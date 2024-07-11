// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import express from 'express'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { expressErrorHandler } from '../controllers/errorHandler.js'
import {
  commitFileOnCatalog,
  commitFileOnStorage,
  commitMediaFile,
  getDownloadById,
  getMediaInfoById,
  getStorageToken,
} from '../controllers/mediaController.js'
import { ROLE_ADMIN, ROLE_EDIT } from '../database/scripts/initDatabase.js'
import { checkRolePerm } from '../utils/roleCheck.js'

// -------------------------------------------------------------------------------------------------
// Routing
// -------------------------------------------------------------------------------------------------

// API from the Storage proxy
export const storageApi = new express.Router()

storageApi.get('/jwt', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), getStorageToken)
storageApi.post('/storage-commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitFileOnStorage)
storageApi.post('/media-commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitFileOnStorage)
storageApi.post('/api-commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitFileOnCatalog)
storageApi.post('/catalog-commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitFileOnCatalog)
storageApi.post('/commit', checkRolePerm([ROLE_EDIT, ROLE_ADMIN]), commitMediaFile)

storageApi.get('/:id', getMediaInfoById)
storageApi.get('/download/:id', getDownloadById)
storageApi.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
