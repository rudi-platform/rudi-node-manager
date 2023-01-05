const mod = 'roleCheck'

const log = require('./logger')
const { ForbiddenError, BadRequestError } = require('./errors')
const { ROLE_SU, ROLE_ALL } = require('../database/scripts/initDatabase')
const { dbGetUserRolesByUsername } = require('../database/database')

exports.checkRolePerm = (expectedRoles) => (req, res, next) => {
  // TODO: retrieve user (in JWT ? passportSetup ?)
  const fun = 'checkRolePerm'
  if (!req?.user) return res.status(400).json(new BadRequestError('User info required'))
  const { username } = req.user
  if (!username) return res.status(400).json(new BadRequestError('Username required'))
  // console.log('T (checkRolePerm) username', username)
  dbGetUserRolesByUsername(null, username)
    .catch((err) => {
      log.e(mod, fun, err)
      return res
        .status(403)
        .json(new ForbiddenError(`Admin validation required for user '${username}'`))
    })
    .then((userRoles) => {
      if (expectedRoles[0] === ROLE_ALL) return next()
      if (
        userRoles?.length &&
        userRoles.findIndex(
          (userRole) =>
            userRole === ROLE_SU || expectedRoles.findIndex((role) => userRole === role) > -1
        ) > -1
      ) {
        next()
      } else {
        // log.w(mod, fun, `Forbidden access by ${username} at ${req.method} ${req.url}`)
        log.sysWarn(
          mod,
          fun,
          `Forbidden access by ${username} at ${req.method} ${req.url}`,
          log.getContext(req, { opType: 'get_hash', statusCode: 403 })
        )
        return res.status(403).json(new ForbiddenError('Insufficient credentials'))
      }
    })
}
