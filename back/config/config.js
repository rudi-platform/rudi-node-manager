// External dependencies
const fs = require('fs')
const ini = require('ini')

// Internal dependencies
const { getBackOptions, OPT_USER_CONF, getBackDomain } = require('./backOptions')
const { pathJoin, jsonToString, removeTrailingSlash } = require('../utils/utils')

// Constants
exports.FORM_PREFIX = 'form'
exports.CATALOG = 'rudi-catalog'
exports.STORAGE = 'rudi-storage'
exports.MANAGER = 'rudi-manager'

// Load default conf
const defaultConfigFile = './prodmanager-conf-default.ini'
const defaultCustomConfigFile = './prodmanager-conf-custom.ini' // if not set

let defaultConfFileContent
try {
  defaultConfFileContent = fs.readFileSync(defaultConfigFile, 'utf-8')
} catch (error) {
  throw new Error(`No default configuration file was found at '${customConfigFile}'`)
}

// Load custom conf
const customConfigFile = getBackOptions(OPT_USER_CONF, defaultCustomConfigFile)
let customConfFileContent
try {
  customConfFileContent = fs.readFileSync(customConfigFile, 'utf-8')
} catch (error) {
  throw new Error(`No custom configuration file was found at '${customConfigFile}'`)
}

const customConfig = ini.parse(customConfFileContent)
const config = ini.parse(defaultConfFileContent)

// eslint-disable-next-line guard-for-in
for (const section in customConfig) {
  const customParams = customConfig[section]
  if (customParams) {
    if (!config[section]) config[section] = {}
    for (const param in customParams) {
      if (customParams[param]) config[section][param] = customParams[param]
    }
  }
}

if (config.logging.displayConf) jsonToString(config)

const RUDI_API_URL = config?.rudi_api?.rudi_api_url
const RUDI_MEDIA_URL = config?.rudi_media?.rudi_media_url

console.debug(`[CONF] ${this.CATALOG} url:`, RUDI_API_URL)
console.debug(`[CONF] ${this.STORAGE} url:`, RUDI_MEDIA_URL)
console.debug(`[CONF] ${this.MANAGER} domain:`, getBackDomain())

if (!RUDI_API_URL) {
  throw new Error(`Configuration error: ${this.CATALOG} URL should be defined`)
}
if (!RUDI_MEDIA_URL) {
  throw new Error(`Configuration error: ${this.STORAGE} URL should be defined`)
}

console.debug()

// Access conf values
exports.getConf = (section, subSection) => {
  if (!section) return config
  const sect = config[section]
  if (!sect || !subSection) return sect
  return sect[subSection]
}

// Shortcuts to access popular conf values

exports.rudiCatalogUrl = (...args) => pathJoin(RUDI_API_URL, ...args)
exports.rudiCatalogAdminApi = (...args) =>
  pathJoin(RUDI_API_URL, config.rudi_api.admin_api, ...args)

exports.getAdminApi = (...args) => pathJoin(config.rudi_api.admin_api, ...args)

exports.getRudiMediaUrl = (...args) => pathJoin(RUDI_MEDIA_URL, ...args)
exports.getMediaDwnlUrl = (id) => this.getRudiMediaUrl('download', id)

// const CONSOLE_FORM_URL = removeTrailingSlash(config.rudi_console.console_form_url)

exports.getDbConf = (subSection) => config.database[subSection]
exports.getSuName = () => config?.database?.db_su_usr
exports.setSuName = (userDefinedSuName) => {
  config.database.db_su_usr = userDefinedSuName
}
exports.getSuMail = () => config?.database?.db_su_mail || 'node-admin@rudi-univ-rennes1.fr'

exports.getCompleteRudiApiUrl = (url, req) => {
  const finalUrl = new URL(this.rudiCatalogUrl(url))
  if (req) {
    const origUrl = new URL(this.rudiCatalogUrl(req.url))
    if (origUrl?.search) {
      origUrl.searchParams.forEach((val, key) => finalUrl.searchParams.set(key, val))
    }
  }
  return finalUrl.href
}
