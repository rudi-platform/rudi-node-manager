const fs = require('fs');
const ini = require('ini');
const defaultConfigFile = './rudi_console_proxy.ini';
const customConfigFile = './rudi_console_proxy_custom.ini';
let customExist;
let customConfig;
try {
  customExist = fs.statSync('./rudi_console_proxy_custom.ini').isFile();
} catch (error) {
  customExist = false;
}

const config = ini.parse(fs.readFileSync(defaultConfigFile, 'utf-8'));

if (customExist) {
  customConfig = ini.parse(fs.readFileSync(customConfigFile, 'utf-8'));
  if (customConfig.server && customConfig.server.listening_address) {
    config.server.listening_address = customConfig.server.listening_address;
  }
  if (customConfig.server && customConfig.server.listening_port) {
    config.server.listening_port = customConfig.server.listening_port;
  }
  if (customConfig.API_RUDI && customConfig.API_RUDI.listening_address) {
    config.API_RUDI.listening_address = customConfig.API_RUDI.listening_address;
  }
  if (customConfig.API_RUDI && customConfig.API_RUDI.admin_api) {
    config.API_RUDI.admin_api = customConfig.API_RUDI.admin_api;
  }
  if (customConfig.API_RUDI && customConfig.API_RUDI.media_api) {
    config.API_RUDI.media_api = customConfig.API_RUDI.media_api;
  }
  if (customConfig.formulaire && customConfig.formulaire.base_url) {
    config.formulaire.base_url = customConfig.formulaire.base_url;
  }


  // DATABASE
  // TODO
};

module.exports = config;
