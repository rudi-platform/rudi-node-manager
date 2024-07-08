const mod = 'server'

// Import dependencies
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path')
const helmet = require('helmet')

// Require Config
const { getConf, getConsoleFormUrl } = require('./config/config')
const log = require('./utils/logger')

// Require Route
const apiOpen = require('./routes/routesOpen')
const apiFront = require('./routes/routesFront')
const apiData = require('./routes/routesData')
const apiMedia = require('./routes/routesMedia')
const apiSecu = require('./routes/routesSecu')

const passport = require('./utils/passportSetup')
const { ROLE_ADMIN, dbInitialize, ROLE_ALL } = require('./database/scripts/initDatabase')
const { isDevEnv } = require('./config/backOptions')
const { checkRolePerm } = require('./utils/roleCheck')
const { expressErrorHandler } = require('./controllers/errorHandler.js')
const { get } = require('lodash')

// Create a new express application named 'app'
const app = express()
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
app.use(
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
app.use((req, reply, next) => {
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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Access-Control-Allow-Origin
// Configure the CORs middleware
app.use(
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
app.use(passport.initialize())

const authenticate = passport.authenticate('jwt', { session: false })

// Configure app to use routes
app.use('/api/open', apiOpen)
app.use('/api/front', apiFront)
app.use('/api/data', authenticate, checkRolePerm([ROLE_ALL]), apiData)
app.use('/api/media', authenticate, checkRolePerm([ROLE_ALL]), apiMedia)
app.use('/api/secu', authenticate, checkRolePerm([ROLE_ADMIN]), apiSecu)

// This middleware informs the express application to serve our compiled React files
// if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
if (!isDevEnv()) {
  console.log('Serving the built static page')
  app.use(express.static(path.join(__dirname, 'front/build')))
  app.get('/*', (req, reply) => reply.sendFile(path.join(__dirname, 'front/build/index.html')))
}

// Init database on startup

dbInitialize()
  .then((res) => log.d(mod, 'initDatabase', 'SQL DB init OK'))
  .catch((err) => log.e(mod, 'initDatabase', `SQL DB init ERR: ${err}`))

// Catch any bad requests
app.get('*', (req, reply) => reply.status(404).send(`Route '${req.method} ${req.url}' not found`))

// Configure our server to listen on the port defiend by our port variable
app.listen(port, () => log.i(mod, '', `BACK_END_SERVICE_PORT: ${port}`, {}))

app.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
