const mod = 'roleCheck'

const { dbGetUserRolesByUsername } = require('../database/database')
const { ForbiddenError } = require('./errors')
const log = require('./logger')

exports.checkRolePerm = (role) => (req, res, next) => {
  // TODO: retrieve user (in JWT ? passportSetup ?)
  //

  const fun = 'checkRolePerm'
  const { username } = req.user
  console.log('T (checkRolePerm) username', username)
  dbGetUserRolesByUsername(null, username)
    .then((userRoles) => {
      if (userRoles.findIndex((userRole) => userRole === 'SuperAdmin' || userRole === role) > -1) {
        next()
      } else {
        log.w(mod, fun, `Forbidden access by ${username} at ${req.method} ${req.url}`)
        log.sysWarn(
          mod,
          fun,
          `Forbidden access by ${username} at ${req.method} ${req.url}`,
          log.getContext(req, { opType: 'get_hash', statusCode: 403 })
        )
        return res.status(403).json(new ForbiddenError('Insufficient credentials'))
      }
    })
    .catch((err) => {
      log.e(mod, fun, err)
      return res.status(403).json(new ForbiddenError('Insufficient credentials'))
    })
}
