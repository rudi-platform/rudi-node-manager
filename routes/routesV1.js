const express = require('express');
const router = new express.Router();
const sysController = require('../controllers/sysController');
const authController = require('./../controllers/authController');

router.get('/hash', sysController.getHash);
router.get('/formUrl', sysController.getFormUrl);
router.get('/test', sysController.getTest);

router.post('/register', authController.postRegister);
router.post('/login', authController.postLogin);
router.post('/forgot-password', authController.postForgot);
router.post('/reset-password', authController.postReset);


module.exports = router;
