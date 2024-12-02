/* eslint-disable no-console */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { readFileSync } from 'fs'
import { parse } from 'ini'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { jsonToString, pathJoin } from '../utils/utils.js'
import { getBackDomain, getBackOptions, OPT_DB_PATH, OPT_USER_CONF } from './backOptions.js'

export const FORM_PREFIX = 'form'
export const CATALOG = 'rudi-catalog'
export const STORAGE = 'rudi-storage'
export const MANAGER = 'rudi-manager'

// -------------------------------------------------------------------------------------------------
// Load default conf
const defaultConfigFile = './prodmanager-conf-default.ini'
const defaultCustomConfigFile = './prodmanager-conf-custom.ini' // if not set

let defaultConfFileContent
try {
  defaultConfFileContent = readFileSync(defaultConfigFile, 'utf-8')
} catch {
  throw new Error(`No default configuration file was found at '${customConfigFile}'`)
}

// -------------------------------------------------------------------------------------------------
// Load custom conf
const customConfigFile = getBackOptions(OPT_USER_CONF, defaultCustomConfigFile)
let customConfFileContent
try {
  customConfFileContent = readFileSync(customConfigFile, 'utf-8')
} catch {
  throw new Error(`No custom configuration file was found at '${customConfigFile}'`)
}

const customConfig = parse(customConfFileContent)
const config = parse(defaultConfFileContent)

for (const section in customConfig) {
  const customParams = customConfig[section]
  if (customParams) {
    if (!config[section]) config[section] = {}
    for (const param in customParams) if (customParams[param]) config[section][param] = customParams[param]
  }
}

if (config.logging.display_conf) jsonToString(config)

const RUDI_CATALOG_URL = config?.rudi_api?.rudi_api_url
const RUDI_STORAGE_URL = config?.rudi_media?.rudi_media_url

console.debug(`[CONF] ${CATALOG} url:`, RUDI_CATALOG_URL)
console.debug(`[CONF] ${STORAGE} url:`, RUDI_STORAGE_URL)
console.debug(`[CONF] ${MANAGER} domain:`, getBackDomain())

if (!RUDI_CATALOG_URL) throw new Error(`Configuration error: ${CATALOG} URL should be defined`)
if (!RUDI_STORAGE_URL) throw new Error(`Configuration error: ${STORAGE} URL should be defined`)

console.debug()

// Access conf values
export function getConf(section, subSection) {
  if (!section) return config
  const sect = config[section]
  if (!sect || !subSection) return sect
  return sect[subSection]
}

// Shortcuts to access popular conf values
const RUDI_CATALOG_API_ADMIN = getConf('rudi_api', 'admin_api') || 'api/admin'
export const getCatalogUrl = (...args) => pathJoin(RUDI_CATALOG_URL, ...args)
export const getCatalogAdminUrl = (...args) => pathJoin(RUDI_CATALOG_URL, RUDI_CATALOG_API_ADMIN, ...args)
export const getCatalogAdminPath = (...args) => pathJoin(RUDI_CATALOG_API_ADMIN, ...args)

export function getCatalogUrlAndParams(url, req) {
  const finalUrl = new URL(getCatalogUrl(url))
  if (req) {
    const origUrl = new URL(getCatalogUrl(req?.url))
    if (origUrl?.search) {
      origUrl.searchParams.forEach((val, key) => finalUrl.searchParams.set(key, val))
    }
  }
  return finalUrl.href
}

export const getStorageUrl = (...args) => pathJoin(RUDI_STORAGE_URL, ...args)
export const getStorageDwnlUrl = (id) => getStorageUrl('download', id)

// const CONSOLE_FORM_URL = removeTrailingSlash(config.rudi_console.console_form_url)

const getDbConf = (subSection) => (config.database?.[subSection] ? `${config.database[subSection]}`.trim() : false)

const DB_PATH = getBackOptions(OPT_DB_PATH) || pathJoin(getDbConf('db_directory'), getDbConf('db_filename'))

export const getDbPath = () => DB_PATH

export const getSuId = () => getDbConf('db_su_id') || 0
export const getSuPwd = () => getDbConf('db_su_pwd')
export const isSuPwdHashed = () => getDbConf('is_su_pwd_hashed')
export const getSuName = () => getDbConf('db_su_usr')
export function setSuName(userDefinedSuName) {
  config.database.db_su_usr = userDefinedSuName
}
export const getSuMail = () => config?.database?.db_su_mail || 'node-admin@rudi-univ-rennes1.fr'

const BACK_PREFIX = getConf('server', 'backend_prefix') || 'back'
export const getBackUrlPrefix = (urlBit) => pathJoin('/', BACK_PREFIX, urlBit)
