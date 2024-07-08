const { floor } = require('lodash')
const { inspect } = require('util')

// ---- Dates
exports.timeEpochMs = (delayMs = 0) => new Date().getTime() + delayMs
exports.timeEpochS = (delayS = 0) => floor(this.timeEpochMs() / 1000) + delayS

exports.nowFormatted = () => new Date().toISOString().replace(/T\./, ' ').replace('Z', '')

// ---- Strings
exports.removeTrailingChar = (str, char) => (str.endsWith(char) ? str.slice(0, -1) : str)

/**
 * Joins several string arguments with the character on which the function is called.
 * This is basically the reverse of the String split function, with the difference that we make sure
 * the merging character is not duplicated
 * @param {...string} args strings to be joined
 * @return {string}
 */
/* eslint no-extend-native: ["error", { "exceptions": ["String"] }] */
String.prototype.merge = function (...args) {
  const argNb = args.length
  if (argNb == 0 || args[0] === undefined || args[0] === null) return ''
  let finalString = `${args[0]}`
  for (let i = 1; i < argNb; i++) {
    if (args[i] === undefined || args[i] === null) break
    const str = `${args[i]}`
    const mergableStr = str.startsWith(this) ? str.slice(1) : str
    finalString = finalString.endsWith(this)
      ? finalString + mergableStr
      : finalString + this + mergableStr
  }
  return finalString
}

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
exports.pathJoin = (...args) => '/'.merge(...args)
exports.removeTrailingSlash = (path) => (`${path}`.endsWith('/') ? path.slice(0, -1) : path)

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

exports.jsonToString = (jsonObject) => inspect(jsonObject, false, 5, true)

/**
 * Cleans a headers string from the "Autorization: <whatever>" information
 */
exports.cleanErrMsg = (str) => (str ? this.cleanHeadersAuth(str) : '')
exports.cleanHeadersAuth = (str) =>
  typeof str == 'string'
    ? str.replace(/["'](Bearer|Basic) [\w-/.]+["']/g, '"***"')
    : this.cleanHeadersAuth(this.beautify(str))

exports.makeRequestable = (func) => async (req, reply, next) => {
  try {
    reply.status(200).send(await func())
  } catch (err) {
    console.warn('makeRequestable', 'ERR', this.cleanErrMsg(err))
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
