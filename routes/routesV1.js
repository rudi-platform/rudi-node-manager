const express = require('express');
const router = new express.Router();
const sysController = require('../controllers/sysController');
const authControllerPassport = require('./../controllers/authControllerPassport');
const usersController = require('../controllers/usersControllers');

router.get('/hash', sysController.getHash);
router.get('/formUrl', sysController.getFormUrl);
router.get('/test', sysController.getTest);

router.get('/users', usersController.usersList);
router.get('/users/:id', usersController.getUserById);

router.post('/register', authControllerPassport.postRegister);
router.post('/login', authControllerPassport.postLogin);
router.post('/forgot-password', authControllerPassport.postForgot);
router.post('/reset-password', authControllerPassport.postReset);

module.exports = router;
