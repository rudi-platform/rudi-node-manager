const mod = 'secu'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { forgeToken, readPrivateKeyFile, tokenStringToJwtObject } from '@aqmo.org/jwt-lib'
import axios from 'axios'
import _jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
const { sign } = _jwt

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getOptBackDomain, isProdEnv } from '../config/backOptions.js'
import {
  getConf,
  getDefaultKey,
  getIdForCatalog,
  getIdForStorage,
  getKeyForCatalog,
  getKeyForStorage,
  getStorageUrl,
  MANAGER,
  STORAGE,
} from '../config/config.js'
import { dbGetUserRolesByUsername } from '../database/database.js'
import { ForbiddenError, RudiError } from './errors.js'
import { logE, logW } from './logger.js'
import { cleanErrMsg, timeEpochS, toInt } from './utils.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
const REGEX_JWT = /^[\w-]+\.[\w-]+\.([\w-]+={0,3})$/

const OFFSET_USR_ID = 5000
const DEFAULT_EXP = getConf('auth', 'exp_time_s') || 600

export const CONSOLE_TOKEN_NAME = 'consoleToken'
export const PM_FRONT_TOKEN_NAME = 'pmFrontToken'

export const ERR_401_MSG = 'User not found or incorrect password'

// -------------------------------------------------------------------------------------------------
// Functions
// -------------------------------------------------------------------------------------------------
function isJwtValid(jwt) {
  if (!jwt) return false
  const jwtParts = tokenStringToJwtObject(jwt)
  return jwtParts?.payload?.exp > timeEpochS()
}

export const extractCookieFromReq = (req, cookieName = CONSOLE_TOKEN_NAME) => req?.cookies?.[cookieName]

export function readJwtBody(jwt) {
  if (!jwt) throw new ForbiddenError(`No JWT provided`, mod, 'readJwtBody')
  if (!RegExp(REGEX_JWT).exec(`${jwt}`)) throw new ForbiddenError(`Wrong format for token ${jwt}`)
  return tokenStringToJwtObject(jwt)?.payload
}

// Constants
const SHOULD_SECURE = isProdEnv()

// Helper functions
export const getConsoleCookieOpts = (exp, overwrite) => ({
  secure: SHOULD_SECURE,
  httpOnly: SHOULD_SECURE,
  domain: getOptBackDomain(),
  path: '/', // Ensure the path covers all routes
  sameSite: 'Strict',
  expires: new Date(exp * 1000),
  overwrite,
})

export const getFrontCookieOpts = (exp, overwrite) => ({
  secure: SHOULD_SECURE,
  httpOnly: false,
  domain: getOptBackDomain(),
  path: '/', // Ensure the path covers all routes
  sameSite: 'Strict',
  expires: new Date(exp * 1000),
  overwrite,
})

const JWT_SECRET = `${uuidv4()}${uuidv4()}`
export const jwtSecretKey = () => JWT_SECRET

const INIT_PWD_SECRET = `${uuidv4()}${uuidv4()}`
export const initPwdSecret = () => INIT_PWD_SECRET

export function createFrontUserTokens(userInfo) {
  const fun = 'createFrontUserTokens'
  try {
    const exp = timeEpochS(toInt(DEFAULT_EXP))
    delete userInfo?.password
    const { username, roles } = { ...userInfo }
    return {
      [CONSOLE_TOKEN_NAME]: sign({ user: userInfo, roles, exp }, JWT_SECRET),
      [PM_FRONT_TOKEN_NAME]: sign({ username, roles, exp }, JWT_SECRET),
      exp,
    }
  } catch (err) {
    logW(mod, `${fun}.err`, cleanErrMsg(err))
    throw err
  }
}

function refreshTokens(req) {
  const fun = 'refreshTokens'
  const user = req.user
  if (!user) {
    logW(mod, fun, 'No user found in req')
    return
  }
  // log.sysInfo(mod, fun, `Refreshing tokens for user '${user.username}'`)
  try {
    const { consoleToken, pmFrontToken, exp } = createFrontUserTokens(user)
    return {
      [CONSOLE_TOKEN_NAME]: { jwt: consoleToken, opts: getConsoleCookieOpts(exp, true) },
      [PM_FRONT_TOKEN_NAME]: { jwt: pmFrontToken, opts: getFrontCookieOpts(exp, true) },
    }
  } catch (err) {
    logW(mod, `${fun}.err`, cleanErrMsg(err))
    throw err
  }
}

export const login = async (req, reply, user) => {
  const fun = 'login'
  if (!user) return reply.status(401).send(ERR_401_MSG)
  try {
    const username = user.username
    const roles = await dbGetUserRolesByUsername(null, username) // NO SONAR
    if (!roles?.length) {
      const errMsg = `Admin validation is required for this user: '${user.username}'`
      logW(mod, fun, errMsg)
      return logout(req, reply, errMsg)
    }

    req.login(user, { session: false }, async (err) => {
      if (err) return reply.status(400).json({ errors: err })
      user.roles = roles
      const { consoleToken, pmFrontToken, exp } = createFrontUserTokens(user)

      // sameSite: 'Lax' ?
      return reply
        .status(200)
        .cookie(CONSOLE_TOKEN_NAME, consoleToken, getConsoleCookieOpts(exp))
        .cookie(PM_FRONT_TOKEN_NAME, pmFrontToken, getFrontCookieOpts(exp))
        .json({ username, roles })
    })
  } catch (er) {
    logE(mod, fun, er)
    logout()
    return reply.status(er?.statusCode || 501).send(er)
  }
}

export const logout = (req, reply, msg) =>
  reply
    .status(msg ? 401 : 200)
    .cookie(CONSOLE_TOKEN_NAME, '', getConsoleCookieOpts(0))
    .cookie(PM_FRONT_TOKEN_NAME, '', getFrontCookieOpts(0))
    .json({ [CONSOLE_TOKEN_NAME]: '', [PM_FRONT_TOKEN_NAME]: '', message: msg || 'logout' })

export function sendJsonAndTokens(req, reply, data) {
  const fun = 'sendJsonAndTokens'
  try {
    const { consoleToken, pmFrontToken } = refreshTokens(req)
    reply
      .status(200)
      .cookie(CONSOLE_TOKEN_NAME, consoleToken.jwt, consoleToken.opts)
      .cookie(PM_FRONT_TOKEN_NAME, pmFrontToken.jwt, pmFrontToken.opts)
      .json(data)
  } catch (err) {
    logW(mod, `${fun}.err`, cleanErrMsg(err))
    logout()
  }
}

// eslint-disable-next-line complexity
export async function getTokenFromMediaForUser(user) {
  const fun = 'getTokenFromMediaForUser'
  const pmHeaders = getStorageHeaders()

  const delegationBody = {
    user_id: user.id,
    user_name: user.username || 'rudi_console',
    group_name: getConf('rudi_console', 'default_client_group'),
  }
  // Let's offset the user id to not mess with Storage ids
  if (delegationBody.user_id < OFFSET_USR_ID) delegationBody.user_id += OFFSET_USR_ID
  // console.trace(`T (${fun})`, 'delegationBody', delegationBody)

  const mediaForgeJwtUrl = getStorageUrl('jwt/forge')
  try {
    const mediaRes = await axios.post(mediaForgeJwtUrl, delegationBody, pmHeaders)
    if (!mediaRes) throw Error(`No answer received from ${STORAGE} module`)
    if (!mediaRes?.data?.token)
      throw new Error(`Unexpected response from ${STORAGE} while forging a token: ${mediaRes.data}`)
    else return mediaRes.data.token
  } catch (err) {
    if (err.code === 'ECONNREFUSED')
      throw RudiError.createRudiHttpError(
        500,
        `Connection from “${MANAGER}” to “${STORAGE}” module failed: ` +
          '“RUDI Media” module is apparently down, contact the RUDI node admin'
      )
    const rudiError = RudiError.createRudiHttpError(
      err.response?.data?.statusCode || err.response?.status,
      `Could not forge a token for user '${user.username}' on ${STORAGE}: ${cleanErrMsg(
        err.response?.data?.message || err.response?.data?.msg || err.message || err.response?.data
      )}`,
      mod,
      fun
    )

    logE(mod, fun, `Could not forge a token on ${STORAGE}: ${rudiError}`)
    throw rudiError
  }
}

export function createPmJwtForMedia(body) {
  return forgeToken(
    getPrvKey('storage'),
    {},
    {
      jti: body?.jti || uuidv4(),
      iat: timeEpochS(),
      exp: body?.exp || timeEpochS(body?.exp_time || DEFAULT_EXP),
      sub: body?.sub || 'auth',
      client_id: body?.client_id || getIdForStorage(),
    }
  )
}

let _cachedStorageJwt
export function getStorageJwt(body) {
  if (!isJwtValid(_cachedStorageJwt)) _cachedStorageJwt = createPmJwtForMedia(body)
  return _cachedStorageJwt
}

export const createPmHeadersForMedia = (body) => ({
  headers: { Authorization: `Bearer ${createPmJwtForMedia(body)}`, Accept: 'application/json, text/plain, */*' },
})

let _cachedStorageHeaders
export function getStorageHeaders(body) {
  if (!isJwtValid(_cachedStorageJwt)) _cachedStorageHeaders = createPmHeadersForMedia(body)
  return _cachedStorageHeaders
}

let _cachedApiJwt
export function getCatalogJwt() {
  if (!isJwtValid(_cachedApiJwt)) {
    _cachedApiJwt = forgeToken(
      getPrvKey('catalog'),
      {},
      {
        exp: timeEpochS(60), // 1 minute to reach the API should be plenty enough
        sub: getIdForCatalog(),
        req_mtd: 'all',
        req_url: 'all',
      }
    )
  }
  return _cachedApiJwt
}

export const getCatalogHeaders = (headersEntries) => ({
  headers: {
    Authorization: `Bearer ${getCatalogJwt()}`,
    Accept: 'application/json, text/plain, */*',
    ...headersEntries,
  },
})

let cachedUrlJwt = {}
export function getCatalogJwtPrecise(url, req) {
  if (isJwtValid(cachedUrlJwt?.[url])) return cachedUrlJwt[url]
  cachedUrlJwt[url] = forgeToken(
    getPrvKey('catalog'),
    {},
    {
      exp: timeEpochS(60), // 1 minute to reach the API should be plenty enough
      sub: getIdForCatalog(),
      req_mtd: req.method,
      req_url: axios.getUri({ url, params: req.query }),
    }
  )
  return cachedUrlJwt[url]
}

/**
 * Shortcut to call a key by name
 * @param {*} name
 * @return {string} path to the key
 */
const getKeyPath = (name) => {
  switch (name) {
    case 'api':
    case 'catalog':
      return getKeyForCatalog()
    case 'media':
    case 'storage':
      return getKeyForStorage()
    default:
      return getDefaultKey()
  }
}

const prvKeyCache = {}

/**
 * Access to local private keys
 * @param {string} name
 * @return {object} the private key
 */
const getPrvKey = (name) => {
  // Shortcuts
  switch (name) {
    case 'catalog':
    case 'catalog_key':
    case 'api':
    case 'api_key':
    case 'pm_api_key':
      name = 'catalog'
      break
    case 'storage':
    case 'storage_key':
    case 'media':
    case 'media_key':
    case 'pm_media_key':
      name = 'storage'
      break
    default:
      name = 'auth'
  }
  // If PEM is cached, let's return it
  if (prvKeyCache[name]) return prvKeyCache[name]
  const keyPath = getKeyPath(name)
  // log.d(mod, fun, `keyPath (${name}}: ${keyPath}`)
  prvKeyCache[name] = readPrivateKeyFile(keyPath)
  return prvKeyCache[name]
}
