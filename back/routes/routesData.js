// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import express from 'express'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------

import { v4 as uuid4 } from 'uuid'
import {
  getCatalogVersion,
  getEnum,
  getLicences,
  getPortalOrg,
  getThemeByLang,
  testPortalConnection,
} from '../controllers/dataController.js'
import { expressErrorHandler } from '../controllers/errorHandler.js'
import {
  deleteObject,
  deleteObjects,
  getCatalogLogs,
  getCounts,
  getObjectById,
  getObjectList,
  postObject,
  putObject,
  searchObjects,
} from '../controllers/genericController.js'
import { ROLE_ADMIN, ROLE_EDIT } from '../database/scripts/initDatabase.js'
import { checkRolePerm } from '../utils/roleCheck.js'

// -------------------------------------------------------------------------------------------------
// Routing
// -------------------------------------------------------------------------------------------------

// Proxy for the Catalog API
export const catalogApi = new express.Router()

catalogApi.get('/uuid', (req, reply) => reply.status(200).send(uuid4(req.query?.nb)))
catalogApi.get('/version', getCatalogVersion)
catalogApi.get('/enum/themes/:lang', getThemeByLang)
catalogApi.get('/enum/themes', getThemeByLang)
catalogApi.get('/enum', getEnum)
catalogApi.get('/licences', getLicences)
catalogApi.get(`/logs`, getCatalogLogs)

catalogApi.get('/portal/test', testPortalConnection)

catalogApi.get(`/portal/organizations/:id/:act`, getPortalOrg)
catalogApi.get(`/portal/organizations/:id`, getPortalOrg)
catalogApi.get(`/portal/organizations`, getPortalOrg)

// TODO : propagate res.status
catalogApi.get(`/counts`, getCounts)
catalogApi.get(`/:objectType/search`, searchObjects)
catalogApi.get(`/:objectType/:id`, getObjectById)
catalogApi.get(`/:objectType`, getObjectList)
catalogApi.post(`/:objectType`, checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), postObject)
catalogApi.put(`/:objectType`, checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), putObject)
catalogApi.delete(`/:objectType/:id`, checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), deleteObject)
catalogApi.delete(`/:objectType`, checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), deleteObjects)
catalogApi.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
