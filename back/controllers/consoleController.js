const mod = 'consoleCtrl'

// Internal dependencies
const { FORM_PREFIX } = require('../config/config')
const log = require('../utils/logger')
const { UnauthorizedError } = require('../utils/errors')
const { getPortalUrl, getCatalogPublicUrl } = require('./dataController')
const { handleError } = require('./errorHandler')
const { getStoragePublicUrl } = require('./mediaController.js')

exports.getNodeUrls = async (req, reply) => {
  const fun = 'getNodeUrls'
  try {
    const urls = await Promise.all([getCatalogPublicUrl(), getStoragePublicUrl(), getPortalUrl()])
    const nodeUrls = {
      api_url: urls[0],
      catalog_url: urls[0],
      media_url: urls[1],
      storage_url: urls[1],
      form_url: FORM_PREFIX,
    }
    if (urls[2] != 'No portal connected') nodeUrls.portal_url = urls[2]

    return reply.status(200).send(nodeUrls)
  } catch (err) {
    log.sysError(mod, fun, err, log.getContext(req, { opType: 'get_node_urls' }))
    handleError(req, reply, err, 404, fun)
  }
}

// Controllers
exports.getPortalConnection = (req, reply) => {
  try {
    reply.status(200).send(getPortalUrl())
  } catch (err) {
    log.e('', '', err)
    log.sysError(mod, 'getPortalConnection', err, log.getContext(req, { opType: 'get_portal_url' }))
    throw err
  }
}

exports.getUserInfo = (req, reply) => {
  const user = req.user
  if (!user) {
    const errMsg = 'User info not available'
    log.w(mod, fun, errMsg)
    return reply.status(401).send(new UnauthorizedError(errMsg))
  }
  const { username, roles } = user
  return reply.status(200).json({ username, roles })
}
