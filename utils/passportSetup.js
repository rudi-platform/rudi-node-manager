const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { Strategy: JWTstrategy, ExtractJwt } = require('passport-jwt');

const { getConf } = require('../config/config');
const databaseManager = require('../database/database');
const { extractCookieFromReq, CONSOLE_TOKEN_NAME: CONSOLE_TOKEN } = require('./jwt');

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  databaseManager
    .getUserById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, false));
});

// Local Strategy
passport.use(
  new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
    // Match User
    databaseManager
      .getUserByUsername(username)
      .then((userInfo) => {
        // Create new User
        if (!userInfo) return done(null, false, { message: 'no user found' });
        // console.log(userInfo);
        // Match password
        bcrypt.compare(password, userInfo.password, (err, isMatch) => {
          if (err) throw err;

          if (isMatch) {
            return done(null, userInfo);
          } else {
            return done(null, false, { message: 'Wrong password' });
          }
        });
      })
      .catch((err) => {
        console.error('T (LocalStrategy) Error login');
        return done(null, false, { message: err });
      });
  })
);

const SECRET_KEY_JWT = getConf('auth', 'secret_key_jwt');
passport.use(
  new JWTstrategy(
    {
      secretOrKey: SECRET_KEY_JWT,
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Take jwt from cookie
        (req) => extractCookieFromReq(req, CONSOLE_TOKEN),
        // Take jwt from http header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
    },
    async (token, done) => {
      try {
        // console.error('T (JWTstrategy) Error auth:', token);
        return done(null, token.user);
      } catch (error) {
        done(error);
      }
    }
  )
);
module.exports = passport;
