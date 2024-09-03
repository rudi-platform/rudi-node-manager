const { MANAGER } = require('../config/config.js')
const { RudiError, ConnectionError } = require('../utils/errors')
const log = require('../utils/logger')
const { cleanErrMsg } = require('../utils/utils')

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
    if (error?.config) log.e(mod, fun, cleanErrMsg(error.config))

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
  log.e(mod, 'handleError.' + srcFun)
  try {
    if (initialError instanceof RudiError) {
      return reply.status(initialError.code).json(initialError)
    }
    if (isAxiosError(initialError)) return this.treatAxiosError(initialError, mod, reply)
    if (initialError?.response?.data) {
      const statusCode = initialError.response.data.statusCode
      const message = cleanErrMsg(initialError.response.data.message)
      const error = cleanErrMsg(initialError.response.data.error)
      if (statusCode && message && error)
        return reply.status(statusCode).json({ statusCode, error, message })
    }
    if (initialError.statusCode && initialError.message && initialError.error) {
      const statusCode = initialError.statusCode
      const message = cleanErrMsg(initialError.message)
      const error = cleanErrMsg(initialError.error)
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

const isAxiosError = (err) => err?.name == 'AxiosError'

exports.treatAxiosError = (err, rudiModuleCalled, req, reply) => {
  const fun = 'treatAxiosError'
  let statusCode, error
  if (err.code == 'ECONNREFUSED' || err.code == 'ERR_BAD_RESPONSE') {
    statusCode = 503
    error = {
      statusCode,
      message: `La connection de “${MANAGER}” vers le module “${rudiModuleCalled}” a échoué: “${rudiModuleCalled}” semble injoignable, contactez l‘admin du noeud RUDI`,
    }
    // log.e(mod,fun,err. )
    if (reply) return reply.status(statusCode).json(error)
    throw new ConnectionError(error.message)
  }
  if (req?.url) log.d(mod, fun, req?.url)

  if (err.response) {
    const { data, status = '' } = err.response
    log.e(mod, fun, `ERR (axios) ${status}: ${cleanErrMsg(data)}`)
    const { statusCode, message } = data
    log.d(mod, fun, cleanErrMsg(message || data))
    const errMsg = rudiModuleCalled
      ? `[${rudiModuleCalled}] ${cleanErrMsg(message || data)}`
      : cleanErrMsg(message | data)
    log.d(mod, fun, cleanErrMsg(errMsg))

    if (reply) return reply.status(statusCode || status).send(errMsg)
    throw RudiError.createRudiHttpError(statusCode || status, errMsg)
  } else {
    // err.message
    const { message, status, code } = err
    const errMsg = (rudiModuleCalled ? `[${rudiModuleCalled}] ` : '') + cleanErrMsg(message || err)
    const logMsg =
      'ERR (axios) ' + (status ? `${status} ` : '') + (code ? `(${code}):` : ':') + errMsg
    log.sysWarn(mod, fun, logMsg)
    if (reply) return reply.status(status).send(errMsg)
    throw RudiError.createRudiHttpError(status, errMsg)
  }
}

exports.expressErrorHandler = (err, req, reply) => {
  const fun = 'expressErrorHandler'
  log.d(mod, fun)
  const now = new Date()
  // console.error(now, `[Express default error handler]`, err)
  // log.sysError(`An error happened on ${req.method} ${req.url}: ${err}`)
  const errMsg = cleanErrMsg(err.message)
  console.error(`An error happened on ${req?.method} ${req?.url}: ${errMsg}`)

  if (reply?.headersSent) return

  // res.status(500)
  // res.render('error', { time: now.getTime(), error: err })
  log.e(mod, fun + '.uncaught', errMsg)
  reply?.status(500).json({
    error: `An error was thrown, please contact the Admin with the information bellow`,
    message: errMsg,
    time: now.getTime(),
  })
}
