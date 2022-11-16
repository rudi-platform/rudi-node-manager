const twoDigits = (n) => `${n}`.padStart(2, '0')

exports.nowLocaleFormatted = (date) => {
  const d = new Date(date)
  return (
    `${twoDigits(d.getDay())}/${twoDigits(d.getMonth())}/${d.getFullYear()} ` +
    `${twoDigits(d.getHours())}:${twoDigits(d.getMinutes())}:${twoDigits(d.getSeconds())}`
  )
}
