const { RudiError } = require('../utils/errors')
const log = require('../utils/logger')

const mod = 'errHandler'

exports.error = (error, req, options) => {
  const fun = 'error'
  try {
    let errorToDisplay
    if (!error) return new RudiError(`Error was unidentified`)
    let statusCode =
      error?.response?.data?.statusCode ||
      error?.response?.status ||
      error?.response?.statusCode ||
      error?.statusCode ||
      error?.status ||
      error?.code ||
      501
    if (statusCode === 'ERR_INVALID_URL') {
      // console.error('T (errorHandler) err', error)
      statusCode = 404
    } else {
      statusCode = parseInt(statusCode)
      if (isNaN(statusCode)) statusCode = 500
    }
    options.statusCode = statusCode
    error.statusCode = statusCode
    // console.error('T (errHandler) statusCode', statusCode)
    // console.error('T (errHandler) error', beautify(error))

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      log.sysError(mod, fun, error.response?.data || error.response, log.getContext(req, options))

      errorToDisplay = Object.keys(error) > 0 ? error : error.toJSON()
      errorToDisplay.moreInfo = error.response?.data || error.response
    } else if (error.request) {
      errorToDisplay = error
    }
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    else {
      // Something happened in setting up the request that triggered an Error
      errorToDisplay = { message: error?.message || error, statusCode }
    }
    // log.e(mod, fun, error?.message || error)
    log.sysError(mod, fun, error?.message || error, log.getContext(req, options))
    if (error?.config) log.e(mod, fun, error.config)

    return errorToDisplay
  } catch (err) {
    log.e(mod, fun, err)
    return { statusCode: 500, message: err, error: err }
  }
}

/**
 *
 * @param {String} req The initial request
 * @param {String} reply The response for the request
 * @param {String} initialError The initial error
 * @param {Number} errCode The error code
 * @param {String} fun Describes operation type
 * @param {String} objectType The type of the object
 * @param {String} id The UUID of the object
 */
exports.handleError = (req, reply, initialError, errCode, fun, objectType, id) => {
  log.e(mod, fun, initialError)
  try {
    if (
      initialError?.response?.data.statusCode &&
      initialError?.response?.data?.message &&
      initialError?.response?.data?.error
    )
      return reply.status(initialError.response.data.statusCode).json({
        statusCode: initialError.response.data.statusCode,
        error: initialError.response.data.error,
        message: initialError.response.data.message,
      })
    initialError.statusCode = initialError.statusCode || initialError.response?.data?.statusCode || errCode
    const errPayload = {}
    if (fun) errPayload.opType = fun
    if (id) errPayload.id = `${objectType}+${id}`
    const error = this.error(initialError, req, errPayload)
    reply.status(error.statusCode || errCode).json(error.moreInfo || error)
  } catch (err) {
    console.error(mod, 'handleError.initialError', initialError)
    console.error(mod, 'handleError failed', err)
  }
}
