const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');

const resourcesList = (req, res, next) => {
  const serveur = `${config.API_RUDI.admin_api}`;
  return axios
    .get(serveur + '/resources', {
      params: req.query,
    })
    .then((resRUDI) => {
      const metadatas = resRUDI.data;
      res.status(200).json(metadatas);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};
exports.getResourceById = (req, res, next) => {
  const { id } = req.params;
  const serveur = `${config.API_RUDI.admin_api}`;
  return axios
    .get(serveur + '/resources/' + id, {
      params: req.query,
    })
    .then((resRUDI) => {
      const metadata = resRUDI.data;
      res.status(200).json(metadata);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};
exports.postResources = (req, res, next) => {
  const serveur = `${config.API_RUDI.admin_api}`;
  return axios
    .post(serveur + '/resources', req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((resRUDI) => {
      res.status(200).json(resRUDI.data);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(500).send(error);
    });
};
exports.putResources = (req, res, next) => {
  const serveur = `${config.API_RUDI.admin_api}`;
  return axios
    .put(serveur + '/resources', req.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((resRUDI) => {
      res.status(200).json(resRUDI.data);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};

module.exports.resourcesList = resourcesList;
