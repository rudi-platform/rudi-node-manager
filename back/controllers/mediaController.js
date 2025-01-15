const mod = 'mediaCtrl'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { extractJwt } from '@aqmo.org/jwt-lib'
import axios from 'axios'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import {
  CATALOG,
  getCatalogAdminUrl as getCatalogAdminApiUrl,
  getStorageDwnlUrl,
  getStorageUrl,
  MANAGER,
  STORAGE,
} from '../config/config.js'
import { dbGetUserByUsername } from '../database/database.js'
import { NotFoundError, RudiError, UnauthorizedError } from '../utils/errors.js'
import { logD, logE, logW } from '../utils/logger.js'
import {
  CONSOLE_TOKEN_NAME,
  extractCookieFromReq,
  getCatalogHeaders,
  getStorageHeaders,
  getTokenFromMediaForUser as getTokenFromStorageForUser,
  readJwtBody,
} from '../utils/secu.js'
import { beautify, cleanErrMsg } from '../utils/utils.js'
import { handleError, treatAxiosError } from './errorHandler.js'

// -------------------------------------------------------------------------------------------------
// Functions
// -------------------------------------------------------------------------------------------------
export async function getStoragePublicUrl(req, reply) {
  const fun = 'getStoragePublicUrl'
  try {
    const res = await axios.get(getStorageUrl('url'), getStorageHeaders())
    return reply ? reply.status(200).send(res?.data) : res?.data
  } catch (err) {
    // log.e(mod, fun, `An error occurred while trying to reach Storage module:`, Err)
    treatAxiosError(err, STORAGE, req, reply)
  }
}

// Controllers
export async function getStorageToken(req, reply, next) {
  const fun = 'getStorageToken'
  try {
    // We extract
    const jwt = extractCookieFromReq(req, CONSOLE_TOKEN_NAME) || extractJwt(req)
    if (!jwt) throw new UnauthorizedError('No JWT was found in the request')

    const jwtPayload = readJwtBody(jwt)
    const payloadUser = jwtPayload.user
    if (!payloadUser)
      throw new UnauthorizedError(`JWT body token should contain an identified user: ${beautify(jwtPayload)}`)

    const user = await dbGetUserByUsername(null, payloadUser.username) // NOSONAR
    if (!user) return reply.status(404).json(new NotFoundError(`User not found: ${payloadUser.username}`))

    const mediaToken = await getTokenFromStorageForUser(user)

    return reply.status(200).send({ token: mediaToken })
  } catch (err) {
    logE(mod, fun, `!! Liaison avec le module “${STORAGE}” incomplète, création de JWT impossible: ` + err)
    if (err.code === 'ECONNREFUSED')
      return reply.status(500).json({
        statusCode: 500,
        message: `“${STORAGE}” module is apparently down, contact the RUDI node admin`,
        error: `Connection from “${MANAGER}” to “${STORAGE}” module failed`,
      })

    reply.status(err.statusCode || 500).json(err)
  }
}

export async function getMediaInfoById(req, reply, next) {
  const opType = 'get_media_info_by_id'
  const { id } = req.params
  try {
    const res = await axios.get(getCatalogAdminApiUrl('media', id), getCatalogHeaders())
    reply.status(200).json(res.data)
  } catch (err) {
    logW(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

// Deprecated ? now use direct access
export function getDownloadById(req, reply, next) {
  const { id } = req.params
  return axios
    .get(getStorageDwnlUrl(id), {
      headers: { 'media-access-method': 'Direct', 'media-access-compression': true },
    })
    .then((resRUDI) => {
      const results = resRUDI.data
      reply.status(200).contentType(resRUDI.headers['content-type']).json(results)
    })
    .catch((err) => {
      handleError(req, reply, err, 500, 'get_download', 'media', `media+${id}`)
    })
}

export async function commitFileOnStorage(req, reply) {
  try {
    const { media_id: mediaId, commit_uuid: commitId, zone_name: zoneName } = req.body
    const res = await commitOnStorage(mediaId, commitId, zoneName)
    reply.send(res)
  } catch (err) {
    return treatAxiosError(err, STORAGE, req, reply)
  }
}

export async function commitFileOnCatalog(req, reply) {
  try {
    const { media_id: mediaId, commit_uuid: commitId } = req.body
    const res = await commitOnCatalog(mediaId, commitId)
    reply.send(res)
  } catch (err) {
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

export async function commitMediaFile(req, reply, next) {
  const fun = 'commitMediaFile'
  const { media_id: mediaId, commit_uuid: commitId, zone_name: zoneName } = req.body

  // Let's commit the media on Storage module
  try {
    const resStorageCommit = await commitOnStorage(mediaId, commitId, zoneName)
  } catch (err) {
    logE(mod, fun, err)
    return treatAxiosError(err, STORAGE, req, reply)
  }
  try {
    const resCatalogCommit = await commitOnCatalog(mediaId, commitId)
    const res = {
      status: 'OK',
      media_id: mediaId,
      commit_id: commitId,
      metadata_list: resCatalogCommit?.metadata_list,
    }
    return reply.status(200).send(res)
  } catch (err) {
    logW(mod, fun, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

const commitOnStorage = async (mediaId, commitId, zoneName) => {
  const fun = 'commitOnStorage'

  try {
    const commitMediaRes = await axios.post(
      getStorageUrl('commit'),
      { commit_uuid: commitId, zone_name: zoneName },
      getStorageHeaders()
    )
    // log.d(mod, fun, commitMediaRes?.statusText || commitMediaRes?.data || commitMediaRes)
    return { status: 'OK', place: 'rudi-media', media_id: mediaId, commit_id: commitId }
  } catch (err) {
    logE(mod, fun + '.origErr', err)
    if (err.code === 'ECONNREFUSED' || err.code === 'ERR_BAD_RESPONSE') {
      throw RudiError.createRudiHttpError(
        503,
        `La connection de “${MANAGER}” vers le module “${STORAGE}” a échoué: “${STORAGE}” semble injoignable, contactez l‘admin du noeud RUDI`
      )
    }

    const errMsg = `ERR${err.response?.status || ''} Media commit: ${beautify(err.response?.data) || err.response?.statusTex || err}`
    logE(mod, fun, errMsg)
    const e = {
      statusCode: err.response?.status,
      place: STORAGE,
      message: err.response?.data?.msg,
    }
    logE(mod, fun + '.test', e)

    throw RudiError.createRudiHttpError(err.response?.status, err.response?.data?.msg)
    // RudiError.createRudiHttpError(
    //   err.statusCode || err.code || 500,
    //   `ERR${err.response?.status} Api commit:`,
    //   err.response?.data || err.response?.statusText || err.response
    // )
    // // throw new InternalServerError(errMsg)
  }
}

const commitOnCatalog = async (mediaId, commitId) => {
  const fun = 'commitOnCatalog'
  try {
    logD(mod, fun, getCatalogAdminApiUrl('media', mediaId, 'commit'))
    const res = await axios.post(
      getCatalogAdminApiUrl('media', mediaId, 'commit'),
      { commit_id: commitId },
      getCatalogHeaders()
    )
    const commitInfo = res.data
    logD(mod, fun, `T commit API OK:`, beautify(commitInfo))
    return { place: CATALOG, ...commitInfo }
  } catch (err) {
    logE(
      fun,
      `T ERR${err.response?.status || err.statusCode || ''} Api commit:`,
      err.response?.data || err.response?.statusText || err.response
    )
    throw err
  }
}
