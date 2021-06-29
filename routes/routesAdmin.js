const express = require('express');
const router = new express.Router();
const controllers = require('../controllers/controllers');
const orgaController = require('../controllers/orgaController');
const contactController = require('../controllers/contactController');
const adminController = require('../controllers/adminController');

router.get('/enum', adminController.getEnum);
router.get('/licences', adminController.getLicences);

// TODO : propage res.status
router.get('/resources', controllers.resourcesList);
router.post('/resources', controllers.postResources);
router.put('/resources', controllers.putResources);
router.get('/resources/:id', controllers.getResourceById);

router.get('/organizations', orgaController.orgaList);
router.post('/organizations', orgaController.postOrga);
router.put('/organizations', orgaController.putOrga);
router.get('/organizations/:id', orgaController.getOrgaById);

router.get('/contacts', contactController.contactList);
router.post('/contacts', contactController.postContact);
router.put('/contacts', contactController.putContact);
router.get('/contacts/:id', contactController.getContactById);

module.exports = router;
