const fs = require('fs');
const ini = require('ini');

const config = ini.parse(fs.readFileSync('./rudi_console_proxy.ini', 'utf-8'));

module.exports = config;
