const mod = 'authController';

const passport = require('passport');
const bcrypt = require('bcrypt');
const databaseManager = require('../database/database');
const log = require('../utils/logger');

const { isDevEnv } = require('../config/backOptions');
const {
  createFrontUserTokens,
  CONSOLE_TOKEN_NAME,
  PM_FRONT_TOKEN_NAME,
} = require('../utils/jwt');
const SHOULD_SECURE = !isDevEnv();

const SALT_ROUNDS = 10;

const consoleCookieOpts = (exp) => {
  return {
    secure: SHOULD_SECURE,
    httpOnly: SHOULD_SECURE,
    sameSite: 'Strict',
    expires: new Date(exp * 1000),
  };
};
const pmFrontCookieOpts = (exp) => {
  return {
    secure: SHOULD_SECURE,
    httpOnly: false,
    sameSite: 'Strict',
    expires: new Date(exp * 1000),
  };
};

exports.postLogin = async (req, res, next) => {
  // log.d(mod, 'postLogin', '<--')
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(400).send(err);
    if (!user) return res.status(401).send('No user found');

    req.login(user, { session: false }, async (err) => {
      if (err) return res.status(400).json({ errors: err });
      const { consoleToken, pmFrontToken, exp } = await createFrontUserTokens(user);

      // sameSite: 'Lax' ?
      return (
        res
          .status(200)
          .cookie(CONSOLE_TOKEN_NAME, consoleToken, consoleCookieOpts(exp))
          .cookie(PM_FRONT_TOKEN_NAME, pmFrontToken, pmFrontCookieOpts(exp))
          .json({
            success: `logged as ${user.username}`,
            // [CONSOLE_TOKEN_NAME]: consoleToken,
            expires: new Date(exp * 1000),
          })
      );
      // TODO : remove .json() for cookie only? or give refresh token instead
    });
  })(req, res, next);
};

const registerUser = (data) => {
  const fun = 'registerUser';
  // TODO : throw error instead
  const { username, email, password, confirmPassword } = data;
  return !password || !confirmPassword || password !== confirmPassword
    ? null
    : databaseManager
        .getUserByUsername(username)
        .then((user) => {
          if (!!user) return Promise.reject(new Error(`User '${username}' already exists!`));

          // Hash password before saving in database
          return bcrypt
            .genSalt(SALT_ROUNDS)
            .then((salt) =>
              bcrypt
                .hash(password, salt)
                .then((hashedPwd) =>
                  databaseManager
                    .createUser({ username: username, password: hashedPwd, email: email })
                    .then((user) => user),
                )
                .catch((err) => {
                  log.e(mod, fun, err);
                  throw err;
                }),
            )
            .catch((err) => {
              log.e(mod, fun, err);
              throw err;
            });
        })
        .catch((err) => {
          log.e(mod, fun, err);
          throw err;
        });
};

exports.postRegister = (req, res, next) => {
  const fun = 'postRegister';
  try {
    registerUser(req.body)
      // TODO : send mail? random password? temp password? link to first password?
      .then((user) => res.json(user))
      .catch((err) => res.status(400).send(err.message));
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
exports.putPassword = (req, res, next) => {
  const fun = 'changePwd';
  try {
    const { username, password, newPassword, confirmNewPassword } = req.body;
    if (
      !username ||
      !password ||
      !newPassword ||
      !confirmNewPassword ||
      newPassword === password ||
      newPassword !== confirmNewPassword
    )
      res.status(401).send('Prerequisites not met');

    passport.authenticate('local', (err, user, info) => {
      if (err) return res.status(400).send(err);
      if (!user) return res.status(401).send(info.message);

      return bcrypt
        .genSalt(SALT_ROUNDS)
        .then((salt) =>
          bcrypt
            .hash(newPassword, salt)
            .then((hashedPwd) =>
              databaseManager
                .updatePassword(username, hashedPwd)
                .then((user) => res.json(user))
                .catch((err) => {
                  log.e(mod, fun, err);
                  res.status(400).send(err.message);
                }),
            )
            .catch((err) => {
              log.e(mod, fun, err);
              throw err;
            }),
        )
        .catch((err) => {
          log.e(mod, fun, err);
          throw err;
        });
    })(req, res, next);
  } catch (err) {
    log.e(mod, fun, err);
    res.status(400).send(err);
  }
};

exports.logout = (req, res, next) => {
  res
    .status(200)
    .cookie(CONSOLE_TOKEN_NAME, '', consoleCookieOpts(0))
    .cookie(PM_FRONT_TOKEN_NAME, '', pmFrontCookieOpts(0))
    .json({ [CONSOLE_TOKEN_NAME]: '', [PM_FRONT_TOKEN_NAME]: '' });
};
