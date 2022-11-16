const express = require('express')
const router = new express.Router()
const {
  postRegister,
  postLogin,
  putPassword,
  logout,
} = require('../controllers/authControllerPassport')
const passport = require('../utils/passportSetup')

const { getFormUrl } = require('../controllers/consoleController')

router.get('/formUrl', passport.authenticate('jwt', { session: false }), getFormUrl)
router.put('/change-password', passport.authenticate('jwt', { session: false }), putPassword)
router.get('/logout', passport.authenticate('jwt', { session: false }), logout)

router.post('/register', postRegister)
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
