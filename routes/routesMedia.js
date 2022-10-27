const express = require('express');
const router = new express.Router();

const passport = require('../utils/passportSetup');
const { getMediaById, getDownloadById, commitMedia } = require('../controllers/mediaController');
const { getMediaToken } = require('../controllers/adminController');

router.get('/jwt', passport.authenticate('jwt', { session: false }), getMediaToken);
router.post('/commit', commitMedia);

router.get('/:id', getMediaById);
router.get('/download/:id', getDownloadById);


module.exports = router;
