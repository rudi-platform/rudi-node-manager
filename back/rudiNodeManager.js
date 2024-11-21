/* eslint-disable no-console */
const mod = 'manager.app'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import express from 'express'

import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { join } from 'path'

// -------------------------------------------------------------------------------------------------
// Internal dependencies: conf
// -------------------------------------------------------------------------------------------------
import { FORM_PREFIX, getConf } from './config/config.js'

import { getBackOptions, isDevEnv, isProdEnv, OPT_BACK_PATH } from './config/backOptions.js'
import { expressErrorHandler } from './controllers/errorHandler.js'
import { getContext, logD, logE, logI, sysError, sysInfo } from './utils/logger.js'

// -------------------------------------------------------------------------------------------------
// External dependencies: routes
// -------------------------------------------------------------------------------------------------
import { catalogApi } from './routes/routesData.js'
import { frontApi } from './routes/routesFront.js'
import { storageApi } from './routes/routesMedia.js'
import { openApi } from './routes/routesOpen.js'
import { secuApi } from './routes/routesSecu.js'

import { consoleRouter } from '../console/router.js'
import { getCatalogPublicUrl } from './controllers/dataController.js'
import { getStoragePublicUrl } from './controllers/mediaController.js'

// -------------------------------------------------------------------------------------------------
// External dependencies: security
// -------------------------------------------------------------------------------------------------
import { dbInitialize, ROLE_ADMIN, ROLE_ALL } from './database/scripts/initDatabase.js'
import { passportAuthenticate, passportInitialize } from './utils/passportSetup.js'
import { checkRolePerm } from './utils/roleCheck.js'
import { getDomain, getHost, pathJoin, sleep } from './utils/utils.js'

// -------------------------------------------------------------------------------------------------
// Check RUDI modules state
// -------------------------------------------------------------------------------------------------
function checkUrls() {
  if (!catalogUrl && !storageUrl) throw new Error('Could not reach RUDI Catalog nor RUDI Storage')
  if (!storageUrl) throw new Error('Could not reach RUDI Storage')
  if (!catalogUrl) throw new Error('Could not reach RUDI Catalog')
  return [catalogUrl, storageUrl]
}

let catalogUrl, storageUrl
async function connectToRudiModules(attemptLeft = 20) {
  const fun = 'connectToRudiModules'
  if (attemptLeft === 0) return checkUrls()

  try {
    const promises = []
    if (!catalogUrl)
      promises.push(
        new Promise((resolve, reject) =>
          getCatalogPublicUrl()
            .then((res) => resolve((catalogUrl = res)))
            .catch((err) => {
              logD(mod, fun, `attempt #${attemptLeft}: Catalog not responding`)
              reject(err)
            })
        )
      )
    if (!storageUrl)
      promises.push(
        new Promise((resolve, reject) =>
          getStoragePublicUrl()
            .then((res) => resolve((storageUrl = res)))
            .catch((err) => {
              logD(mod, fun, `attempt #${attemptLeft}: Storage not responding`)
              reject(err)
            })
        )
      )
    await Promise.all(promises)
    return [catalogUrl, storageUrl]
  } catch {
    await sleep(1000)
    // log.d(mod, fun, `attempt ${attemptLeft}`)
    return connectToRudiModules(attemptLeft - 1)
  }
}

function getHelmetDirectives({ catalogUrl, storageUrl }) {
  const fun = 'getHelmetDirectives'
  const backUrl = getBackOptions(OPT_BACK_PATH)

  const trustedUrls = backUrl ? [backUrl, catalogUrl, storageUrl] : [catalogUrl, storageUrl]
  const moduleDomains = ["'self'"]
  const moduleHosts = ["'self'"]
  for (const url of trustedUrls) {
    if (url) {
      const domain = getDomain(url)
      const host = getHost(url)
      // log.d(mod, fun + '.domains', `${url} -> ${domain}`)
      if (!moduleHosts.includes(host)) moduleHosts.push(host)
      if (!moduleDomains.includes(domain)) moduleDomains.push(domain)
    }
  }
  // log.d(mod, fun + '.domains', `rudi module Domains: ${moduleDomains}`)

  /* Note about Content Security Policy:
   * - connect-src, media-src, worker-src: Allow full hosts (including ports).
   * - script-src, img-src, style-src, font-src: Only accept hostnames (domains); ports are not allowed.
   */
  const connectSrc = [...moduleHosts, ...getConf('security', 'trusted_domain')]
  logD(mod, fun, 'trustedUrls:', trustedUrls)
  const scriptSrc = moduleDomains
  const imgSrc = ['data:', ...moduleDomains, 'https://*.tile.osm.org']
  const defaultSrc = [...moduleDomains]

  const styleSrc = [...moduleDomains, "'unsafe-inline'"]
  const objectSrc = ["'none'"]
  const helmetDirectives = { scriptSrc, connectSrc, imgSrc, styleSrc, objectSrc, defaultSrc }
  if (!isProdEnv()) helmetDirectives.upgradeInsecureRequests = null
  return helmetDirectives
}

// -------------------------------------------------------------------------------------------------
// Launching express app
// -------------------------------------------------------------------------------------------------
const managerApp = express()
const launchExpressApp = async ({ catalogUrl, storageUrl }) => {
  // Set our backend port to be either an environment variable or port 5000
  const listeningPort = getConf('server', 'listening_port') || 5000
  const listeningAddress = getConf('server', 'listening_address') || '0.0.0.0'

  managerApp.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: getHelmetDirectives({ catalogUrl, storageUrl }),
      },
    })
  )

  // This application level middleware prints incoming requests to the servers console, useful to see incoming requests
  managerApp.use((req, reply, next) => {
    const logReqMsg = `${req?.method} ${req?.url} (from ${req?.ip})`
    sysInfo('req.in <', '', logReqMsg, getContext(req, {})) // <= IN

    // Redirection for trailing slashes
    // https://stackoverflow.com/a/15773824/1563072
    if (req.path.length > 1 && req.path.slice(-1) === '/') {
      const query = req.url.slice(req.path.length)
      const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
      reply.redirect(301, safepath + query)
    } else {
      next()
    }

    reply.on('finish', () => {
      if (reply.statusCode < 400) {
        const okReplyMsg = `${reply.statusCode}: ${req.method} ${req.originalUrl}`
        sysInfo('req.out >', '', okReplyMsg, getContext(req, {})) // => OK
      } else {
        const errReplyMsg = `${reply.statusCode} ${reply.statusMessage} > ${req.method} ${req.originalUrl}`
        sysError('req.err >', '', errReplyMsg, getContext(req, {})) // => ERR
      }
    })
  })

  // Note: bodyParser middleware has been replace with express bodyParser
  managerApp.use(express.json())
  managerApp.use(express.urlencoded({ extended: true }))
  managerApp.use(cookieParser())

  // const WHITE_LIST = [
  //   'self',
  //   '::ffff:127.0.0.1',
  //   /127\.0\.0\.1(:\d+)?/,
  //   /localhost(:\d+)?/,
  //   'localhost.*',
  //   getConsoleFormUrl(),
  //   ...getConf('security', 'trusted_domain'),
  // ]
  // const QUOTED_WHITE_LIST = WHITE_LIST.map((whiteListedIp) => `'${whiteListedIp}'`)

  // Access-Control-Allow-Origin
  // Configure the CORs middleware
  // backend.use(
  //   cors({
  //     credentials: true,
  //     origin: WHITE_LIST,
  //     allowedHeaders: ['Content-Type', 'Content-Length', 'Authorization'],
  //     vary: 'Origin',
  //     methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
  //     maxAge: 600,
  //   })
  // )

  // Passport middleware
  managerApp.use(passportInitialize())

  const authenticate = passportAuthenticate('jwt', { session: false })

  // Configure app to use routes
  managerApp.use('/api/open', openApi)
  managerApp.use('/api/front', frontApi)
  managerApp.use('/api/data', authenticate, checkRolePerm([ROLE_ALL]), catalogApi)
  managerApp.use('/api/media', authenticate, checkRolePerm([ROLE_ALL]), storageApi)
  managerApp.use('/api/secu', authenticate, checkRolePerm([ROLE_ADMIN]), secuApi)

  // Serving the console frontend
  managerApp.use(pathJoin('', FORM_PREFIX), consoleRouter)

  // This middleware informs the express application to serve our compiled React files
  // if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  if (!isDevEnv()) {
    logI(mod, 'serve', 'Serving the built static page')
    managerApp.use(express.static(join(__dirname, 'front/build')))
    managerApp.get('/*', (req, reply) => reply.sendFile(join(__dirname, 'front/build/index.html')))
  }

  // Init database on startup
  try {
    await dbInitialize()
    logD(mod, 'initDatabase', 'SQL DB init OK')
  } catch (err) {
    logE(mod, 'initDatabase', `SQL DB init ERR: ${err}`)
    throw new Error(`SQL DB init ERR: ${err}`)
  }

  // Catch any bad requests
  managerApp.get('*', (req, reply) => reply.status(404).send(`Route '${req?.method} ${req?.url}' not found`))

  // Configure our server to listen on the port defiend by our port variable
  const managerServer = managerApp.listen(listeningPort, listeningAddress, () =>
    logI(mod, '', `Listening on: ${listeningAddress}:${listeningPort}`)
  )
  managerServer.on('error', (err) => {
    console.error('This error was uncaught:', err)
  })

  managerApp.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
  return managerServer
}

async function shutDown(managerServer, signal) {
  logD(mod, 'shutDown', `Closing session on signal ${signal}`)
  managerServer.close(() => {
    console.log('Closed out remaining connections')
    process.exit(0)
  })

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}

export async function runRudiManagerBackend() {
  const fun = 'runManagerBackend'
  const [catalogUrl, storageUrl] = await connectToRudiModules(15)
  logD(mod, fun, `catalogUrl: ${catalogUrl}`)
  logD(mod, fun, `storageUrl: ${storageUrl}`)
  const managerServer = await launchExpressApp({ catalogUrl, storageUrl })

  process.on('SIGINT', () => shutDown(managerServer, 'SIGINT'))
  process.on('SIGTERM', () => shutDown(managerServer, 'SIGTERM'))
  process.on('SIGQUIT', () => shutDown(managerServer, 'SIGQUIT'))
}
