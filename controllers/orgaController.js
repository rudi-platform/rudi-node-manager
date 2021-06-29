const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');

const orgaList = (req, res, next) => {
  const serveur = `${config.API_RUDI.admin_api}`;
  return axios
    .get(serveur + '/organizations', { params: req.query })
    .then((resRUDI) => {
      const organizations = resRUDI.data;
      res.status(200).json(organizations);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};
exports.getOrgaById = (req, res, next) => {
  const { id } = req.params;
  const serveur = `${config.API_RUDI.admin_api}`;
  return axios
    .get(serveur + '/organizations/' + id, { params: req.query })
    .then((resRUDI) => {
      const organization = resRUDI.data;
      res.status(200).json(organization);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};

exports.postOrga = (req, res, next) => {
  const serveur = `${config.API_RUDI.admin_api}`;
  return axios
    .post(serveur + '/organizations', req.body, { headers: { 'Content-Type': 'application/json' } })
    .then((resRUDI) => {
      res.status(200).json(resRUDI.data);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};

exports.putOrga = (req, res, next) => {
  const serveur = `${config.API_RUDI.admin_api}`;
  return axios
    .put(serveur + '/organizations', req.body, { headers: { 'Content-Type': 'application/json' } })
    .then((resRUDI) => {
      res.status(200).json(resRUDI.data);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};

module.exports.orgaList = orgaList;
