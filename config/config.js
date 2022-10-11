const fs = require('fs');
const ini = require('ini');
const { getBackOptions, OPT_USER_CONF } = require('./backOptions');
const defaultConfigFile = './rudi_console_proxy.ini';
const customConfigFile = getBackOptions(OPT_USER_CONF, './rudi_console_proxy_custom.ini');
let customExist;
let customConfig;
try {
  customExist = fs.statSync(customConfigFile).isFile();
} catch (error) {
  customExist = false;
}

const config = ini.parse(fs.readFileSync(defaultConfigFile, 'utf-8'));
const CONF_PARAMS = {
  server: ['listening_address', 'listening_port'],
  auth: ['secret_key_JWT', 'exp_time_s'],
  security: ['trusted_domain'],
  API_RUDI: ['listening_address', 'admin_api', 'media_api', 'RUDI_key', 'api_key', 'manager_id'],
  rudi_media: [
    'media_url',
    'media_key',
    'manager_id',
    'user_id',
    'group_id',
    'default_client_group',
    'exp_time_s',
  ],
  formulaire: ['base_url'],
  database: ['db_directory', 'db_filename', 'db_su_usr', 'db_su_pwd'],
  logging: ['log_dir', 'app_name', 'debug'],
  syslog: [
    'syslog_level',
    'syslog_host',
    'syslog_port',
    'syslog_facility',
    'syslog_protocol',
    'syslog_type',
    'syslog_socket',
    'syslog_node_name',
    'syslog_dir',
  ],
};
if (customExist) {
  customConfig = ini.parse(fs.readFileSync(customConfigFile, 'utf-8'));

  // eslint-disable-next-line guard-for-in
  for (const section in CONF_PARAMS) {
    console.log('CONF', section);
    const sectionParams = customConfig[section];
    if (sectionParams) {
      if (!config[section]) config[section] = {};
      for (const param of CONF_PARAMS[section]) {
        // console.log('CONF', param);
        if (sectionParams[param]) config[section][param] = sectionParams[param];
      }
    }
  }
}
if (config.logging.debug) console.log(config);

module.exports = config;
