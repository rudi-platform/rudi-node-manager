const axios = require('axios');
const config = require('../config');

// TODO : Move to util.js
const errorHandler = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message);
  }
  console.log(error.config);
};

const resourcesList = (req, res, next) => {
  const serveur = `${config.API_RUDI.listening_address}`;
  return axios.get(serveur+'/resources', {params: req.query}).then((resRUDI) => {
    const metadatas = resRUDI.data;
    res.status(200).json({
      body: metadatas,
    });
  })
      .catch((error) => {
        errorHandler(error);
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
        errorHandler(error);
        res.status(501).json(error);
      });
};

module.exports.resourcesList = resourcesList;
