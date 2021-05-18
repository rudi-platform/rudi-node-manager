const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');

const contactList = (req, res, next) => {
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.get(serveur+'/contacts', {params: req.query}).then((resRUDI) => {
    const contacts = resRUDI.data;
    res.status(200).json(contacts);
  })
      .catch((error) => {
        errorHandler.error(error);
        res.status(501).json(error);
      });
};
exports.getContactById = (req, res, next) => {
  const {id} = req.params;
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.get(serveur+'/contacts/' + id, {params: req.query}).then((resRUDI) => {
    const contact = resRUDI.data;
    res.status(200).json(contact);
  })
      .catch((error) => {
        errorHandler.error(error);
        res.status(501).json(error);
      });
};

exports.postContact = (req, res, next) => {
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.post(serveur+'/contacts', req.body, {headers: {'Content-Type': 'application/json'}}).then((resRUDI) => {
    res.status(200).json(resRUDI.data);
  })
      .catch((error) => {
        errorHandler.error(error);
        res.status(501).json(error);
      });
};
exports.putContact = (req, res, next) => {
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.put(serveur+'/contacts', req.body, {headers: {'Content-Type': 'application/json'}}).then((resRUDI) => {
    res.status(200).json(resRUDI.data);
  })
      .catch((error) => {
        errorHandler.error(error);
        res.status(501).json(error);
      });
};

module.exports.contactList = contactList;
