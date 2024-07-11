/**
 * Joins several string chunks with the first argument the function is called with.
 * This is basically the reverse of the String split function, with the difference that we make sure
 * the merging character is not duplicated
 * @param {string} sep separator we want to merge the string chunks with
 * @param {...string} args string chunks to be joined
 * @return {string}
 */
export const mergeStrings = (sep, ...args) => {
  const argNb = args.length
  if (argNb == 0 || args[0] === undefined || args[0] === null) return ''
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
export const ensureEndsWithSlash = (url) => (`${url}`.endsWith('/') ? url : `${url}/`)
export const removeTrailingSlash = (url) => (`${url}`.endsWith('/') ? url.slice(0, -1) : url)

const twoDigits = (n) => `${n}`.padStart(2, '0')

/**
 * Format a date string
 * @param {string | number} date A date
 * @return {string} A date in format YYYY.MM.DD hh:mm:ss
 */
export const getLocaleFormatted = (date) => {
  const d = new Date(date)
  return (
    `${twoDigits(d.getDate())}/${twoDigits(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${twoDigits(d.getHours())}:${twoDigits(d.getMinutes())}:${twoDigits(d.getSeconds())}`
  )
}

export const timeEpochMs = (delayMs = 0) => new Date().getTime() + delayMs
export const timeEpochS = (delayS = 0) => Math.floor(new Date().getTime() / 1000) + delayS

export const lastMonth = () => new Date(new Date().getTime() - 2592000000)

/**
 * Displays a JSON object content
 * @param {Object} obj a JSON object
 * @param {BigInt} option adds indentation
 * @return {string} The JSON object as a string
 */
export const showObj = (obj, option = 2) => {
  try {
    return `${JSON.stringify(obj, null, option).replace(/\\"/g, '"')}${option != null ? '\n' : ''}`
  } catch {
    return `${obj}`
  }
}

export const getCookie = (name) =>
  document.cookie
    ?.split('; ')
    ?.find((row) => row.startsWith(`${name}`))
    ?.split('=')[1]

export function convertEncoding(data, fromEncoding = 'base64url', toEncoding = 'utf-8') {
  try {
    return Buffer.from(data, fromEncoding).toString(toEncoding)
  } catch (err) {
    console.error('[convertEncoding] ERR', err)
    return ''
  }
}
export const decodeBase64url = (data) => atob(data, 'base64url', 'utf-8')
