const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const moment = require('moment');
const databaseManager = require('../database/database');
const config = require('../config/config');

const registerUser = (data) => {
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
            console.log(err);
            throw err;
          });
      } else {
        // TODO : user already exist
      }
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const createToken = (user) => {
  let exp = moment().add(20, 'minutes').format('X');
  exp = parseInt(exp, 10);
  const body = { id: user.id, username: user.username };
  return { token: jwt.sign({ user: body, exp }, config.auth.secret_key_JWT), exp: exp };
};

exports.postLogin = (req, res, next) => {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return res.status(400).json({ errors: err });
    }
    if (!user) {
      return res.status(400).json({ errors: 'No user found' });
    }
    req.login(user, { session: false }, function (err) {
      if (err) {
        return res.status(400).json({ errors: err });
      }

      const { token, exp } = createToken(user);

      return res
        .status(200)
        .cookie('authToken', token, {
          secure: true,
          httpOnly: true,
          expires: new Date(exp * 1000),
        })
        .json({
          success: `logged in ${user.username}`,
          token: token,
          expires: new Date(exp * 1000),
        });
      // TODO : remove .json() for cookie only? or give refresh token instead
    });
  })(req, res, next);
};

exports.postRegister = (req, res, next) => {
  try {
    const data = req.body;
    registerUser(data).then((user) => {
      // TODO : send mail? random password? temp password? link to first password?
      res.json(user);
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
};
exports.postForgot = (req, res, next) => {
  try {
    // TODO
  } catch (err) {
    console.log(err);
    throw err;
  }
};
exports.postReset = (req, res, next) => {
  try {
    // TODO
  } catch (err) {
    console.log(err);
    throw err;
  }
};
exports.registerUser = registerUser;
exports.createToken = createToken;
