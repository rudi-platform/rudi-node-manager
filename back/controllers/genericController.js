const mod = 'genCtrl'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import axios from 'axios'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { CATALOG, getCatalogAdminUrl as getCatalogAdminApiUrl } from '../config/config.js'

import { logD, logE, logW } from '../utils/logger.js'
import { getCatalogHeaders, sendJsonAndTokens } from '../utils/secu.js'
import { beautify, cleanErrMsg } from '../utils/utils.js'
import { handleError, treatAxiosError } from './errorHandler.js'

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

export async function searchObjects(req, reply) {
  const opType = 'search_objects'
  const { objectType } = req.params
  logD(mod, opType + '.params', beautify(req.params))

  if (!checkObjectType(req, reply, opType, objectType)) return
  try {
    const opts = { params: req?.query, ...getCatalogHeaders() }
    const res = await axios.get(getCatalogAdminApiUrl(objectType, 'search'), opts)
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    logW(mod, opType, cleanErrMsg(err))
    logW(mod, opType, err)
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

export async function getObjectList(req, reply) {
  const opType = 'get_objects'
  const { objectType } = req.params
  // logD(mod, opType + '.params', beautify(req.params))

  if (!checkObjectType(req, reply, opType, objectType)) return
  try {
    const opts = { params: req?.query, ...getCatalogHeaders() }
    const res = await axios.get(getCatalogAdminApiUrl(objectType), opts)
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    logW(mod, opType, cleanErrMsg(err))
    logW(mod, opType, err)
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

export async function getObjectById(req, reply) {
  const opType = 'get_object_by_id'
  const { objectType, id } = req.params
  // log.d(mod, opType + '.params', beautify(req.params))
  if (!checkObjectType(req, reply, opType, objectType)) return
  try {
    const res = await axios.get(getCatalogAdminApiUrl(objectType, id), getCatalogHeaders())
    return sendJsonAndTokens(req, reply, res.data)
  } catch (err) {
    logW(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

export async function postObject(req, reply) {
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
    logW(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

export async function putObject(req, reply) {
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
    logW(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

export async function deleteObject(req, reply) {
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
    logW(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

export async function deleteObjects(req, reply) {
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
    logW(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

const COUNT_BY_LABELS = ['metadata_status', 'theme', 'keywords', 'producer']
export async function getCounts(req, reply) {
  const fun = `${mod}.getCounts`
  let res
  try {
    res = await Promise.all(
      COUNT_BY_LABELS.map((label) => {
        logD(mod, fun, `${label}: ` + getCatalogAdminApiUrl(`resources?count_by=${label}`))
        return axios.get(getCatalogAdminApiUrl(`resources?count_by=${label}`), getCatalogHeaders())
      })
    )
  } catch (err) {
    logW(mod, fun, err)
    return treatAxiosError(err, CATALOG, req, reply)
  }
  try {
    const counts = {}
    logD(mod, fun, beautify(res.data))
    COUNT_BY_LABELS.forEach((label, i) => {
      counts[label] = res[i].data
    })
    reply.status(200).json(counts)
  } catch (err) {
    logE(mod, fun, 'Could not get counts -> ERR ', err)
    reply.status(500).json({ statusCode: err.statusCode || 500, message: err.message })
  }
}
