const axios = require('axios');
const config = require('../config');
const errorHandler = require('./errorHandler');

const orgaList = (req, res, next) => {
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.get(serveur+'/organizations', {params: req.query}).then((resRUDI) => {
    const organizations = resRUDI.data;
    res.status(200).json(organizations);
  })
      .catch((error) => {
        errorHandler.error(error);
        res.status(501).json(error);
      });
};
exports.getOrgaById = (req, res, next) => {
  const {id} = req.params;
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.get(serveur+'/organizations/' + id, {params: req.query}).then((resRUDI) => {
    const organization = resRUDI.data;
    res.status(200).json( organization);
  })
      .catch((error) => {
        errorHandler.error(error);
        res.status(501).json(error);
      });
};

exports.postOrga = (req, res, next) => {
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.post(serveur+'/organizations', req.body).then((resRUDI) => {
    res.status(200);
  })
      .catch((error) => {
        errorHandler.error(error);
        res.status(501).json(error);
      });
};

module.exports.orgaList = orgaList;
