// const bcrypt = require('bcrypt')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const { Strategy: JWTstrategy, ExtractJwt } = require('passport-jwt')

const { getConf } = require('../config/config')
const { dbGetUserById, dbGetUserByUsername } = require('../database/database')
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
    dbGetUserByUsername(null, username)
      .then((userInfo) => {
        console.log('T (LocalStrategy) userInfo:', userInfo)
        if (!userInfo) return done(null, false, { message: 'No user found' })

        console.log('T (LocalStrategy) match:', matchPassword(password, userInfo.password))
        if (!matchPassword(password, userInfo.password))
          return done(null, false, { message: 'Wrong password' })
        else return done(null, userInfo)
      })
      .catch((err) => {
        console.error('T (LocalStrategy) Error login')
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
