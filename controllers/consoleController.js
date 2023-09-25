const mod = 'consoleCtrl'

// Internal dependencies
const { getConsoleFormUrl } = require('../config/config')
const log = require('../utils/logger')
const { UnauthorizedError } = require('../utils/errors')
const { getPortalUrl } = require('./dataController')

// Controllers
exports.getFormUrl = (req, reply) => {
  try {
    reply.status(200).send(getConsoleFormUrl())
  } catch (err) {
    log.e('', '', err)
    log.sysError(mod, 'getFormUrl', err, log.getContext(req, { opType: 'get_form_url' }))
    throw err
  }
}

// Controllers
exports.getPortalConnection = (req, reply) => {
  try {
    reply.status(200).send(getPortalUrl())
  } catch (err) {
    log.e('', '', err)
    log.sysError(mod, 'getPortalConnection', err, log.getContext(req, { opType: 'get_portal_url' }))
    throw err
  }
}

exports.getUserInfo = (req, reply) => {
  const user = req.user
  if (!user) return reply.status(401).send(new UnauthorizedError('User info not available'))
  const { username, roles } = user
  return reply.status(200).json({ username, roles })
}
