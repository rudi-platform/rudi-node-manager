const mod = 'consoleCtrl'

const { getConsoleFormUrl, getRudiApi } = require('../config/config')
const log = require('../utils/logger')
const {  UnauthorizedError } = require('../utils/errors')

exports.getFormUrl = (req, res) => {
  try {
    res.status(200).send(getConsoleFormUrl())
  } catch (err) {
    log.e('', '', err)
    log.sysError(mod, 'getFormUrl', err, log.getContext(req, { opType: 'get_formUrl' }))
    throw err
  }
}

exports.getRudiApiV1Url = (req, res) => {
  try {
    res.status(200).send(getRudiApi('api/v1'))
  } catch (err) {
    log.e('', '', err)
    log.sysError(mod, 'getRudiApiV1Url', err, log.getContext(req, { opType: 'get_apiV1Url' }))
    throw err
  }
}

exports.getUserInfo = (req, res) => {
  const user = req.user
  if (!user) return res.status(401).send(new UnauthorizedError('User info not available'))
  const { username, roles } = user
  return res.status(200).json({ username, roles })
}
