const bcrypt = require('bcrypt');
const passport = require('passport');
const { getConf } = require('../config/config');
const LocalStrategy = require('passport-local').Strategy;
const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const databaseManager = require('../database/database');
const { extractCookieFromReq, CONSOLE_TOKEN } = require('./jwt');

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
      .then((user) => {
        // Create new User
        if (!user) return done(null, false, { message: 'no user found' });

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;

          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Wrong password' });
          }
        });
      })
      .catch((err) => {
        return done(null, false, { message: err });
      });
  }),
);

passport.use(
  new JWTstrategy(
    {
      secretOrKey: getConf('auth', 'secret_key_jwt'),
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Take jwt from cookie
        (req) => extractCookieFromReq(req, CONSOLE_TOKEN),
        // Take jwt from http header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
    },
    async (token, done) => {
      try {
        return done(null, token.user);
      } catch (error) {
        done(error);
      }
    },
  ),
);
module.exports = passport;
