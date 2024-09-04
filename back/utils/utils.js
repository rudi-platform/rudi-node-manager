const { floor, isInteger } = require('lodash')
const { inspect } = require('util')
const { v4 } = require('uuid')

// ---- Dates
exports.timeEpochMs = (delayMs = 0) => new Date().getTime() + delayMs
exports.timeEpochS = (delayS = 0) => floor(this.timeEpochMs() / 1000) + delayS

exports.nowFormatted = () => new Date().toISOString().replace(/T\./, ' ').replace('Z', '')

// ---- Strings
exports.removeTrailingChar = (str, char) =>
  `${str}`.endsWith(char) ? `${str}`.slice(0, -1) : `${str}`
exports.removeTrailingSlash = (path) => this.removeTrailingChar(path, '/')

/**
 * Joins several string chunks with the first argument the function is called with.
 * This is basically the reverse of the String split function, with the difference that we make sure
 * the merging character is not duplicated
 * @param {string} sep separator we want to merge the string chunks with
 * @param {...string} args string chunks to be joined
 * @return {string}
 */
exports.mergeStrings = (sep, ...args) => {
  const argNb = args.length
  if (argNb == 0 || args[0] === undefined || args[0] === null) return ''
  let accumulatedStr = `${args[0]}`
  for (let i = 1; i < argNb; i++) {
    if (args[i] === undefined || args[i] === null) break
    const newChunk = `${args[i]}`
    const cleanChunk = newChunk.startsWith(sep) ? newChunk.slice(1) : newChunk
    accumulatedStr = accumulatedStr.endsWith(sep)
      ? accumulatedStr + cleanChunk
      : accumulatedStr + sep + cleanChunk
  }
  return accumulatedStr
}

exports.pathJoin = (...args) => this.mergeStrings('/', ...args)

// ---- String encodings
exports.toBase64 = (data) => this.convertEncoding(data, 'utf-8', 'base64')
exports.toBase64url = (str) => this.convertEncoding(str, 'utf-8', 'base64url')
exports.decodeBase64 = (data) => this.convertEncoding(data, 'base64', 'utf-8')
exports.decodeBase64url = (data) => this.convertEncoding(data, 'base64url', 'utf-8')

exports.convertEncoding = (data, fromEncoding, toEncoding) => {
  try {
    const dataStr = data
    return Buffer.from(dataStr, fromEncoding).toString(toEncoding)
  } catch (err) {
    throw err
  }
}

exports.toInt = (str) => {
  const i = parseInt(str, 10)
  return Number.isNaN(i) || `${i}` !== str ? str : i
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

exports.getDomain = (url) => {
  if (!url.startsWith('http')) url = 'http://' + url
  return this.checkIsURL(url)?.hostname
}

exports.getHost = (url) => {
  if (!url.startsWith('http')) url = 'http://' + url
  return this.checkIsURL(url)?.host
}

exports.checkIsURL = (url) => {
  try {
    return new URL(url)
  } catch {
    return undefined
  }
}

exports.uuidv4 = (nb) => {
  if (!nb) return v4()
  if (!isInteger(parseInt(nb))) throw new Error('Input parameter should be an integer')
  const uuidArray = []
  for (let i = 0; i < nb; i++) {
    uuidArray.push(v4())
  }
  return uuidArray
}

exports.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
