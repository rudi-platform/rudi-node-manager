const crypt = require('../utils/crypt');
const databaseManager = require('../database');

const authenticate = function(username, password) {
  let userId;
  return databaseManager.getUserByUsername(username)
      .then((user) => {
        if (!user) {
          throw new Error('User not found.');
        }
        userId = user.id;
        return crypt.checkPassword(password, user.passwordHash)
            .then((isCorrect) => {
              if (!isCorrect) {
                throw new Error('Wrong password.');
              }
              const token = generateToken(userId);
              return {jwt: token, user};
            });
      });
};
const generateToken = (userId) => {
  const expiresInDays = 365 * config.jwtExpireDays || 30;
  let exp = moment().add(expiresInDays, 'days').format('X');
  exp = parseInt(exp, 10);
  const payload = {
    u: userId,
    exp,
  };
  const accessToken = jwt.sign(payload, config.jwtSecret);
  return {
    accessToken,
    expires: new Date(exp * 1000),
  };
};
const registerUser = (data) =>{
  if (!data.password || !data.confirmPassword || data.password !== data.confirmPassword) return;
  return crypt.generatePasswordHash(data.password)
      .then((hashAndSalt) => {
        Object.assign(data, hashAndSalt);
        delete data.password;
        delete data.confirmPassword;
        return databaseManager.createUser(data);
      });
};

exports.postRegister = (req, res, next) => {
  try {
    const data = req.body;
    registerUser(data)
        .then((user) => {
          req.session.user = user;
          res.json(user);
        }); ;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
exports.postLogin = (req, res, next) => {
  authenticate(req.body.username, req.body.password)
      .then((data) => {
        req.session.user = data.user;
        req.session.jwt = data.jwt;
        res.json(data);
      })
      .catch((err) => {
        next(err);
      });
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
