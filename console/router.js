import child from 'child_process'
import express from 'express'
import { readFileSync } from 'fs'

import { pathJoin } from '../back/utils/utils.js'

// -------------------------------------------------------------------------------------------------
// Helper functions
// -------------------------------------------------------------------------------------------------
const root = process.cwd()

const getRoot = (...path) => pathJoin(root, ...path)

let libsPath
const getLib = (...path) => {
  try {
    libsPath = libsPath || child.execSync('npm root', { encoding: 'utf-8' })
  } catch (e) {
    libsPath = root
  }
  if (libsPath.endsWith('\n')) libsPath = libsPath.slice(0, -1)
  return pathJoin(libsPath, ...path)
}

const relative = (...path) => getRoot('console', ...path)
const staticDependency = (dep) => express.static(getLib(dep, 'dist'))
const staticPublicFile = (filePath) => (req, res) => res.sendFile(relative('public', filePath))

// -------------------------------------------------------------------------------------------------
// Console router
// -------------------------------------------------------------------------------------------------
export const consoleRouter = express.Router()

// -------------------------------------------------------------------------------------------------
// Package dependencies
// -------------------------------------------------------------------------------------------------
consoleRouter.use('/dependencies/leaflet', staticDependency('leaflet'))
consoleRouter.use('/dependencies/leaflet.draw', staticDependency('leaflet-draw'))

// -------------------------------------------------------------------------------------------------
// Main routes
// -------------------------------------------------------------------------------------------------
consoleRouter.get('/(metadata)?', staticPublicFile('metadata.html'))
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
