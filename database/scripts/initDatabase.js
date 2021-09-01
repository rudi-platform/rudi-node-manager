const databaseManager = require('../database');
const config = require('../../config/config');
const initUsersTable = require('./initUsersTable');
const initRolesTable = require('./initRoles');
const fs = require('fs');

exports.initDatabase = () => {
  try {
    fs.statSync(config.database.db_directory).isDirectory();
    const db = databaseManager.openOrCreateDB();
    initUsersTable.initUsersTable(db);
    initRolesTable.initRolesTable(db);
    initRolesTable.initUserRolesTable(db);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
