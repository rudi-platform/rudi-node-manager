const express = require('express')
const helmet = require('helmet')
const path = require('path')

const { pathJoin } = require('../back/utils/utils.js')
const { getRudiMediaUrl } = require('../back/config/config.js')

const root = process.cwd()
// Helper functions

const staticPublicFile = (filePath) => (req, res) => res.sendFile(relative('public', filePath))
const relative = (...path_) => path.join(root, 'console', ...path_)

// Console router
const consoleRouter = express.Router()
consoleRouter.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", pathJoin(getRudiMediaUrl(), 'post')],
        imgSrc: ["'self'", 'https://*.tile.osm.org'],
      },
    },
  })
)
// Package dependencies
const dependenciesRouter = express.Router()
dependenciesRouter.use('/leaflet', express.static(relative('/node_modules/leaflet/dist')))
dependenciesRouter.use('/leaflet.draw', express.static(relative('/node_modules/leaflet-draw/dist')))
consoleRouter.use('/dependencies', dependenciesRouter)

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
