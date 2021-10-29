const log = require('../utils/logger');
const mod = 'controller';
const fun = '';

exports.error = (error) => {
  let errorToDisplay;
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    log.e(mod, fun, error.response.data);
    log.e(mod, fun, error.response.status);
    log.e(mod, fun, error.response.headers);
    errorToDisplay = error.response.data;
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    log.e(mod, fun, error.request);
    errorToDisplay = error.request;
  } else {
    // Something happened in setting up the request that triggered an Error
    log.e(mod, fun, error.message);
    errorToDisplay = error.message;
  }
  log.e(mod, fun, error.config);
  error = error.toJSON();
  error.moreInfo = errorToDisplay;
  return error;
};
