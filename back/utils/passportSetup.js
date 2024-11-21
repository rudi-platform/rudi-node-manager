const mod = 'passSetup'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------

import passport from 'passport'
// const { authenticate, deserializeUser, initialize, serializeUser } = passport
// const debug = require('debug')('passport')

import { ExtractJwt, Strategy as JWTstrategy } from 'passport-jwt'
import { Strategy as LocalStrategy } from 'passport-local'

import { matchPassword } from '@aqmo.org/jwt-lib'
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
import { logE, logI, logW, sysWarn } from './logger.js'
import { CONSOLE_TOKEN_NAME, extractCookieFromReq, jwtSecretKey, PM_FRONT_TOKEN_NAME } from './secu.js'

// -------------------------------------------------------------------------------------------------
// Passport configuration
// -------------------------------------------------------------------------------------------------
passport.serializeUser((user, done) => done(null, user.id))

passport.deserializeUser((id, done) =>
  dbGetUserById(null, id)
    .then((user) => done(null, user))
    .catch((err) => {
      logE(mod, 'passport.deserializeUser', `User ID not found: ${id}`)
      return done(err, false, new UnauthorizedError('User not found'))
    })
)

// -------------------------------------------------------------------------------------------------
// Local Strategy
// -------------------------------------------------------------------------------------------------
passport.use(
  new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
    // Match User
    checkPassport(username, password)
      .then(() => done(null, { username }))
      .catch((err) => {
        logW(mod, 'LocalStrategy', `Error login: ${err}`)
        return done(null, false, err)
      })
  })
)

const checkPassport = async (username, password) => {
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
      const roles = await dbGetUserRolesByUsername(db, username)
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

const SECRET_KEY_JWT = jwtSecretKey()
passport.use(
  new JWTstrategy(
    {
      secretOrKey: SECRET_KEY_JWT,
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
    },
    async (token, done) => {
      try {
        return done(null, token.user)
      } catch (error) {
        logE(mod, 'JWTstrategy', `ERR: ${error}`)
        sysWarn(mod, 'JWTstrategy', error)
        return done(error)
      }
    }
  )
)

export const passportAuthenticate = (...args) => passport.authenticate(...args)
export const passportInitialize = (...args) => passport.initialize(...args)
