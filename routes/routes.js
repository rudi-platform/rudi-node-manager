const express = require('express');
const router = new express.Router();
const controllers = require('./../controllers/controllers');
const orgaController = require('./../controllers/orgaController');
const contactController = require('./../controllers/contactController');
const sysController = require('./../controllers/sysController');

// TODO : propage res.status

router.get('/resources', controllers.resourcesList);
router.post('/resources', controllers.postResources);
// TODO add /filter
router.get('/resources/:id', controllers.getResourceById);

router.get('/organizations', orgaController.orgaList);
router.post('/organizations', orgaController.postOrga);
router.get('/organizations/:id', orgaController.getOrgaById);

router.get('/contacts', contactController.contactList);
router.post('/contacts', contactController.postContact);
router.get('/contacts/:id', contactController.getContactById);

router.get('/hash', sysController.getHash);
router.get('/test', sysController.getTest);

module.exports = router;
