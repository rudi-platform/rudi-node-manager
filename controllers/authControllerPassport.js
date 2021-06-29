const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const moment = require('moment');
const databaseManager = require('../database/database');
const config = require('../config/config');

const registerUser = (data) => {
  if (!data.password || !data.confirmPassword || data.password !== data.confirmPassword) return;
  return databaseManager
    .getUserByUsername(data.username)
    .then((user) => {
      // Create new User
      if (!user) {
        const newUser = { username: data.username, password: data.password, email: data.email };
        // Hash password before saving in database
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            return databaseManager
              .createUser(newUser)
              .then((user) => {
                return user;
              })
              .catch((err) => {
                console.log(err);
                throw err;
              });
          });
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

      let exp = moment().add(20, 'minutes').format('X');
      exp = parseInt(exp, 10);
      const body = { id: user.id, username: user.username };
      const token = jwt.sign({ user: body, exp }, config.server.secret_key_JWT);

      return res
        .status(200)
        .json({
          success: `logged in ${user.username}`,
          token: token,
          expires: new Date(exp * 1000),
        });
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
