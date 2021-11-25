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

  // Auth
  if (customConfig.auth && customConfig.auth.secret_key_JWT) {
    config.auth.secret_key_JWT = customConfig.auth.secret_key_JWT;
  }
  if (customConfig.auth && customConfig.auth.token_expire) {
    config.auth.token_expire = customConfig.auth.token_expire;
  }

  // Security
  if (customConfig.security && customConfig.security.trusted_domain) {
    config.security.trusted_domain = customConfig.security.trusted_domain;
  }

  // API_RUDI
  if (customConfig.API_RUDI && customConfig.API_RUDI.listening_address) {
    config.API_RUDI.listening_address = customConfig.API_RUDI.listening_address;
  }
  if (customConfig.API_RUDI && customConfig.API_RUDI.admin_api) {
    config.API_RUDI.admin_api = customConfig.API_RUDI.admin_api;
  }
  if (customConfig.API_RUDI && customConfig.API_RUDI.media_api) {
    config.API_RUDI.media_api = customConfig.API_RUDI.media_api;
  }
  if (customConfig.API_RUDI && customConfig.API_RUDI.RUDI_key) {
    config.API_RUDI.RUDI_key = customConfig.API_RUDI.RUDI_key;
  }
  if (customConfig.API_RUDI && customConfig.API_RUDI.manager_id) {
    config.API_RUDI.manager_id = customConfig.API_RUDI.manager_id;
  }

  // formulaire
  if (customConfig.formulaire && customConfig.formulaire.base_url) {
    config.formulaire.base_url = customConfig.formulaire.base_url;
  }

  // DATABASE
  if (customConfig.database && customConfig.database.db_directory) {
    config.database.db_directory = customConfig.database.db_directory;
  }

  // Systeme
}

module.exports = config;
