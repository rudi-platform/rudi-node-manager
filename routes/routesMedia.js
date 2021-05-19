const express = require('express');
const router = new express.Router();
const mediaController = require('../controllers/mediaController');

router.get('/:id', mediaController.getMediaById);

module.exports = router;
