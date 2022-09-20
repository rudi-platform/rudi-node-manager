const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');
const utils = require('../utils/utils');
const { getObjectList } = require('./genericController');

const serveur = `${config.API_RUDI.listening_address}`;
const api = `${config.API_RUDI.admin_api}`;

exports.getResourcesList = (req, res, next) => getObjectList(req, res, next, 'resources')

// {
//   const url = `${api}/resources`;
//   const token = utils.createRudiApiToken({
//     url: url,
//     req: req,
//   });
//   return axios
//     .get(`${serveur}${url}`, {
//       params: req.query,
//       headers: { Authorization: `Bearer ${token}` },
//     })
//     .then((resRUDI) => {
//       const metadatas = resRUDI.data;
//       res.status(200).json(metadatas);
//     })
//     .catch((error) => {
//       error = errorHandler.error(error, req, { opType: 'get_metadatas' });
//       res.status(error.statusCode).json(error);
//     });
// };
exports.getResourceById = (req, res, next) => {
  const { id } = req.params;
  const url = `${api}/resources/${id}`;
  const token = utils.createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .get(`${serveur}${url}`, {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRUDI) => {
      const metadata = resRUDI.data;
      res.status(200).json(metadata);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_metadata', id: `metadata+${id}` });
      res.status(error.statusCode).json(error);
    });
};
exports.postResources = (req, res, next) => {
  const url = `${api}/resources`;
  const token = utils.createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .post(`${serveur}${url}`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    .then((resRUDI) => {
      res.status(200).json(resRUDI.data);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'post_metadata' });
      res.status(error.statusCode).send(error);
    });
};
exports.putResources = (req, res, next) => {
  const url = `${api}/resources`;
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
    .then((resRUDI) => {
      res.status(200).json(resRUDI.data);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, {
        opType: 'put_metadata',
        id: `metadata+${req.body.global_id}`,
      });
      res.status(error.statusCode).json(error);
    });
};

exports.deleteResource = (req, res, next) => {
  const { id } = req.params;
  const url = `${api}/resources/${id}`;
  const token = utils.createRudiApiToken({
    url: url,
    req: req,
  });
  return axios
    .delete(`${serveur}${url}`, {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((resRUDI) => {
      const metadata = resRUDI.data;
      res.status(200).json(metadata);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'delete_metadata', id: `metadata+${id}` });
      res.status(error.statusCode).json(error);
    });
};

exports.getReports = (req, res, next) => {
  const url = `${api}/report`;
  const token = utils.createRudiApiToken({
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
      const error = errorHandler.error(err, req, { opType: 'get_reports' });
      res.status(error.statusCode).json(error);
    });
};
