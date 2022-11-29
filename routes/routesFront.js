const express = require('express')
const router = new express.Router()

const passport = require('../utils/passportSetup')
const { getFormUrl } = require('../controllers/consoleController')
const {
  logout,
  postLogin,
  postRegister,
  putPassword,
} = require('../controllers/authControllerPassport')

router.get('/formUrl', passport.authenticate('jwt', { session: false }), getFormUrl)
router.get('/logout', passport.authenticate('jwt', { session: false }), logout)

router.post('/register', postRegister)
router.put('/change-password', putPassword) // Delayed auth
router.post('/login', postLogin)

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
