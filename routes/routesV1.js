const express = require('express');
const router = new express.Router();
const sysController = require('../controllers/sysController');

router.get('/hash', sysController.getHash);
router.get('/formUrl', sysController.getFormUrl);
router.get('/test', sysController.getTest);

module.exports = router;
