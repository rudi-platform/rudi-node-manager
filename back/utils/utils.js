/* eslint-disable no-console */

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------

import _ from 'lodash'
const { floor, isInteger } = _

import { inspect } from 'util'
import { v4 } from 'uuid'

// -------------------------------------------------------------------------------------------------
// Dates
// -------------------------------------------------------------------------------------------------
export const timeEpochMs = (delayMs = 0) => new Date().getTime() + delayMs

export const timeEpochS = (delayS = 0) => floor(timeEpochMs() / 1000) + delayS

export const nowFormatted = () => new Date().toISOString().replace(/T\./, ' ').replace('Z', '')

// -------------------------------------------------------------------------------------------------
// Strings
// -------------------------------------------------------------------------------------------------
export const removeTrailingChar = (str, char) => (`${str}`.endsWith(char) ? `${str}`.slice(0, -1) : `${str}`)
export const removeTrailingSlash = (path) => removeTrailingChar(path, '/')

/**
 * Joins several string chunks with the first argument the function is called with.
 * This is basically the reverse of the String split function, with the difference that we make sure
 * the merging character is not duplicated
 * @param {string} sep separator we want to merge the string chunks with
 * @param {...string} args string chunks to be joined
 * @return {string}
 */
export function mergeStrings(sep, ...args) {
  const argNb = args.length
  if (argNb === 0 || args[0] === undefined || args[0] === null) return ''
  let accumulatedStr = `${args[0]}`
  for (let i = 1; i < argNb; i++) {
    if (args[i] === undefined || args[i] === null) break
    const newChunk = `${args[i]}`
    const cleanChunk = newChunk.startsWith(sep) ? newChunk.slice(1) : newChunk
    accumulatedStr = accumulatedStr.endsWith(sep) ? accumulatedStr + cleanChunk : accumulatedStr + sep + cleanChunk
  }
  return accumulatedStr
}

export const pathJoin = (...args) => mergeStrings('/', ...args)

// ---- String encodings
export const toBase64 = (data) => convertEncoding(data, 'utf-8', 'base64')
export const toBase64url = (str) => convertEncoding(str, 'utf-8', 'base64url')
export const decodeBase64 = (data) => convertEncoding(data, 'base64', 'utf-8')
export const decodeBase64url = (data) => convertEncoding(data, 'base64url', 'utf-8')

export function convertEncoding(data, fromEncoding, toEncoding) {
  try {
    const dataStr = data
    return Buffer.from(dataStr, fromEncoding).toString(toEncoding)
  } catch (err) {
    throw err
  }
}

export function toInt(str) {
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
export function beautify(jsonObject, option) {
  try {
    return `${JSON.stringify(jsonObject, null, option).replace(/\\"/g, '"')}${option != null ? '\n' : ''}`
  } catch {
    return `${inspect(jsonObject)}`
  }
}

export const jsonToString = (jsonObject) => inspect(jsonObject, false, 5, true)

/**
 * Cleans a headers string from the "Autorization: <whatever>" information
 */
export const cleanErrMsg = (str) => (str ? cleanHeadersAuth(str) : '')
export const cleanHeadersAuth = (str) =>
  typeof str == 'string' ? str.replace(/["'](Bearer|Basic) [\w-/.]+["']/g, '"***"') : cleanHeadersAuth(beautify(str))

export function makeRequestable(func) {
  return async (req, reply, next) => {
    try {
      reply.status(200).send(await func())
    } catch (err) {
      console.warn('makeRequestable', 'ERR', cleanErrMsg(err))
      if (typeof err == 'object' && err.message && err.statusCode && err.error)
        return reply
          .status(err.statusCode || 500)
          .json({ statusCode: err.statusCode, error: err.error, message: err.message })
      if (typeof err.message == 'string')
        return reply.status(err.statusCode || 500).json({ statusCode: err.statusCode || 500, message: err.message })
      reply.status(500).json({ statusCode: 500, message: cleanErrMsg(err) })
    }
  }
}

export function getDomain(url) {
  if (!url.startsWith('http')) url = 'http://' + url
  return checkIsURL(url)?.hostname
}

export function getHost(url) {
  if (!url.startsWith('http')) url = 'http://' + url
  return checkIsURL(url)?.host
}

export function checkIsURL(url) {
  try {
    return new URL(url)
  } catch {
    return undefined
  }
}

export function uuidv4(nb) {
  if (!nb) return v4()
  if (!isInteger(parseInt(nb))) throw new Error('Input parameter should be an integer')
  const uuidArray = []
  for (let i = 0; i < nb; i++) {
    uuidArray.push(v4())
  }
  return uuidArray
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// export const moduleDirname = (place = import.meta.url) => dirname(fileURLToPath(place))

export const getRootDir = () => process.cwd()
