const mod = 'callApiSimple'

// External dependencies
const axios = require('axios')

// Internal dependencies
const { getRudiApi, getAdminApi } = require('../config/config')
const { getRudiApiToken } = require('../utils/secu')
const { handleError } = require('./errorHandler')
const log = require('../utils/logger')
const { cleanErrMsg } = require('../utils/utils')

let cache = {}
// Helper functions
const callApiModule = async (req, reply, url, opType) => {
  const fun = 'callApiModule'
  try {
    if (cache[opType]) return req ? reply.status(200).send(cache[opType]) : cache[opType]
    const completeUrl = new URL(url, getRudiApi())
    if (req?.query) completeUrl.search = new URLSearchParams(req.query)

    const res = await axios.get(`${completeUrl}`, {
      headers: { Authorization: `Bearer ${getRudiApiToken()}` },
    })
    cache[opType] = res.data
    return req ? reply.status(200).send(res.data) : cache[opType]
  } catch (err) {

    if (err.code == 'ECONNREFUSED') {
      const statusCode = 500
      const connError = {
        statusCode,
        error: 'Connection from “RUDI Prod Manager” to “RUDI API” module failed',
        message: '“RUDI API” module is apparently down, contact the RUDI node admin',
      }
      const connErrorMsg = connError.error + ': ' + connError.message

      log.e(mod, fun, connErrorMsg)
      if (req) return reply.status(statusCode).json(connError)
      else throw new Error(connErrorMsg)
    }
    log.w(mod, fun, cleanErrMsg(err))
    if (req) return handleError(req, reply, err, 501, opType)
    throw err
  }
}

// Controllers
exports.getVersion = (req, reply) => callApiModule(req, reply, '/api/version', 'get_version')
exports.getEnum = (req, reply) => callApiModule(req, reply, getAdminApi('enum'), 'get_enum')
exports.getLicences = (req, reply) =>
  callApiModule(req, reply, getAdminApi('licences'), 'get_licences')

exports.getThemeByLang = (req, reply) =>
  callApiModule(req, reply, getAdminApi(`enum/themes/${req.params?.lang}`), 'get_theme_by_lg')

exports.getApiExternalUrl = () =>
  callApiModule(null, null, getAdminApi('check/node/url'), 'get_api_url')
exports.getPortalUrl = () =>
  callApiModule(null, null, getAdminApi('check/portal/url'), 'get_portal_url')
