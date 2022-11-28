const mod = 'authController'

// External dependencies
const passport = require('passport')

// Internal dependencies
const { decodeBase64 } = require('../utils/utils')
const { isDevEnv } = require('../config/backOptions')
const log = require('../utils/logger')
const { BadRequestError, RudiError } = require('../utils/errors')
const { getDbConf } = require('../config/config')

const errorHandler = require('./errorHandler')
const {
  CONSOLE_TOKEN_NAME,
  createFrontUserTokens,
  hashPassword,
  PM_FRONT_TOKEN_NAME,
  matchPassword,
} = require('../utils/secu')
const {
  dbHashAndUpdatePassword,
  dbRegisterUser,
  dbUpdatePassword,
  dbGetHashedPassword,
  dbOpen,
} = require('../database/database')

// Constants
const SHOULD_SECURE = !isDevEnv()

// Helper functions
const consoleCookieOpts = (exp) => {
  return {
    secure: SHOULD_SECURE,
    httpOnly: SHOULD_SECURE,
    sameSite: 'Strict',
    expires: new Date(exp * 1000),
  }
}
const pmFrontCookieOpts = (exp) => {
  return {
    secure: SHOULD_SECURE,
    httpOnly: false,
    sameSite: 'Strict',
    expires: new Date(exp * 1000),
  }
}

// Controllers
exports.postLogin = async (req, res, next) => {
  // log.d(mod, 'postLogin', '<--')
  passport.authenticate('local', (err, user) => {
    if (err) return res.status(400).send(err)
    if (!user)
      return res.status(401).send(`User not found or incorrect password: '${req?.body?.username}'`)

    req.login(user, { session: false }, async (err) => {
      if (err) return res.status(400).json({ errors: err })
      const { consoleToken, pmFrontToken, exp } = await createFrontUserTokens(user)

      // sameSite: 'Lax' ?
      return res
        .status(200)
        .cookie(CONSOLE_TOKEN_NAME, consoleToken, consoleCookieOpts(exp))
        .cookie(PM_FRONT_TOKEN_NAME, pmFrontToken, pmFrontCookieOpts(exp))
        .json({
          success: `logged as '${user.username}'`,
          // [CONSOLE_TOKEN_NAME]: consoleToken,
          expires: new Date(exp * 1000),
        })
      // TODO : remove .json() for cookie only? or give refresh token instead
    })
  })(req, res, next)
}

exports.postRegister = async (req, res) => {
  const fun = 'postRegister'
  try {
    const { username, email, password, confirmPassword } = req.body
    if (!password || password !== confirmPassword)
      throw new BadRequestError('Password and its confirmation should not be null and be the same.')

    const user = await dbRegisterUser(null, { username, email, password })
    res.status(200).send(user)
  } catch (err) {
    log.e(mod, fun, err)
    res.status(err.code || 400).send(err.message)
  }
}
exports.postForgot = (req, res, next) => {
  const fun = 'postForgot'
  try {
    // TODO
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

const INIT_PWD = decodeBase64(getDbConf('db_no_pwd'))

exports.putPassword = async (req, res, next) => {
  const fun = 'changePwd'
  try {
    const { username, password, newPassword, confirmNewPassword } = req.body
    if (
      !username ||
      !password ||
      !newPassword ||
      newPassword === password ||
      newPassword !== confirmNewPassword
    )
      res.status(401).send('Prerequisites not met')

    const db = dbOpen()
    const dbUserInfo = await dbGetHashedPassword(db, username)
    const dbUserHash = dbUserInfo?.password

    passport.authenticate('local', (err, user, info) => {
      if (err) return res.status(400).send(err)
      if (!user && !matchPassword(INIT_PWD, dbUserHash))
        return res.status(401).send(info.message || 'User not found')

      return dbHashAndUpdatePassword(db, username, newPassword)
        .then((userInfo) => res.json(userInfo))
        .catch((err) => {
          log.e(mod, fun, err)
          res.status(400).send(err.message)
        })
    })(req, res, next)
  } catch (err) {
    log.e(mod, fun, err)
    res.status(400).send(err)
  }
}

exports.resetPassword = async (req, res, next) => {
  try {
    // ONLY ADMIN !
    const { id } = req.body
    dbUpdatePassword(null, id, hashPassword(INIT_PWD))
  } catch (err) {
    const error = errorHandler.error(err, req, { opType: 'reset_pwd' })
    return res.status(500).json(new RudiError(error.message))
  }
}

exports.logout = (req, res, next) =>
  res
    .status(200)
    .cookie(CONSOLE_TOKEN_NAME, '', consoleCookieOpts(0))
    .cookie(PM_FRONT_TOKEN_NAME, '', pmFrontCookieOpts(0))
    .json({ [CONSOLE_TOKEN_NAME]: '', [PM_FRONT_TOKEN_NAME]: '' })
