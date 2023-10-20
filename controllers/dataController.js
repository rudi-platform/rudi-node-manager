const mod = 'apiSmplCalls'

// External dependencies
const axios = require('axios')

// Internal dependencies
const { getRudiApi, getAdminApi } = require('../config/config')
const { getRudiApiToken } = require('../utils/secu')
const { handleError } = require('./errorHandler')
const log = require('../utils/logger')

let cache = {}
// Helper functions
const callApiModule = (req, reply, url, opType) => {
  const fun = 'callApiModule'
  if (cache[opType]) return req ? reply.status(200).send(cache[opType]) : cache[opType]
  const completeUrl = new URL(url, getRudiApi())
  if (req?.query) completeUrl.search = new URLSearchParams(req.query)

  return axios
    .get(`${completeUrl}`, { headers: { Authorization: `Bearer ${getRudiApiToken()}` } })
    .then((res) => {
      cache[opType] = res.data
      return req ? reply.status(200).send(res.data) : cache[opType]
    })
    .catch((error) => {
      if (error.code == 'ECONNREFUSED') {
        log.e(
          mod,
          fun,
          'Connection from “RUDI Prod Manager” to “RUDI API” module failed: “RUDI API” module is apparently down'
        )
        const statusCode = 500
        const connError = {
          statusCode,
          error: 'Connection from “RUDI Prod Manager” to “RUDI API” module failed',
          message: '“RUDI API” module is apparently down, contact the RUDI node admin',
        }
        if (req) return reply.status(500).json(connError)
        else throw new Error(connError)
      }
      if (req) return handleError(req, reply, error, 501, opType)
    })
}

// Controllers
exports.getVersion = (req, reply) => callApiModule(req, reply, '/api/version', 'get_version')
exports.getEnum = (req, reply) => callApiModule(req, reply, getAdminApi('enum'), 'get_enum')
exports.getLicences = (req, reply) =>
  callApiModule(req, reply, getAdminApi('licences'), 'get_licences')

exports.getThemeByLang = (req, reply) =>
  callApiModule(req, reply, getAdminApi(`enum/themes/${req.params?.lang}`), 'get_theme_by_lg')

exports.getApiExternalUrl = (req, reply) =>
  callApiModule(null, reply, getAdminApi('check/node/url'), 'get_api_url')
exports.getPortalUrl = (req, reply) =>
  callApiModule(null, reply, getAdminApi('check/portal/url'), 'get_portal_url')
