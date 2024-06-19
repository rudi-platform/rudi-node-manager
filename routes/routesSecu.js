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
