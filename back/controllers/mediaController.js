const mod = 'mediaCtrl'

// External dependencies
const { default: axios } = require('axios')

// Internal dependencies
const {
  getStorageDwnlUrl,
  getStorageUrl,
  CATALOG,
  getCatalogAdminUrl: getCatalogAdminApiUrl,
  STORAGE,
  MANAGER,
} = require('../config/config')
const { dbGetUserByUsername } = require('../database/database')
const { UnauthorizedError, NotFoundError, RudiError } = require('../utils/errors')
const log = require('../utils/logger')
const {
  extractCookieFromReq,
  CONSOLE_TOKEN_NAME,
  readJwtBody,
  getTokenFromMediaForUser,
  getCatalogHeaders,
  getStorageHeaders,
} = require('../utils/secu')
const { handleError, treatAxiosError } = require('./errorHandler')
const { extractJwt } = require('@aqmo.org/jwt-lib')
const { beautify, cleanErrMsg } = require('../utils/utils.js')

exports.getStoragePublicUrl = async (req, reply) => {
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
exports.getStorageToken = async (req, reply, next) => {
  const fun = 'getMediaToken'
  try {
    // We extract
    const jwt = extractCookieFromReq(req, CONSOLE_TOKEN_NAME) || extractJwt(req)
    if (!jwt) {
      // console.error('T (getMediaToken) req:', req)
      throw new UnauthorizedError('No JWT was found in the request')
    }

    const jwtPayload = readJwtBody(jwt)
    const payloadUser = jwtPayload.user
    if (!payloadUser)
      throw new UnauthorizedError(`JWT body token should contain an identified user: ${beautify(jwtPayload)}`)

    const user = await dbGetUserByUsername(null, payloadUser.username) // NOSONAR
    if (!user) return reply.status(404).json(new NotFoundError(`User not found: ${payloadUser.username}`))

    const mediaToken = await getTokenFromMediaForUser(user)

    return reply.status(200).send({ token: mediaToken })
  } catch (err) {
    log.e(mod, fun, `!! Liaison avec le module “${STORAGE}” incomplète, création de JWT impossible: ` + err)
    if (err.code == 'ECONNREFUSED')
      return reply.status(500).json({
        statusCode: 500,
        message: `“${STORAGE}” module is apparently down, contact the RUDI node admin`,
        error: `Connection from “${MANAGER}” to “${STORAGE}” module failed`,
      })

    reply.status(err.statusCode || 500).json(err)
  }
}

exports.getMediaInfoById = async (req, reply, next) => {
  const opType = 'get_media_info_by_id'
  const { id } = req.params
  try {
    const res = await axios.get(getCatalogAdminApiUrl('media', id), getCatalogHeaders())
    reply.status(200).json(res.data)
  } catch (err) {
    log.w(mod, opType, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

// Deprecated ? now use direct access
exports.getDownloadById = (req, reply, next) => {
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

exports.commitFileOnStorage = async (req, reply) => {
  const { media_id: mediaId, commit_uuid: commitId, zone_name: zoneName } = req.body
  try {
    return await commitOnStorage(mediaId, commitId, zoneName)
  } catch (err) {
    return reply.status(err.response?.status || 500).send(err)
  }
}

exports.commitFileOnCatalog = async (req, reply) => {
  const { media_id: mediaId, commit_uuid: commitId } = req.body
  return await commitOnRudiApi(mediaId, commitId)
}

exports.commitMediaFile = async (req, reply, next) => {
  const fun = 'commitMediaFile'
  const { media_id: mediaId, commit_uuid: commitId, zone_name: zoneName } = req.body

  // Let's commit the media on Media module
  try {
    await commitOnStorage(mediaId, commitId, zoneName)
  } catch (err) {
    log.e(mod, fun, err)
    return reply.status(err.code).json(err || err?.message)
  }
  try {
    const apiCommitReply = await commitOnRudiApi(mediaId, commitId)
    const res = {
      status: 'OK',
      media_id: mediaId,
      commit_id: commitId,
      metadata_list: apiCommitReply?.metadata_list,
    }
    return reply.status(200).send(res)
  } catch (err) {
    log.w(mod, fun, cleanErrMsg(err))
    return treatAxiosError(err, CATALOG, req, reply)
  }
}

const commitOnStorage = async (mediaId, commitId, zoneName) => {
  const fun = 'commitOnStorage'

  try {
    const commitMediaRes = await axios.post(
      getStorageUrl('commit'),
      JSON.stringify({ commit_uuid: commitId, zone_name: zoneName }),
      getStorageHeaders()
    )
    // log.d(mod, fun, commitMediaRes?.statusText || commitMediaRes?.data || commitMediaRes)
    return { status: 'OK', place: 'rudi-media', media_id: mediaId, commit_id: commitId }
  } catch (err) {
    log.e(mod, fun + '.origErr', err)
    const moduleName = 'RUDI Media'
    if (err.code == 'ECONNREFUSED' || err.code == 'ERR_BAD_RESPONSE') {
      throw RudiError.createRudiHttpError(
        503,
        `La connection de “${MANAGER}” vers le module “${moduleName}” a échoué: “${moduleName}” semble injoignable, contactez l‘admin du noeud RUDI`
      )
    }

    const errMsg = `ERR${err.response?.status || ''} Media commit: ${beautify(err.response?.data) || err.response?.statusTex || err}`
    log.e(mod, fun, errMsg)
    const e = {
      statusCode: err.response?.status,
      place: moduleName,
      message: err.response?.data?.msg,
    }
    log.e(mod, fun + '.test', e)

    throw RudiError.createRudiHttpError(err.response?.status, err.response?.data?.msg)
    // RudiError.createRudiHttpError(
    //   err.statusCode || err.code || 500,
    //   `ERR${err.response?.status} Api commit:`,
    //   err.response?.data || err.response?.statusText || err.response
    // )
    // // throw new InternalServerError(errMsg)
  }
}

const commitOnRudiApi = async (mediaId, commitId) => {
  const fun = 'commitOnRudiApi'
  try {
    const res = await axios.post(
      getCatalogAdminApiUrl('media', mediaId, 'commit'),
      { commit_id: commitId },
      getCatalogHeaders()
    )
    const commitInfo = res.data
    // log.d(mod, fun, `T (${fun}) commit API OK:`, commitInfo)
    return { place: CATALOG, ...commitInfo }
  } catch (err) {
    // console.error(
    //   `T (${fun}) ERR${err.response?.status || err.statusCode || ''} Api commit:`,
    //   err.response?.data || err.response?.statusText || err.response
    // )
    throw err
  }
}
