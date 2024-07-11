// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import express from 'express'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getAppTag, getHash, getTags } from '../config/backOptions.js'
import { hashCredentials } from '../controllers/authControllerPassport.js'
import { expressErrorHandler } from '../controllers/errorHandler.js'

// -------------------------------------------------------------------------------------------------
// Routing
// -------------------------------------------------------------------------------------------------
export const openApi = new express.Router()

openApi.post('/hash-credentials', (req, reply) => {
  let { usr, pwd, encoding } = req.body
  return reply.status(200).send(hashCredentials(pwd, usr, encoding))
})

openApi.get('/test', (req, reply) => reply.status(200).send('test'))
openApi.get('/hash', (req, reply) => reply.status(200).send(getHash()))
openApi.get('/tag', (req, reply) => reply.status(200).send(getAppTag()))
openApi.get('/tags', (req, reply) => reply.status(200).send(getTags()))
openApi.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
