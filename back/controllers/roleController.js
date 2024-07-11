const mod = 'roleCtrl'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  dbClose,
  dbCreateUserRole,
  dbDeleteUserRole,
  dbGetRoleById,
  dbGetRoles,
  dbGetUserById,
  dbGetUserRolesByUsername,
  dbOpen,
} from '../database/database.js'
import { BadRequestError } from '../utils/errors.js'
import { logE, logW } from '../utils/logger.js'
import { formatError } from './errorHandler.js'

// -------------------------------------------------------------------------------------------------
// Functions
// -------------------------------------------------------------------------------------------------
export async function getRoleList(req, reply, next) {
  try {
    const roles = await dbGetRoles()
    // console.trace('T (getRoleList) roles:', roles)
    const visibleRoles = roles.filter((role) => !role.hide)
    // console.trace('T (getRoleList) unhiddenRoles:', visibleRoles)
    reply.status(200).json(
      visibleRoles.map((roleInfo) => {
        return { role: roleInfo.role, desc: roleInfo.desc }
      })
    )
  } catch (err) {
    const error = formatError(err, req, { opType: 'get_roles' })
    try {
      reply.status(error.statusCode).json(error)
    } catch (e) {
      logW(mod, 'getRoleList', e)
    }
  }
}

export function getRoleById(req, reply, next) {
  const { role } = req.params
  return dbGetRoleById(null, role)
    .then((row) => reply.status(200).json(row))
    .catch((err) => {
      const error = formatError(err, req, { opType: 'get_role' })
      try {
        reply.status(error.statusCode).json(error)
      } catch (e) {
        logW(mod, 'getRoleById', e)
      }
    })
}

// User_Roles
export async function getUserRolesByUsername(req, reply, next) {
  const { username } = req.params
  if (!username) return reply.status(400).json(new BadRequestError('Request should provide a username'))

  try {
    const roles = await dbGetUserRolesByUsername(null, username)
    return reply.status(200).json(roles)
  } catch (err) {
    const error = formatError(err, req, { opType: 'get_userRole' })
    try {
      reply.status(error.statusCode).json(error)
    } catch (e) {
      logW(mod, 'getUserRolesByUsername', e)
    }
  }
}

export async function deleteUserRole(req, reply, next) {
  try {
    const db = dbOpen()
    const { userId, role } = req.params
    const { userId: id } = await dbDeleteUserRole(null, userId, role)
    const user = await dbGetUserById(db, id)
    reply.status(200).json(user)
  } catch (err) {
    const error = formatError(err, req, { opType: 'delete_userRole' })
    try {
      reply.status(error.statusCode).json(error)
    } catch (e) {
      logW(mod, 'deleteUserRole', e)
    }
  }
}
export async function postUserRole(req, reply, next) {
  try {
    const db = dbOpen()
    const { userId, username, role } = req.body
    if (userId !== 0 && !userId) return reply.status(400).json(new BadRequestError('A userId should be provided'))
    if (!role) return reply.status(400).json(new BadRequestError('A role should be provided'))
    const { userId: id } = await dbCreateUserRole(db, { userId, username, role })
    const user = await dbGetUserById(db, id)
    dbClose(db)
    reply.status(200).json(user)
  } catch (err) {
    logW(mod, 'postUserRole', err)
    const error = formatError(err, req, { opType: 'post_userRole' })
    try {
      reply.status(error?.statusCode).json(error)
    } catch (e) {
      logE(mod, 'postUserRole', e)
    }
  }
}
