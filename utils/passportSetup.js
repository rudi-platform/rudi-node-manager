const bcrypt = require('bcrypt');
const databaseManager = require('../database/database');
const passport = require('passport');
const config = require('../config/config');
const LocalStrategy = require('passport-local').Strategy;
const JWTstrategy = require('passport-jwt').Strategy;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

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
        if (!user) {
          return done(null, false, { message: 'no user found' });
        } else {
          // Match password
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: 'Wrong password' });
            }
          });
        }
      })
      .catch((err) => {
        return done(null, false, { message: err });
      });
  }),
);
const cookieExtractor = function (req) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['authToken'];
  }
  console.log('token : ', token)
  return token;
};

passport.use(
  new JWTstrategy(
    {
      secretOrKey: config.auth.secret_key_JWT,
      jwtFromRequest: cookieExtractor,
    },
    async (token, done) => {
      try {
        // TODO : authorisation
        return done(null, token.user);
      } catch (error) {
        done(error);
      }
    },
  ),
);
module.exports = passport;
