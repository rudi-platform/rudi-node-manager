const mod = 'passSetup'
// const bcrypt = require('bcrypt')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { Strategy: JWTstrategy, ExtractJwt } = require('passport-jwt')

const { getConf } = require('../config/config')
const {
  dbGetUserById,
  dbHashAndUpdatePassword,
  dbGetHashedPassword,
} = require('../database/database')
const log = require('./logger')
const { extractCookieFromReq, CONSOLE_TOKEN_NAME, matchPassword } = require('./secu')

passport.serializeUser((user, done) => done(null, user.id))

passport.deserializeUser((id, done) => {
  dbGetUserById(null, id)
    .then((user) => done(null, user))
    .catch((err) => done(err, false))
})

// Local Strategy
passport.use(
  new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
    // Match User
    dbGetHashedPassword(null, username)
      .then((dbUserHash) => {
        // console.log('T (LocalStrategy) userInfo:', dbUserInfo)
        if (!dbUserHash) return done(null, false, { message: 'No user found' })

        // console.log('T (LocalStrategy) match:', matchPassword(password, dbUserInfo.password))
        if (!matchPassword(password, dbUserHash)) {
          log.e(mod, 'LocalStrategy', `Password mismatch`)
          return done(null, false, { message: 'Wrong password' })
        } else {
          // Password is OK... But if it was bcrypt-generated, let's change
          // the hash from the DB with a crypto.scryptSync hashed password
          // console.log('T (LocalStrategy) match:', matchPassword(password, dbUserInfo.password))
          if (dbUserHash.startsWith('$2b$10$')) {
            dbHashAndUpdatePassword(null, username, password)
              .then((res) => done(null, dbUserHash))
              .catch((err) =>
                log.e(mod, 'LocalStrategy', `Error while updating 2b10 password: ${err}`)
              )
          }
          return done(null, true)
        }
      })
      .catch((err) => {
        log.e(mod, 'LocalStrategy', `Error login: ${err}`)
        return done(null, false, { message: err })
      })
  })
)

const SECRET_KEY_JWT = getConf('auth', 'secret_key_jwt')
passport.use(
  new JWTstrategy(
    {
      secretOrKey: SECRET_KEY_JWT,
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Take jwt from cookie
        (req) => extractCookieFromReq(req, CONSOLE_TOKEN_NAME),
        // Take jwt from http header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
    },
    async (token, done) => {
      try {
        // console.error('T (JWTstrategy) Error auth:', token);
        return done(null, token.user)
      } catch (error) {
        done(error)
      }
    }
  )
)
module.exports = passport
