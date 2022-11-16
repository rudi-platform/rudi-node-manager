const mod = 'consoleCtrl'

const { getConsoleFormUrl } = require('../config/config')
const log = require('../utils/logger')
const errorHandler = require('./errorHandler')
const databaseManager = require('../database/database')

// Default Value for rudi_console
exports.getDefaultForm = (req, res) => {
  const user = req.user
  return databaseManager
    .dbGetDefaultForm(null, user)
    .then((rows) => res.status(200).json(rows))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_defaultForm' })
      res.status(error.statusCode).json(error)
    })
}

exports.deleteDefaultForm = (req, res) => {
  const user = req.user
  const { name } = req.params
  return databaseManager
    .dbDeleteDefaultForm(null, user, name)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'delete_defaultForm' })
      res.status(error.statusCode).json(error)
    })
}

exports.putDefaultForm = (req, res) => {
  const data = req.body
  const user = req.user

  return databaseManager
    .dbUpdateDefaultForm(null, user, data)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'put_defaultForm' })
      res.status(error.statusCode).json(error)
    })
}

exports.getFormUrl = (req, res) => {
  try {
    res.status(200).send(getConsoleFormUrl())
  } catch (err) {
    log.e('', '', err)
    log.sysError(mod, 'getFormUrl', err, log.getContext(req, { opType: 'get_formUrl' }))
    throw err
  }
}
