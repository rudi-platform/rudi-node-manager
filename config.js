const fs = require('fs');
const ini = require('ini');
let configFile;
let customExist;
try {
  customExist = fs.statSync('./rudi_console_proxy_custom.ini').isFile();
} catch (error) {
  customExist = false;
}
/* TODO IMPROVE (surcharge champs par champs) */
if (customExist) {
  configFile = './rudi_console_proxy_custom.ini';
} else {
  configFile = './rudi_console_proxy.ini';
};
const config = ini.parse(fs.readFileSync(configFile, 'utf-8')); ;


module.exports = config;
