// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import express from 'express'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { hashPassword } from '@aqmo.org/jwt-lib'
import { resetPassword } from '../controllers/authControllerPassport.js'
import { expressErrorHandler } from '../controllers/errorHandler.js'
import { getRoleById, getRoleList } from '../controllers/roleController.js'
import {
  createUser,
  deleteUserWithId,
  editUser,
  getUserByUsername,
  getUsersList,
} from '../controllers/usersControllers.js'
import { BadRequestError } from '../utils/errors.js'
import { decodeBase64, decodeBase64url } from '../utils/utils.js'

// -------------------------------------------------------------------------------------------------
// Routing
// -------------------------------------------------------------------------------------------------
export const secuApi = new express.Router()
secuApi.post('/hash-password', (req, reply) => {
  if (!req?.body?.pwd)
    throw new BadRequestError(`Input should be a JSON { pwd: <mandatory_pwd>, encoding: 'base64url|base64|null' }`)
  const inputPwd = req.body.pwd
  const encoding = `${req.body.encoding}`?.toLowerCase()
  let pwd = inputPwd
  if (encoding === 'base64') pwd = decodeBase64(inputPwd)
  else if (encoding === 'base64url') pwd = decodeBase64url(inputPwd)
  return reply.status(200).send(hashPassword(pwd))
})

secuApi.get('/roles', getRoleList)
secuApi.get('/roles/:role', getRoleById)

secuApi.get('/users', getUsersList)
secuApi.get('/users/:username', getUserByUsername)
secuApi.post('/users', createUser)
secuApi.put('/users', editUser)
secuApi.put('/users/:id/reset-password', resetPassword) // Admin action that resets a user pwd
secuApi.delete('/users/:id', deleteUserWithId)

secuApi.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))
