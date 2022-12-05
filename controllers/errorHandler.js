const { RudiError } = require('../utils/errors')
const log = require('../utils/logger')

const mod = 'errHandler'
const fun = ''

exports.error = (error, req, options) => {
  let errorToDisplay
  if (!error) return new RudiError(`Error was unidentified: ${error}`)
  // log.e(mod, fun, error);
  // log.e(mod, fun, error.response?.data);
  // log.e(mod, fun, error.response?.status);
  // log.e(mod, fun, error.response?.headers);
  const statusCode =
    error?.statusCode ||
    error?.status ||
    error?.response?.statusCode ||
    error?.response?.status ||
    501
  options.statusCode = statusCode
  error.statusCode = statusCode

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    log.sysError(mod, fun, error.response.data, log.getContext(req, options))

    errorToDisplay = error.toJSON()
    errorToDisplay.moreInfo = error.response.data
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    log.e(mod, fun, error.message)
    log.sysError(mod, fun, error.message, log.getContext(req, options))
    errorToDisplay = error
  } else {
    // Something happened in setting up the request that triggered an Error
    log.e(mod, fun, error.message)
    log.sysError(mod, fun, error.message, log.getContext(req, options))
    errorToDisplay = { message: error.message, statusCode }
  }
  log.e(mod, fun, error.config)
  return errorToDisplay
}
