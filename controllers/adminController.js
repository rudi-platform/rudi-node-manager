const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');
const utils = require('../utils/utils');
const databaseManager = require('../database/database');

const serveur = `${config.API_RUDI.listening_address}`;
const api = `${config.API_RUDI.admin_api}`;

exports.getEnum = (req, res, next) => {
  const url = `${api}/enum`;
  const token = utils.createRudiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRUDI) => {
      const results = resRUDI.data;
      res.status(200).json(results);
    })
    .catch((error) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};
exports.getThemeByLang = (req, res, next) => {
  const { lang } = req.params;
  const url = `${api}/enum/themes/${lang}`;
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

// Default Value for formulaire
exports.getDefaultForm = (req, res, next) => {
  const user = req.user;
  databaseManager
    .getDefaultForm(user)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      error = errorHandler.error(err);
      res.status(501).json(error);
    });
};
exports.deleteDefaultForm = (req, res, next) => {
  const user = req.user;
  databaseManager
    .deleteDefaultForm(user)
    .then((row) => {
      res.status(200).json(row);
    })
    .catch((err) => {
      error = errorHandler.error(err);
      res.status(501).json(error);
    });
};
exports.putDefaultForm = (req, res, next) => {
  const data = req.body;
  const user = req.user;

  databaseManager
    .updateDefaultForm(user, data)
    .then((row) => {
      res.status(200).json(row);
    })
    .catch((err) => {
      error = errorHandler.error(err);
      res.status(501).json(error);
    });
};
