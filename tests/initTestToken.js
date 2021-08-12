const utils = require('../utils/utils');

try {
  console.log(utils.createToken({ id: 9999, username: 'test' }).token);
} catch (error) {
  console.error(error);
  throw error;
}
