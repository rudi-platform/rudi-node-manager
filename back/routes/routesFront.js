const express = require('express')
const router = new express.Router()

const passport = require('../utils/passportSetup')
const { getUserInfo, getNodeUrls } = require('../controllers/consoleController')
const { getCatalogPublicUrl, getPortalUrl, getInitData } = require('../controllers/dataController')
const {
  logout,
  postLogin,
  postRegister,
  putPassword,
} = require('../controllers/authControllerPassport')
const { makeRequestable } = require('../utils/utils')
const { FORM_PREFIX } = require('../config/config.js')
const { expressErrorHandler } = require('../controllers/errorHandler.js')
const { getStoragePublicUrl } = require('../controllers/mediaController.js')
const { getNodeEnv } = require('../config/backOptions.js')

const authenticate = passport.authenticate('jwt', { session: false })

router.post('/register', postRegister)
router.put('/change-password', putPassword) // Delayed auth
router.post('/login', postLogin)
router.get('/logout', logout)

// Routes to get all the data necessary for the UI to start
router.get('/init-data', authenticate, getInitData)

router.get('/user-info', authenticate, getUserInfo)
router.get('/node-urls', authenticate, getNodeUrls)

// Get modules public URLs
router.get('/env', authenticate, (req, reply) => reply.status(200).send(getNodeEnv()))
router.get('/form-url', authenticate, (req, reply) => reply.status(200).send(FORM_PREFIX))
router.get('/storage-url', authenticate, getStoragePublicUrl)
router.get('/catalog-url', authenticate, makeRequestable(getCatalogPublicUrl))
router.get('/portal-url', authenticate, makeRequestable(getPortalUrl))

// Legacy routes:
router.get('/media-url', authenticate, getStoragePublicUrl) // legacy: media => RUDI node Storage
router.get('/ext-api-url', authenticate, makeRequestable(getCatalogPublicUrl)) // legacy: API => RUDI node Catalog

router.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))

module.exports = router
