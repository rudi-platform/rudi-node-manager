const mod = 'usrCtrl'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { hashPassword } from '@aqmo.org/jwt-lib'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  dbClose,
  dbCreateUser,
  dbDeleteUserWithId,
  dbDeleteUserWithName,
  dbGetUserByEmail,
  dbGetUserById,
  dbGetUserByUsername,
  dbGetUserInfoByUsername,
  dbGetUsers,
  dbOpen,
  dbUpdateUser,
  dbUpdateUserRoles,
} from '../database/database.js'
import { BadRequestError, ForbiddenError, NotFoundError, RudiError } from '../utils/errors.js'
import { logW } from '../utils/logger.js'
import { initPwdSecret } from '../utils/secu.js'
import { formatError } from './errorHandler.js'

const INIT_PWD = initPwdSecret()

export async function getUsersList(req, reply, next) {
  try {
    const users = await dbGetUsers()
    return reply.status(200).json(users)
  } catch (err) {
    const error = formatError(err, req, { opType: 'get_users' })
    try {
      reply.status(error.statusCode).json(new RudiError(error.message))
    } catch (e) {
      logW(mod, 'getUsersList', e)
    }
  }
}

export async function getUserByUsername(req, reply, next) {
  try {
    const { username: name } = req.params
    const userInfo = await dbGetUserByUsername(null, name)
    if (!userInfo) return reply.status(404).json(new NotFoundError(`User not found: '${name}'`))
    const { id, username, email, roles } = userInfo
    return reply.status(200).json({ id, username, email, roles })
  } catch (err) {
    const error = formatError(err, req, { opType: 'get_user' })
    try {
      reply.status(error.statusCode || 500).json(new RudiError(error.message))
    } catch (e) {
      logW(mod, 'getUserByUsername', e)
    }
  }
}

export async function getUserInfoByUsername(req, reply, next) {
  try {
    const { username: name } = req.params
    const userInfo = await dbGetUserInfoByUsername(null, name)
    if (!userInfo) return reply.status(404).json(new NotFoundError(`User not found: '${name}'`))
    const { id, username, email, roles } = userInfo
    return reply.status(200).json({ id, username, email, roles })
  } catch (err) {
    const error = formatError(err, req, { opType: 'get_user' })
    try {
      reply.status(error.statusCode || 500).json(new RudiError(error.message))
    } catch (e) {
      logW(mod, 'getUserInfoByUsername', e)
    }
  }
}

export async function deleteUserWithName(req, reply, next) {
  try {
    // ONLY ADMIN !
    const { username } = req.params
    const db = dbOpen()
    const userInfo = await dbGetUserByUsername(db, username)
    if (!userInfo) {
      dbClose(db)
      return reply.status(404).json(new NotFoundError(`User not found: ${username}`))
    }
    await dbDeleteUserWithName(db, username)
    dbClose(db)
    return reply.status(200).json({ message: `User deleted: ${username}` })
  } catch (err) {
    const error = formatError(err, req, { opType: 'delete_user' })
    try {
      reply.status(error.statusCode).json(new RudiError(error.message))
    } catch (e) {
      logW(mod, 'deleteUserWithName', e)
    }
  }
}

export async function deleteUserWithId(req, reply, next) {
  try {
    // ONLY ADMIN !
    const { id } = req.params
    const db = dbOpen()
    const userInfo = await dbGetUserById(db, id)
    if (!userInfo) return reply.status(404).json(new NotFoundError(`User '${id}' not found`))
    await dbDeleteUserWithId(db, id)
    return reply.status(200).json({ message: `User deleted: ${userInfo?.username}` })
  } catch (err) {
    const error = formatError(err, req, { opType: 'delete_user' })
    try {
      reply.status(error.statusCode).json(new RudiError(error.message))
    } catch (e) {
      logW(mod, 'deleteUserWithId', e)
    }
  }
}

export async function createUser(req, reply) {
  try {
    const userInfo = req.body
    // console.trace('T (addUser) userInfo', userInfo)
    const { username, email, password, roles } = userInfo
    if (!username) return reply.status(400).json(new BadRequestError('La requête doit comporter un username non null'))
    if (!email) return reply.status(400).json(new BadRequestError('La requête doit comporter un email non null'))
    if (!roles || !Array.isArray(roles) || roles.length === 0)
      return reply.status(400).json(new BadRequestError('La requête doit définir un rôle pour l‘utilisateur'))

    const hashedPassword = hashPassword(password || INIT_PWD)

    const db = dbOpen()

    const dbUserSameName = await dbGetUserByUsername(db, username) // NOSONAR
    if (dbUserSameName) {
      dbClose(db)
      return reply.status(403).json(new ForbiddenError(`Ce nom est déjà utilisé: '${username}'`))
    }

    const dbUserSameMail = await dbGetUserByEmail(db, email) // NOSONAR
    if (dbUserSameMail) {
      dbClose(db)
      return reply.status(403).json(new ForbiddenError(`Cet email est déjà utilisé: '${email}'`))
    }
    const { id } = await dbCreateUser(db, { username, password: hashedPassword, email })
    // console.trace('T (createUser) id:', id)
    await dbUpdateUserRoles(db, { userId: id, username, roles })

    const updatedUser = await dbGetUserById(db, id) // NOSONAR
    dbClose(db)
    return reply.status(200).json(updatedUser)
  } catch (err) {
    const error = formatError(err, req, { opType: 'add_user' })
    try {
      reply.status(500).json(new RudiError(error.message))
    } catch (e) {
      logW(mod, 'createUser', e)
    }
  }
}

export async function editUser(req, reply, next) {
  try {
    const { id, email, roles } = req.body
    let username = req.body.username
    if ((id !== 0 && !id) || !username || !email || !roles) {
      return reply.status(400).json(new BadRequestError('Payload attendue: {id, username, email, roles}'))
    }
    const db = dbOpen()
    const reqUsername = req?.user?.username
    if (reqUsername) {
      const dbReqUser = await dbGetUserByUsername(db, reqUsername)
      if (dbReqUser.id === id) {
        // An admin user can't change their own name
        username = reqUsername
      }
    }
    const dbUser = await dbGetUserById(db, id)
    const dbUserSameName = await dbGetUserByUsername(db, username)
    if (dbUserSameName && dbUserSameName.id !== dbUser.id) {
      dbClose(db)
      return reply.status(403).json(`Ce nom est déjà utilisé: '${username}' (${dbUserSameName.id} !== ${dbUser.id})`)
    }
    const dbUserSameMail = await dbGetUserByEmail(db, email)
    if (dbUserSameMail && dbUserSameMail.id !== dbUser.id) {
      dbClose(db)
      return reply.status(403).json(`Cet email est déjà utilisé: '${email}'`)
    }
    await dbUpdateUser(db, { id, username, email })
    await dbUpdateUserRoles(db, { userId: id, username, roles })
    const updatedUser = await dbGetUserById(db, id)
    dbClose(db)
    return reply.status(200).json(updatedUser)
  } catch (err) {
    const error = formatError(err, req, { opType: 'edit_user' })
    try {
      reply.status(500).json(new RudiError(error.message))
    } catch (e) {
      logW(mod, 'editUser', e)
    }
  }
}
