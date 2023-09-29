const mod = 'genCtrl'

const axios = require('axios')
const { getRudiApi, getAdminApi } = require('../config/config')
const errorHandler = require('./errorHandler')
const {
  CONSOLE_TOKEN_NAME,
  getRudiApiToken,
  PM_FRONT_TOKEN_NAME,
  refreshTokens,
} = require('../utils/secu')
const { sysWarn } = require('../utils/logger')
const { beautify } = require('../utils/utils')

const OBJECT_TYPES = {
  resources: { url: 'resources', id: 'global_id' },
  organizations: { url: 'organizations', id: 'organization_id' },
  contacts: { url: 'contacts', id: 'contact_id' },
  media: { url: 'media', id: 'media_id' },
  pub_keys: { url: 'pub_keys', id: 'name' },
  reports: { url: 'reports', id: 'report_id' },
}

/**
 *
 * @param {String} req The initial request
 * @param {String} reply The response for the request
 * @param {String} initialError The initial error
 * @param {Number} errCode The error code
 * @param {String} fun Describes operation type
 * @param {String} objectType The type of the object
 * @param {String} id The UUID of the object
 */
function handleError(req, reply, initialError, errCode, fun, objectType, id) {
  try {
    console.log('req params:', req.params)
    console.log('req url:', req.originalUrl)
    console.log('initialError:', initialError?.response?.data)
    if (
      initialError?.response?.data.statusCode &&
      initialError?.response?.data?.message &&
      initialError?.response?.data?.error
    )
      return reply.status(initialError.response.data.statusCode).json({
        statusCode: initialError.response.data.statusCode,
        error: initialError.response.data.error,
        message: initialError.response.data.message,
      })

    console.log(
      `errCode: ${initialError.statusCode || initialError.response?.data?.statusCode || errCode}`
    )
    console.log('fun: ' + fun)
    console.log('objectType: ' + objectType)
    console.log('id: ' + id)
    const errPayload = {}
    if (fun) errPayload.opType = fun
    if (id) errPayload.id = `${objectType}+${id}`
    const error = errorHandler.error(initialError, req, errPayload)
    reply.status(initialError.statusCode || errCode).json(error.moreInfo || error)
  } catch (err) {
    console.error(mod, 'handleError.initialError', initialError)
    console.error(mod, 'handleError failed', err)
  }
}
exports.handleError = handleError

const checkObjectType = (req, reply, fun, objectType) => {
  if (!OBJECT_TYPES[objectType]) {
    handleError(req, reply, new Error('Object type unknown: ' + objectType), 400, fun, objectType)
    return false
  }
  return true
}

const callApiModule = (req, reply, url, opType) => {
  const fun = `${mod}.callApiModule`
  const completeUrl = new URL(url, getRudiApi())
  if (req.query) completeUrl.search = new URLSearchParams(req.query)

  return axios
    .get(`${completeUrl}`, { headers: { Authorization: `Bearer ${getRudiApiToken(url, req)}` } })
    .then((res) => res.data)
    .catch((err) => {
      try {
        if (err.code == 'ECONNREFUSED') {
          const errObj = {
            statusCode: 500,
            message: '“RUDI API” module is apparently down, contact the RUDI node admin',
            error: 'Connection from “RUDI Prod Manager” to “RUDI API” module failed',
          }
          return handleError(req, reply, new Error(errObj), 500, fun, opType)
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

exports.getObjectList = (req, reply, next) => {
  const opType = 'get_objects'
  const { objectType } = req.params
  if (!checkObjectType(req, reply, opType, objectType) || objectType === 'media') return

  callApiModule(req, reply, getAdminApi(objectType), opType)
    .then((res) => {
      const { consoleToken, pmFrontToken } = refreshTokens(req)
      return reply
        .status(200)
        .cookie(CONSOLE_TOKEN_NAME, consoleToken.jwt, consoleToken.opts)
        .cookie(PM_FRONT_TOKEN_NAME, pmFrontToken.jwt, pmFrontToken.opts)
        .json(res)
    })
    .catch((err) => handleError(req, reply, err, 501, opType, objectType))
}

exports.getObjectById = (req, reply, next) => {
  const opType = 'get_object_by_id'
  const { objectType, id } = req.params
  if (!checkObjectType(req, reply, opType, objectType)) return

  return callApiModule(req, reply, getAdminApi(`${objectType}/${id}`), opType)
    .then((rudiObj) => reply.status(200).json(rudiObj))
    .catch((err) => handleError(req, reply, err, 501, opType, objectType, id))
}

exports.postObject = async (req, reply, next) => {
  const opType = 'post_object'
  const { objectType } = req.params
  try {
    if (!checkObjectType(req, reply, opType, objectType)) return
    let data
    try {
      const url = getAdminApi(objectType)
      const token = getRudiApiToken(url, req)
      const resRudiApi = await axios.post(getRudiApi(url), req.body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      data = resRudiApi.data
    } catch (e) {
      sysWarn(mod, opType, `ERR ${e.statusCode} Contacting RUDI API failed:`, e.message)
      throw e
    }

    const { consoleToken, pmFrontToken } = refreshTokens(req)
    reply
      .status(200)
      .cookie(CONSOLE_TOKEN_NAME, consoleToken.jwt, consoleToken.opts)
      .cookie(PM_FRONT_TOKEN_NAME, pmFrontToken.jwt, pmFrontToken.opts)
      .json(data)
  } catch (err) {
    const id = req.body[OBJECT_TYPES[objectType].id]
    handleError(req, reply, err, 501, opType, objectType, id)
  }
}

exports.putObject = async (req, reply, next) => {
  const opType = 'put_object'
  const { objectType } = req.params
  try {
    if (!checkObjectType(req, reply, opType, objectType)) return
    let data
    try {
      const url = getAdminApi(objectType)
      const token = getRudiApiToken(url, req)
      const resRudiApi = await axios.put(getRudiApi(url), req.body, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      data = resRudiApi.data
    } catch (e) {
      sysWarn(mod, opType, `ERR ${e.statusCode} Contacting RUDI API failed:`, e.message)
      throw e
    }

    const { consoleToken, pmFrontToken } = refreshTokens(req)
    reply
      .status(200)
      .cookie(CONSOLE_TOKEN_NAME, consoleToken.jwt, consoleToken.opts)
      .cookie(PM_FRONT_TOKEN_NAME, pmFrontToken.jwt, pmFrontToken.opts)
      .json(data)
  } catch (error) {
    const id = req.body[OBJECT_TYPES[objectType].id]
    handleError(req, reply, error, error.statusCode || 501, opType, objectType, id)
  }
}

exports.deleteObject = (req, reply, next) => {
  const fun = 'del_object'
  const { objectType, id } = req.params
  if (!checkObjectType(req, reply, fun, objectType)) return

  const url = getAdminApi(`${objectType}/${id}`)
  const token = getRudiApiToken(url, req)
  return axios
    .delete(getRudiApi(url), {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRudiApi) => {
      const rudiObj = resRudiApi.data
      reply.status(200).json(rudiObj)
    })
    .catch((error) => handleError(req, reply, error, 501, fun, objectType, id))
}

exports.deleteObjects = (req, reply, next) => {
  const fun = 'del_objects'
  const { objectType } = req.params
  if (!checkObjectType(req, reply, fun, objectType)) return

  const url = getAdminApi(`${objectType}`)
  const token = getRudiApiToken(url, req)
  return axios
    .delete(getRudiApi(url), {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRudiApi) => {
      const rudiObj = resRudiApi.data
      reply.status(200).json(rudiObj)
    })
    .catch((error) => handleError(req, reply, error, 501, fun, objectType))
}
