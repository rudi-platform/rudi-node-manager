const authController = require('../controllers/authControllerPassport');

try {
  console.log(authController.createToken({ id: 9999, username: 'test' }).token);
} catch (error) {
  console.error(error);
  throw error;
}
