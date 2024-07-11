/* eslint-disable no-console */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { execSync } from 'child_process'
import minimist from 'minimist'

const _argv = minimist(process.argv.slice(2), { string: ['hash', 'tag', 'su'] })
console.log('_argv:', _argv)

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getDomain, mergeStrings } from '../utils/utils.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
export const OPT_USER_CONF = 'conf'
export const OPT_GIT_HASH = 'hash'
export const OPT_APP_TAG = 'tag'
export const OPT_APP_PREFIX = 'appPrefix'
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
    env: 'MANAGER_USER_CONF',
  },
  [OPT_GIT_HASH]: {
    text: 'Git hash',
    cli: 'hash',
    env: 'MANAGER_GIT_REV',
  },
  [OPT_APP_TAG]: {
    text: 'Version tag displayed',
    cli: 'tag',
    env: 'MANAGER_APP_TAG',
  },
  [OPT_APP_PREFIX]: {
    text: 'Prefix used for the manager app',
    cli: 'pre',
    env: 'MANAGER_PREFIX',
  },
  [OPT_BACK_PATH]: {
    text: 'Back-end path',
    cli: 'url',
    env: 'MANAGER_PUBLIC_URL',
  },
  [OPT_DB_PATH]: {
    text: 'Full path for the usr db file',
    cli: 'db',
    env: 'MANAGER_DB',
  },
  [OPT_SU_CREDS]: {
    text: 'Base64 colon separated super-user credentials: <name>:<hashed pwd>',
    cli: 'su',
    env: 'MANAGER_SU',
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

// -------------------------------------------------------------------------------------------------
// Extract command line arguments
// -------------------------------------------------------------------------------------------------
// console.log('= Extract command line arguments =');
// console.log(process.argv);
const extractCliOptions = () => {
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
  return cliOptionsValues
}

const CLI_OPTIONS = extractCliOptions()
const getCliOption = (opt) => CLI_OPTIONS[opt]

// -------------------------------------------------------------------------------------------------
// Extracted conf values
// -------------------------------------------------------------------------------------------------
const getEnvVar = (opt) => {
  const envVarBaseName = OPTIONS[opt].env
  if (process.env[envVarBaseName] !== undefined) return process.env[envVarBaseName]
  // legacy
  for (const prefix of ['RUDI_NODE', 'RUDI', 'RUDI_PROD']) {
    // console.log(`checking env var ${mergeStrings('_', prefix, envVarBaseName)}`)
    const envVar = process.env[mergeStrings('_', prefix, envVarBaseName)]
    if (envVar !== undefined) return envVar
  }
}
const getUserOptions = () => {
  const backOptionsValues = {}
  console.log('Extracted conf values:')
  Object.keys(OPTIONS).forEach((opt) => {
    const cliOpt = getCliOption(opt)
    if (cliOpt !== undefined) {
      backOptionsValues[opt] = cliOpt
      console.log('    (cli) ' + opt + ' => ' + cliOpt)
    } else {
      const envVar = getEnvVar(opt)
      if (envVar !== undefined) {
        backOptionsValues[opt] = envVar
        console.log('    (env) ' + opt + ' => ' + envVar)
      }
    }
  })
  return backOptionsValues
}
const BACK_OPTIONS = getUserOptions()
console.log('--------------------------------------------------------------')

/**
 * Retrieve app option values
 * @param {String} opt Value given through command line option or environment variable
 * @param {String} altValue Value to be used if both CLI option and ENV option are not defined
 * @return {String} Value for the option
 */
export const getBackOptions = (opt, altValue) => {
  if (!opt) return BACK_OPTIONS
  return BACK_OPTIONS[opt] ?? altValue
}

export const getAppTag = () => getBackOptions(OPT_APP_TAG, '')

export function getHash() {
  let gitHash = getBackOptions(OPT_GIT_HASH)
  if (!gitHash) {
    try {
      gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim().slice(0, 7)
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

const nodeEnv = getBackOptions(OPT_NODE_ENV)
export const getNodeEnv = () => getBackOptions(OPT_NODE_ENV)
export const isDevEnv = () => nodeEnv === 'development'
export const isStageEnv = () => nodeEnv === 'staging'
export const isProdEnv = () => nodeEnv === 'production'

const BACK_PATH = getBackOptions(OPT_BACK_PATH)
const BACK_DOMAIN = getDomain(BACK_PATH)
export const getOptBackPath = () => BACK_PATH
export const getOptBackDomain = () => BACK_DOMAIN

// If the --su CLI option or MANAGER_SU_CREDS env var is defined, the SU creds in the DB will be overwritten.
export const getOptSuCreds = () => getBackOptions(OPT_SU_CREDS)

const APP_PREFIX = getBackOptions(OPT_APP_PREFIX)
export const getOptAppPrefix = () => APP_PREFIX
