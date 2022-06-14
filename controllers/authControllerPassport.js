const mod = 'authController';

const passport = require('passport');
const bcrypt = require('bcrypt');
const databaseManager = require('../database/database');
const utils = require('../utils/utils');
const log = require('../utils/logger');

const { isDevEnv } = require('../config/backOptions');
const SHOULD_SECURE = !isDevEnv();

const AUTH_TOKEN = 'authToken';
const PUBLIC_TOKEN = 'publicToken';

exports.AUTH_TOKEN = AUTH_TOKEN;
exports.PUBLIC_TOKEN = PUBLIC_TOKEN;

const registerUser = (data) => {
  const fun = 'registerUser';
  // TODO : throw error instead
  if (!data.password || !data.confirmPassword || data.password !== data.confirmPassword) return;
  return databaseManager
    .getUserByUsername(data.username)
    .then((user) => {
      // Create new User
      if (!user) {
        const newUser = { username: data.username, password: data.password, email: data.email };
        // Hash password before saving in database
        return bcrypt
          .genSalt(10)
          .then((salt) => {
            return bcrypt.hash(newUser.password, salt).then((hash) => {
              newUser.password = hash;
              return databaseManager.createUser(newUser).then((user) => {
                return user;
              });
            });
          })
          .catch((err) => {
            log.e(mod, fun, err);
            throw err;
          });
      } else {
        return Promise.reject(new Error(`User '${data.username}' already exists!`));
      }
    })
    .catch((err) => {
      log.e(mod, fun, err);
      throw err;
    });
};

const authTokenOpts = (exp) => {
  return {
    secure: SHOULD_SECURE,
    httpOnly: true,
    sameSite: 'Strict',
    expires: new Date(exp * 1000),
  };
};
const publicTokenOpts = (exp) => {
  return {
    secure: SHOULD_SECURE,
    httpOnly: false,
    expires: new Date(exp * 1000),
  };
};
exports.postLogin = (req, res, next) => {
  // log.d(mod, 'postLogin', '<--')
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return res.status(400).send(err);
    }
    if (!user) {
      return res.status(401).send('No user found');
    }
    req.login(user, { session: false }, function (err) {
      if (err) {
        return res.status(400).json({ errors: err });
      }

      const { authToken, publicToken, exp } = utils.createToken(user);

      // sameSite: 'Lax' ?
      return res
        .status(200)
        .cookie(AUTH_TOKEN, authToken, authTokenOpts(exp))
        .cookie(PUBLIC_TOKEN, publicToken, publicTokenOpts(exp))
        .json({
          success: `logged as ${user.username}`,
          token: publicToken,
          authToken: authToken,
          expires: new Date(exp * 1000),
        });
      // TODO : remove .json() for cookie only? or give refresh token instead
    });
  })(req, res, next);
};

exports.postRegister = (req, res, next) => {
  const fun = 'postRegister';
  try {
    const data = req.body;
    registerUser(data)
      .then((user) => {
        // TODO : send mail? random password? temp password? link to first password?
        res.json(user);
      })
      .catch((err) => {
        res.status(400).send(err.message);
      });
  } catch (err) {
    log.e(mod, fun, err);
    res.status(400).send(err);
  }
};
exports.postForgot = (req, res, next) => {
  const fun = 'postForgot';
  try {
    // TODO
  } catch (err) {
    log.e(mod, fun, err);
    throw err;
  }
};
exports.postReset = (req, res, next) => {
  const fun = 'postReset';
  try {
    // TODO
  } catch (err) {
    log.e(mod, fun, err);
    throw err;
  }
};

exports.logout = (req, res, next) => {
  res
    .status(200)
    .cookie(AUTH_TOKEN, null, {
      secure: SHOULD_SECURE,
      httpOnly: true,
      sameSite: 'Strict',
      expires: new Date(0),
    })
    .cookie(PUBLIC_TOKEN, null, {
      secure: SHOULD_SECURE,
      httpOnly: false,
      expires: new Date(0),
    })
    .json({});
};
exports.getToken = (req, res, next) => {
  const { authToken, publicToken, exp } = utils.createToken(req.user);
  res
    .status(200)
    .cookie(AUTH_TOKEN, authToken, {
      secure: SHOULD_SECURE,
      httpOnly: true,
      sameSite: 'Strict',
      expires: new Date(exp * 1000),
    })
    .cookie(PUBLIC_TOKEN, publicToken, {
      secure: SHOULD_SECURE,
      httpOnly: false,
      expires: new Date(exp * 1000),
    })
    .json({
      token: authToken,
      expires: new Date(exp * 1000),
    });
};

exports.registerUser = registerUser;
