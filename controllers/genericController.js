const mod = 'genCtrl'

const axios = require('axios')
const { getRudiApi, getAdminApi } = require('../config/config')
const errorHandler = require('./errorHandler')
const { createRudiApiToken } = require('../utils/secu')

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
 * @param {String} res The response for the request
 * @param {String} initialError The initial error
 * @param {Number} errCode The error code
 * @param {String} fun Describes operation type
 * @param {String} objectType The type of the object
 * @param {String} id The UUID of the object
 */
function raiseError(req, res, initialError, errCode, fun, objectType, id) {
  try {
    console.log('req params:', req.params)
    console.log('req url:', req.originalUrl)
    console.log('res:' + res)
    console.log('initialError:', initialError?.response?.data)
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
    res.status(initialError.statusCode || errCode).json(error.moreInfo || error)
  } catch (err) {
    console.error(mod, 'raiseError', err)
    console.error(mod, 'raiseError.initialError', initialError)
  }
}

const checkObjectType = (req, res, fun, objectType) => {
  if (!OBJECT_TYPES[objectType]) {
    raiseError(req, res, new Error('Object type unkown: ' + objectType), 400, fun, objectType)
    return false
  }
  return true
}

exports.getObjectList = (req, res, next) => {
  const opType = 'get_objects'
  const { objectType } = req.params
  // console.log('url:', req.url, ' | params:', req.params, ' | query:', req.query);

  // const urlParts = `${req.url}`.split('?');
  // const urlSuffix = urlParts.length > 1 ? `?${urlParts[1]}` : '';

  if (!checkObjectType(req, res, opType, objectType) || objectType === 'media') return

  const url = getAdminApi(objectType)
  // console.log('T (getObjectList) url', getRudiApi(url));
  const token = createRudiApiToken(url, req)
  return axios
    .get(getRudiApi(url), {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRudiApi) => res.status(200).json(resRudiApi.data))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType })
      res.status(error.statusCode).json(error)
    })
}

exports.getObjectById = (req, res, next) => {
  const opType = 'get_object_by_id'
  const { objectType, id } = req.params
  if (!checkObjectType(req, res, opType, objectType)) return

  const url = getAdminApi(`${objectType}/${id}`)
  const token = createRudiApiToken(url, req)
  return axios
    .get(getRudiApi(url), {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRudiApi) => {
      const rudiObj = resRudiApi.data
      res.status(200).json(rudiObj)
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType, id })
      res.status(error.statusCode).json(error)
    })
}

exports.postObject = (req, res, next) => {
  const opType = 'post_object'
  const { objectType } = req.params
  if (!checkObjectType(req, res, opType, objectType)) return

  const url = getAdminApi(objectType)
  const token = createRudiApiToken(url, req)
  return axios
    .post(getRudiApi(url), req.body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    .then((resRudiApi) => {
      res.status(200).json(resRudiApi.data)
    })
    .catch((err) => {
      const id = req.body[OBJECT_TYPES[objectType].id]
      const error = errorHandler.error(err, req, { opType, id })
      res.status(error.statusCode).json(error)
    })
}

exports.putObject = (req, res, next) => {
  const fun = 'put_object'
  const { objectType } = req.params
  if (!checkObjectType(req, res, fun, objectType)) return

  const url = getAdminApi(objectType)
  const token = createRudiApiToken(url, req)
  return axios
    .put(getRudiApi(url), req.body, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    .then((resRudiApi) => res.status(200).json(resRudiApi.data))
    .catch((error) => {
      const id = req.body[OBJECT_TYPES[objectType].id]
      raiseError(req, res, error, 501, fun, objectType, id)
    })
}

exports.deleteObject = (req, res, next) => {
  const fun = 'del_object'
  const { objectType, id } = req.params
  if (!checkObjectType(req, res, fun, objectType)) return

  const url = getAdminApi(`${objectType}/${id}`)
  const token = createRudiApiToken(url, req)
  return axios
    .delete(getRudiApi(url), {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRudiApi) => {
      const rudiObj = resRudiApi.data
      res.status(200).json(rudiObj)
    })
    .catch((error) => raiseError(req, res, error, 501, fun, objectType, id))
}
