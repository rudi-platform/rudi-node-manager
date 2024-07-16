const express = require('express')

const { pathJoin } = require('../back/utils/utils.js')

// Helper functions
const root = process.cwd()
const relative = (...path) => pathJoin(root, 'console', ...path)
const staticDependency = (dep) => express.static(pathJoin(root, 'node_modules', dep, 'dist'))
const staticPublicFile = (filePath) => (req, res) => res.sendFile(relative('public', filePath))

// Console router
const consoleRouter = express.Router()

// Package dependencies
// const dependenciesRouter = express.Router()
consoleRouter.use('/dependencies/leaflet', staticDependency('leaflet'))
consoleRouter.use('/dependencies/leaflet.draw', staticDependency('leaflet-draw'))

// Main routes
consoleRouter.get('/', staticPublicFile('metadata.html'))
consoleRouter.get('/metadata', staticPublicFile('metadata.html'))
consoleRouter.get('/contacts', staticPublicFile('contact.html'))
consoleRouter.get('/organizations', staticPublicFile('organization.html'))
consoleRouter.get('/pub_keys', staticPublicFile('publicKey.html'))
consoleRouter.get('/pub_keys_gen', staticPublicFile('publicKeyGen.html'))

consoleRouter.get('/templates/:filename', (req, res) => {
  const x = req.params
  let template
  try {
    template = require(relative('templates', x.filename))
  } catch (err) {
    console.error(`get(/templates/${x.filename})`, err)
    res
      .status(404)
      .json({ error: 'Not found', statusCode: 404, message: `File not found: ${x?.filename}` })
  }
  res.json(template)
})
consoleRouter.use(express.static(relative('public')))

module.exports = consoleRouter
