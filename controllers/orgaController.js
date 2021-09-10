const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');
const utils = require('../utils/utils');

const serveur = `${config.API_RUDI.listening_address}`;
const api = `${config.API_RUDI.admin_api}`;

const orgaList = (req, res, next) => {
  const url = `${api}/organizations`;
  const token = utils.createRudiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, { params: req.query, headers: { Authorization: `Bearer ${token}` } })
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
  const url = `${api}/organizations/${id}`;
  const token = utils.createRudiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, { params: req.query, headers: { Authorization: `Bearer ${token}` } })
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
  const url = `${api}/organizations`;
  const token = utils.createRudiToken({
    url: url,
    req: req,
  });
  return axios
    .post(`${serveur}${url}`, req.body, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    .then((resRUDI) => {
      res.status(200).json(resRUDI.data);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};

exports.putOrga = (req, res, next) => {
  const url = `${api}/organizations`;
  const token = utils.createRudiToken({
    url: url,
    req: req,
  });
  return axios
    .put(`${serveur}${url}`, req.body, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    .then((resRUDI) => {
      res.status(200).json(resRUDI.data);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};

exports.deleteOrga = (req, res, next) => {
  const { id } = req.params;
  const url = `${api}/organizations/${id}`;
  const token = utils.createRudiToken({
    url: url,
    req: req,
  });
  return axios
    .delete(`${serveur}${url}`, {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRUDI) => {
      const orga = resRUDI.data;
      res.status(200).json(orga);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};

module.exports.orgaList = orgaList;
