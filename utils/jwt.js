const fs = require('fs');
const jwt = require('jsonwebtoken');
const { parsePrivateKey } = require('sshpk');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const config = require('../config/config');
const { toBase64url, convertEncoding, timeEpochS, toInt, decodeBase64url } = require('./utils');
const log = require('./logger');
const errorHandler = require('../controllers/errorHandler');
const { ForbiddenError, BadRequestError, RudiError } = require('./errors');
const e = require('express');

const mod = 'jwt';

const KTYP = 'ktyp';
const PRVK = 'prvk';
const OFFSET_USR_ID = 5000;

exports.CONSOLE_TOKEN = 'consoleToken';
exports.PM_FRONT_TOKEN = 'pmFrontToken';
exports.MEDIA_TOKEN = 'mediaToken';
exports.PM_MEDIA_TOKEN = 'mediaManagerToken';

const MEDIA_AUTH = config.rudi_media;

/**
 * Retrieve the string that states which algorithm was used for the
 * private/public key pair.
 * see https://datatracker.ietf.org/doc/html/rfc7518#section-3.1
 * @param {String} algo
 * @return {String} Key algo
 */
exports.getJwtAlgo = (algo) => {
  try {
    switch (algo) {
      case 'ed25519':
      case 'EdDSA':
        return 'EdDSA';
      case 'HS256':
      case 'ES256':
      case 'RS256':
      case 'PS256':
      case 'HS512':
      case 'ES512':
      case 'RS512':
      case 'PS512':
        return algo;
      default:
        throw Error(`Algo not recognized: '${algo}'`);
    }
  } catch (err) {
    throw err;
  }
};

/**
 * Hash algo to be used to sign the JWT
 * @param {String} algo
 * @return {String} Hash algo
 */
exports.getHashAlgo = (algo) => {
  try {
    switch (algo) {
      case 'HS256':
      case 'RS256':
      case 'ES256':
      case 'PS256':
        return 'sha256';
      case 'ES512':
      case 'HS512':
      case 'RS512':
      case 'PS512':
      case 'ed25519':
      case 'EdDSA':
        return 'sha512';
      default:
        throw Error(`Algo not recognized: '${algo}'`);
    }
  } catch (err) {
    throw err;
  }
};

exports.extractCookieFromReq = (req, cookieName = CONSOLE_TOKEN) =>
  req?.cookies ? req.cookies[cookieName] : null;

exports.extractJwtFromReq = (req) => {
  const auth = req?.headers?.Authorization;
  if (!auth) throw new ForbiddenError('Forbidden: no Authorization found in request headers');
  if (!auth.startsWith('Bearer ')) return new BadRequestError('Request should use a JWT');

  const token = auth.substring(7);
  return token;
};

const REGEX_JWT = /^[\w-]+\.[\w-]+\.([\w-]+={0,3})$/;
exports.readJwtBody = (jwt) => {
  if (!`${jwt}`.match(REGEX_JWT)) throw new BadRequestError(`Wrong format for token ${jwt}`);
  const encodedBody = jwt.split('.')[1];
  const decodedBody = decodeBase64url(encodedBody);
  const parsedBody = JSON.parse(decodedBody);
  return parsedBody;
};

exports.createUserTokens = async (user) => {
  const exp = timeEpochS(toInt(config.auth.exp_time_s));
  return {
    [this.CONSOLE_TOKEN]: jwt.sign({ user: user, exp }, config.auth.secret_key_JWT),
    [this.PM_FRONT_TOKEN]: jwt.sign({ exp }, config.auth.secret_key_JWT),
    exp,
  };
};

exports.getTokenFromMediaForUser = async (user, exp) => {
  const fun = 'getTokenFromMediaForUser';
  const pmHeadersJwt = await this.createPmHeadersJwtForMedia(exp ? { exp } : null);
  // console.log('T (getTokenFromMediaForUser) pmHeadersJwt', pmHeadersJwt);
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

  const mediaForgeJwtUrl = `${MEDIA_AUTH.media_url}/jwt/forge`;
  // console.log('T (getTokenFromMediaForUser) mediaForgeJwtUrl', mediaForgeJwtUrl);
  // console.log('T (getTokenFromMediaForUser) opts', opts);
  try {
    const mediaRes = await axios.post(mediaForgeJwtUrl, delegationBody, opts);
    if (!mediaRes) throw Error(`No answer received from Media module`);
    if (!mediaRes?.data?.token)
      throw new Error(`Unexpected response from Media while forging a token: ${mediaRes.data}`);
    else return mediaRes.data.token;
  } catch (err) {
    console.log('T (getTokenFromMediaForUser) rudiError.code', err);
    const rudiError = RudiError.createRudiHttpError(
      err.response?.data?.statusCode || err.response?.status,
      `Could not forge a token for user '${user.username}' on Media: ${
        err.response?.data?.message || err.response?.data || err.message
      }`,
    );

    log.e(mod, fun, `Could not forge a token on Media: ${rudiError}`);
    throw rudiError;
  }
};

exports.createPmHeadersJwtForMedia = async (body) => {
  // Building the JWT header
  const keyInfo = getKeyInfo('media');
  const jwtHeader = { typ: 'JWT', alg: this.getJwtAlgo(keyInfo[KTYP]) };

  // console.log('T (createPmHeadersJwtForMedia) body', body);
  // Building the JWT body
  const jwtPayload = {
    jti: body?.jti || uuidv4(),
    iat: body?.iat || timeEpochS(),
    exp: body?.exp || timeEpochS(body?.exp_time || config.auth.exp_time_s),
    sub: body?.sub || 'auth',
    client_id: body?.client_id || 'rudimanager',
  };
  console.log('T (createPmHeadersJwtForMedia) exp', jwtPayload.exp);

  const jwt = this.createJwt(jwtHeader, jwtPayload, keyInfo);
  return jwt;
};

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
exports.createRudiMediaToken = (jwtPayload) => {
  try {
    // Building the JWT header
    const keyInfo = getKeyInfo('media');
    const jwtHeader = { typ: 'JWT', alg: this.getJwtAlgo(keyInfo[KTYP]) };

    // Building the JWT body
    const body = {
      jti: uuidv4(),
      iat: timeEpochS(),
      exp: jwtPayload?.exp || timeEpochS(jwtPayload?.exp_time || config.auth.exp_time_s),
      sub: jwtPayload?.sub || 'auth',
      client_id: jwtPayload.client_id || MEDIA_AUTH.manager_id,
    };
    return this.createJwt(jwtHeader, body, keyInfo);
  } catch (err) {
    throw err;
  }
};

exports.createRudiApiToken = (url, req) => {
  try {
    // Building the JWT header
    const keyInfo = getKeyInfo('api');
    const jwtHeader = { typ: 'JWT', alg: this.getJwtAlgo(keyInfo[KTYP]) };

    const body = {
      exp: timeEpochS(60), // 1 minute to reach the API should be plenty enough
      sub: config.API_RUDI.manager_id,
      req_mtd: req.method,
      req_url: axios.getUri({ url, params: req.query }),
    };
    if (req?.user?.id) body.client_id = req.user.id;

    return this.createJwt(jwtHeader, body, keyInfo);
  } catch (err) {
    throw err;
  }
};

exports.createJwt = (jwtHeader, jwtPayload, keyInfo) => {
  // Building the data to sign
  const headerBase64url = toBase64url(JSON.stringify(jwtHeader));
  const payloadBase64url = toBase64url(JSON.stringify(jwtPayload));
  const data = headerBase64url + '.' + payloadBase64url;

  // Building the JWT signature
  const keyType = keyInfo[KTYP];
  const prvKey = keyInfo[PRVK];
  const hashAlgo = this.getHashAlgo(keyType);

  const signBuffer = prvKey.createSign(hashAlgo);
  signBuffer.update(data);
  const signatureBase64 = signBuffer.sign();
  const signatureBase64url = convertEncoding(signatureBase64.toString(), 'base64', 'base64url');
  // log.d(mod, fun, `base64url signature: ${signatureBase64url}`)

  // Returning the final JWT
  // console.log('T (createJwt) final JWT',`${data}.${signatureBase64url}`)
  return `${data}.${signatureBase64url}`;
};

/**
 * Returns both the private key and the algo
 * @param {String} name of the key ('api' | 'media')
 * @return {*} key info
 */
function getKeyInfo(name) {
  try {
    // Extracting the private key
    let keyPath;
    switch (name) {
      case 'api':
      case 'api_key':
        keyPath = config.API_RUDI.api_key;
        break;
      case 'media':
      case 'media_key':
        keyPath = config.rudi_media.media_key;
        break;
      default:
        keyPath = config.API_RUDI.RUDI_key;
    }
    const prvKeyPem = fs.readFileSync(keyPath || config.API_RUDI.RUDI_key, 'ascii');
    const prvKey = parsePrivateKey(prvKeyPem);
    const keyType = prvKey.type;

    // Storing key info
    const keyInfos = {
      [KTYP]: keyType,
      [PRVK]: prvKey,
    };
    return keyInfos;
  } catch (err) {
    throw err;
  }
}
