const express = require('express')
const router = new express.Router()

const passport = require('../utils/passportSetup')
const { getFormUrl, getUserInfo, getNodeUrls } = require('../controllers/consoleController')
const { getApiExternalUrl, getPortalUrl } = require('../controllers/dataController')
const {
  logout,
  postLogin,
  postRegister,
  putPassword,
} = require('../controllers/authControllerPassport')

const authenticate = passport.authenticate('jwt', { session: false })

router.get('/node-urls', authenticate, getNodeUrls)

router.get('/form-url', authenticate, getFormUrl)
router.get('/ext-api-url', authenticate, getApiExternalUrl)
router.get('/portal-url', authenticate, getPortalUrl)
router.get('/user-info', authenticate, getUserInfo)

router.post('/register', postRegister)
router.put('/change-password', putPassword) // Delayed auth
router.post('/login', postLogin)
router.get('/logout', logout)

module.exports = router
