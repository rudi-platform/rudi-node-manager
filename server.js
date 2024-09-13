const mod = 'manager.app'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
const express = require('express')
const cookieParser = require('cookie-parser')
// const cors = require('cors')
const path = require('path')
const helmet = require('helmet')

// -------------------------------------------------------------------------------------------------
// Internal dependencies: conf
// -------------------------------------------------------------------------------------------------
const { getConf, FORM_PREFIX } = require('./back/config/config')

const log = require('./back/utils/logger')
const { isDevEnv, OPT_BACK_PATH, getBackOptions, isProdEnv } = require('./back/config/backOptions')
const { expressErrorHandler } = require('./back/controllers/errorHandler.js')

// -------------------------------------------------------------------------------------------------
// External dependencies: routes
// -------------------------------------------------------------------------------------------------
const apiOpen = require('./back/routes/routesOpen')
const apiFront = require('./back/routes/routesFront')
const apiData = require('./back/routes/routesData')
const apiMedia = require('./back/routes/routesMedia')
const apiSecu = require('./back/routes/routesSecu')

// -------------------------------------------------------------------------------------------------
// External dependencies: security
// -------------------------------------------------------------------------------------------------
const passport = require('./back/utils/passportSetup')
const { ROLE_ADMIN, dbInitialize, ROLE_ALL } = require('./back/database/scripts/initDatabase')
const { checkRolePerm } = require('./back/utils/roleCheck')
const consoleRouter = require('./console/router.js')
const { pathJoin, sleep, getDomain, getHost } = require('./back/utils/utils.js')
const { getStoragePublicUrl } = require('./back/controllers/mediaController.js')
const { getCatalogPublicUrl } = require('./back/controllers/dataController.js')

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
              log.d(mod, fun, `attempt #${attemptLeft}: Catalog not responding`)
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
              log.d(mod, fun, `attempt #${attemptLeft}: Storage not responding`)
              reject(err)
            })
        )
      )
    await Promise.all(promises)
    return [catalogUrl, storageUrl]
  } catch (e) {
    await sleep(1000)
    // log.d(mod, fun, `attempt ${attemptLeft}`)
    return connectToRudiModules(attemptLeft - 1)
  }
}

function getHelmetDirectives({ catalogUrl, storageUrl }) {
  const fun = 'getHelmetDirectives'
  const backUrl = getBackOptions(OPT_BACK_PATH)

  const trustedUrls = [backUrl, catalogUrl, storageUrl]
  const moduleDomains = ["'self'"]
  const moduleHosts = ["'self'"]
  for (const url of trustedUrls) {
    if (url) {
      const domain = getDomain(url)
      const host = getHost(url)
      // log.d(mod, fun + '.domains', `${url} -> ${domain}`)
      if (!moduleDomains.includes(domain)) moduleDomains.push(domain)
      if (!moduleHosts.includes(host)) moduleHosts.push(host)
    }
  }
  // log.d(mod, fun + '.domains', `rudi module Domains: ${moduleDomains}`)

  /* Note about Content Security Policy:
   * - connect-src, media-src, worker-src: Allow full hosts (including ports).
   * - script-src, img-src, style-src, font-src: Only accept hostnames (domains); ports are not allowed.
   */
  const connectSrc = [...moduleHosts, ...getConf('security', 'trusted_domain')]

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
  const fun = 'launchExpressApp'
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
    const logReqMsg = `Request <= ${req?.method} ${req?.url} (from ${req?.ip})`
    log.sysInfo(mod, '', logReqMsg, log.getContext(req, {}))

    // console.log('req.headers.cookie:', req.headers.cookie)
    next()

    reply.on('finish', () => {
      if (reply.statusCode < 400) {
        const okReplyMsg = `=> OK ${reply.statusCode}: ${req.method} ${req.originalUrl}`
        log.sysInfo(mod, '', okReplyMsg, log.getContext(req, {}))
      } else {
        const errReplyMsg = `=> ERR ${reply.statusCode} ${reply.statusMessage} > ${req.method} ${req.originalUrl}`
        log.sysWarn(mod, '', errReplyMsg, log.getContext(req, {}))
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
  managerApp.use(passport.initialize())

  const authenticate = passport.authenticate('jwt', { session: false })

  // Configure app to use routes
  managerApp.use('/api/open', apiOpen)
  managerApp.use('/api/front', apiFront)
  managerApp.use('/api/data', authenticate, checkRolePerm([ROLE_ALL]), apiData)
  managerApp.use('/api/media', authenticate, checkRolePerm([ROLE_ALL]), apiMedia)
  managerApp.use('/api/secu', authenticate, checkRolePerm([ROLE_ADMIN]), apiSecu)

  // Serving the console frontend
  managerApp.use(pathJoin('', FORM_PREFIX), consoleRouter)

  // This middleware informs the express application to serve our compiled React files
  // if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  if (!isDevEnv()) {
    console.log('Serving the built static page')
    managerApp.use(express.static(path.join(__dirname, 'front/build')))
    managerApp.get('/*', (req, reply) =>
      reply.sendFile(path.join(__dirname, 'front/build/index.html'))
    )
  }

  // Init database on startup
  try {
    await dbInitialize()
    log.d(mod, 'initDatabase', 'SQL DB init OK')
  } catch (err) {
    log.e(mod, 'initDatabase', `SQL DB init ERR: ${err}`)
    throw new Error(`SQL DB init ERR: ${err}`)
  }

  // Catch any bad requests
  managerApp.get('*', (req, reply) =>
    reply.status(404).send(`Route '${req?.method} ${req?.url}' not found`)
  )

  // Configure our server to listen on the port defiend by our port variable
  const managerServer = managerApp.listen(listeningPort, listeningAddress, () =>
    log.i(mod, '', `Listening on: ${listeningAddress}:${listeningPort}`)
  )
  managerServer.on('error', (err) => {
    console.error('This error was uncaught:', err)
  })

  managerApp.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
  return managerServer
}

async function runManagerBackend() {
  const fun = 'runManagerBackend'
  const [catalogUrl, storageUrl] = await connectToRudiModules(15)
  log.d(mod, fun, `catalogUrl: ${catalogUrl}`)
  log.d(mod, fun, `storageUrl: ${storageUrl}`)
  const managerServer = await launchExpressApp({ catalogUrl, storageUrl })

  process.on('SIGINT', () => shutDown(managerServer, 'SIGINT'))
  process.on('SIGTERM', () => shutDown(managerServer, 'SIGTERM'))
  process.on('SIGQUIT', () => shutDown(managerServer, 'SIGQUIT'))
}

async function shutDown(managerServer, signal) {
  console.debug(`Closing session on signal ${signal}`)
  managerServer.close(() => {
    console.log('Closed out remaining connections')
    process.exit(0)
  })

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}

runManagerBackend()
