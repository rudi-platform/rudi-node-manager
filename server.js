const mod = 'server'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path')
const helmet = require('helmet')

// -------------------------------------------------------------------------------------------------
// Internal dependencies: conf
// -------------------------------------------------------------------------------------------------
const { getConf, getConsoleFormUrl } = require('./back/config/config')

const log = require('./back/utils/logger')
const { isDevEnv } = require('./back/config/backOptions')
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

// -------------------------------------------------------------------------------------------------
// Launching express app
// -------------------------------------------------------------------------------------------------
const backend = express()
// Set our backend port to be either an environment variable or port 5000
const port = getConf('server', 'listening_port') || 5000

const WHITE_LIST = [
  'self',
  '::ffff:127.0.0.1',
  /127\.0\.0\.1(:\d+)?/,
  /localhost(:\d+)?/,
  'localhost.*',
  getConsoleFormUrl(),
  ...getConf('security', 'trusted_domain'),
]
const QUOTED_WHITE_LIST = WHITE_LIST.map((whiteListedIp) => `'${whiteListedIp}'`)
backend.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        scriptSrc: ["'self'"],
        'connect-src': QUOTED_WHITE_LIST,
      },
    },
  })
)

// This application level middleware prints incoming requests to the servers console, useful to see incoming requests
backend.use((req, reply, next) => {
  const logReqMsg = `Request <= ${req.method} ${req.url} (from ${req.ip})`
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
backend.use(express.json())
backend.use(express.urlencoded({ extended: true }))
backend.use(cookieParser())

// Access-Control-Allow-Origin
// Configure the CORs middleware
backend.use(
  cors({
    credentials: true,
    origin: WHITE_LIST,
    allowedHeaders: ['Content-Type', 'Content-Length', 'Authorization'],
    vary: 'Origin',
    methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
    maxAge: 600,
  })
)

// Passport middleware
backend.use(passport.initialize())

const authenticate = passport.authenticate('jwt', { session: false })

// Configure app to use routes
backend.use('/api/open', apiOpen)
backend.use('/api/front', apiFront)
backend.use('/api/data', authenticate, checkRolePerm([ROLE_ALL]), apiData)
backend.use('/api/media', authenticate, checkRolePerm([ROLE_ALL]), apiMedia)
backend.use('/api/secu', authenticate, checkRolePerm([ROLE_ADMIN]), apiSecu)

// This middleware informs the express application to serve our compiled React files
// if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
if (!isDevEnv()) {
  console.log('Serving the built static page')
  backend.use(express.static(path.join(__dirname, 'front/build')))
  backend.get('/*', (req, reply) => reply.sendFile(path.join(__dirname, 'front/build/index.html')))
}

// Init database on startup

dbInitialize()
  .then((res) => log.d(mod, 'initDatabase', 'SQL DB init OK'))
  .catch((err) => log.e(mod, 'initDatabase', `SQL DB init ERR: ${err}`))

// Catch any bad requests
backend.get('*', (req, reply) =>
  reply.status(404).send(`Route '${req.method} ${req.url}' not found`)
)

// Configure our server to listen on the port defiend by our port variable
backend.listen(port, () => log.i(mod, '', `BACK_END_SERVICE_PORT: ${port}`, {}))

backend.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
