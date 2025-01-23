const mod = 'authController'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { hashPassword, matchPassword } from '@aqmo.org/jwt-lib'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  dbGetHashedPassword,
  dbHashAndUpdatePassword,
  dbOpen,
  dbRegisterUser,
  dbUpdatePasswordWithField,
} from '../database/database.js'
import { BadRequestError, RudiError, UnauthorizedError } from '../utils/errors.js'
import { logE, logW } from '../utils/logger.js'
import { passportAuthenticate } from '../utils/passportSetup.js'
import { ERR_401_MSG, initPwdSecret, login, logout } from '../utils/secu.js'
import { decodeBase64, decodeBase64url, toBase64 } from '../utils/utils.js'
import { formatError } from './errorHandler.js'

// -------------------------------------------------------------------------------------------------
// Controllers
// -------------------------------------------------------------------------------------------------
/**
 * Used for a user to login
 * @param {*} req
 * @param {*} reply
 * @param {*} next
 * @returns {Object} user info
 */
export async function postLogin(req, reply, next) {
  const fun = 'postLogin'
  // log.d(mod, 'postLogin', '<--')
  passportAuthenticate('local', async (err, user, info) => {
    if (err) {
      logW(mod, fun, err)
      return reply.status(400).send(err)
    }
    if (!user) {
      const errMsg = info?.message ?? `User not found or incorrect password: '${req?.body?.username}'`
      logW(mod, fun, errMsg)
      return reply.status(401).send(ERR_401_MSG)
    }
    try {
      await login(req, reply, user)
    } catch (er) {
      logE(mod, fun, er)
      logout()
      return reply.status(er?.statusCode ?? 501).send(er)
    }
    // TODO : remove .json() for cookie only? or give refresh token instead
  })(req, reply, next)
}

export async function postRegister(req, reply) {
  const fun = 'postRegister'
  try {
    const { username, email, password, confirmPassword } = req.body
    if (!password || password !== confirmPassword)
      throw new BadRequestError('Password and its confirmation should not be null and be the same.')

    const user = await dbRegisterUser(null, { username, email, password })
    reply.status(200).send(user)
  } catch (err) {
    logE(mod, fun, err)
    try {
      reply.status(err.code ?? 400).send(err.message)
    } catch (e) {
      logE(mod, fun, e)
      return
    }
  }
}
export function postForgot(req, reply, next) {
  const fun = 'postForgot'
  try {
    // TODO
  } catch (err) {
    logE(mod, fun, err)
    throw err
  }
}

const INIT_PWD = initPwdSecret()

export async function putPassword(req, reply, next) {
  const fun = 'changePwd'
  try {
    const { username, password, newPassword, confirmNewPassword } = req.body
    if (!username || !password || !newPassword || newPassword === password || newPassword !== confirmNewPassword) {
      const errMsg = 'Prerequisites not met'
      logW(mod, fun, errMsg)
      reply.status(401).send(errMsg)
    }
    const db = dbOpen()
    const dbUserInfo = await dbGetHashedPassword(db, username)
    const dbUserHash = dbUserInfo?.password

    passportAuthenticate('local', (err, user, info) => {
      if (err) return reply.status(400).send(err)
      if (!user && !matchPassword(INIT_PWD, dbUserHash)) {
        const errMsg = info.message ?? 'User not found'
        logW(mod, fun, errMsg)
        return reply.status(401).send(ERR_401_MSG)
      }
      return dbHashAndUpdatePassword(db, username, newPassword)
        .then((userInfo) => reply.json(userInfo))
        .catch((err) => {
          logE(mod, fun, err)
          reply.status(400).send(err.message)
        })
    })(req, reply, next)
  } catch (err) {
    logE(mod, fun, err)
    reply.status(400).send(err)
  }
}

export async function resetPassword(req, reply, next) {
  try {
    // ONLY ADMIN !
    const { id } = req.params
    if (id === 0) throw new UnauthorizedError(`Le mot de passe du SU ne peut être modifié via l'API`)
    await dbUpdatePasswordWithField(null, 'id', id, hashPassword(INIT_PWD))
    reply.status(200).send(`Password reinitialized for user ${id}`)
  } catch (err) {
    const error = formatError(err, req, { opType: 'reset_pwd' })
    try {
      return reply.status(err.statusCode).json(new RudiError(error.message))
    } catch (e) {
      logE(mod, 'resetPassword', e)
    }
  }
}

/**
 *
 * @param {String} pwd the user's password
 * @param {String} usr the user's name
 * @param {String} encoding input encoding of both username and password
 * @returns if usr was defined: a base64 encoded string with colon-separated <username>:<hashed password>. Otherwise : the hashed password (not encoded)
 */
export function hashCredentials(pwd, usr, encoding) {
  if (!pwd) throw new BadRequestError('Input password should be defined')
  let decode
  switch (encoding?.toLowerCase()) {
    case 'base64':
      decode = (x) => decodeBase64(x)
      break
    case 'base64url':
      decode = (x) => decodeBase64url(x)
      break
    case undefined:
      decode = (x) => x
      break
    default:
      throw new BadRequestError(`When defined, input encoding should be 'base64' or 'base64url', got '${encoding}'`)
  }
  if (usr) return toBase64(`${decode(usr)}:${hashPassword(decode(pwd))}`)
  return hashPassword(decode(pwd))
}

export function decodeCredentials(b64Credentials) {
  let creds
  try {
    creds = decodeBase64(b64Credentials)
  } catch {
    throw new BadRequestError('The input credentials should be base 64 encoded')
  }
  try {
    const [usr, pwd] = creds.split(':')
    return [usr, pwd]
  } catch {
    throw new BadRequestError('Credentials should be a <usr>:<pwd> string')
  }
}
