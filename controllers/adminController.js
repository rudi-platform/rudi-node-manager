const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');

exports.getEnum = (req, res, next) => {
  const serveurAdmin = `${config.API_RUDI.admin_api}`;
  return axios
    .get(serveurAdmin + '/enum')
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
  const serveurAdmin = `${config.API_RUDI.admin_api}`;
  return axios
    .get(serveurAdmin + '/licences')
    .then((resRUDI) => {
      const results = resRUDI.data;
      res.status(200).json(results);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};
