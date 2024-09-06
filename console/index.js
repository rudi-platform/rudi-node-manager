// This code has been rendered obsolete!!!
//
// The main server now uses the console router directly
// managerApp.use(pathJoin('', FORM_PREFIX), consoleRouter)
//

/**
 * Code for the node server
 * Load config, serve dependencies and static content
 *
 * args :
 *  --config        path to config file
 *  --dev           mode dev
 *  --revision      expose git hash (for production purposes)
 *
 * Listen on the port 3038
 * @author Forian Desmortreux
 */

/* ----- INITALIZE VARIABLES AND CONSTANTS ----- */
const express = require('express')
const minimist = require('minimist')

const consoleRouter = require('./router.js')

const _argv = minimist(process.argv.slice(2))
// console.log('_argv:', _argv)

// Build config from default config and parse cli args
const loadConfig = () => {
  // Loading default config
  const config = require('./default_config.json')

  // Env dev
  if (_argv['dev'] || _argv['env'] == 'dev') config.dev = true

  // Git hash
  const cliRevision = _argv['revision'] || _argv['hash']
  if (cliRevision) config.gitHash = cliRevision

  const customConfFile = _argv['config'] || _argv['conf']
  if (customConfFile) {
    let customConf
    try {
      customConf = require(customConfFile)
    } catch (e) {
      throw new Error('Error with config file reading')
    }
    try {
      Object.assign(config, customConf)
    } catch {
      throw new Error('Error with config file structure')
    }
  } else {
    console.warn('[WARN] CLI option --config not found')
  }

  if (!config.gitHash) {
    try {
      config.gitHash = `${require('child_process').execSync('git rev-parse --short HEAD')}`.trim()
    } catch (e) {
      console.error(e)
      /* Ignore.*/
    }
  }
  if (config.pm_url.endsWith('/')) config.pm_url = config.pm_url.slice(0, -1)
  if (!config.pm_url.endsWith('api')) config.pm_url = `${config.pm_url}/api`

  console.log('Config :\n', config)
  return config
}

const launchServer = () => {
  /* ----- CONF ----- */

  console.log(new Date().toISOString())
  const consoleConfig = loadConfig()

  /* ----- EXPRESS ----- */

  // Routing

  const app = express()
  app.use('/', consoleRouter)

  // Serve config
  app.get('/conf', (req, res) => {
    console.log('Serving config...')
    res.json(consoleConfig)
  })

  // Get commit id;
  app.get('/hashId', (req, res) => res.send(consoleConfig.gitHash))
  app.get('/hash', (req, res) => res.send(consoleConfig.gitHash))

  // Start node serveur
  app.listen(consoleConfig.port, consoleConfig.host, () =>
    console.log('App listening at %s:%s', consoleConfig.host, consoleConfig.port)
  )
}

try {
  launchServer()
  console.log('--- Server launched ---')
} catch (err) {
  console.error(err)
}
