const { getConsoleFormUrl } = require('../config/config');
const log = require('../utils/logger');
const mod = 'sysController';

exports.getFormUrl = (req, res, next) => {
  try {
    res.status(200).send(getConsoleFormUrl());
  } catch (err) {
    log.e('', '', err);
    log.sysError(mod, 'getFormUrl', err, log.getContext(req, { opType: 'get_formUrl' }));
    throw err;
  }
};
exports.getTest = (req, res, next) => {
  try {
    res.status(200).send('test');
  } catch (err) {
    log.e('', '', err);
    throw err;
  }
};
