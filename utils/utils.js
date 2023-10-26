const { floor } = require('lodash')
const { inspect } = require('util')

// ---- Dates
exports.timeEpochMs = (delayMs = 0) => new Date().getTime() + delayMs
exports.timeEpochS = (delayS = 0) => floor(this.timeEpochMs() / 1000) + delayS

exports.nowFormatted = () => new Date().toISOString().replace(/T\./, ' ').replace('Z', '')

// ---- Strings
exports.toBase64 = (data) => this.convertEncoding(data, 'utf-8', 'base64')
exports.toBase64url = (str) => this.convertEncoding(str, 'utf-8', 'base64url')
exports.decodeBase64 = (data) => this.convertEncoding(data, 'base64', 'utf-8')
exports.decodeBase64url = (data) => this.convertEncoding(data, 'base64url', 'utf-8')

exports.convertEncoding = (data, fromEncoding, toEncoding) => {
  try {
    const dataStr = data
    // if (typeof data === 'object') dataStr = JSON.stringify(data)
    return Buffer.from(dataStr, fromEncoding).toString(toEncoding)
  } catch (err) {
    throw err
  }
}

exports.toInt = (str) => {
  const i = parseInt(str, 10)
  // console.log('T (toInt)', str, '->', i);
  return Number.isNaN(i) || `${i}` !== str ? str : i
}

// ---- URL
exports.getCompletedUrl = (baseUrl, subUrl) => {
  if (!subUrl) return baseUrl
  if (`${subUrl}`.startsWith('/')) subUrl = `${subUrl}`.substring(1)
  return `${baseUrl}`.endsWith('/') ? `${baseUrl}${subUrl}` : `${baseUrl}/${subUrl}`
}

/**
 * Custom JSON beautifying function
 * @param {JSON} jsonObject: a JSON object
 * @param {String or number} options: JSON.stringify options. 4 or '\t' make it possible
 *                                    to display the JSON on several lines
 * @returns {String} JSON.stringify options
 */
exports.beautify = (jsonObject, option) => {
  try {
    return `${JSON.stringify(jsonObject, null, option).replace(/\\"/g, '"')}${
      option != null ? '\n' : ''
    }`
  } catch (err) {
    return `${inspect(jsonObject)}`
  }
}

/**
 * Cleans a headers string from the "Autorization: <whatever>" information
 */
exports.cleanErrMsg = (str) => (str ? this.cleanHeadersAuth(str) : '')
exports.cleanHeadersAuth = (str) =>
  typeof str == 'string'
    ? str.replace(/["'](Bearer|Basic) [\w-/\.]+["']/g, '<auth>')
    : this.cleanHeadersAuth(this.beautify(str))

exports.makeRequestable = (func) => async (req, reply) => {
  try {
    return await func(req, reply)
  } catch (err) {
    // console.log('makeRequestable', 'ERR', this.cleanErrMsg(err))
    // console.log('makeRequestable', 'ERR', err.statusCode, err.error, err.message)
    if (typeof err == 'object' && err.message && err.statusCode && err.error)
      return reply
        .status(err.statusCode || 500)
        .json({ statusCode: err.statusCode, error: err.error, message: err.message })
    if (typeof err.message == 'string')
      return reply
        .status(err.statusCode || 500)
        .json({ statusCode: err.statusCode || 500, message: err.message })
    reply.status(500).json({ statusCode: 500, message: this.cleanErrMsg(err) })
  }
}
