const mod = 'genCtrl'

const log = require('../utils/logger')
const axios = require('axios')
const { getRudiApi, getAdminApi, getCompleteRudiApiUrl } = require('../config/config')
const {
  CONSOLE_TOKEN_NAME,
  getRudiApiToken,
  PM_FRONT_TOKEN_NAME,
  refreshTokens,
} = require('../utils/secu')
const { sysWarn, d } = require('../utils/logger')
const { handleError, treatAxiosError } = require('./errorHandler')
const { rudiApiGet } = require('../utils/connect.js')

const OBJECT_TYPES = {
  resources: { url: 'resources', id: 'global_id' },
  organizations: { url: 'organizations', id: 'organization_id' },
  contacts: { url: 'contacts', id: 'contact_id' },
  media: { url: 'media', id: 'media_id' },
  pub_keys: { url: 'pub_keys', id: 'name' },
  reports: { url: 'reports', id: 'report_id' },
}

const checkObjectType = (req, reply, fun, objectType) => {
  if (!OBJECT_TYPES[objectType]) {
    handleError(req, reply, new Error('Object type unknown: ' + objectType), 400, fun, objectType)
    return false
  }
  return true
}

exports.getObjectList = async (req, reply) => {
  const opType = 'get_objects'
  const { objectType } = req.params
  if (!checkObjectType(req, reply, opType, objectType)) return reply.status(404).json('Not found')
  try {
    const data = await rudiApiGet(getCompleteRudiApiUrl(getAdminApi(objectType), req))
    const { consoleToken, pmFrontToken } = refreshTokens(req)
    return reply
      .status(200)
      .cookie(CONSOLE_TOKEN_NAME, consoleToken.jwt, consoleToken.opts)
      .cookie(PM_FRONT_TOKEN_NAME, pmFrontToken.jwt, pmFrontToken.opts)
      .json(data)
  } catch (err) {
    handleError(req, reply, err, 501, opType, objectType)
  }
}

exports.getObjectById = async (req, reply, next) => {
  const opType = 'get_object_by_id'
  const { objectType, id } = req.params
  if (!checkObjectType(req, reply, opType, objectType)) return
  try {
    const rudiObj = await rudiApiGet(getCompleteRudiApiUrl(getAdminApi(objectType, id), req))
    return reply.status(200).json(rudiObj)
  } catch (err) {
    handleError(req, reply, err, 501, opType, objectType, id)
  }
}

exports.postObject = async (req, reply, next) => {
  const opType = 'post_object'
  const { objectType } = req.params
  try {
    if (!checkObjectType(req, reply, opType, objectType)) return
    let data
    try {
      const url = getAdminApi(objectType)
      const resRudiApi = await axios.post(getRudiApi(url), req.body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getRudiApiToken()}`,
        },
      })
      data = resRudiApi.data
    } catch (e) {
      sysWarn(mod, opType, `ERR ${e.statusCode || ''} Contacting RUDI API failed:`, e.message)
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

exports.putObject = async (req, reply) => {
  const opType = 'put_object'
  const { objectType } = req.params
  d(opType, 'req.params', req.params)
  d(opType, 'req', req)
  try {
    if (!checkObjectType(req, reply, opType, objectType)) return
    let data
    try {
      const url = getAdminApi(objectType)
      const resRudiApi = await axios.put(getRudiApi(url), req.body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getRudiApiToken()}`,
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
  } catch (error) {
    const id = req.body[OBJECT_TYPES[objectType].id]
    handleError(req, reply, error, error.statusCode || 501, opType, objectType, id)
  }
}

exports.deleteObject = (req, reply, next) => {
  const fun = 'del_object'
  const { objectType, id } = req.params
  if (!checkObjectType(req, reply, fun, objectType)) return

  const url = getAdminApi(objectType, id)
  return axios
    .delete(getRudiApi(url), {
      params: req.query,
      headers: { Authorization: `Bearer ${getRudiApiToken()}` },
    })
    .then((resRudiApi) => {
      const rudiObj = resRudiApi.data
      reply.status(200).json(rudiObj)
    })
    .catch((error) => handleError(req, reply, error, 501, fun, objectType, id))
}

exports.deleteObjects = (req, reply) => {
  const fun = 'del_objects'
  const { objectType } = req.params
  if (!checkObjectType(req, reply, fun, objectType)) return

  const url = getAdminApi(objectType)
  return axios
    .delete(getRudiApi(url), {
      params: req.query,
      headers: { Authorization: `Bearer ${getRudiApiToken()}` },
    })
    .then((resRudiApi) => {
      const rudiObj = resRudiApi.data
      reply.status(200).json(rudiObj)
    })
    .catch((error) => handleError(req, reply, error, 501, fun, objectType))
}

const COUNT_BY_LABELS = ['metadata_status', 'theme', 'keywords', 'producer']
exports.getCounts = async (req, reply) => {
  const fun = `${mod}.getCounts`
  try {
    const data = await Promise.all(
      COUNT_BY_LABELS.map((label) =>
        rudiApiGet(getRudiApi(getAdminApi(`resources?count_by=${label}`)))
      )
    )

    const counts = {}
    COUNT_BY_LABELS.forEach((label, i) => {
      counts[label] = data[i]
    })
    reply.status(200).json(counts)
  } catch (err) {
    log.e(mod, fun, 'Could not get counts')
    reply.status(500).json({ statusCode: err.statusCode || 500, message: err.message })
  }
}
