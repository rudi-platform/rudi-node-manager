/* eslint-disable no-console */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
const fs = require('fs')
const ini = require('ini')

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
const { getBackOptions, OPT_USER_CONF, getBackDomain, OPT_DB_PATH } = require('./backOptions')
const { pathJoin, jsonToString } = require('../utils/utils')

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
exports.FORM_PREFIX = 'form'
exports.CATALOG = 'rudi-catalog'
exports.STORAGE = 'rudi-storage'
exports.MANAGER = 'rudi-manager'

// -------------------------------------------------------------------------------------------------
// Load default conf
const defaultConfigFile = './prodmanager-conf-default.ini'
const defaultCustomConfigFile = './prodmanager-conf-custom.ini' // if not set

let defaultConfFileContent
try {
  defaultConfFileContent = fs.readFileSync(defaultConfigFile, 'utf-8')
} catch {
  throw new Error(`No default configuration file was found at '${customConfigFile}'`)
}

// -------------------------------------------------------------------------------------------------
// Load custom conf
const customConfigFile = getBackOptions(OPT_USER_CONF, defaultCustomConfigFile)
let customConfFileContent
try {
  customConfFileContent = fs.readFileSync(customConfigFile, 'utf-8')
} catch {
  throw new Error(`No custom configuration file was found at '${customConfigFile}'`)
}

const customConfig = ini.parse(customConfFileContent)
const config = ini.parse(defaultConfFileContent)

for (const section in customConfig) {
  const customParams = customConfig[section]
  if (customParams) {
    if (!config[section]) config[section] = {}
    for (const param in customParams) if (customParams[param]) config[section][param] = customParams[param]
  }
}

if (config.logging.displayConf) jsonToString(config)

const RUDI_CATALOG_URL = config?.rudi_api?.rudi_api_url
const RUDI_STORAGE_URL = config?.rudi_media?.rudi_media_url

console.debug(`[CONF] ${this.CATALOG} url:`, RUDI_CATALOG_URL)
console.debug(`[CONF] ${this.STORAGE} url:`, RUDI_STORAGE_URL)
console.debug(`[CONF] ${this.MANAGER} domain:`, getBackDomain())

if (!RUDI_CATALOG_URL) throw new Error(`Configuration error: ${this.CATALOG} URL should be defined`)
if (!RUDI_STORAGE_URL) throw new Error(`Configuration error: ${this.STORAGE} URL should be defined`)

console.debug()

// Access conf values
exports.getConf = (section, subSection) => {
  if (!section) return config
  const sect = config[section]
  if (!sect || !subSection) return sect
  return sect[subSection]
}

// Shortcuts to access popular conf values
const RUDI_CATALOG_API_ADMIN = config.rudi_api?.admin_api || 'api/admin'
exports.getCatalogUrl = (...args) => pathJoin(RUDI_CATALOG_URL, ...args)
exports.getCatalogAdminUrl = (...args) => pathJoin(RUDI_CATALOG_URL, RUDI_CATALOG_API_ADMIN, ...args)
exports.getCatalogAdminPath = (...args) => pathJoin(RUDI_CATALOG_API_ADMIN, ...args)

exports.getCatalogUrlAndParams = (url, req) => {
  const finalUrl = new URL(this.getCatalogUrl(url))
  if (req) {
    const origUrl = new URL(this.getCatalogUrl(req?.url))
    if (origUrl?.search) {
      origUrl.searchParams.forEach((val, key) => finalUrl.searchParams.set(key, val))
    }
  }
  return finalUrl.href
}

exports.getStorageUrl = (...args) => pathJoin(RUDI_STORAGE_URL, ...args)
exports.getStorageDwnlUrl = (id) => this.getStorageUrl('download', id)

// const CONSOLE_FORM_URL = removeTrailingSlash(config.rudi_console.console_form_url)

const getDbConf = (subSection) => (config.database?.[subSection] ? `${config.database[subSection]}`.trim() : false)

const DB_PATH = getBackOptions(OPT_DB_PATH) || pathJoin(getDbConf('db_directory'), getDbConf('db_filename'))

exports.getDbPath = () => DB_PATH

exports.getSuId = () => getDbConf('db_su_id') || 0
exports.getSuPwd = () => getDbConf('db_su_pwd')
exports.isSuPwdHashed = () => getDbConf('is_su_pwd_hashed')
exports.getSuName = () => getDbConf('db_su_usr')
exports.setSuName = (userDefinedSuName) => {
  config.database.db_su_usr = userDefinedSuName
}
exports.getSuMail = () => config?.database?.db_su_mail || 'node-admin@rudi-univ-rennes1.fr'
