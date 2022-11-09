const mod = 'authController';

// External dependencies
const passport = require('passport');
const bcrypt = require('bcrypt');

// Internal dependencies
const { isDevEnv } = require('../config/backOptions');
const log = require('../utils/logger');
const { BadRequestError } = require('../utils/errors');
const { createFrontUserTokens, CONSOLE_TOKEN_NAME, PM_FRONT_TOKEN_NAME } = require('../utils/jwt');
const databaseManager = require('../database/database');

// Constants
const SHOULD_SECURE = !isDevEnv();
const SALT_ROUNDS = 10;

// Helper functions
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

/**
 * Hash and salt a password before storing it into a DB
 * @param {String} password A password
 * @param {Boolean} isNotBase64 True of the password is not base64 encoded
 * @return {String} The salted passwrod
 */
 const hashPassword = async (password) => {
  const fun = 'hashPassword';
  try {
    const pwdStr = `${password}`;
    if (pwdStr.startsWith('$')) {
      console.debug('T (saltPassword) Already hashed pwd:', pwdStr);
      return pwdStr;
    }
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPwd = await bcrypt.hash(pwdStr, salt);
    console.debug('T (saltPassword) hashed pwd:', hashedPwd);
    return hashedPwd;
  } catch (e) {
    log.e(mod, fun, e);
    throw e;
  }
};


// Controllers
exports.postLogin = async (req, res, next) => {
  // log.d(mod, 'postLogin', '<--')
  passport.authenticate('local', (err, user) => {
    if (err) return res.status(400).send(err);
    if (!user) return res.status(401).send(`User not found: '${req?.body?.username}'`);

    req.login(user, { session: false }, async (err) => {
      if (err) return res.status(400).json({ errors: err });
      const { consoleToken, pmFrontToken, exp } = await createFrontUserTokens(user);

      // sameSite: 'Lax' ?
      return res
        .status(200)
        .cookie(CONSOLE_TOKEN_NAME, consoleToken, consoleCookieOpts(exp))
        .cookie(PM_FRONT_TOKEN_NAME, pmFrontToken, pmFrontCookieOpts(exp))
        .json({
          success: `logged as '${user.username}'`,
          // [CONSOLE_TOKEN_NAME]: consoleToken,
          expires: new Date(exp * 1000),
        });
      // TODO : remove .json() for cookie only? or give refresh token instead
    });
  })(req, res, next);
};

exports.registerUser = async (data) => {
  try {
    const { username, email, password } = data;

    const hashedPwd = await hashPassword(password);
    const userInfo = await databaseManager.safeCreateUser({
      username: username,
      password: hashedPwd,
      email: email,
    });
    return userInfo;
  } catch (err) {
    log.e(mod, 'registerUser', err);
    throw err;
  }
};

exports.postRegister = async (req, res) => {
  const fun = 'postRegister';
  try {
    const { username, email, password, confirmPassword } = req.body;
    if (!password || password !== confirmPassword)
      throw new BadRequestError(
        'Password and its confirmation should not be null and be the same.',
      );

    const user = await this.registerUser({ username, email, password });
    res.status(200).send(user);
  } catch (err) {
    log.e(mod, fun, err);
    res.status(err.code || 400).send(err.message);
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
exports.putPassword = async (req, res, next) => {
  const fun = 'changePwd';
  try {
    const { username, password, newPassword, confirmNewPassword } = req.body;
    if (
      !username ||
      !password ||
      !newPassword ||
      newPassword === password ||
      newPassword !== confirmNewPassword
    )
      res.status(401).send('Prerequisites not met');

    const hashedPwd = await hashPassword(newPassword);

    passport.authenticate('local', (err, user, info) => {
      if (err) return res.status(400).send(err);
      if (!user) return res.status(401).send(info.message || 'User not found');

      return databaseManager
        .updatePassword(username, hashedPwd)
        .then((userInfo) => res.json(userInfo))
        .catch((err) => {
          log.e(mod, fun, err);
          res.status(400).send(err.message);
        });
    })(req, res, next);
  } catch (err) {
    log.e(mod, fun, err);
    res.status(400).send(err);
  }
};

exports.logout = (req, res, next) =>
  res
    .status(200)
    .cookie(CONSOLE_TOKEN_NAME, '', consoleCookieOpts(0))
    .cookie(PM_FRONT_TOKEN_NAME, '', pmFrontCookieOpts(0))
    .json({ [CONSOLE_TOKEN_NAME]: '', [PM_FRONT_TOKEN_NAME]: '' });
