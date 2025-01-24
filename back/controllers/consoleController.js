const mod = 'consoleCtrl'

// Internal dependencies
import { getPublicBack, getPublicConsole, getPublicFront, getPublicManager } from '../config/config.js'
import { UnauthorizedError } from '../utils/errors.js'
import { getContext, logE, logW, sysError } from '../utils/logger.js'
import { getCatalogPublicUrl, getPortalUrl } from './dataController.js'
import { handleError } from './errorHandler.js'
import { getStoragePublicUrl } from './mediaController.js'

export const getNodeUrls = async () => {
  const fun = 'getNodeUrls'
  try {
    const urls = await Promise.all([getCatalogPublicUrl(), getStoragePublicUrl(), getPortalUrl()])
    const nodeUrls = {
      catalogUrl: urls[0],
      catalog_url: urls[0],
      storageUrl: urls[1],
      media_url: urls[1],
      consolePath: getPublicConsole(),
      frontPath: getPublicFront(),
      backPath: getPublicBack(),
      managerPath: getPublicManager(),
      portalUrl: urls[2],
      portal_url: urls[2],
    }
    return nodeUrls
  } catch (err) {
    logE(mod, fun, err)
  }
}

export async function sendNodeUrls(req, reply) {
  const fun = 'sendNodeUrls'
  try {
    const nodeUrls = await getNodeUrls()
    return reply.status(200).send(nodeUrls)
  } catch (err) {
    sysError(mod, fun, err, getContext(req, { opType: 'get_node_urls' }))
    handleError(req, reply, err, 404, fun)
  }
}

// Controllers
export function getPortalConnection(req, reply) {
  try {
    reply.status(200).send(getPortalUrl())
  } catch (err) {
    sysError(mod, 'getPortalConnection', err, getContext(req, { opType: 'get_portal_url' }))
    throw err
  }
}

export function getUserInfo(req, reply) {
  const fun = 'getUserInfo'
  const user = req.user
  if (!user) {
    const errMsg = 'User info not available'
    logW(mod, fun, errMsg)
    return reply.status(401).send(new UnauthorizedError(errMsg))
  }
  const { username, roles } = user
  return reply.status(200).json({ username, roles })
}
