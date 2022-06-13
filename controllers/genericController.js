const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');
const utils = require('../utils/utils');

const serveur = `${config.API_RUDI.listening_address}`;
const api = `${config.API_RUDI.admin_api}`;

const OBJECT_TYPES = {
  resources: { url: 'resources', id: 'global_id' },
  organizations: { url: 'organizations', id: 'organization_id' },
  contacts: { url: 'contacts', id: 'contact_id' },
  pub_keys: { url: 'pub_keys', id: 'name' },
  reports: { url: 'reports', id: 'report_id' },
};

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
  console.log('req: ' + req);
  console.log('res: ' + res);
  console.log('initialError: ' + initialError);
  console.log('errCode: ' + errCode);
  console.log('fun: ' + fun);
  console.log('objectType: ' + objectType);
  console.log('id: ' + id);
  const errPayload = {};
  if (fun) errPayload.opType = fun;
  if (id) errPayload.id = `${objectType}+${id}`;
  const error = errorHandler.error(initialError, req, errPayload);
  res.status(errCode).json(error);
}

const checkObjectType = (req, res, fun, objectType) => {
  if (!OBJECT_TYPES[objectType])
    return raiseError(req, res, new Error('Object type unkown: '+objectType), 400, fun, objectType);
  return;
};

exports.getObjectList = (req, res, next) => {
  const fun = 'get_objects';
  const { objectType } = req.params;
  checkObjectType(req, res, fun, objectType);

  const url = `${api}/${objectType}`;
  const token = utils.createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRudiApi) => {
      // const rudiObjects = resRudiApi.data;
      res.status(200).json(resRudiApi.data);
    })
    .catch((error) => {
      console.log(error);
      raiseError(req, res, error, 501, fun, objectType);
    });
};

exports.getObjectById = (req, res, next) => {
  const fun = 'get_object_by_id';
  const { objectType, id } = req.params;
  checkObjectType(req, res, fun, objectType);

  const url = `${api}/${objectType}/${id}`;
  const token = utils.createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRudiApi) => {
      const rudiObj = resRudiApi.data;
      res.status(200).json(rudiObj);
    })
    .catch((error) => raiseError(req, res, error, 501, fun, objectType, id));
};

exports.putObject = (req, res, next) => {
  const fun = 'put_object';
  const { objectType } = req.params;
  checkObjectType(req, res, fun, objectType);

  const url = `${api}/${objectType}`;
  const token = utils.createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .put(`${serveur}${url}`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    .then((resRudiApi) => {
      res.status(200).json(resRudiApi.data);
    })
    .catch((error) =>
      raiseError(req, res, error, 501, fun, objectType, req.body[OBJECT_TYPES[objectType].id]),
    );
};

exports.deleteObject = (req, res, next) => {
  const fun = 'del_object';
  const { objectType, id } = req.params;
  checkObjectType(req, res, fun, objectType);

  const url = `${api}/${objectType}/${id}`;
  const token = utils.createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .delete(`${serveur}${url}`, {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRudiApi) => {
      const rudiObj = resRudiApi.data;
      res.status(200).json(rudiObj);
    })
    .catch((error) => raiseError(req, res, error, 501, fun, objectType, id));
};
