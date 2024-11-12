const mod = 'axiosCalls'

const log = require('../utils/logger')
const { default: axios } = require('axios')
const { RudiError } = require('./errors.js')
const { cleanErrMsg, toInt } = require('./utils.js')
const { getRudiApiHeaders } = require('./secu.js')
const { MANAGER } = require('../config/config.js')

const rudiErrMsg = (rudiModuleCalled, message, status = '') =>
  rudiModuleCalled
    ? `ERR ${status} while calling ${rudiModuleCalled}: ${cleanErrMsg(message)}`
    : `ERR ${status}: ${message}`

exports.rudiApiGet = async (url, opts) => this.safeAxiosGet('RUDI API', url, { ...opts, ...getRudiApiHeaders() })

exports.safeAxiosGet = async (rudiModuleCalled, url, opts) => {
  const fun = 'safeAxiosGet'
  let res
  try {
    log.d('axios.get', null, url)
    res = await axios.get(url, opts)
    // log.d(mod, `${fun}+(${url})`, res?.data)
  } catch (axiosErr) {
    log.e(mod, `${fun}-(${url})`, cleanErrMsg(axiosErr))
    let { message, code, status } = axiosErr
    const axiosGenericMsg = 'Request failed with status code '
    if (!status && message?.startsWith(axiosGenericMsg)) {
      status = toInt(message.split(axiosGenericMsg)[1])
      if (axiosErr?.response?.data) {
        log.e(mod, fun + '.axiosMsg', axiosErr?.response.data)
        message = axiosErr.response.data.message
        status = axiosErr.response.data.statusCode
        // message = axiosErr.response.message
      }
    }
    if (code == 'ECONNREFUSED' || code == 'ERR_BAD_RESPONSE') {
      const errMsg = `La connection de “${MANAGER}” vers le module “${rudiModuleCalled}” a échoué: “${rudiModuleCalled}” semble injoignable, contactez l‘admin du noeud RUDI`
      throw RudiError.createRudiHttpError(503, errMsg)
    }
    throw RudiError.createRudiHttpError(status, rudiErrMsg(rudiModuleCalled, message, status))
  }
  //   if (res?.data?.error !== undefined) {
  //     log.e(mod, `${fun} res?.data?.error =`, res?.data?.error)
  //     log.e(mod, `${fun} res =`, res)
  //     const rudiErr = res.data
  //     throw RudiError.createRudiHttpError(
  //       rudiErr.statusCode,
  //       rudiErrMsg(rudiModuleCalled, rudiErr.message, rudiErr.statusCode)
  //     )
  //   }
  //   log.i(mod, fun + `(${url})=>`, res?.data)
  return res.data
}
