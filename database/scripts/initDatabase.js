const mod = 'initDb';

// ---- External dependencies -----
const fs = require('fs');

// ---- Internal dependencies -----
const { getDbConf } = require('../../config/config');
const { registerUser } = require('../../controllers/authControllerPassport');
const log = require('../../utils/logger');
const { decodeBase64 } = require('../../utils/utils');
const dbManager = require('../database');
const initDefaultFormTable = require('./initDefaultForm');

const USER_ID_START_VALUE = 6000;

// ---- Constants -----
const initialRoles = [
  { role: 'SuperAdmin', desc: 'a tous les droits' },
  { role: 'Admin', desc: 'administration, création et validation des comptes' },
  { role: 'Moniteur', desc: 'accès au monitoring' },
  { role: 'Gestionnaire', desc: 'gestion avancée des métadonnées' },
  { role: 'Créateur', desc: 'gestion simple des métadonnées' },
];

const sqlGet = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;
const sqlCreateRoleTable =
  `CREATE TABLE IF NOT EXISTS ${dbManager.TBL_ROLES} ` +
  `(role TEXT PRIMARY KEY NOT NULL UNIQUE,desc TEXT);`;

const sqlCreateUserTable =
  `CREATE TABLE IF NOT EXISTS ${dbManager.TBL_USERS} (` +
  `id INTEGER PRIMARY KEY AUTOINCREMENT=${USER_ID_START_VALUE},` +
  `username TEXT NOT NULL UNIQUE,` +
  `password TEXT NOT NULL,email TEXT);`;

const sqlCreateUserRoleTable =
  `CREATE TABLE IF NOT EXISTS ${dbManager.TBL_USER_ROLES} (userId INTEGER, role TEXT, PRIMARY KEY(userId,role),` +
  `CONSTRAINT Roles_fk_user_Id FOREIGN KEY (userId) REFERENCES ${dbManager.TBL_USERS}(id) ` +
  `ON UPDATE CASCADE ON DELETE CASCADE,` +
  `CONSTRAINT Roles_fk_role FOREIGN KEY (role) REFERENCES ${dbManager.TBL_ROLES}(role) ` +
  `ON UPDATE CASCADE ON DELETE CASCADE);`;

// ---- Functions -----
const initTable = (tableName, sqlCreateReq, initializeTable) => {
  const fun = 'initTable';
  const db = dbManager.open();
  db.get(sqlGet, [tableName], (err, row) => {
    if (err) {
      // log.e(mod, `${fun}.${tableName}.get`, err.message);
      dbManager.close(db);
    } else {
      // log.i(mod, `${fun}.${tableName}.get`, row);
      if (!row) {
        db.run(sqlCreateReq, (err) => {
          if (err) {
            log.e(mod, `${fun}.${tableName}.create`, err.message);
          } else {
            log.i(
              mod,
              `${fun}.${tableName}.create`,
              `Table Created : ${tableName}`,
              log.getContext(null, { opType: `init_table_${tableName}`.toLowerCase() }),
            );
          }
          initializeTable();
          dbManager.close(db);
        });
      } else {
        dbManager.close(db);
      }
    }
  });
};

const initializeRoles = () => dbManager.createRoles(initialRoles);
const initRolesTable = () =>
  initTable(dbManager.TBL_ROLES, sqlCreateRoleTable, () => initializeRoles);
const initUsersTable = () => initTable(dbManager.TBL_USERS, sqlCreateUserTable, () => {});

const createSuperUser = async () => {
  const fun = 'createSuperUser';

  if (!getDbConf('db_su_usr') || !getDbConf('db_su_pwd')) {
    log.d(mod, fun, 'No super user config was found');
    return;
  }

  const suName = getDbConf('db_su_usr');
  if (await dbManager.existsUser(suName)) {
    // log.d(mod, fun, `Super user '${suName}' already exists`);
    return;
  }
  const suPwd = decodeBase64(getDbConf('db_su_pwd'));
  const superUser = {
    username: suName,
    password: suPwd,
    email: 'security@rudi-univ-rennes1.fr',
    role: 'SuperAdmin',
  };

  const res = await registerUser(superUser);
  const { id, username } = res;
  await dbManager.createUserRole({ userId: id, role: superUser.role });
  log.i(mod, fun, `Super user created: '${username}' (id ${id})`);
};

const initUserRolesTable = () =>
  initTable(dbManager.TBL_USER_ROLES, sqlCreateUserRoleTable, () => {});

exports.initDatabase = async () => {
  const fun = 'initDatabase';
  try {
    fs.statSync(getDbConf('db_directory')).isDirectory();

    const db = dbManager.openOrCreateDB();
    dbManager.close(db);
    initRolesTable();
    initUserRolesTable();
    await dbManager.normalizeUserTableName();
    initUsersTable();
    await createSuperUser();
    initDefaultFormTable.initDefaultFormTable();
  } catch (error) {
    log.e(mod, fun, error);
    throw error;
  }
};
