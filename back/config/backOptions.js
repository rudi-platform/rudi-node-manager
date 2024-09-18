const minimist = require('minimist')
const { getDomain } = require('../utils/utils.js')

// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
exports.OPT_USER_CONF = 'conf'
exports.OPT_GIT_HASH = 'hash'
exports.OPT_APP_TAG = 'tag'
exports.OPT_NODE_ENV = 'nodeEnv'
exports.OPT_BACK_PATH = 'backPath'
exports.OPT_SU_CREDS = 'suCreds'
exports.OPT_DB_PATH = 'dbPath'

const _argv = minimist(process.argv.slice(2))
console.log('_argv:', _argv)

// ------------------------------------------------------------------------------------------------
// App options
// 'text': description
// 'cli': option given through command line interface
// 'env': option given through environment variable
// 'file': option given through the configuration file
// If found, 'cli' has priority over 'env' that has priority over 'file'
// ------------------------------------------------------------------------------------------------
exports.OPTIONS = {
  [this.OPT_NODE_ENV]: {
    text: 'Node environment: production | development',
    cli: 'node_env',
    env: 'NODE_ENV',
  },
  [this.OPT_USER_CONF]: {
    text: 'Path for user conf file',
    cli: 'conf',
    env: 'RUDI_PROD_MANAGER_USER_CONF',
  },
  [this.OPT_GIT_HASH]: {
    text: 'Git hash',
    cli: 'hash',
    env: 'RUDI_PROD_MANAGER_GIT_REV',
  },
  [this.OPT_APP_TAG]: {
    text: 'Version tag displayed',
    cli: 'tag',
    env: 'RUDI_PROD_MANAGER_APP_TAG',
  },
  [this.OPT_BACK_PATH]: {
    text: 'Back-end path',
    cli: 'url',
    env: 'RUDI_MANAGER_URL',
  },
  [this.OPT_DB_PATH]: {
    text: 'Full path for the usr db file',
    cli: 'db',
    env: 'RUDI_MANAGER_DB',
  },
  [this.OPT_SU_CREDS]: {
    text: 'Base64 colon separated super-user credentials: <name>:<hashed pwd>',
    cli: 'su',
    env: 'RUDI_PROD_MANAGER_SU_CREDS',
  },
}
// if (argv.indexOf('--opts') > -1) {
console.log('--------------------------------------------------------------')

console.log('Options to run this app: ')
Object.keys(this.OPTIONS).forEach((opt) =>
  console.log(
    '    cli: --' +
      this.OPTIONS[opt].cli +
      (this.OPTIONS[opt].cli.length < 8 ? '\t' : '') +
      '\t| env: ' +
      this.OPTIONS[opt].env
  )
)
console.log('--------------------------------------------------------------')
// }
// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
// console.log('= Extract command line arguments =');
// console.log(process.argv);
const cliOptionsValues = {}

Object.keys(_argv).forEach((cliOption) => {
  if (cliOption == '_') {
    if (_argv[cliOption].length > 0)
      console.error(
        '!!! ERR Command Line option not recognized. You might have used --opt = "value" with value ',
        _argv[cliOption]
      )
    return
  }
  let found = false
  for (const appOpt of Object.keys(this.OPTIONS)) {
    if (this.OPTIONS[appOpt]?.cli == cliOption) {
      cliOptionsValues[appOpt] = _argv[cliOption]
      found = true
      // console.log('Command Line option recognized:', cliOption, '=', _argv[cliOption])
      break
    }
  }
  if (!found) {
    console.error('!!! ERR Command Line option not recognized:', `--${cliOption}`, _argv[cliOption])
    console.log('--------------------------------------------------------------')
  }
})

// ------------------------------------------------------------------------------------------------
// Extracted conf values
// ------------------------------------------------------------------------------------------------
console.log('Extracted conf values:')
const backOptionsValues = {}
Object.keys(this.OPTIONS).forEach((opt) => {
  if (cliOptionsValues[opt] !== undefined) {
    backOptionsValues[opt] = cliOptionsValues[opt]
    console.log('    (cli) ' + opt + ' => ' + backOptionsValues[opt])
  } else {
    const envVar = this.OPTIONS[opt].env
    if (process.env[envVar]) {
      backOptionsValues[opt] = process.env[envVar]
      console.log('    (env) ' + opt + ' => ' + backOptionsValues[opt])
    }
  }
})

console.log('--------------------------------------------------------------')

/**
 * Retrieve app option values
 * @param {String} opt Value given through command line option or environment variable
 * @param {String} altValue Value to be used if both CLI option and ENV option are not defined
 * @return {String} Value for the option
 */
exports.getBackOptions = (opt, altValue) =>
  opt ? backOptionsValues[opt] || altValue : backOptionsValues

exports.getAppTag = () => this.getBackOptions(this.OPT_APP_TAG) || ''

exports.getHash = () => {
  let gitHash = this.getBackOptions(this.OPT_GIT_HASH)
  if (!gitHash) {
    try {
      gitHash = require('child_process').execSync('git rev-parse --short HEAD')
    } catch {
      console.error('WARNING: no --hash option provided + giv rev parse does not work')
      return 'v0_0;'
    }
  }
  return gitHash
}

exports.getTags = () => {
  const tags = { tag: this.getAppTag() }
  const gitHash = this.getHash()
  if (gitHash) tags['hash'] = gitHash
  return tags
}

exports.getNodeEnv = () => this.getBackOptions(this.OPT_NODE_ENV)
exports.isDevEnv = () => this.getNodeEnv() === 'development'
exports.isProdEnv = () => this.getNodeEnv() === 'production'

const backDomain = () => {
  const backPath = this.getBackOptions(this.OPT_BACK_PATH)
  try {
    return getDomain(backPath)
  } catch {
    return backPath
  }
}

const BACK_DOMAIN = backDomain()
exports.getBackDomain = () => BACK_DOMAIN
