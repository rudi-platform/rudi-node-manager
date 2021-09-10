const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');
const utils = require('../utils/utils');

const serveur = `${config.API_RUDI.listening_address}`;
const api = `${config.API_RUDI.admin_api}`;

exports.getEnum = (req, res, next) => {
  const url = `${api}/enum`;
  const token = utils.createRudiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((resRUDI) => {
      const results = resRUDI.data;
      res.status(200).json(results);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};
exports.getLicences = (req, res, next) => {
  const url = `${api}/licences`;
  const token = utils.createRudiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((resRUDI) => {
      const results = resRUDI.data;
      res.status(200).json(results);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};
