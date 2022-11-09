// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
// Require Route
const apiOpen = require('./routes/routesOpen');
const apiFront = require('./routes/routesFront');
const apiData = require('./routes/routesData');
const apiMedia = require('./routes/routesMedia');
const apiSecu = require('./routes/routesSecu');
// Require Config
const { getConf } = require('./config/config');
const log = require('./utils/logger');

const mod = 'server';

const passport = require('./utils/passportSetup');
const initDb = require('./database/scripts/initDatabase');
const { isDevEnv } = require('./config/backOptions');
const { checkRolePerm } = require('./utils/roleCheck');

// Create a new express application named 'app'
const app = express();
// Set our backend port to be either an environment variable or port 5000
const port = getConf('server', 'listening_port') || 5000;

// This application level middleware prints incoming requests to the servers console, useful to see incoming requests
app.use((req, res, next) => {
  log.sysInfo(mod, '', `Request_Endpoint: ${req.method} ${req.url}`, log.getContext(req, {}));
  // console.log('url:', req.url, ' | params:', req.params, ' | query:', req.query);
  // console.debug(req.cookies?`   cookies: ${req.cookies}`:'   auth:', req.headers?.authorization);
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        scriptSrc: ["'self'"],
        'connect-src': ["'self'", ...getConf('security').trusted_domain],
      },
    },
  })
);

// Configure the bodyParser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure the CORs middleware
app.use(cors());

// Passport middleware
app.use(passport.initialize());

const authenticate = passport.authenticate('jwt', { session: false });

// Configure app to use routes
app.use(`/api/open/`, apiOpen);
app.use(`/api/front/`, apiFront);
app.use(`/api/data/`, authenticate, apiData);
app.use(`/api/media/`, authenticate, apiMedia);
app.use(`/api/secu/`, authenticate, checkRolePerm('Admin'), apiSecu);

// This middleware informs the express application to serve our compiled React files
// if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
if (!isDevEnv()) {
  app.use(express.static(path.join(__dirname, 'front/build')));

  app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'front/build', 'index.html'));
  });
}

// Init database on startup
initDb.initDatabase();

// Catch any bad requests
app.get('*', (req, res) => res.status(404).send(`Route '${req.method} ${req.url}' not found`));

// Configure our server to listen on the port defiend by our port variable
app.listen(port, () => log.i(mod, '', `BACK_END_SERVICE_PORT: ${port}`, {}));
