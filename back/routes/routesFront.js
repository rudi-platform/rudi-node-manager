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

router.get('/node-urls', authenticate, getNodeUrls)
router.get('/init-data', authenticate, getInitData)
router.get('/env', authenticate, (req, reply) => reply.status(200).send(getNodeEnv()))

router.get('/form-url', authenticate, (req, reply) => reply.status(200).send(FORM_PREFIX))
router.get('/media-url', authenticate, getStoragePublicUrl)
router.get('/storage-url', authenticate, getStoragePublicUrl)
router.get('/ext-api-url', authenticate, makeRequestable(getCatalogPublicUrl))
router.get('/catalog-url', authenticate, makeRequestable(getCatalogPublicUrl))
router.get('/portal-url', authenticate, makeRequestable(getPortalUrl))
router.get('/user-info', authenticate, getUserInfo)

router.post('/register', postRegister)
router.put('/change-password', putPassword) // Delayed auth
router.post('/login', postLogin)
router.get('/logout', logout)
router.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))

module.exports = router
