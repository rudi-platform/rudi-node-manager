const config = require('../config/config');

exports.getHash = (req, res, next) => {
  try {
    let hashId = process.env.RUDI_PROD_MANAGER_GIT_REV;
    if (!hashId)
      try {
        hashId = require('child_process').execSync('git rev-parse --short HEAD');
      } catch (err) {
        throw err;
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
