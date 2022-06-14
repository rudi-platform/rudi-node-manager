const express = require('express');
const router = new express.Router();
const adminController = require('../controllers/adminController');
const {
  getObjectList,
  postObject,
  putObject,
  getObjectById,
  deleteObject,
} = require('../controllers/genericController');
// const passport = require('../utils/passportSetup');

router.get('/enum', adminController.getEnum);
router.get('/enum/themes/:lang', adminController.getThemeByLang);
router.get('/licences', adminController.getLicences);
router.get('/version', adminController.getVersion);

// TODO : propage res.status
router.get(`/:objectType`, getObjectList);
router.post(`/:objectType`, postObject);
router.put(`/:objectType`, putObject);
router.get(`/:objectType/:id`, getObjectById);
router.delete(`/:objectType/:id`, deleteObject);


module.exports = router;
