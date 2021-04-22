const express = require('express');
const router = new express.Router();
const controllers = require('./../controllers/controllers');
const sysController = require('./../controllers/sysController');

router.get('/resources', controllers.resourcesList);
router.get('/resources/:id', controllers.getResourceById);

router.get('/hash', sysController.getHash);
router.get('/test', sysController.getTest);

module.exports = router;
