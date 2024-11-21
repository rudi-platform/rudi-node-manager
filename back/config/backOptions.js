/* eslint-disable no-console */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import child from 'child_process'
import minimist from 'minimist'

const _argv = minimist(process.argv.slice(2), { string: ['hash', 'tag', 'su'] })
console.log('_argv:', _argv)

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getDomain } from '../utils/utils.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
export const OPT_USER_CONF = 'conf'
export const OPT_GIT_HASH = 'hash'
export const OPT_APP_TAG = 'tag'
export const OPT_NODE_ENV = 'nodeEnv'
export const OPT_BACK_PATH = 'backPath'
export const OPT_SU_CREDS = 'suCreds'
export const OPT_DB_PATH = 'dbPath'

export const OPTIONS = {
  [OPT_NODE_ENV]: {
    text: 'Node environment: production | development',
    cli: 'node_env',
    env: 'NODE_ENV',
  },
  [OPT_USER_CONF]: {
    text: 'Path for user conf file',
    cli: 'conf',
    env: 'RUDI_PROD_MANAGER_USER_CONF',
  },
  [OPT_GIT_HASH]: {
    text: 'Git hash',
    cli: 'hash',
    env: 'RUDI_PROD_MANAGER_GIT_REV',
  },
  [OPT_APP_TAG]: {
    text: 'Version tag displayed',
    cli: 'tag',
    env: 'RUDI_PROD_MANAGER_APP_TAG',
  },
  [OPT_BACK_PATH]: {
    text: 'Back-end path',
    cli: 'url',
    env: 'RUDI_MANAGER_URL',
  },
  [OPT_DB_PATH]: {
    text: 'Full path for the usr db file',
    cli: 'db',
    env: 'RUDI_MANAGER_DB',
  },
  [OPT_SU_CREDS]: {
    text: 'Base64 colon separated super-user credentials: <name>:<hashed pwd>',
    cli: 'su',
    env: 'RUDI_PROD_MANAGER_SU_CREDS',
  },
}
// if (argv.indexOf('--opts') > -1) {
console.log('--------------------------------------------------------------')

console.log('Options to run this app: ')
Object.keys(OPTIONS).forEach((opt) =>
  console.log(
    '    cli: --' + OPTIONS[opt].cli + (OPTIONS[opt].cli.length < 8 ? '\t' : '') + '\t| env: ' + OPTIONS[opt].env
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
  if (cliOption === '_') {
    if (_argv[cliOption].length > 0)
      console.error(
        '!!! ERR Command Line option not recognized. You might have used --opt = "value" with value ',
        _argv[cliOption]
      )
    return
  }
  let found = false
  for (const appOpt of Object.keys(OPTIONS)) {
    if (OPTIONS[appOpt]?.cli === cliOption) {
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
Object.keys(OPTIONS).forEach((opt) => {
  if (cliOptionsValues[opt] !== undefined) {
    backOptionsValues[opt] = cliOptionsValues[opt]
    console.log('    (cli) ' + opt + ' => ' + backOptionsValues[opt])
  } else {
    const envVar = OPTIONS[opt].env
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
export const getBackOptions = (opt, altValue) => (opt ? backOptionsValues[opt] || altValue : backOptionsValues)

export const getAppTag = () => getBackOptions(OPT_APP_TAG) || ''

export function getHash() {
  let gitHash = getBackOptions(OPT_GIT_HASH)
  if (!gitHash) {
    try {
      gitHash = child.execSync('git rev-parse --short HEAD')
    } catch {
      console.error('WARNING: no --hash option provided + giv rev parse does not work')
      return 'v0_0;'
    }
  }
  return gitHash
}

export function getTags() {
  const tags = { tag: getAppTag() }
  const gitHash = getHash()
  if (gitHash) tags['hash'] = gitHash
  return tags
}

export const getNodeEnv = () => getBackOptions(OPT_NODE_ENV)
export const isDevEnv = () => getNodeEnv() === 'development'
export const isProdEnv = () => getNodeEnv() === 'production'

const backDomain = () => {
  const backPath = getBackOptions(OPT_BACK_PATH)
  try {
    return getDomain(backPath)
  } catch {
    return backPath
  }
}

const BACK_DOMAIN = backDomain()
export const getBackDomain = () => BACK_DOMAIN
