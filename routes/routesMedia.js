const express = require('express')
const router = new express.Router()

const {
  getMediaToken,
  commitMedia,
  getDownloadById,
  getMediaById,
} = require('../controllers/mediaController')

router.get('/jwt', getMediaToken)
router.post('/commit', commitMedia)

router.get('/:id', getMediaById)
router.get('/download/:id', getDownloadById)

module.exports = router
