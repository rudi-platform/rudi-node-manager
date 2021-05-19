const axios = require('axios');
const config = require('../config/config');
const errorHandler = require('./errorHandler');

exports.getMediaById = (req, res, next) => {
  const {id} = req.params;
  const serveurMedia = `${config.API_RUDI.media_api}`;
  return axios.get(serveurMedia+'/'+id).then((resRUDI) => {
    const results = resRUDI.data;
    res.status(200).json(results);
  })
      .catch((error) => {
        errorHandler.error(error);
        res.status(501).json(error);
      });
};

