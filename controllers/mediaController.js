const mod = 'mediaCtrl'

// External dependencies
const axios = require('axios')

// Internal dependencies
const { getMediaDwnlUrl, getRudiApi, getRudiMediaUrl, getAdminApi } = require('../config/config')
const { dbGetUserByUsername } = require('../database/database')
const { ForbiddenError, UnauthorizedError, NotFoundError, RudiError } = require('../utils/errors')
const log = require('../utils/logger')
const {
  getRudiApiToken,
  createPmHeadersForMedia,
  extractCookieFromReq,
  CONSOLE_TOKEN_NAME,
  readJwtBody,
  getTokenFromMediaForUser,
  getRudiApiHeaders,
} = require('../utils/secu')
const { handleError, treatAxiosError } = require('./errorHandler')
const { extractJwt } = require('@aqmo.org/jwt-lib')
const { beautify } = require('../utils/utils.js')

// Controllers
exports.getMediaToken = async (req, reply, next) => {
  const fun = 'getMediaToken'
  try {
    // We extract
    const jwt = extractCookieFromReq(req, CONSOLE_TOKEN_NAME) || extractJwt(req)
    if (!jwt) {
      console.error('T (getMediaToken) req:', req)
      throw new UnauthorizedError('No JWT was found in the request')
    }

    const jwtPayload = readJwtBody(jwt)
    const payloadUser = jwtPayload.user
    const exp = jwtPayload.exp
    if (!payloadUser)
      throw new UnauthorizedError(
        `JWT body token should contain an identified user: ${beautify(jwtPayload)}`
      )
    if (exp * 1000 < new Date().getTime())
      throw new ForbiddenError(`JWT expired: ${new Date(exp * 1000)} < ${new Date()}`)

    const user = await dbGetUserByUsername(null, payloadUser.username)
    if (!user)
      return reply.status(404).json(new NotFoundError(`User not found: ${payloadUser.username}`))

    const mediaToken = await getTokenFromMediaForUser(user, exp)

    return reply.status(200).send({ token: mediaToken })
  } catch (err) {
    log.e(
      mod,
      fun,
      '!! Liaison avec le module “Media” incomplète, création de JWT impossible: ' + err
    )
    if (err.code == 'ECONNREFUSED')
      return reply.status(500).json({
        statusCode: 500,
        message: '“RUDI Media” module is apparently down, contact the RUDI node admin',
        error: 'Connection from “RUDI Prod Manager” to “RUDI Media” module failed',
      })

    reply.status(err.statusCode || 500).json(err)
  }
}

exports.getMediaInfoById = async (req, reply, next) => {
  const opType = 'get_media_info_by_id'
  const { id } = req.params
  try {
    const url = getAdminApi('media', id)
    const token = getRudiApiToken(url, req)

    const resRudiApi = await axios.get(getRudiApi(url), {
      params: req.query,
      headers: { Authorization: `Bearer ${token}` },
    })
    const mediaInfo = resRudiApi.data
    reply.status(200).json(mediaInfo)
  } catch (err) {
    handleError(req, reply, err, 500, opType, 'media')
  }
}

// Deprecated ? now use direct access
exports.getDownloadById = (req, reply, next) => {
  const { id } = req.params
  return axios
    .get(getMediaDwnlUrl(id), {
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

exports.commitFileOnRudiMedia = async (req, reply) => {
  const { media_id: mediaId, commit_uuid: commitId, zone_name: zoneName } = req.body
  try {
    return await commitOnRudiMedia(mediaId, commitId, zoneName)
  } catch (err) {
    return reply.status(err.response?.status || 500).send(err)
  }
}

exports.commitFileOnRudiApi = async (req, reply) => {
  const { media_id: mediaId, commit_uuid: commitId } = req.body
  return await commitOnRudiApi(mediaId, commitId)
}

exports.commitMediaFile = async (req, reply, next) => {
  const fun = 'commitMediaFile'
  const { media_id: mediaId, commit_uuid: commitId, zone_name: zoneName } = req.body

  // Let's commit the media on Media module
  try {
    await commitOnRudiMedia(mediaId, commitId, zoneName)
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
    log.e(mod, fun, err)
    if (err.response?.data) return reply.send(err.response.code).json(err.response.data)
    return treatAxiosError(err, reply, 'RudiApi')
  }
}

const commitOnRudiMedia = async (mediaId, commitId, zoneName) => {
  const fun = 'commitOnRudiMedia'

  try {
    const commitMediaRes = await axios.post(
      getRudiMediaUrl('commit/'),
      JSON.stringify({ commit_uuid: commitId, zone_name: zoneName }),
      createPmHeadersForMedia()
    )
    log.d(mod, fun, commitMediaRes?.statusText || commitMediaRes?.data || commitMediaRes)
    return { status: 'OK', place: 'rudi-media', media_id: mediaId, commit_id: commitId }
  } catch (err) {
    log.e(mod, fun + '.origErr', err)
    const moduleName = 'RUDI Media'
    if (err.code == 'ECONNREFUSED' || err.code == 'ERR_BAD_RESPONSE') {
      throw RudiError.createRudiHttpError(
        503,
        `La connection de “RUDI Prod Manager” vers le module “${moduleName}” a échoué: “${moduleName}” semble injoignable, contactez l‘admin du noeud RUDI`
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
  const url = getAdminApi('media', mediaId, 'commit')
  try {
    const commitInfo = await axios.post(
      getRudiApi(url),
      { commit_id: commitId },
      getRudiApiHeaders()
    )
    log.d(mod, fun, 'T (commitMedia) commit API OK:', commitInfo.data)
    return {
      place: 'rudi-api',
      ...commitInfo,
    }
  } catch (err) {
    console.error(
      `T (commitMedia) ERR${err.response?.status || err.statusCode || ''} Api commit:`,
      err.response?.data || err.response?.statusText || err.response
    )
    throw err
  }
}
