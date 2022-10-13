const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = new express.Router();
const {
  getEnum,
  getThemeByLang,
  getLicences,
  getVersion,
} = require('../controllers/adminController');
const {
  getObjectList,
  postObject,
  putObject,
  getObjectById,
  deleteObject,
} = require('../controllers/genericController');
// const passport = require('../utils/passportSetup');

router.get('/enum', getEnum);
router.get('/enum/themes/:lang', getThemeByLang);
router.get('/licences', getLicences);
router.get('/version', getVersion);
router.get('/uuid', () => res.status(200).send(uuidv4()));

// TODO : propage res.status
router.get(`/:objectType`, getObjectList);
router.post(`/:objectType`, postObject);
router.put(`/:objectType`, putObject);
router.get(`/:objectType/:id`, getObjectById);
router.delete(`/:objectType/:id`, deleteObject);

module.exports = router;
