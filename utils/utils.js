const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../config/config');

const createToken = (user) => {
  let exp = moment().add(20, 'minutes').format('X');
  exp = parseInt(exp, 10);
  const body = { id: user.id, username: user.username };
  return { token: jwt.sign({ user: body, exp }, config.auth.secret_key_JWT), exp: exp };
};

exports.createToken = createToken;
