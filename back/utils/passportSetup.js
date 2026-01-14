const mod = 'passSetup'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------

import passport from 'passport'
// const { authenticate, deserializeUser, initialize, serializeUser } = passport
// const debug = require('debug')('passport')

import { ExtractJwt, Strategy as JWTstrategy } from 'passport-jwt'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as PassportStrategy } from 'passport-strategy'

import { matchPassword, verifyToken } from '@aqmo.org/jwt-lib'
// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  dbClose,
  dbGetHashedPassword,
  dbGetUserById,
  dbGetUserRolesByUsername,
  dbHashAndUpdatePassword,
  dbOpen,
} from '../database/database.js'
import { ForbiddenError, statusOK, UnauthorizedError } from './errors.js'
import { logD, logE, logI, logW, sysWarn } from './logger.js'
import {
  CONSOLE_TOKEN_NAME,
  extractCookieFromReq,
  getManagerPubKeys,
  jwtSecretKey,
  PM_FRONT_TOKEN_NAME,
} from './secu.js'
import { beautify, timeEpochS } from './utils.js'

// -------------------------------------------------------------------------------------------------
// Local Strategy
// -------------------------------------------------------------------------------------------------

const checkUsrPwd = async (username, password) => {
  const fun = 'checkPassport'
  const db = dbOpen()
  try {
    const dbUserInfo = await dbGetHashedPassword(db, username)
    const dbUserHash = dbUserInfo.password
    if (!dbUserHash) {
      logE(mod, fun, `User not found: ${username}`)
      throw new UnauthorizedError('No user found')
    }

    if (!matchPassword(password, dbUserHash)) {
      logE(mod, fun, `Password mismatch`)
      throw new UnauthorizedError('Wrong password')
    }

    // Password is OK... But if it was bcrypt-generated, so let's change
    // the hash stored in the DB with a crypto.scryptSync hashed password
    try {
      if (dbUserHash.startsWith('$2b$10$')) {
        await dbHashAndUpdatePassword(db, username, password)
        logI(mod, fun, `Password updated for user '${username}'`)
      }
    } catch (err) {
      logE(mod, fun, `Error while updating 2b10 password: ${err}`)
    }
    try {
      const roles = await dbGetUserRolesByUsername(db, username) // NOSONAR
      // console.trace('T (checkPassport) user roles:', roles)
      if (!roles?.length) throw new ForbiddenError(`Admin validation required for user: '${username}'`)
      // console.trace('T (checkPassport)', 'User may login')
      dbClose(db)
      return statusOK('User may login')
    } catch {
      throw new ForbiddenError(`Admin validation required for user: '${username}'`)
    }
  } catch (err) {
    dbClose(db)
    throw err
  }
}

// -------------------------------------------------------------------------------------------------
// Passport configuration
// -------------------------------------------------------------------------------------------------

/**
 * This Strategy is used to accept requests with a JWT signed with a private key corresponding to
 * the local public keys
 */
class SshJwtStrategy extends PassportStrategy {
  here = 'SshJwtStrategy'
  name = 'jwt-admin'

  constructor() {
    super()
  }

  verify = (jwt) => {
    const fun = 'verify'
    logD(mod, fun)
    for (const { name, key } of getManagerPubKeys()) {
      try {
        const { payload } = verifyToken(key, jwt)
        logD(mod, fun, `Pub key identified for request JWT: '${name}'`)
        if (payload.exp < timeEpochS()) throw new UnauthorizedError('JWT has expired')
        // logD(mod, fun, `${payload.exp} > ${timeEpochS()}`)
        return { payload }
      } catch {
        continue
      }
    }
    throw new UnauthorizedError('No valid key found')
  }

  extractJwt = ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken()])

  async authenticate(req) {
    const fun = 'authenticate'
    logD(mod, fun)
    const jwt = this.extractJwt(req)
    try {
      const { payload } = this.verify(jwt)
      logD(mod, fun, `payload for validated JWT: ${beautify(payload)}`)
      const usr = await dbGetUserById(null, 0)
      usr.roles = await dbGetUserRolesByUsername(null, usr.username) // NO SONAR

      this.success(usr)
    } catch (err) {
      logW(mod, fun, err)
      this.fail(err)
    }
  }
}

const setupPassport = () => {
  const fun = 'setupPassport'
  logD(mod, fun)

  passport.serializeUser((user, done) => done(null, user.id))

  passport.deserializeUser((id, done) =>
    dbGetUserById(null, id)
      .then((user) => done(null, user))
      .catch((err) => {
        logE(mod, 'passport.deserializeUser', `User ID not found: ${id}`)
        return done(new UnauthorizedError('User not found'), false)
      })
  )

  passport.use(
    new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
      // Match User
      checkUsrPwd(username, password)
        .then(() => done(null, { username }))
        .catch((err) => {
          logW(mod, 'LocalStrategy', `Error login: ${err}`)
          return done(null, false, err)
        })
    })
  )

  const SECRET_KEY_JWT = jwtSecretKey()
  passport.use(
    'jwt-usr',
    new JWTstrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          // Take jwt from cookie
          (req) => extractCookieFromReq(req, CONSOLE_TOKEN_NAME),
          (req) => {
            const frontToken = extractCookieFromReq(req, PM_FRONT_TOKEN_NAME)
            // console.log('extracted fronttoken:', frontToken)
            return frontToken
          },
          // Take jwt from http header
          ExtractJwt.fromAuthHeaderAsBearerToken(),
        ]),
        ignoreExpiration: false,
        secretOrKey: SECRET_KEY_JWT,
      },
      (jwtPayload, done) => {
        const fun = 'JWTstrategyCb'
        // logI(mod, fun, `jwtPayload: ${beautify(jwtPayload)}`)
        try {
          // logD(mod, fun, beautify(token.user))
          return done(null, jwtPayload.user)
        } catch (error) {
          logE(mod, fun, `ERR: ${error}`)
          sysWarn(mod, fun, error)
          return done(error)
        }
      }
    )
  )
  passport.use('jwt-admin', new SshJwtStrategy())
}

setupPassport()

export const passportAuthenticate = (...args) => passport.authenticate(...args)
export const passportInitialize = (...args) => passport.initialize(...args)
