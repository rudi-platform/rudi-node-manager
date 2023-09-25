// External dependencies
const axios = require('axios')

// Internal dependencies
const { getRudiApi, getAdminApi } = require('../config/config')
const errorHandler = require('./errorHandler')
const { getRudiApiToken } = require('../utils/secu')

// Helper functions
const callApiModule = (req, reply, url, opType) => {
  const token = getRudiApiToken(url, req)
  const completeUrl = new URL(url, getRudiApi())
  if (req.query) completeUrl.search = new URLSearchParams(req.query)

  return axios
    .get(`${completeUrl}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => reply.status(200).send(res.data))
    .catch((err) => {
      try {
        if (err.code == 'ECONNREFUSED') {
          console.error(
            'Connection from “RUDI Prod Manager” to “RUDI API” module failed: “RUDI API” module is apparently down'
          )
          return reply.status(500).json({
            statusCode: 500,
            message: '“RUDI API” module is apparently down, contact the RUDI node admin',
            error: 'Connection from “RUDI Prod Manager” to “RUDI API” module failed',
          })
        }
        const error = errorHandler.error(err, req, { opType })
        return reply.status(error.statusCode).json(error)
      } catch (error) {
        err.statusCode = !err.statusCode || isNaN(err.statusCode) ? 500 : err.statusCode
        try {
          return reply
            .status(err.statusCode)
            .send('An error occurred:' + (error.message || error.msg))
        } catch (e) {
          console.error(e)
        }
      }
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
  callApiModule(req, reply, getAdminApi('check/node/url'), 'get_api_url')
