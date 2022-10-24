const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const jwtLib = require(`@aqmo.org/jwt_lib`);

const { getConf } = require('../config/config');
const { timeEpochS, toInt } = require('./utils');
const log = require('./logger');
const { ForbiddenError, RudiError } = require('./errors');


const mod = 'jwt';

const OFFSET_USR_ID = 5000;

exports.CONSOLE_TOKEN = 'consoleToken';
exports.PM_FRONT_TOKEN = 'pmFrontToken';
exports.MEDIA_TOKEN = 'mediaToken';
exports.PM_MEDIA_TOKEN = 'mediaManagerToken';

const MEDIA_AUTH = getConf('rudi_media');

exports.extractCookieFromReq = (req, cookieName = CONSOLE_TOKEN) =>
  req?.cookies ? req.cookies[cookieName] : null;

exports.extractJwtFromReq = (req) => {
  const fun = 'extractJwtFromReq';
  const headers = req?.headers || req?.Headers;
  const auth = headers?.Authorization || headers?.authorization;
  if (!auth) {
    log.d(mod, fun, `headers: ${headers}`);
    throw new ForbiddenError('No Authorization found in request headers');
  }
  if (!auth.startsWith('Bearer ')) return new ForbiddenError('Request should use a JWT');

  const token = auth.substring(7);
  if (token.length === 0) return new ForbiddenError('Request provided an empty JWT');
  return token;
};

const REGEX_JWT = /^[\w-]+\.[\w-]+\.([\w-]+={0,3})$/;

exports.readJwtBody = (jwt) => {
  if (!jwt) throw new ForbiddenError(`No JWT provided`, mod, 'readJwtBody');
  if (!`${jwt}`.match(REGEX_JWT)) throw new ForbiddenError(`Wrong format for token ${jwt}`);
  return jwtLib.tokenStringToJwtObject(jwt)?.payload;
};

const AUTH_CONF = getConf('auth');
exports.createFrontUserTokens = async (user) => {
  const exp = timeEpochS(toInt(getConf('auth', 'exp_time_s')));
  delete user.password;
  return {
    [this.CONSOLE_TOKEN]: jwt.sign({ user: user, exp }, AUTH_CONF.secret_key_jwt),
    [this.PM_FRONT_TOKEN]: jwt.sign({ exp }, AUTH_CONF.secret_key_jwt),
    exp,
  };
};

exports.getTokenFromMediaForUser = async (user, exp) => {
  const fun = 'getTokenFromMediaForUser';
  const pmHeadersJwt = this.createPmHeadersJwtForMedia(exp ? { exp } : null);
  console.log('T (getTokenFromMediaForUser) pmHeadersJwt', pmHeadersJwt);
  const opts = {
    headers: {
      Authorization: `Bearer ${pmHeadersJwt}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  const delegationBody = {
    user_id: user.id,
    user_name: user.username || 'rudiconsole',
    group_name: MEDIA_AUTH.default_client_group,
  };
  // Let's offset the user id to not mess with Media ids
  if (delegationBody.user_id < OFFSET_USR_ID) delegationBody.user_id += OFFSET_USR_ID;
  // console.log('T (getTokenFromMediaForUser) delegationBody', delegationBody);

  const mediaForgeJwtUrl = `${MEDIA_AUTH.rudi_media_url}/jwt/forge`;
  // console.log('T (getTokenFromMediaForUser) mediaForgeJwtUrl', mediaForgeJwtUrl);
  // console.log('T (getTokenFromMediaForUser) opts', opts);
  try {
    const mediaRes = await axios.post(mediaForgeJwtUrl, delegationBody, opts);
    if (!mediaRes) throw Error(`No answer received from Media module`);
    if (!mediaRes?.data?.token)
      throw new Error(`Unexpected response from Media while forging a token: ${mediaRes.data}`);
    else return mediaRes.data.token;
  } catch (err) {
    console.error(
      'T (getTokenFromMediaForUser) mediaError.msg/data',
      err.message,
      err.response?.data,
    );
    const rudiError = RudiError.createRudiHttpError(
      err.response?.data?.statusCode || err.response?.status,
      `Could not forge a token for user '${user.username}' on Media: ${
        err.response?.data?.message || err.response?.data || err.message
      }`,
      mod,
      fun,
    );

    log.e(mod, fun, `Could not forge a token on Media: ${rudiError}`);
    throw rudiError;
  }
};

exports.createPmHeadersJwtForMedia = (body) =>
  jwtLib.forgeToken(
    getPrvKey('media'),
    {},
    {
      jti: body?.jti || uuidv4(),
      iat: timeEpochS(),
      exp: body?.exp || timeEpochS(body?.exp_time || AUTH_CONF.exp_time_s),
      sub: body?.sub || 'auth',
      client_id: body?.client_id || getConf('rudi_media', 'pm_media_id') || 'rudimanager',
    },
  );

/**
 *
 * @param {Object} jwtPayload optional options to create the JWT payload
 *  - exp: Epoch date in seconds until which the JWt is valid
 *  - exp_time: time in seconds during which the JWT is valid
 *              (not taken into account if 'exp' is given)
 *  - user_name: name of the user
 *  - user_id: id of the user
 *    (shifted here with an offset of 5000 to ensure compatibility with media)
 * @return {String} a JWT
 */
exports.createRudiMediaToken = (jwtPayload) =>
  jwtLib.forgeToken(
    getPrvKey('media'),
    {},
    {
      jti: uuidv4(),
      iat: timeEpochS(),
      exp:
        jwtPayload?.exp ||
        timeEpochS(jwtPayload?.exp_time || MEDIA_AUTH.exp_time_s || AUTH_CONF.exp_time_s),
      sub: jwtPayload?.sub || 'auth',
      client_id: jwtPayload.client_id || MEDIA_AUTH.pm_media_id,
    },
  );

exports.createRudiApiToken = (url, req) =>
  jwtLib.forgeToken(
    getPrvKey('api'),
    {},
    {
      exp: timeEpochS(60), // 1 minute to reach the API should be plenty enough
      sub: getConf('rudi_api', 'pm_api_id'),
      req_mtd: req.method,
      req_url: axios.getUri({ url, params: req.query }),
    },
  );

/**
 * Shortcut to call a key by name
 * @param {*} name
 * @return {string} path to the key
 */
const getKeyPath = (name) => {
  switch (name) {
    case 'api':
      return getConf('rudi_api', 'pm_api_key') || getConf('auth', 'pm_prv_key');
    case 'media':
      return getConf('rudi_media', 'pm_media_key') || getConf('auth', 'pm_prv_key');
    default:
      return getConf('auth', 'pm_prv_key');
  }
};

const prvKeyCache = {};

/**
 * Access to local private keys
 * @param {string} name
 * @return {object} the private key
 */
const getPrvKey = (name) => {
  // Shortcuts
  switch (name) {
    case 'api':
    case 'api_key':
    case 'pm_api_key':
      name = 'api';
      break;
    case 'media':
    case 'media_key':
    case 'pm_media_key':
      name = 'media';
      break;
    default:
      name = 'auth';
  }
  // If PEM is cached, let's return it
  if (prvKeyCache[name]) return prvKeyCache[name];
  const keyPath = getKeyPath(name);
  prvKeyCache[name] = jwtLib.readPrivateKeyFile(keyPath);
  return prvKeyCache[name];
};
