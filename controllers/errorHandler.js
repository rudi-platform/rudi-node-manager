const { RudiError } = require('../utils/errors')
const log = require('../utils/logger')
const { cleanErrMsg, beautify } = require('../utils/utils')

const mod = 'errHandler'

exports.error = (error, req, options) => {
  const fun = 'error'
  try {
    log.sysError(mod, fun, cleanErrMsg(error), log.getContext(req, options))
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
      statusCode = 404
    } else {
      statusCode = parseInt(statusCode)
      if (isNaN(statusCode)) statusCode = 500
    }
    options.statusCode = statusCode
    error.statusCode = statusCode

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      log.sysError(
        mod,
        fun,
        cleanErrMsg(error.response?.data || error.response),
        log.getContext(req, options)
      )

      errorToDisplay = Object.keys(error) > 0 ? error : error.toJSON()
      errorToDisplay.moreInfo = cleanErrMsg(error.response?.data || error.response)
    } else if (error.request) {
      errorToDisplay = cleanErrMsg(error)
    }
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    else {
      // Something happened in setting up the request that triggered an Error
      errorToDisplay = { message: cleanErrMsg(error?.message || error, statusCode) }
    }
    // log.e(mod, fun, error?.message || error)
    log.sysError(mod, fun, cleanErrMsg(errorToDisplay), log.getContext(req, options))
    if (error?.config) log.e(mod, fun, error.config)

    return errorToDisplay
  } catch (err) {
    log.e(mod, fun, `Error in errHandler: ${cleanErrMsg(err)}`)
    return {
      statusCode: 500,
      message: cleanErrMsg(err),
      error: cleanErrMsg(err),
    }
  }
}

/**
 *
 * @param {String} req The initial request
 * @param {String} reply The response for the request
 * @param {String} initialError The initial error
 * @param {Number} errCode The error code
 * @param {String} srcFun Describes operation type
 * @param {String} objectType The type of the object
 * @param {String} id The UUID of the object
 */
exports.handleError = (req, reply, initialError, errCode, srcFun, objectType, id) => {
  log.e(mod, srcFun, cleanErrMsg(initialError))
  try {
    if (initialError?.response?.data) {
      const statusCode = initialError.response.data.statusCode
      const message = cleanErrMsg(initialError.response.data.message)
      const error = cleanErrMsg(initialError.response.data.error)
      if (statusCode && message && error)
        return reply.status(statusCode).json({ statusCode, error, message })
    }
    initialError.statusCode =
      initialError.statusCode || initialError.response?.data?.statusCode || errCode || 500
    const errPayload = {}
    if (srcFun) errPayload.opType = srcFun
    if (id) errPayload.id = `${objectType}+${id}`
    const finalErr = this.error(initialError, req, errPayload)
    reply.status(finalErr.statusCode || errCode).json(finalErr.moreInfo || finalErr)
  } catch (err) {
    console.error(mod, 'handleError.initialError', cleanErrMsg(initialError))
    console.error(mod, 'handleError failed', cleanErrMsg(err))
  }
}
