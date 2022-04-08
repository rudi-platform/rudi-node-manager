const { getAppOptions, OPT_GIT_HASH } = require('../config/appOptions');
const config = require('../config/config');
const log = require('../utils/logger');
const mod = 'sysController';

exports.getHash = (req, res, next) => {
  try {
    const hashId = this.getHashFun();

    res.status(200).send(`${hashId}`.trim());
  } catch (err) {
    log.e('', '', err);
    log.sysError(mod, 'getHash', err, log.getContext(req, { opType: 'get_hash' }));
    throw err;
  }
};
exports.getHashFun = () => {
  const hashId = getAppOptions(OPT_GIT_HASH);
  try {
    return hashId ? hashId : require('child_process').execSync('git rev-parse --short HEAD');
  } catch (err) {
    throw err;
  }
};
exports.getFormUrl = (req, res, next) => {
  try {
    res.status(200).json(config.formulaire.base_url);
  } catch (err) {
    log.e('', '', err);
    log.sysError(mod, 'getFormUrl', err, log.getContext(req, { opType: 'get_formUrl' }));
    throw err;
  }
};
exports.getTest = (req, res, next) => {
  try {
    res.status(200).json('test');
  } catch (err) {
    log.e('', '', err);
    throw err;
  }
};
