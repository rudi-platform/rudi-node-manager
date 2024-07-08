/**
 * Joins several string argument with the character on which the function is called
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

const mergeStr = (...args) => {
  const c = `${args[0]}`
  const argNb = args.length
  if (argNb == 0 || args[0] === undefined || args[0] === null) return ''
  if (argNb == 1) return args[1]

  let finalString = `${args[1]}`
  for (let i = 2; i < argNb; i++) {
    if (args[i] === undefined || args[i] === null) break
    const str = `${args[i]}`
    const mergableStr = str.startsWith(c) ? str.slice(1) : str
    finalString = finalString.endsWith(c)
      ? finalString + mergableStr
      : finalString + c + mergableStr
  }
  return finalString
}
export const pathJoin = (...args) => mergeStr('/', ...args)
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
