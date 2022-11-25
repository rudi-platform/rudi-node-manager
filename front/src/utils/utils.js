const twoDigits = (n) => `${n}`.padStart(2, '0')

exports.nowLocaleFormatted = (date) => {
  const d = new Date(date)
  return (
    `${twoDigits(d.getDay())}/${twoDigits(d.getMonth())}/${d.getFullYear()} ` +
    `${twoDigits(d.getHours())}:${twoDigits(d.getMinutes())}:${twoDigits(d.getSeconds())}`
  )
}

/**
 * Displays a JSON object content
 * @param {Object} obj a JSON object
 * @param {BigInt} option adds indentation
 * @returns
 */
exports.showObj = (obj, option = 2) => {
  try {
    return `${JSON.stringify(obj, null, option).replace(/\\"/g, '"')}${option != null ? '\n' : ''}`
  } catch (err) {
    return `${obj}`
  }
}
