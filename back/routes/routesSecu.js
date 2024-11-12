const express = require('express')
const router = new express.Router()
const {
  createUser,
  deleteUserWithId,
  editUser,
  getUserByUsername,
  getUsersList,
} = require('../controllers/usersControllers')
const { getRoleById, getRoleList } = require('../controllers/roleController')
const { resetPassword } = require('../controllers/authControllerPassport')
const { expressErrorHandler } = require('../controllers/errorHandler.js')
const { hashPassword } = require('@aqmo.org/jwt-lib')
const { BadRequestError } = require('../utils/errors.js')
const { decodeBase64url, decodeBase64 } = require('../utils/utils.js')

router.post('/hash-password', (req, reply) => {
  if (!req?.body?.pwd)
    throw new BadRequestError(`Input should be a JSON { pwd: <mandatory_pwd>, encoding: 'base64url|base64|null' }`)
  const inputPwd = req.body.pwd
  const encoding = `${req.body.encoding}`?.toLowerCase()
  let pwd = inputPwd
  if (encoding === 'base64') pwd = decodeBase64(inputPwd)
  else if (encoding === 'base64url') pwd = decodeBase64url(inputPwd)
  return reply.status(200).send(hashPassword(pwd))
})

router.get('/roles', getRoleList)
router.get('/roles/:role', getRoleById)

router.get('/users', getUsersList)
router.get('/users/:username', getUserByUsername)
router.post('/users', createUser)
router.put('/users', editUser)
router.put('/users/:id/reset-password', resetPassword) // Admin action that resets a user pwd
router.delete('/users/:id', deleteUserWithId)

router.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))

module.exports = router
