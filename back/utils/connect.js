const mod = 'axiosCalls'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { default as axios } from 'axios'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { MANAGER } from '../config/config.js'
import { logD, logE } from '../utils/logger'
import { RudiError } from './errors.js'
import { getCatalogHeaders } from './secu.js'
import { cleanErrMsg, toInt } from './utils.js'

// -------------------------------------------------------------------------------------------------
// Functions
// -------------------------------------------------------------------------------------------------
const rudiErrMsg = (rudiModuleCalled, message, status = '') =>
  rudiModuleCalled
    ? `ERR ${status} while calling ${rudiModuleCalled}: ${cleanErrMsg(message)}`
    : `ERR ${status}: ${message}`

export const rudiCatalogGet = (url, opts) => safeAxiosGet('RUDI node Catalog', url, { ...opts, ...getCatalogHeaders() })

export async function safeAxiosGet(rudiModuleCalled, url, opts) {
  const fun = 'safeAxiosGet'
  let res
  try {
    logD('axios.get', null, url)
    res = await axios.get(url, opts)
    // log.d(mod, `${fun}+(${url})`, res?.data)
  } catch (axiosErr) {
    logE(mod, `${fun}-(${url})`, cleanErrMsg(axiosErr))
    let { message, code, status } = axiosErr
    const axiosGenericMsg = 'Request failed with status code '
    if (!status && message?.startsWith(axiosGenericMsg)) {
      status = toInt(message.split(axiosGenericMsg)[1])
      if (axiosErr?.response?.data) {
        logE(mod, fun + '.axiosMsg', axiosErr?.response.data)
        message = axiosErr.response.data.message
        status = axiosErr.response.data.statusCode
        // message = axiosErr.response.message
      }
    }
    if (code === 'ECONNREFUSED' || code === 'ERR_BAD_RESPONSE') {
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
