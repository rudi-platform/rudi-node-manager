const express = require('express')
const router = new express.Router()

const {
  getStorageToken,
  commitMediaFile,
  getDownloadById,
  getMediaInfoById,
  commitFileOnStorage,
  commitFileOnCatalog,
} = require('../controllers/mediaController')
const { ROLE_EDIT, ROLE_ADMIN } = require('../database/scripts/initDatabase')
const { checkRolePerm } = require('../utils/roleCheck')
const { expressErrorHandler } = require('../utils/errors.js')

router.get('/jwt', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), getStorageToken)
router.post('/media-commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitFileOnStorage)
router.post('/api-commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitFileOnCatalog)
router.post('/commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitMediaFile)

router.get('/:id', getMediaInfoById)
router.get('/download/:id', getDownloadById)
router.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))

module.exports = router
