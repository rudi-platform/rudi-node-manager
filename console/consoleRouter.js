// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import express from 'express'
import { readFileSync } from 'fs'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getLib, getRoot } from '../back/utils/utils.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
const mod = 'consoleRouter'

// -------------------------------------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------------------------------------
const relative = (...path) => getRoot('console', ...path)
const staticDependency = (dep) => express.static(getLib(dep, 'dist'))
const staticPublicFile = (filePath) => (req, res) => res.sendFile(relative('public', filePath))

// -------------------------------------------------------------------------------------------------
// Console router
// -------------------------------------------------------------------------------------------------
export const consoleRouter = new express.Router()

// -------------------------------------------------------------------------------------------------
// Package dependencies
// -------------------------------------------------------------------------------------------------
consoleRouter.use('/dependencies/leaflet.draw', staticDependency('leaflet-draw'))
consoleRouter.use('/dependencies/leaflet', staticDependency('leaflet'))

// -------------------------------------------------------------------------------------------------
// Main routes
// -------------------------------------------------------------------------------------------------
consoleRouter.get('/?(metadata)?', staticPublicFile('metadata.html'))
consoleRouter.get('/contacts', staticPublicFile('contact.html'))
consoleRouter.get('/organizations', staticPublicFile('organization.html'))
consoleRouter.get('/pub_keys', staticPublicFile('publicKey.html'))
consoleRouter.get('/pub_keys_gen', staticPublicFile('publicKeyGen.html'))

consoleRouter.get('/templates/:filename', async (req, res) => {
  const x = req.params
  let template
  try {
    template = JSON.parse(readFileSync(relative('templates', x.filename), 'utf-8'))
    res.json(template)
  } catch (err) {
    console.error(`get(/templates/${x.filename})`, err)
    res.status(404).json({ error: 'Not found', statusCode: 404, message: `File not found: ${x?.filename}` })
  }
})
consoleRouter.use(express.static(relative('public')))
