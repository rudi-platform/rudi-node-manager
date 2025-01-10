/* eslint-disable no-console */
const mod = 'manager.app'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { readFileSync } from 'fs'

import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'

// -------------------------------------------------------------------------------------------------
// Internal dependencies: conf
// -------------------------------------------------------------------------------------------------
import {
  getBackendListeningAddress,
  getBackendListeningPort,
  getBackPath,
  getConf,
  getConsolePath,
  getFrontPath,
  getManagerPath,
} from './config/config.js'

import { getBackOptions, isDevEnv, isProdEnv, OPT_BACK_PATH } from './config/backOptions.js'
import { expressErrorHandler } from './controllers/errorHandler.js'
import { getContext, logD, logE, logI, logW, sysError, sysInfo } from './utils/logger.js'

// -------------------------------------------------------------------------------------------------
// External dependencies: routes
// -------------------------------------------------------------------------------------------------
import { catalogApi } from './routes/routesData.js'
import { frontApi } from './routes/routesFront.js'
import { storageApi } from './routes/routesMedia.js'
import { openApi } from './routes/routesOpen.js'
import { secuApi } from './routes/routesSecu.js'

import { consoleRouter } from '../console/consoleRouter.js'
import { getCatalogPublicUrl, getInitData } from './controllers/dataController.js'
import { getStoragePublicUrl } from './controllers/mediaController.js'

// -------------------------------------------------------------------------------------------------
// External dependencies: security
// -------------------------------------------------------------------------------------------------
import { dbInitialize, ROLE_ADMIN, ROLE_ALL } from './database/scripts/initDatabase.js'
import { ConnectionError } from './utils/errors.js'
import { passportAuthenticate, passportInitialize } from './utils/passportSetup.js'
import { checkRolePerm } from './utils/roleCheck.js'
import { getAllFiles, getDomain, getFileExtension, getHost, getRootDir, pathJoin, sleep } from './utils/utils.js'

// -------------------------------------------------------------------------------------------------
// Check RUDI modules state
// -------------------------------------------------------------------------------------------------
const moduleUrls = { catalog: undefined, storage: undefined }

function checkUrls() {
  if (!moduleUrls.catalog && !moduleUrls.storage)
    throw new ConnectionError('Could not reach RUDI Catalog nor RUDI Storage')
  if (!moduleUrls.storage) throw new ConnectionError('Could not reach RUDI Storage')
  if (!moduleUrls.catalog) throw new ConnectionError('Could not reach RUDI Catalog')
  return moduleUrls
}

const connectToModule = (moduleCall, moduleName, errMsg) =>
  new Promise((resolve, reject) =>
    moduleCall()
      .then((res) => {
        moduleUrls[moduleName] = res
        // logD(mod, 'connectToModule', res)
        return resolve(res)
      })
      .catch((err) => {
        logW(mod, 'connectToModule', errMsg)
        return reject(err)
      })
  )

async function connectToRudiModules(attemptLeft = 20) {
  if (attemptLeft === 0) return checkUrls()

  try {
    const promises = []
    if (!moduleUrls.catalog)
      promises.push(connectToModule(getCatalogPublicUrl, 'catalog', `attempt #${attemptLeft}: Catalog not responding`))
    if (!moduleUrls.storage)
      promises.push(connectToModule(getStoragePublicUrl, 'storage', `attempt #${attemptLeft}: Storage not responding`))
    await Promise.all(promises)
    return [moduleUrls.catalog, moduleUrls.storage]
  } catch {
    await sleep(1000)
    // log.d(mod, fun, `attempt ${attemptLeft}`)
    return connectToRudiModules(attemptLeft - 1)
  }
}

/**
 * Redirection for trailing slashes
 * Source: https://stackoverflow.com/a/15773824/1563072
 */
const redirectTrailingSlashes = (req, reply, next) => {
  if (req.path.length > 1 && req.path.slice(-1) === '/') {
    const query = req.url.slice(req.path.length)
    const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
    logI(mod, 'redirect', req.url, '=>', safepath + query)
    reply.redirect(308, safepath + query)
  } else {
    next()
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

const launchManagerRouter = async ({ catalogUrl, storageUrl }) => {
  const here = 'managerRouter'
  const listeningPort = getBackendListeningPort()
  const listeningAddress = getBackendListeningAddress()

  managerApp.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: getHelmetDirectives({ catalogUrl, storageUrl }),
      },
    })
  )

  // Note: bodyParser middleware has been replace with express bodyParser
  managerApp.use(express.json())
  managerApp.use(express.urlencoded({ extended: true }))
  managerApp.use(cookieParser())

  // This application level middleware prints incoming requests to the servers console, useful to see incoming requests
  managerApp.use((req, reply, next) => {
    const logReqMsg = `${req?.method} ${req?.url} (from ${req?.ip})`
    sysInfo('req.in <', '', logReqMsg, getContext(req, {})) // <= IN

    // Redirection for trailing slashes
    // redirectTrailingSlashes(req, reply, next)
    next()

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

  // -----------------------------------------------------------------------------------------------
  // Get conf (this module URLs)
  // -----------------------------------------------------------------------------------------------
  // Get the manager conf in any frontend path
  managerApp.get(/.*\/conf$/, (req, reply) => {
    logD(mod, here, 'serving conf')
    getInitData(req, reply)
  })

  // -----------------------------------------------------------------------------------------------
  // Backend routes
  // -----------------------------------------------------------------------------------------------
  managerApp.use(getBackPath('open'), openApi)
  managerApp.use(getBackPath('front'), frontApi)
  managerApp.use(getBackPath('catalog'), authenticate, checkRolePerm([ROLE_ALL]), catalogApi)
  managerApp.use(getBackPath('data'), authenticate, checkRolePerm([ROLE_ALL]), catalogApi) // Legacy
  managerApp.use(getBackPath('storage'), authenticate, checkRolePerm([ROLE_ALL]), storageApi)
  managerApp.use(getBackPath('media'), authenticate, checkRolePerm([ROLE_ALL]), storageApi) // Legacy
  managerApp.use(getBackPath('secu'), authenticate, checkRolePerm([ROLE_ADMIN]), secuApi)

  // -----------------------------------------------------------------------------------------------
  // Serving the console frontend                                                                 !!
  // -----------------------------------------------------------------------------------------------
  managerApp.use(getConsolePath(), authenticate, consoleRouter)

  // -----------------------------------------------------------------------------------------------
  // Serving the React frontend                                                                   !!
  // -----------------------------------------------------------------------------------------------
  // This middleware informs the express application to serve our compiled React files
  // if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {

  if (!isDevEnv()) {
    const trace = 'route front'
    logI(mod, 'serve', `Serving the built static page on ${getFrontPath()}`)
    const __dirname = getRootDir()
    const frontDir = pathJoin(__dirname, 'front/build')
    // Access the favicon
    managerApp.use(/.*favicon.ico/, express.static(pathJoin(frontDir, 'favicon.ico')))

    // Special treatment: some frontend static files should be parsed (because they cannot be dynamically updated)
    const filesToParse = getAllFiles(frontDir, { extensionFilter: ['json', 'html', 'css', 'js'] })
    const mimeTypes = { js: 'application/javascript', css: 'text/css', html: 'text/html', json: 'application/json' }
    const modifiedStaticFiles = {}
    filesToParse.forEach((filePath) => {
      const fileContent = readFileSync(filePath, 'utf-8')
      const content = fileContent.replaceAll('http://f7689a5a-0ed6-4f4b-97da-df690903ef4f', getFrontPath())
      const fileExtension = getFileExtension(filePath)
      const mime = mimeTypes[fileExtension]
      const fileCall = filePath.split('front/build')[1]
      modifiedStaticFiles[fileCall] = { content, mime }
      logD(mod, here, 'modifed file:', fileCall)
    })

    // Serving modified static files
    for (const file in modifiedStaticFiles) {
      managerApp.get(getFrontPath(file), (req, reply) => {
        const fileInfo = modifiedStaticFiles[file]
        logD(mod, trace, `Accessing modified static file '${file}' (${fileInfo.mime})`)
        // reply.header('Content-Type', `${fileInfo.mime}`).send(String(fileInfo.content))
        reply.contentType(fileInfo.mime).send(String(fileInfo.content))
      })
    }

    // Additionaly serving index.html for /
    const homePage = modifiedStaticFiles['/index.html']
    managerApp.get(getFrontPath(), (req, reply) => {
      logD(mod, trace, `Manager Front accessed from ${req.url}`)
      reply.send(homePage.content)
    })
    managerApp.get(getFrontPath(''), (req, reply) => {
      logD(mod, trace, `Manager Front accessed from ${req.url}`)
      reply.send(homePage.content)
    })

    // Accessing the static ressources
    managerApp.use(getFrontPath(), (req, res, next) => {
      logD(mod, trace, `Accessing unmodified static file ${req.url}`)
      express.static(frontDir)(req, res, next)
    })

    // Redirecting everything else to the React front
    managerApp.get('*', (req, reply) => {
      logW(mod, trace, `Redirecting this URL to /metadata: ${req.url}`)
      reply.redirect(308, getFrontPath())
    })
  }

  // -----------------------------------------------------------------------------------------------
  // Init database on startup
  // -----------------------------------------------------------------------------------------------
  try {
    await dbInitialize()
    logD(mod, 'initDatabase', 'SQL DB init OK')
  } catch (err) {
    logE(mod, 'initDatabase', `SQL DB init ERR: ${err}`)
    throw new Error(`SQL DB init ERR: ${err}`)
  }

  // -----------------------------------------------------------------------------------------------
  // Catch any bad requests
  // -----------------------------------------------------------------------------------------------
  managerApp.get('*', (req, reply) => reply.status(404).send(`Route '${req?.method} ${req?.url}' not found`))

  // -----------------------------------------------------------------------------------------------
  // Catch any error
  // -----------------------------------------------------------------------------------------------
  managerApp.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))

  // -----------------------------------------------------------------------------------------------
  // Configure our server to listen on the port defiend by our port variable
  // -----------------------------------------------------------------------------------------------
  const managerServer = managerApp.listen(listeningPort, listeningAddress, () =>
    logI(mod, '', `Listening on: ${listeningAddress}:${listeningPort}${getManagerPath()}`)
  )
  managerServer.on('error', (err) => console.error('This error was uncaught:', err))

  return managerServer
}

// -------------------------------------------------------------------------------------------------
// Manager app launch
// -------------------------------------------------------------------------------------------------
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
  const fun = 'runRudiManagerBackend'
  const [catalogUrl, storageUrl] = await connectToRudiModules(20)
  logD(mod, fun, `catalogUrl: ${catalogUrl}`)
  logD(mod, fun, `storageUrl: ${storageUrl}`)
  const managerServer = await launchManagerRouter({ catalogUrl, storageUrl })

  process.on('SIGINT', () => shutDown(managerServer, 'SIGINT'))
  process.on('SIGTERM', () => shutDown(managerServer, 'SIGTERM'))
  process.on('SIGQUIT', () => shutDown(managerServer, 'SIGQUIT'))
}
