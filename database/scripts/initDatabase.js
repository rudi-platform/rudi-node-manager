const mod = 'initDb'

// ---- External dependencies -----
const fs = require('fs')

// ---- Internal dependencies -----
const { getDbConf } = require('../../config/config')
const { decodeBase64 } = require('../../utils/utils')
const log = require('../../utils/logger')
const { RudiError, statusOK } = require('../../utils/errors')

const {
  TBL_ROLES,
  TBL_USERS,
  TBL_USER_ROLES,
  dbCreateRoles,
  dbExistsUser,
  dbCreateUserRole,
  dbNormalizeUserTableName,
  dbOpenOrCreate,
  dbRegisterUser,
  dbClose,
  dbDeleteUserWithName,
} = require('../database')
const { dbInitDefaultFormTable } = require('./initDefaultForm')

const USER_ID_START_VALUE = 6000

// ---- Constants -----
const initialRoles = [
  { role: 'SuperAdmin', desc: 'a tous les droits' },
  { role: 'Admin', desc: 'administration, création et validation des comptes' },
  { role: 'Moniteur', desc: 'accès au monitoring' },
  { role: 'Gestionnaire', desc: 'gestion avancée des métadonnées' },
  { role: 'Createur', desc: 'gestion simple des métadonnées' },
]

const sqlGet = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
const sqlCreateRoleTable =
  `CREATE TABLE IF NOT EXISTS ${TBL_ROLES} ` + `(role TEXT PRIMARY KEY NOT NULL UNIQUE,desc TEXT);`

const sqlCreateUserTable =
  `CREATE TABLE IF NOT EXISTS ${TBL_USERS} (` +
  `id INTEGER PRIMARY KEY AUTOINCREMENT,` +
  `username TEXT NOT NULL UNIQUE,` +
  `password TEXT NOT NULL,email TEXT);`

const sqlCreateUserRoleTable =
  `CREATE TABLE IF NOT EXISTS ${TBL_USER_ROLES} (userId INTEGER, role TEXT, PRIMARY KEY(userId,role),` +
  `CONSTRAINT Roles_fk_user_Id FOREIGN KEY (userId) REFERENCES ${TBL_USERS}(id) ` +
  `ON UPDATE CASCADE ON DELETE CASCADE,` +
  `CONSTRAINT Roles_fk_role FOREIGN KEY (role) REFERENCES ${TBL_ROLES}(role) ` +
  `ON UPDATE CASCADE ON DELETE CASCADE);`

// ---- Functions -----
const initTable = (openedDb, tableName, sqlCreateReq, initializeTable) => {
  const fun = 'initTable'
  const db = openedDb || open()
  // console.log('T (initTable) db:', tableName);
  return new Promise((resolve, reject) => {
    db.get(sqlGet, [tableName], (err, row) => {
      if (err) {
        if (!openedDb) close(db)
        return reject(err)
        // log.e(mod, `${fun}.${tableName}.get`, err.message);
      }
      // log.i(mod, `${fun}.${tableName}.get`, row);
      if (row) {
        if (!openedDb) close(db)
        return resolve({ status: `Table exists: '${tableName}'` })
      }
      db.run(sqlCreateReq, (err) => {
        if (err) {
          if (!openedDb) close(db)
          log.e(mod, `${fun}.${tableName}.create`, err.message)
          return reject(err)
        }
        log.i(
          mod,
          `${fun}.${tableName}.create`,
          `Table Created : ${tableName}`,
          log.getContext(null, { opType: `init_table_${tableName}`.toLowerCase() })
        )
        if (!!initializeTable) {
          initializeTable(db)
            .then((res) => {
              if (!openedDb) close(db)
              resolve(statusOK(`Table initialized: ${tableName}`))
            })
            .catch((err) => {
              if (!openedDb) close(db)
              log.e(mod, `${fun}.${tableName}.init`, err.message)
              reject(err)
            })
        } else {
          resolve(statusOK(`Table created: ${tableName}`))
        }
      })
    })
  })
}

const initRolesTable = (db) =>
  initTable(db, TBL_ROLES, sqlCreateRoleTable, (openedDb) => dbCreateRoles(openedDb, initialRoles))
const initUsersTable = async (db) => {
  await initTable(db, TBL_USERS, sqlCreateUserTable, async (openedDb) => {
    try {
      const dummyUserName = 'dummy'
      await dbRegisterUser(openedDb, {
        username: dummyUserName,
        email: 'x',
        password: 'x',
        id: USER_ID_START_VALUE,
      })
      await dbDeleteUserWithName(openedDb, dummyUserName)
    } catch (err) {
      log.e(mod, 'initUsersTable', err)
      throw err
    }
  })
}

const createSuperUser = async (db) => {
  const fun = 'createSuperUser'

  if (!getDbConf('db_su_usr') || !getDbConf('db_su_pwd')) {
    log.d(mod, fun, 'No super user config was found')
    return
  }

  const suName = getDbConf('db_su_usr')
  if (await dbExistsUser(db, suName)) {
    // log.d(mod, fun, `Super user '${suName}' already exists`);
    return
  }
  const suId = getDbConf('db_su_id') || 1

  const encodedSuPwd = getDbConf('db_su_pwd')
  // log.d(mod, fun, `Super user pwd: '${encodedSuPwd}'`);
  const suPwd = decodeBase64(encodedSuPwd)

  const superUser = {
    id: suId,
    username: suName,
    password: suPwd,
    email: 'security@rudi-univ-rennes1.fr',
    role: 'SuperAdmin',
  }

  const res = await dbRegisterUser(db, superUser)
  const { id, username } = res
  try {
    await dbCreateUserRole(db, { userId: id, role: superUser.role })
    log.i(mod, fun, `Super user created: '${username}' (id ${id})`)
  } catch (err) {
    log.e(mod, fun, `Error: ${err}`)
  }
}

const dbInitUserRolesTable = (db) => initTable(db, TBL_USER_ROLES, sqlCreateUserRoleTable)

exports.dbInitialize = async () => {
  const fun = 'dbInitialize'
  try {
    if (!fs.statSync(getDbConf('db_directory')).isDirectory())
      throw new RudiError(
        `Database folder not found: ${getDbConf('db_directory')}`,
        500,
        'Confif error'
      )

    const db = await dbOpenOrCreate()

    await initRolesTable(db)
    log.d(mod, fun, 'Table initialized: Roles')

    await dbInitUserRolesTable(db)
    log.d(mod, fun, 'Table initialized: UserRoles')

    await dbNormalizeUserTableName(db, 'totox')
    await dbNormalizeUserTableName(db, 'users')
    log.d(mod, fun, 'Table normalized: users')

    await initUsersTable(db)
    log.d(mod, fun, 'Table initialized: Users')

    await createSuperUser(db)
    log.d(mod, fun, 'User created: SU')

    await dbInitDefaultFormTable(db)
    log.d(mod, fun, 'Table initialized: DefaultForm')

    await dbClose(db)
    log.d(mod, fun, 'DB initialized')
  } catch (error) {
    log.e(mod, fun, error)
    throw error
  }
}
