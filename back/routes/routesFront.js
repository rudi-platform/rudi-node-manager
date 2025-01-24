// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import express from 'express'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getNodeEnv } from '../config/backOptions.js'
import { getPublicConsole } from '../config/config.js'
import { postLogin, postRegister, putPassword } from '../controllers/authControllerPassport.js'
import { getUserInfo, sendNodeUrls } from '../controllers/consoleController.js'
import { getCatalogPublicUrl, getInitData, getPortalUrl } from '../controllers/dataController.js'
import { expressErrorHandler } from '../controllers/errorHandler.js'
import { getStoragePublicUrl } from '../controllers/mediaController.js'
import { passportAuthenticate } from '../utils/passportSetup.js'
import { logout } from '../utils/secu.js'
import { makeRequestable } from '../utils/utils.js'

// -------------------------------------------------------------------------------------------------
// Routing
// -------------------------------------------------------------------------------------------------
export const frontApi = new express.Router()
const authenticate = passportAuthenticate('jwt', { session: false })

frontApi.post('/register', postRegister)
frontApi.put('/change-password', putPassword) // Delayed auth
frontApi.post('/login', postLogin)
frontApi.get('/logout', (req, reply) => logout(req, reply))

// Routes to get all the data necessary for the UI to start
frontApi.get('/init-data', authenticate, getInitData)

frontApi.get('/user-info', authenticate, getUserInfo)
frontApi.get('/node-urls', authenticate, sendNodeUrls)

// Get modules public URLs
frontApi.get('/env', authenticate, (req, reply) => reply.status(200).send(getNodeEnv()))
frontApi.get('/form-url', authenticate, (req, reply) => reply.status(200).send(getPublicConsole()))
frontApi.get('/storage-url', authenticate, getStoragePublicUrl)
frontApi.get('/catalog-url', authenticate, makeRequestable(getCatalogPublicUrl))
frontApi.get('/portal-url', authenticate, makeRequestable(getPortalUrl))

// Legacy routes:
frontApi.get('/media-url', authenticate, getStoragePublicUrl) // legacy: media => RUDI node Storage
frontApi.get('/ext-api-url', authenticate, makeRequestable(getCatalogPublicUrl)) // legacy: API => RUDI node Catalog

frontApi.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
