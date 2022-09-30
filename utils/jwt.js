const jwt = require('jsonwebtoken');
const config = require('../config/config');
const fs = require('fs');
const { parsePrivateKey } = require('sshpk');
const axios = require('axios');
const { toBase64url, convertEncoding, nowEpochS } = require('./utils');
const { v4: uuidv4 } = require('uuid');

const KTYP = 'ktyp';
const PRVK = 'prvk';

exports.CONSOLE_TOKEN = 'consoleToken';
exports.PM_FRONT_TOKEN = 'pmFrontToken';
exports.MEDIA_TOKEN = 'mediaToken';

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

exports.createUserToken = (user) => {
  const exp = nowEpochS() + parseInt(config.auth.exp_time_s);
  const body = { id: user.id, username: user.username };
  return {
    consoleToken: jwt.sign({ user: body, exp }, config.auth.secret_key_JWT),
    pmFrontToken: jwt.sign({ exp }, config.auth.secret_key_JWT),
    mediaToken: this.createRudiMediaToken({ exp: exp, user_id: user.id, user_name: user.username }),
    exp: exp,
  };
};

/**
 *
 * @param {Object} jwtPayload optional options to create the JWT payload
 *  - exp_time: time in seconds during which the JWt is valid
 *  -
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
      iat: nowEpochS(),
      exp: jwtPayload?.exp || nowEpochS() + (jwtPayload?.exp_time || config.auth.exp_time_s),
      client_id: config.media_auth.manager_id,
      group: 'auth',
      user_id: config.media_auth.user_id,
      group_id: config.media_auth.group_id,
      xattr: {
        name: jwtPayload?.user_name || 'rudiconsole',
      },
    };
    if (jwtPayload?.user_id) body.xattr.uuid = jwtPayload.user_id;

    return this.createJwt(jwtHeader, body, keyInfo);
  } catch (err) {
    throw err;
  }
};

exports.createRudiApiToken = (jwtPayload) => {
  try {
    // Building the JWT header
    const keyInfo = getKeyInfo('api');
    const jwtHeader = { typ: 'JWT', alg: this.getJwtAlgo(keyInfo[KTYP]) };

    const body = {
      exp: nowEpochS() + 60, // 1 minute to reach the API should be plenty enough
      sub: config.API_RUDI.manager_id,
      client_id: jwtPayload.req.user && jwtPayload.req.user.id,
      req_mtd: jwtPayload.methode || jwtPayload.req.method,
      req_url: axios.getUri({ url: jwtPayload.url, params: jwtPayload.req.query }),
    };

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

  // Building the final JWT
  const jwt = data + '.' + signatureBase64url;
  return jwt;
};

/**
 * Returns both the private key and the algo
 * @param {String} name of the key ('api' | 'media')
 * @return {*} key info
 */
function getKeyInfo(name) {
  try {
    // Extracting the private key
    const prvKeyPem = fs.readFileSync(config.API_RUDI[name] || config.API_RUDI.RUDI_key, 'ascii');
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
