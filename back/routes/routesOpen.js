const express = require('express')
const router = new express.Router()

const { getAppTag, getTags, getHash } = require('../config/backOptions')
const { expressErrorHandler } = require('../controllers/errorHandler.js')
const { hashCredentials } = require('../controllers/authControllerPassport.js')

router.post('/hash-credentials', (req, reply) => {
  let { usr, pwd, encoding } = req.body
  return reply.status(200).send(hashCredentials(pwd, usr, encoding))
})

router.get('/test', (req, reply) => reply.status(200).send('test'))
router.get('/hash', (req, reply) => reply.status(200).send(getHash()))
router.get('/tag', (req, reply) => reply.status(200).send(getAppTag()))
router.get('/tags', (req, reply) => reply.status(200).send(getTags()))
router.use((err, req, reply, next) => expressErrorHandler(err, req, reply, next))

module.exports = router
