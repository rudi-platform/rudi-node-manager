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
  getConf,
  getDirectBack,
  getDirectConsole,
  getDirectFront,
  getPublicFront,
  getPublicManager,
  getRouterBack,
  getRouterConsole,
  getRouterFront,
  getRouterPath,
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
import {
  getAllFiles,
  getDomain,
  getFileExtension,
  getHost,
  getRootDir,
  pathJoin,
  removeTrailingSlash,
  sleep,
} from './utils/utils.js'

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
  const fun = 'helmet'
  const backUrl = getBackOptions(OPT_BACK_PATH)

  const moduleDomains = ["'self'"]
  const moduleHosts = ["'self'"]

  const trustedDomains = getConf('security', 'trusted_domain') ?? []
  const trustedUrls = [catalogUrl, storageUrl, ...trustedDomains]
  if (backUrl) trustedUrls.push(backUrl)

  for (const url of trustedUrls) {
    if (url) {
      const domain = getDomain(url)
      const host = getHost(url)
      // logD(mod, fun + '.domains', `${url} -> ${domain}`)
      if (!moduleHosts.includes(host)) moduleHosts.push(host)
      if (!moduleDomains.includes(domain)) moduleDomains.push(domain)
      for (const locals of [
        ['localhost', '127.0.0.1'],
        ['127.0.0.1', 'localhost'],
      ])
        if (domain.startsWith(locals[0])) {
          const altDomain = domain.replace(locals[0], locals[1])
          if (!moduleDomains.includes(altDomain)) moduleDomains.push(altDomain)
        }
    }
  }

  /* Note about Content Security Policy:
   * - connect-src, media-src, worker-src: Allow full hosts (including ports).
   * - script-src, img-src, style-src, font-src: Only accept hostnames (domains); ports are not allowed.
   */
  const connectSrc = moduleHosts
  const scriptSrc = moduleDomains
  const imgSrc = ['data:', ...moduleDomains, 'https://*.tile.osm.org']
  const defaultSrc = moduleDomains

  const styleSrc = [...moduleDomains, "'unsafe-inline'"]
  const objectSrc = ["'none'"]
  const helmetDirectives = { scriptSrc, connectSrc, imgSrc, styleSrc, objectSrc, defaultSrc }
  if (!isProdEnv()) helmetDirectives.upgradeInsecureRequests = null

  logD(mod, fun, `Trusted domains (script-src, img-src, style-src, font-src): ${moduleDomains}`)
  logD(mod, fun, `Trusted hosts (connect-src, media-src, worker-src): ${moduleDomains}`)

  return helmetDirectives
}

// -------------------------------------------------------------------------------------------------
// Launching express app
// -------------------------------------------------------------------------------------------------

// This is the dummy PUBLIC_URL the front has been built with
const STATIC_FRONT_BUILD_URL = 'http://68064ef1-1e5c-4384-8c50-626f52b78c5c'

// MIME types from the files to be modified
const MIME_TYPES = { js: 'application/javascript', css: 'text/css', html: 'text/html', json: 'application/json' }

const modifystaticFiles = (frontDir) => {
  const here = 'modifystaticFiles'

  // Special treatment: some frontend static files are be parsed (because they cannot be dynamically updated)
  // The above STATIC_FRONT_BUILD_URL will be replaced with the right URL
  const filesToParse = getAllFiles(frontDir, { extensionFilter: ['json', 'html', 'css', 'js'] })

  const modifiedStaticFiles = {}
  logD(mod, 'serve', `replacing in files ${STATIC_FRONT_BUILD_URL} -> ${getPublicFront()}`)
  filesToParse.forEach((filePath) => {
    const fileContent = readFileSync(filePath, 'utf-8')
    const content = fileContent.replaceAll(STATIC_FRONT_BUILD_URL, removeTrailingSlash(getPublicFront()))
    const fileExtension = getFileExtension(filePath)
    const mime = MIME_TYPES[fileExtension]
    const fileCall = filePath.split('front/build')[1]
    modifiedStaticFiles[fileCall] = { content, mime }
    logD(mod, here, 'modifed file:', fileCall)
  })

  return modifiedStaticFiles
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

  // Note: bodyParser middleware has been replaced with express bodyParser
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

  const authenticate = passportAuthenticate(['jwt-usr', 'jwt-admin'], { session: false })

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
  managerApp.use(getRouterBack('open'), openApi)
  managerApp.use(getRouterBack('front'), frontApi)
  managerApp.use(getRouterBack('catalog'), authenticate, checkRolePerm([ROLE_ALL]), catalogApi)
  managerApp.use(getRouterBack('data'), authenticate, checkRolePerm([ROLE_ALL]), catalogApi) // Legacy
  managerApp.use(getRouterBack('storage'), authenticate, checkRolePerm([ROLE_ALL]), storageApi)
  managerApp.use(getRouterBack('media'), authenticate, checkRolePerm([ROLE_ALL]), storageApi) // Legacy
  managerApp.use(getRouterBack('secu'), authenticate, checkRolePerm([ROLE_ADMIN]), secuApi)

  // For config where the router prefix is removed
  managerApp.use(getDirectBack('open'), openApi)
  managerApp.use(getDirectBack('front'), frontApi)
  managerApp.use(getDirectBack('catalog'), authenticate, checkRolePerm([ROLE_ALL]), catalogApi)
  managerApp.use(getDirectBack('data'), authenticate, checkRolePerm([ROLE_ALL]), catalogApi) // Legacy
  managerApp.use(getDirectBack('storage'), authenticate, checkRolePerm([ROLE_ALL]), storageApi)
  managerApp.use(getDirectBack('media'), authenticate, checkRolePerm([ROLE_ALL]), storageApi) // Legacy
  managerApp.use(getDirectBack('secu'), authenticate, checkRolePerm([ROLE_ADMIN]), secuApi)

  // -----------------------------------------------------------------------------------------------
  // Serving the console frontend                                                                 !!
  // -----------------------------------------------------------------------------------------------
  managerApp.use(getRouterConsole(), authenticate, consoleRouter)
  managerApp.use(getDirectConsole(), authenticate, consoleRouter)

  // -----------------------------------------------------------------------------------------------
  // Serving the React frontend                                                                   !!
  // -----------------------------------------------------------------------------------------------
  // This middleware informs the express application to serve our compiled React files

  if (!isDevEnv()) {
    const trace = 'route front'
    logI(mod, 'serve', `Serving the built static page on ${getPublicFront()}`)
    const __dirname = getRootDir()
    const frontDir = pathJoin(__dirname, 'front/build')
    // Access the favicon
    managerApp.use(/.*favicon.ico/, express.static(pathJoin(frontDir, 'favicon.ico')))

    const modifiedStaticFiles = modifystaticFiles(frontDir)

    // Serving modified static files
    for (const file in modifiedStaticFiles) {
      managerApp.get(getRouterFront(file), (req, reply) => {
        const fileInfo = modifiedStaticFiles[file]
        reply.contentType(fileInfo.mime).send(String(fileInfo.content))
      })
      managerApp.get(getDirectFront(file), (req, reply) => {
        const fileInfo = modifiedStaticFiles[file]
        // logD(mod, trace, `Accessing modified static file '${file}' (${fileInfo.mime})`)
        // reply.header('Content-Type', `${fileInfo.mime}`).send(String(fileInfo.content))
        reply.contentType(fileInfo.mime).send(String(fileInfo.content))
      })
    }

    // Additionaly serving index.html for "/" and ""
    logD(mod, trace, `front path: ${getRouterFront('/')}`)
    const homePageContent = modifiedStaticFiles['/index.html']?.content
    const homePageMime = modifiedStaticFiles['/index.html']?.mime
    const rootPaths = [
      getRouterFront('/'),
      getDirectFront('/'),
      removeTrailingSlash(getRouterFront()),
      removeTrailingSlash(getDirectFront()),
    ]
    for (const path of rootPaths)
      managerApp.get(path, (req, reply) => {
        logW(mod, trace, `Manager Front accessed from ${path} (original URL: ${req.url})`)
        reply.contentType(homePageMime).send(homePageContent)
      })

    // Serving the static ressources
    for (const path of rootPaths) managerApp.use(path, (req, res, next) => express.static(frontDir)(req, res, next))

    // Redirecting everything else to the React front
    managerApp.get('/*', (req, reply) => {
      logW(mod, trace, `Redirecting the following URL to the UI: ${req.url} -> ${getRouterFront('/')}`)
      reply.redirect(308, getRouterFront('/'))
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
  const managerServer = managerApp.listen(listeningPort, listeningAddress, () => {
    logI(mod, '', `Listening on: ${listeningAddress}:${listeningPort}${getPublicManager()}`)
    logI(mod, '', `Routing on:   ${listeningAddress}:${listeningPort}${getRouterPath()}`)
  })
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
  logD(mod, fun, `Public URL defined in Catalog module: ${catalogUrl}`)
  logD(mod, fun, `Public URL defined in Storage module: ${storageUrl}`)
  const managerServer = await launchManagerRouter({ catalogUrl, storageUrl })

  process.on('SIGINT', () => shutDown(managerServer, 'SIGINT'))
  process.on('SIGTERM', () => shutDown(managerServer, 'SIGTERM'))
  process.on('SIGQUIT', () => shutDown(managerServer, 'SIGQUIT'))
}
