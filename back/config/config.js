/* eslint-disable no-console */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { readFileSync } from 'fs'
import { parse } from 'ini'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { jsonToString, pathJoin, removeTrailingSlash } from '../utils/utils.js'
import { getBackOptions, getOptAppPrefix, getOptBackDomain, OPT_DB_PATH, OPT_USER_CONF } from './backOptions.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
export const CATALOG = 'rudi-catalog'
export const STORAGE = 'rudi-storage'
export const MANAGER = 'rudi-manager'

// -------------------------------------------------------------------------------------------------
// Load default conf
// -------------------------------------------------------------------------------------------------
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
// -------------------------------------------------------------------------------------------------
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
  if (!config[section]) config[section] = customConfig[section]
  else config[section] = { ...config[section], ...customConfig[section] }
}

if (config.logging.display_conf) jsonToString(config)

const getCatalogConf = (subSection, altSubSection, altVal) =>
  getAltConf('rudi_catalog', 'rudi_api', subSection, altSubSection, altVal)
const getStorageConf = (subSection, altSubSection, altVal) =>
  getAltConf('rudi_storage', 'rudi_media', subSection, altSubSection, altVal)

const RUDI_CATALOG_URL = getCatalogConf('rudi_catalog_url', 'rudi_api_url')
const RUDI_STORAGE_URL = getStorageConf('rudi_storage_url', 'rudi_media_url')

console.debug(`[CONF] ${CATALOG} url:   `, RUDI_CATALOG_URL)
console.debug(`[CONF] ${STORAGE} url:   `, RUDI_STORAGE_URL)
console.debug(`[CONF] ${MANAGER} domain:`, getOptBackDomain())

if (!RUDI_CATALOG_URL) throw new Error(`Configuration error: ${CATALOG} URL should be defined`)
if (!RUDI_STORAGE_URL) throw new Error(`Configuration error: ${STORAGE} URL should be defined`)

// -------------------------------------------------------------------------------------------------
// Access conf values
// -------------------------------------------------------------------------------------------------
export function getConf(section, subSection, defaultVal) {
  if (!section) return config
  const sect = config[section]
  if (!sect || !subSection) return sect
  return sect[subSection] ?? defaultVal
}
export function getAltConf(section, altSection, subSection, altSubSection, defaultVal) {
  if (!section) return config
  const sect = customConfig[section] ?? customConfig[altSection] ?? config[section] ?? config[altSection]
  if (!sect || !subSection) return sect
  return sect[subSection] ?? sect[altSubSection] ?? defaultVal
}

// -------------------------------------------------------------------------------------------------
// Shortcuts to access popular conf values
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// Manager app server
// -------------------------------------------------------------------------------------------------
const LISTENING_PORT = getConf('server', 'listening_port', 5000)
const LISTENING_ADDRESS = getConf('server', 'listening_address', '0.0.0.0')

export const getBackendListeningPort = () => LISTENING_PORT
export const getBackendListeningAddress = () => LISTENING_ADDRESS
export const getBackendListeningAddressAndPort = () => `${LISTENING_ADDRESS}:${LISTENING_PORT}`

const HOST_DOMAIN = getOptBackDomain() ?? getBackendListeningAddressAndPort()
export const getHostDomain = () => HOST_DOMAIN

console.debug(`[CONF] ${MANAGER} host:  `, HOST_DOMAIN)
console.debug()

const MANAGER_PREFIX = getOptAppPrefix() ?? getConf('server', 'manager_prefix', '')
const BACKEND_PREFIX = getConf('server', 'backend_prefix', 'api')
const FRONTEND_PREFIX = getConf('server', 'frontend_prefix', '')
const CONSOLE_PREFIX = getConf('server', 'console_prefix', 'form')

export const getPublicManager = (...args) => pathJoin('/', removeTrailingSlash(MANAGER_PREFIX), ...args)
export const getPublicBack = (...args) => getPublicManager(BACKEND_PREFIX, ...args)
export const getPublicFront = (...args) => getPublicManager(FRONTEND_PREFIX, ...args)
export const getPublicConsole = (...args) => getPublicManager(CONSOLE_PREFIX, ...args)

console.debug('[CONF] Public prefix Manager:', getPublicManager())
console.debug('[CONF] Public prefix Backend:', getPublicBack())
console.debug('[CONF] Public prefix FrontUI:', getPublicFront())
console.debug('[CONF] Public prefix Console:', getPublicConsole())
console.debug()

export const getRouterPath = (...args) => pathJoin('/', removeTrailingSlash(MANAGER_PREFIX), ...args)
export const getRouterBack = (...args) => getRouterPath(BACKEND_PREFIX, ...args)
export const getDirectBack = (...url) => pathJoin('/', BACKEND_PREFIX, ...url)

export const getRouterFront = (...args) => getRouterPath(removeTrailingSlash(FRONTEND_PREFIX), ...args)
export const getDirectFront = (...args) => pathJoin('/', removeTrailingSlash(FRONTEND_PREFIX), ...args)

export const getRouterConsole = (...args) => getRouterPath(CONSOLE_PREFIX, ...args)
export const getDirectConsole = (...args) => pathJoin('/', CONSOLE_PREFIX, ...args)

console.debug('[CONF] Routing Manager:', getRouterPath())
console.debug('[CONF] Routing Backend:', getRouterBack(), '|', getDirectBack())
console.debug('[CONF] Routing FrontUI:', getRouterFront())
console.debug('[CONF] Routing Console:', getRouterConsole())
console.debug()

// -------------------------------------------------------------------------------------------------
// Catalog
// -------------------------------------------------------------------------------------------------
const RUDI_CATALOG_API_ADMIN = getCatalogConf('admin_api', 'admin_api', 'api/admin')
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

// -------------------------------------------------------------------------------------------------
// Storage
// -------------------------------------------------------------------------------------------------
export const getStorageUrl = (...args) => pathJoin(RUDI_STORAGE_URL, ...args)
export const getStorageDwnlUrl = (id) => getStorageUrl('download', id)

// -------------------------------------------------------------------------------------------------
// DB
// -------------------------------------------------------------------------------------------------
const getDbConf = (subSection, altVal) => getConf('database', subSection, altVal).trim()

const DB_PATH = getBackOptions(OPT_DB_PATH, pathJoin(getDbConf('db_directory'), getDbConf('db_filename')))
export const getDbPath = () => DB_PATH

// -------------------------------------------------------------------------------------------------
// Super user
// -------------------------------------------------------------------------------------------------
export const getConfSuId = () => getDbConf('db_su_id', 0)
export const getConfSuPwd = () => getDbConf('db_su_pwd')
export const isConfSuPwdHashed = () => getDbConf('is_su_pwd_hashed')
export const getConfSuMail = () => getDbConf('db_su_mail', 'node-admin@rudi-univ-rennes1.fr')
export const getConfSuName = () => getDbConf('db_su_usr')
export function setConfSuName(userDefinedSuName) {
  config.database.db_su_usr = userDefinedSuName
}

// -------------------------------------------------------------------------------------------------
// Keys
// -------------------------------------------------------------------------------------------------
const DEFAULT_MANAGER_KEY = getConf('auth', 'pm_prv_key')
const KEY_FOR_CATALOG = getCatalogConf('pm_api_key', 'pm_catalog_key', DEFAULT_MANAGER_KEY)
const KEY_FOR_STORAGE = getStorageConf('pm_media_key', 'pm_storage_key', DEFAULT_MANAGER_KEY)

export const getDefaultKey = () => DEFAULT_MANAGER_KEY
export const getKeyForCatalog = () => KEY_FOR_CATALOG
export const getKeyForStorage = () => KEY_FOR_STORAGE

const SSH_PUB_DIR = getConf('auth', 'ssh_pub_dir')
export const getSshPubDir = () => SSH_PUB_DIR

const ID_FOR_CATALOG = getCatalogConf('pm_api_id', 'pm_catalog_id')
const ID_FOR_STORAGE = getStorageConf('pm_media_id', 'pm_storage_id')
export const getIdForCatalog = () => ID_FOR_CATALOG
export const getIdForStorage = () => ID_FOR_STORAGE
