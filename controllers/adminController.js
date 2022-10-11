const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');
const databaseManager = require('../database/database');
const {
  createRudiApiToken,
  readJwtBody,
  extractCookieFromReq,
  CONSOLE_TOKEN,
  getTokenFromMediaForUser,
} = require('../utils/jwt');
const log = require('../utils/logger');
const { BadRequestError } = require('../utils/errors');
const mod = 'admCtrl';

const serveur = `${config.API_RUDI.listening_address}`;
const api = `${config.API_RUDI.admin_api}`;

exports.getApiUrl = (obj) => `${api}/${!obj ? '' : obj}`;

exports.getEnum = (req, res, next) => {
  const url = `${api}/enum`;
  const token = createRudiApiToken({
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
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_enum' });
      res.status(error.statusCode).json(error);
    });
};
exports.getThemeByLang = (req, res, next) => {
  const { lang } = req.params;
  const url = `${api}/enum/themes/${lang}`;
  const token = createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((resRUDI) => {
      const results = resRUDI.data;
      res.status(200).json(results);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_theme_by_lang' });
      res.status(error.statusCode).json(error);
    });
};

exports.getLicences = (req, res, next) => {
  const url = `${api}/licences`;
  const token = createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((resRUDI) => {
      const results = resRUDI.data;
      res.status(200).json(results);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_licences' });
      res.status(error.statusCode).json(error);
    });
};

// Default Value for formulaire
exports.getDefaultForm = (req, res, next) => {
  const user = req.user;
  return databaseManager
    .getDefaultForm(user)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      error = errorHandler.error(err, req, { opType: 'get_defaultForm' });
      res.status(error.statusCode).json(error);
    });
};
exports.deleteDefaultForm = (req, res, next) => {
  const user = req.user;
  const { name } = req.params;
  return databaseManager
    .deleteDefaultForm(user, name)
    .then((row) => {
      res.status(200).json(row);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'delete_defaultForm' });
      res.status(error.statusCode).json(error);
    });
};
exports.putDefaultForm = (req, res, next) => {
  const data = req.body;
  const user = req.user;

  return databaseManager
    .updateDefaultForm(user, data)
    .then((row) => {
      res.status(200).json(row);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'put_defaultForm' });
      res.status(error.statusCode).json(error);
    });
};

exports.getVersion = (req, res, next) => {
  const url = `/api/version`;
  const token = createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRUDI) => {
      const reports = resRUDI.data;
      res.status(200).send(reports);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_version' });
      res.status(error.statusCode).json(error);
    });
};

exports.getMediaToken = async (req, res, next) => {
  const fun = 'getMediaToken';
  // if (!user) return res.status(401).send('Error: user should be provided');
  const jwt = extractCookieFromReq(req, CONSOLE_TOKEN);
  const jwtPayload = readJwtBody(jwt);
  const user = jwtPayload.user;
  const exp = jwtPayload.exp;
  if (!user)
    throw new BadRequestError(`JWT body token should contain an identified user: ${jwtPayload}`);

  try {
    const token = await getTokenFromMediaForUser(user, exp);
    try {
      const parsedBody = readJwtBody(token);
      parsedBody.exp = new Date(parsedBody.exp).toISOString();
      console.log('T (getMediaToken) token:', parsedBody);
    } catch (e) {
      console.log('T (getMediaToken) token:', token);
    }
    res.status(200).send(token);
  } catch (e) {
    log.e(mod, fun, e);
    // throw new Error(errMsg);
    res.status(e.statusCode || 500).send(e);
  }
};
