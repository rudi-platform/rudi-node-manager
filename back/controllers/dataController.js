const mod = 'callApiSimple'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import axios from 'axios'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  CATALOG,
  getCatalogAdminPath,
  getCatalogUrlAndParams,
  getHostDomain,
  getPublicBack,
  getPublicConsole,
  getPublicFront,
  getPublicManager,
} from '../config/config.js'

import { getTags } from '../config/backOptions.js'

import { BadRequestError, NotFoundError } from '../utils/errors.js'
import { getCatalogHeaders } from '../utils/secu.js'
import { isUUID } from '../utils/utils.js'
import { handleError, treatAxiosError } from './errorHandler.js'
import { getStoragePublicUrl } from './mediaController.js'

let cache = {}
// Helper functions

/**
 * This function makes a call to RUDI node Catalog module
 * It surrounds the API call with a local cache retrieval and also can be use either in a request
 * context (if req/reply are fulfilled, it will directly reply), or as a secondary function the
 * result of which one would wish to further process.
 *
 * This should be used preferably for persistant data, such as server URLs, not resources list
 * (or you'll need to invalidate the cache when a PUT occurred)
 * @param {*} url The external (relative) URL you wish to call on RUDI node Catalog server
 * @param {*} req Original request
 * @param {*} reply Original reply object, that will be used to return a result if it's provided
 * @returns
 */
const callCatalog = async (url, req, reply) => {
  const fun = 'callCatalog'
  try {
    // altered to consider query parameters changing
    let checkUrl = req?.url ? req.url : url
    if (cache[checkUrl]) return reply ? reply.status(200).send(cache[checkUrl]) : cache[checkUrl]
    const res = await axios.get(getCatalogUrlAndParams(url, req), getCatalogHeaders())
    const data = res.data
    cache[url] = data
    return reply ? reply.status(200).send(data) : data
  } catch (err) {
    // log.w(mod, fun, cleanErrMsg(err))
    // if (reply) reply.status(err.statusCode).send(err.message)
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

export const testPortalConnection = async (req, reply) => {
  const fun = 'testPortalConnection'
  try {
    const res = await Promise.all([
      axios.get(getCatalogUrlAndParams(getCatalogAdminPath('portal/token'), req), getCatalogHeaders()),
      getPortalUrl(),
    ])
    const catalogRes = res[0]?.data
    const portalUrl = res[1]
    const portalJwt = catalogRes?.access_token
    if (!!portalJwt) {
      return reply.status(200).send({ status: 'Connected', portalUrl })
    }
    return reply.status(200).send({ status: 'Not connected', portalUrl })
  } catch (err) {
    // treatAxiosError(err, CATALOG, req, reply)
    const error = err.response?.data
    return reply.status(500).send({ status: 'Not connected', portalUrl: await getPortalUrl(), error })
  }
}

// Controllers
export const getCatalogVersion = (req, reply) => callCatalog(getCatalogAdminPath('version'), req, reply)
export function getEnum(req, reply) {
  const lang = req.params?.lang ?? req.query?.lang ?? 'fr'
  return callCatalog(getCatalogAdminPath(`enum?lang=${lang}`), req, reply)
}
export const getLicences = (req, reply) => callCatalog(getCatalogAdminPath('licences'), req, reply)

const getThemes = (req, reply) => {
  const lang = req?.params?.lang ?? req?.query?.lang ?? 'fr'
  return callCatalog(getCatalogAdminPath('enum/themes', lang), req, reply)
}

export const getThemeByLang = (req, reply) => getThemes(req, reply)
export const getCatalogPublicUrl = () => callCatalog(getCatalogAdminPath('check/node/url'))
export const getPortalUrl = () => callCatalog(getCatalogAdminPath('check/portal/url'))

export async function getInitData(req, reply) {
  try {
    const [themeLabels, catalogPubUrl, storagePubUrl, portalUrl] = await Promise.all([
      getThemes(req),
      getCatalogPublicUrl(),
      getStoragePublicUrl(),
      getPortalUrl(),
    ])
    // console.log(data)
    const portalConnected = `${portalUrl}`.startsWith('http')
    const tags = getTags()
    const initData = {
      appTag: tags?.tag,
      gitHash: tags?.hash,
      catalogPubUrl,
      storagePubUrl,
      consolePath: getPublicConsole(),
      frontPath: getPublicFront(),
      backPath: getPublicBack(),
      managerPath: getPublicManager(),
      hostUrl: getHostDomain(),
      portalUrl,
      portalConnected,
      themeLabels,
    }
    return reply ? reply.status(200).json(initData) : initData
  } catch (e) {
    // log.e(mod, 'getInitData', cleanErrMsg(e))
    if (reply) handleError(req, reply, e, 500, 'getInitData', 'init_data')
    else throw new Error(`Couldn't get init data: ${e.message}`)
  }
}

export const getPortalOrg = (req, reply) => {
  const id = req?.params?.id
  if (id && !isUUID(id)) throw new BadRequestError(`Not a valid UUID: '${id}'`)

  const act = req?.params?.act
  if (act && !id) throw new NotFoundError(`Incorrect route: ${req.url}`)

  try {
    return callCatalog(getCatalogAdminPath('/portal/organizations', id, act), req, reply)
  } catch (err) {
    return treatAxiosError(err, CATALOG, req, reply)
  }
}
