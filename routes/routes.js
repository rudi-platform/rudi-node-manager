const express = require('express');
const router = express.Router();
const controllers = require('./../controllers/controllers');

router.get('/resources', controllers.resourcesList);
router.get('/resources/:id', controllers.getResourceById);

module.exports = router;
