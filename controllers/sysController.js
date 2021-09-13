const config = require('../config/config');

exports.getHash = (req, res, next) => {
  try {
    let hashId;
    try {
      hashId = require('child_process').execSync('git rev-parse --short HEAD');
    } catch (err) {
      hashId = config.logging.revision;
    }

    res.status(200).send(`${hashId}`.trim());
  } catch (err) {
    console.log(err);
    throw err;
  }
};
exports.getFormUrl = (req, res, next) => {
  try {
    res.status(200).json(config.formulaire.base_url);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
exports.getTest = (req, res, next) => {
  try {
    res.status(200).json('test');
  } catch (err) {
    console.log(err);
    throw err;
  }
};
