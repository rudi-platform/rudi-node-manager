const mod = 'consoleCtrl'

// Internal dependecies
const { getConsoleFormUrl } = require('../config/config')
const log = require('../utils/logger')
const { UnauthorizedError } = require('../utils/errors')

// Controllers
exports.getFormUrl = (req, reply) => {
  try {
    reply.status(200).send(getConsoleFormUrl())
  } catch (err) {
    log.e('', '', err)
    log.sysError(mod, 'getFormUrl', err, log.getContext(req, { opType: 'get_formUrl' }))
    throw err
  }
}

exports.getUserInfo = (req, reply) => {
  const user = req.user
  if (!user) return reply.status(401).send(new UnauthorizedError('User info not available'))
  const { username, roles } = user
  return reply.status(200).json({ username, roles })
}
