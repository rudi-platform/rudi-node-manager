const mod = 'roleCheck'

import { dbGetUserRolesByUsername } from '../database/database.js'
import { ROLE_ALL, ROLE_SU } from '../database/scripts/initDatabase.js'
import { BadRequestError, ForbiddenError } from './errors.js'
import { getContext, logE, sysWarn } from './logger.js'
import { logout } from './secu.js'

export function checkRolePerm(expectedRoles) {
  return (req, reply, next) => {
    // TODO: retrieve user (in JWT ? passportSetup ?)
    const fun = 'checkRolePerm'
    if (!req?.user) return reply.status(400).json(new BadRequestError('User info required'))
    const { username } = req.user
    // console.trace('T (checkRolePerm) user', req.user)
    if (!username) return reply.status(400).json(new BadRequestError('Username required'))
    dbGetUserRolesByUsername(null, username)
      .then((userRoles) => {
        // log.d(mod, fun, 'THEN')
        if (expectedRoles[0] === ROLE_ALL) return next()
        if (
          userRoles?.length &&
          userRoles.findIndex(
            (userRole) => userRole === ROLE_SU || expectedRoles.findIndex((role) => userRole === role) > -1
          ) > -1
        ) {
          next()
        } else {
          sysWarn(
            mod,
            fun,
            `Access forbidden for '${username}' to ${req?.method} ${req?.url}`,
            getContext(req, { opType: 'get_hash', statusCode: 403 })
          )
          try {
            return reply.status(403).json(new ForbiddenError('Insufficient credentials'))
          } catch (e) {
            logE(mod, fun, e)
            return
          }
        }
      })
      .catch((err) => {
        // log.d(mod, fun, 'CATCH')
        if (err?.statusCode === 401 && err?.message?.startsWith('User not found')) {
          logE(mod, fun, 'Deleted user?')
          return logout(req, reply)
        }
        logE(mod, fun, err)
        return reply.status(403).json(new ForbiddenError(`Admin validation required for user '${username}'`))
      })
  }
}
