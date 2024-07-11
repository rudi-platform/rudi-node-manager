/* eslint-disable complexity */
/* eslint-disable no-console */
const mod = 'errHandler'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { MANAGER } from '../config/config.js'
import { ConnectionError, RudiError } from '../utils/errors.js'
import { getContext, logD, logE, sysError } from '../utils/logger.js'
import { cleanErrMsg } from '../utils/utils.js'

export function formatError(error, req, options) {
  const fun = 'error'
  try {
    sysError(mod, fun, cleanErrMsg(error), getContext(req, options))
    let errorToDisplay
    if (!error) return new RudiError(`Error was unidentified`)
    let statusCode =
      error?.response?.data?.statusCode ??
      error?.response?.status ??
      error?.response?.statusCode ??
      error?.statusCode ??
      error?.status ??
      error?.code ??
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
      sysError(mod, fun, cleanErrMsg(error.response?.data ?? error.response), getContext(req, options))

      errorToDisplay = Object.keys(error) > 0 ? error : error.toJSON()
      errorToDisplay.moreInfo = cleanErrMsg(error.response?.data ?? error.response)
    } else if (error.request) {
      errorToDisplay = cleanErrMsg(error)
    }
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    else {
      // Something happened in setting up the request that triggered an Error
      errorToDisplay = { message: cleanErrMsg(error?.message ?? error, statusCode) }
    }
    // log.e(mod, fun, error?.message ?? error)
    sysError(mod, fun, cleanErrMsg(errorToDisplay), getContext(req, options))
    if (error?.config) logE(mod, fun, cleanErrMsg(error.config))

    return errorToDisplay
  } catch (err) {
    logE(mod, fun, `Error in errHandler: ${cleanErrMsg(err)}`)
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
export function handleError(req, reply, initialError, errCode, srcFun, objectType, id) {
  logE(mod, 'handleError.' + srcFun)
  try {
    if (initialError instanceof RudiError) {
      return reply.status(initialError.code).json(initialError)
    }
    if (isAxiosError(initialError)) return treatAxiosError(initialError, mod, reply)
    if (initialError?.response?.data) {
      const statusCode = initialError.response.data.statusCode
      const message = cleanErrMsg(initialError.response.data.message)
      const error = cleanErrMsg(initialError.response.data.error)
      if (statusCode && message && error) return reply.status(statusCode).json({ statusCode, error, message })
    }
    if (initialError.statusCode && initialError.message && initialError.error) {
      const statusCode = initialError.statusCode
      const message = cleanErrMsg(initialError.message)
      const error = cleanErrMsg(initialError.error)
      if (statusCode && message && error) return reply.status(statusCode).json({ statusCode, error, message })
    }
    initialError.statusCode = initialError.statusCode ?? initialError.response?.data?.statusCode ?? errCode ?? 500
    const errPayload = {}
    if (srcFun) errPayload.opType = srcFun
    if (id) errPayload.id = `${objectType}+${id}`
    const finalErr = formatError(initialError, req, errPayload)
    reply.status(finalErr.statusCode ?? errCode).json(finalErr.moreInfo ?? finalErr)
  } catch (err) {
    console.error(mod, 'handleError.initialError', cleanErrMsg(initialError))
    console.error(mod, 'handleError failed', cleanErrMsg(err))
  }
}

const isAxiosError = (err) => err?.name === 'AxiosError'

export function treatAxiosError(err, rudiModuleCalled, req, reply) {
  const fun = 'treatAxiosError'
  let statusCode, error
  if (err.code === 'ECONNREFUSED' || err.code === 'ERR_BAD_RESPONSE') {
    statusCode = 503
    const message = `La connection de “${MANAGER}” vers le module “${rudiModuleCalled}” a échoué: “${rudiModuleCalled}” semble injoignable, contactez l‘admin du noeud RUDI`
    if (reply) return reply.status(statusCode).json({ statusCode, message })
    throw new ConnectionError(error.message)
  }
  if (err.code?.startsWith('E')) {
    statusCode = err.status ?? 400
    const errData = err.response?.data ?? { statusCode, message: err.message ?? 'Bad Request' }
    return reply.headerSent || reply.status(err.status ?? 400).json(errData)
  }
  reply.headerSent || reply.status(err.code ?? 400).json(err)
}

export function expressErrorHandler(err, req, reply) {
  const fun = 'expressErrorHandler'
  logD(mod, fun)
  const now = new Date()
  // console.error(now, `[Express default error handler]`, err)
  // log.sysError(`An error happened on ${req.method} ${req.url}: ${err}`)
  const errMsg = cleanErrMsg(err.message)
  console.error(`An error happened on ${req?.method} ${req?.url}: ${errMsg}`)

  if (reply?.headersSent) return

  // res.status(500)
  // res.render('error', { time: now.getTime(), error: err })
  logE(mod, fun + '.uncaught', errMsg)
  reply?.status(500).json({
    error: `An error was thrown, please contact the Admin with the information bellow`,
    message: errMsg,
    time: now.getTime(),
  })
}
