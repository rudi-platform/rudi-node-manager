const axios = require('axios');
const config = require('../config');

const resourcesList = (req, res, next) => {
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.get(serveur+'/resources', {params: req.query}).then((resRUDI) => {
    const metadatas = resRUDI.data;
    res.status(200).json({
      body: metadatas,
    });
  })
      .catch((error) => {
        res.status(501).json(error);
      });
};
exports.getResourceById = (req, res, next) => {
  const {id} = req.params;
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.get(serveur+'/resources/' + id, {params: req.query}).then((resRUDI) => {
    const metadata = resRUDI.data;
    res.status(200).json({
      body: metadata,
    });
  })
      .catch((error) => {
        res.status(501).json(error);
      });
};

module.exports.resourcesList = resourcesList;
