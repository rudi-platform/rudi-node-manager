const express = require('express')
const router = new express.Router()

const passport = require('../utils/passportSetup')
const { getFormUrl } = require('../controllers/consoleController')
const {
  logout,
  postLogin,
  postRegister,
  putPassword,
  resetPassword,
} = require('../controllers/authControllerPassport')

router.get('/formUrl', passport.authenticate('jwt', { session: false }), getFormUrl)
router.get('/logout', passport.authenticate('jwt', { session: false }), logout)
router.put('/reset-password', passport.authenticate('jwt', { session: false }), resetPassword) // Admin action that resets a user pwd

router.post('/register', postRegister)
router.put('/change-password', putPassword)
router.post('/login', postLogin)

// router.post('/forgot-password', authControllerPassport.postForgot);

// router.get(
//   '/default-form',
//   passport.authenticate('jwt', { session: false }),
//   adminController.getDefaultForm,
// );
// router.delete(
//   '/default-form/:name',
//   passport.authenticate('jwt', { session: false }),
//   adminController.deleteDefaultForm,
// );
// router.put(
//   '/default-form',
//   passport.authenticate('jwt', { session: false }),
//   adminController.putDefaultForm,
// );

module.exports = router
