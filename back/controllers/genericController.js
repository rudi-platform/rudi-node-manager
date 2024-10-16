const mod = 'genCtrl'

const { default: axios } = require('axios')
const { CATALOG, getCatalogAdminUrl: getCatalogAdminApiUrl } = require('../config/config')

const log = require('../utils/logger')
const { getCatalogHeaders, sendJsonAndTokens } = require('../utils/secu')
const { handleError, treatAxiosError } = require('./errorHandler')
const { cleanErrMsg, beautify } = require('../utils/utils.js')

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

exports.searchObjects = async (req, reply) => {
  const opType = 'search_objects'
  const { objectType } = req.params
  log.d(mod, opType + '.params', beautify(req.params))

  if (!checkObjectType(req, reply, opType, objectType)) return
  try {
    const opts = { params: req?.query, ...getCatalogHeaders() }
    const res = await axios.get(getCatalogAdminApiUrl(objectType, 'search'), opts)
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    log.w(mod, opType, cleanErrMsg(err))
    log.w(mod, opType, err)
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

exports.getObjectList = async (req, reply) => {
  const opType = 'get_objects'
  const { objectType } = req.params
  // log.d(mod, opType + '.params', beautify(req.params))

  if (!checkObjectType(req, reply, opType, objectType)) return
  try {
    const opts = { params: req?.query, ...getCatalogHeaders() }
    const res = await axios.get(getCatalogAdminApiUrl(objectType), opts)
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    log.w(mod, opType, cleanErrMsg(err))
    log.w(mod, opType, err)
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

exports.getObjectById = async (req, reply) => {
  const opType = 'get_object_by_id'
  const { objectType, id } = req.params
  // log.d(mod, opType + '.params', beautify(req.params))
  if (!checkObjectType(req, reply, opType, objectType)) return
  try {
    const res = await axios.get(getCatalogAdminApiUrl(objectType, id), getCatalogHeaders())
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    log.w(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

exports.postObject = async (req, reply) => {
  const opType = 'post_object'
  const { objectType } = req.params
  if (!checkObjectType(req, reply, opType, objectType)) return
  const opts = {
    params: req?.query,
    ...getCatalogHeaders(),
  }
  try {
    const res = await axios.post(getCatalogAdminApiUrl(objectType), req.body, opts)
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    log.w(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

exports.putObject = async (req, reply) => {
  const opType = 'post_object'
  const { objectType } = req.params
  if (!checkObjectType(req, reply, opType, objectType)) return
  const opts = {
    params: req?.query,
    ...getCatalogHeaders(),
  }
  try {
    const res = await axios.put(getCatalogAdminApiUrl(objectType), req.body, opts)
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    log.w(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

exports.deleteObject = async (req, reply) => {
  const opType = 'del_object'
  const { objectType, id } = req.params
  if (!checkObjectType(req, reply, opType, objectType)) return
  const opts = {
    params: req?.query,
    ...getCatalogHeaders(),
  }
  try {
    const res = await axios.delete(getCatalogAdminApiUrl(objectType, id), opts)
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    log.w(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

exports.deleteObjects = async (req, reply) => {
  const opType = 'del_objects'
  const { objectType } = req.params
  if (!checkObjectType(req, reply, opType, objectType)) return
  const opts = {
    params: req?.query,
    ...getCatalogHeaders(),
  }
  try {
    const res = await axios.delete(getCatalogAdminApiUrl(objectType), opts)
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    log.w(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

const COUNT_BY_LABELS = ['metadata_status', 'theme', 'keywords', 'producer']
exports.getCounts = async (req, reply) => {
  const fun = `${mod}.getCounts`
  let res
  try {
    res = await Promise.all(
      COUNT_BY_LABELS.map((label) => {
        log.d(mod, fun, `${label}: ` + getCatalogAdminApiUrl(`resources?count_by=${label}`))
        return axios.get(getCatalogAdminApiUrl(`resources?count_by=${label}`), getCatalogHeaders())
      })
    )
  } catch (err) {
    log.w(mod, fun, err)
    return treatAxiosError(err, CATALOG, req, reply)
  }
  try {
    const counts = {}
    log.d(mod, fun, beautify(res.data))
    COUNT_BY_LABELS.forEach((label, i) => {
      counts[label] = res[i].data
    })
    reply.status(200).json(counts)
  } catch (err) {
    log.e(mod, fun, 'Could not get counts -> ERR ', err)
    reply.status(500).json({ statusCode: err.statusCode || 500, message: err.message })
  }
}
