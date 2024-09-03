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
const {
  isDevEnv,
  OPT_BACK_PATH,
  getBackOptions,
  getBackDomain,
} = require('./back/config/backOptions')
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
const { pathJoin, sleep, getDomain } = require('./back/utils/utils.js')
const { getStoragePublicUrl } = require('./back/controllers/mediaController.js')
const { getCatalogPublicUrl } = require('./back/controllers/dataController.js')

// -------------------------------------------------------------------------------------------------
// Launching express app
// -------------------------------------------------------------------------------------------------
const launchExpressServer = async ({ catalogUrl, storageUrl }) => {
  const managerBackend = express()
  // Set our backend port to be either an environment variable or port 5000
  const listeningPort = getConf('server', 'listening_port') || 5000
  const listeningAddress = getConf('server', 'listening_address') || '0.0.0.0'

  const backUrl = getBackOptions(OPT_BACK_PATH)
  const me = ["'self'"]
  for (const rudiModuleUrl of [backUrl, catalogUrl, storageUrl]) {
    if (rudiModuleUrl) {
      const domain = getDomain(rudiModuleUrl)
      if (!me.includes(domain)) me.push(domain)
    }
  }

  managerBackend.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: [...me, 'data:'],
          scriptSrc: me,
          connectSrc: [...me, ...getConf('security', 'trusted_domain')],
          imgSrc: [...me, 'data:', 'https://*.tile.osm.org'],
          upgradeInsecureRequests: null,
        },
      },
    })
  )

  // backend.use(
  //   helmet({
  //     contentSecurityPolicy: {
  //       useDefaults: true,
  //       directives: {
  //         defaultSrc: ["'self'", 'data:'],
  //         scriptSrc: ["'self'"],
  //         connectSrc: ["'self'", getStorageUrl('/'), ...getConf('security', 'trusted_domain')],
  //         imgSrc: ["'self'", 'data:', 'https://*.tile.osm.org'],
  //       },
  //     },
  //   })
  // )

  // This application level middleware prints incoming requests to the servers console, useful to see incoming requests
  managerBackend.use((req, reply, next) => {
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
  managerBackend.use(express.json())
  managerBackend.use(express.urlencoded({ extended: true }))
  managerBackend.use(cookieParser())

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
  managerBackend.use(passport.initialize())

  const authenticate = passport.authenticate('jwt', { session: false })

  // Configure app to use routes
  managerBackend.use('/api/open', apiOpen)
  managerBackend.use('/api/front', apiFront)
  managerBackend.use('/api/data', authenticate, checkRolePerm([ROLE_ALL]), apiData)
  managerBackend.use('/api/media', authenticate, checkRolePerm([ROLE_ALL]), apiMedia)
  managerBackend.use('/api/secu', authenticate, checkRolePerm([ROLE_ADMIN]), apiSecu)

  // Serving the console frontend
  managerBackend.use(pathJoin('', FORM_PREFIX), consoleRouter)

  // This middleware informs the express application to serve our compiled React files
  // if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  if (!isDevEnv()) {
    console.log('Serving the built static page')
    managerBackend.use(express.static(path.join(__dirname, 'front/build')))
    managerBackend.get('/*', (req, reply) =>
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
  managerBackend.get('*', (req, reply) =>
    reply.status(404).send(`Route '${req?.method} ${req?.url}' not found`)
  )

  // Configure our server to listen on the port defiend by our port variable
  managerBackend.listen(listeningPort, listeningAddress, () =>
    log.i(mod, '', `Listening on: ${listeningAddress}:${listeningPort}`)
  )

  managerBackend.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
}

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
            .catch((err) => reject(err))
        )
      )
    if (!storageUrl)
      promises.push(
        new Promise((resolve, reject) =>
          getStoragePublicUrl()
            .then((res) => resolve((storageUrl = res)))
            .catch((err) => reject(err))
        )
      )
    await Promise.all(promises)
    return [catalogUrl, storageUrl]
  } catch (e) {
    await sleep(1000)
    log.d(mod, fun, `attempt ${attemptLeft}`)
    return connectToRudiModules(attemptLeft - 1)
  }
}

async function runManagerBackend() {
  const [catalogUrl, storageUrl] = await connectToRudiModules(15)
  launchExpressServer({ catalogUrl, storageUrl }).catch((e) => console.error('Uncaught error:', e))
}

runManagerBackend()
