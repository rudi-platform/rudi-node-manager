const { floor } = require('lodash');

// ---- Dates
exports.nowEpochMs = () => new Date().getTime();
exports.nowEpochS = () => floor(this.nowEpochMs() / 1000);

exports.nowFormatted = () => new Date().toISOString().replace(/T\./, ' ').replace('Z', '');

// ---- Strings

exports.toBase64url = (str) => this.convertEncoding(str, 'utf-8', 'base64url');

exports.convertEncoding = (data, fromEncoding, toEncoding) => {
  try {
    const dataStr = data;
    // if (typeof data === 'object') dataStr = JSON.stringify(data)
    return Buffer.from(dataStr, fromEncoding).toString(toEncoding);
  } catch (err) {
    throw err;
  }
};
