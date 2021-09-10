const express = require('express');
const router = new express.Router();
const controllers = require('../controllers/controllers');
const orgaController = require('../controllers/orgaController');
const contactController = require('../controllers/contactController');
const adminController = require('../controllers/adminController');
const passport = require('../utils/passportSetup');

router.get('/enum', adminController.getEnum);
router.get('/licences', adminController.getLicences);

// TODO : propage res.status
router.get('/resources', controllers.resourcesList);
router.post(
  '/resources',
  passport.authenticate('jwt', { session: false }),
  controllers.postResources,
);
router.put(
  '/resources',
  passport.authenticate('jwt', { session: false }),
  controllers.putResources,
);
router.get('/resources/:id', controllers.getResourceById);
router.delete(
  '/resources/:id',
  passport.authenticate('jwt', { session: false }),
  controllers.deleteResource,
);

router.get('/organizations', orgaController.orgaList);
router.post(
  '/organizations',
  passport.authenticate('jwt', { session: false }),
  orgaController.postOrga,
);
router.put(
  '/organizations',
  passport.authenticate('jwt', { session: false }),
  orgaController.putOrga,
);
router.get('/organizations/:id', orgaController.getOrgaById);
router.delete(
  '/organizations/:id',
  passport.authenticate('jwt', { session: false }),
  orgaController.deleteOrga,
);

router.get('/contacts', contactController.contactList);
router.post(
  '/contacts',
  passport.authenticate('jwt', { session: false }),
  contactController.postContact,
);
router.put(
  '/contacts',
  passport.authenticate('jwt', { session: false }),
  contactController.putContact,
);
router.get('/contacts/:id', contactController.getContactById);
router.delete(
  '/contacts/:id',
  passport.authenticate('jwt', { session: false }),
  contactController.deleteContact,
);

module.exports = router;
