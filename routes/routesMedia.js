const express = require('express')
const router = new express.Router()

const {
  getMediaToken,
  commitMediaFile,
  getDownloadById,
  getMediaInfoById,
  commitFileOnRudiMedia,
  commitFileOnRudiApi,
} = require('../controllers/mediaController')
const { ROLE_EDIT, ROLE_ADMIN } = require('../database/scripts/initDatabase')
const { checkRolePerm } = require('../utils/roleCheck')

router.get('/jwt', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), getMediaToken)
router.post('/media-commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitFileOnRudiMedia)
router.post('/api-commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitFileOnRudiApi)
router.post('/commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitMediaFile)

router.get('/:id', getMediaInfoById)
router.get('/download/:id', getDownloadById)

module.exports = router
