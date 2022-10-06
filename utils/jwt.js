const jwt = require('jsonwebtoken');
const config = require('../config/config');
const fs = require('fs');
const { parsePrivateKey } = require('sshpk');
const axios = require('axios');
const { toBase64url, convertEncoding, timeEpochS, toInt } = require('./utils');
const { v4: uuidv4 } = require('uuid');
const util = require('util');

const KTYP = 'ktyp';
const PRVK = 'prvk';
const OFFSET_USR_ID = 5000;

exports.CONSOLE_TOKEN = 'consoleToken';
exports.PM_FRONT_TOKEN = 'pmFrontToken';
exports.MEDIA_TOKEN = 'mediaToken';
exports.PM_MEDIA_TOKEN = 'mediaManagerToken';

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

exports.createUserTokens = (user, error, next) => {
  const exp = timeEpochS(toInt(config.auth.exp_time_s));
  const cbody = { id: user.id, username: user.username };
  const mbody = { client_id: config.media_auth.manager_id, sub: 'auth' };
  // console.log('T (createUserToken) payload', { user: body, exp });
  const PM_FRONT_TOKEN = jwt.sign({ exp }, config.auth.secret_key_JWT);
  const CONSOLE_TOKEN  = jwt.sign({ user: cbody, exp }, config.auth.secret_key_JWT);
  const PM_MEDIA_TOKEN = this.createRudiMediaToken({ user: mbody, exp });

  const delegationBody = {
      'user_id': user.id || OFFSET_USR_ID,
      'user_name': user.username || 'rudiconsole',
      'group_name': config.media_auth.default_client_group
  };
  if (delegationBody.user_id < OFFSET_USR_ID) delegationBody.user_id += OFFSET_USR_ID;
  //next(CONSOLE_TOKEN, PM_FRONT_TOKEN, '--', exp);
  //return ;

  const serveurMedia = `${config.API_RUDI.media_api}`;
  axios.post(serveurMedia + '/jwt/forge', delegationBody, {
      headers: { 'authorization': 'Bearer '+PM_MEDIA_TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/json' }
  }).then((resMEDIA) => {
      if (!resMEDIA.headers || !resMEDIA.headers.cookie) error('Unexpected response from Media while forging a token');
      else {
          const umc = resMEDIA.headers.cookie;
          const userMediaToken = umc.slice(umc.indexOf('=')+1);
          next(CONSOLE_TOKEN, PM_FRONT_TOKEN, userMediaToken, exp);
      }
  }) .catch((err) => {
      error('while forging a Media token: '+err);
  });
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
      exp: jwtPayload.exp || timeEpochS(jwtPayload?.exp_time || config.auth.exp_time_s),
      sub: jwtPayload.sub || 'auth',
      client_id: jwtPayload.client_id || config.media_auth.manager_id,
    };
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
      exp: timeEpochS(60), // 1 minute to reach the API should be plenty enough
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
