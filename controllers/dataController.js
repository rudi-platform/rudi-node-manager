// External dependecies
const axios = require('axios');

// Internal dependecies
const { getConf } = require('../config/config');
const errorHandler = require('./errorHandler');
const { createRudiApiToken } = require('../utils/jwt');
const { getCompletedUrl } = require('../utils/utils');

// Constants
const API_MODULE_URL = `${getConf('rudi_api', 'rudi_api_url')}`;
const API_PREFIX = `${getConf('rudi_api', 'admin_api')}`;

// Helper functions
const getApiShortUrl = (suffix) => getCompletedUrl(API_PREFIX, suffix);

const callApiModule = (req, reply, url, opType) => {
  const token = createRudiApiToken(url, req);
  return axios
    .get(getCompletedUrl(API_MODULE_URL, url), {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const results = res.data;
      reply.status(200).send(results);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType });
      reply.status(error.statusCode).json(error);
    });
};

// Controllers
exports.getEnum = (req, res, next) => callApiModule(req, res, getApiShortUrl('enum'), 'get_enum');

exports.getThemeByLang = (req, res, next) =>
  callApiModule(req, res, getApiShortUrl(`enum/themes/${req.params?.lang}`), 'get_theme_by_lang');

exports.getLicences = (req, res, next) =>
  callApiModule(req, res, getApiShortUrl('licences'), 'get_licences');

exports.getVersion = (req, res, next) => callApiModule(req, res, '/api/version', 'get_version');
