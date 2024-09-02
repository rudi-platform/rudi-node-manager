const express = require('express')

const router = new express.Router()
const {
  getEnum,
  getThemeByLang,
  getLicences,
  getVersion,
} = require('../controllers/dataController')
const {
  getObjectList,
  postObject,
  putObject,
  getObjectById,
  deleteObject,
  deleteObjects,
  getCounts,
} = require('../controllers/genericController')
const { ROLE_ADMIN, ROLE_EDIT } = require('../database/scripts/initDatabase')
const { checkRolePerm } = require('../utils/roleCheck')
const { expressErrorHandler } = require('../controllers/errorHandler.js')
const { uuidv4 } = require('../utils/utils.js')

router.get('/uuid', (req, reply) => reply.status(200).send(uuidv4(req.query?.nb)))
router.get('/version', getVersion)
router.get('/enum', getEnum)
router.get('/enum/themes/:lang', getThemeByLang)
router.get('/enum/themes', getThemeByLang)
router.get('/licences', getLicences)

// TODO : propagate res.status
router.get(`/counts`, getCounts)
router.get(`/:objectType`, getObjectList)
router.post(`/:objectType`, checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), postObject)
router.put(`/:objectType`, checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), putObject)
router.get(`/:objectType/:id`, getObjectById)
router.delete(`/:objectType/:id`, checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), deleteObject)
router.delete(`/:objectType`, checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), deleteObjects)
router.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))

module.exports = router
