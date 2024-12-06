const mod = 'consoleCtrl'

import { getOptBackDomain } from '../config/backOptions.js'
// Internal dependencies
import {
  getAppUrlPrefix,
  getBackendListeningAddressAndPort,
  getBackUrlPrefix,
  getConsoleUrlPrefix,
  getFrontUrlPrefix,
} from '../config/config.js'
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
      catalog_url: urls[0],
      storage_url: urls[1],
      console_path: getConsoleUrlPrefix(),
      front_path: getFrontUrlPrefix(),
      back_path: getBackUrlPrefix(),
      manager_path: getAppUrlPrefix(),
      host_url: getOptBackDomain() || getBackendListeningAddressAndPort(),
    }
    if (urls[2] !== 'No portal connected') nodeUrls.portal_url = urls[2]
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
