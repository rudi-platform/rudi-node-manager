const express = require('express');
const router = new express.Router();
const adminController = require('../controllers/adminController');

router.get('/enum', adminController.getEnum);
router.get('/licences', adminController.getLicences);

module.exports = router;
