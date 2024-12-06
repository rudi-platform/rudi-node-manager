/* eslint-disable no-console */
const mod = 'initDb'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { statSync } from 'fs'
import { dirname } from 'path'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { hashPassword } from '@aqmo.org/jwt-lib'
import { getOptSuCreds } from '../../config/backOptions.js'
import { getConfSuId, getConfSuMail, getConfSuName, getDbPath, setConfSuName } from '../../config/config.js'
import { decodeCredentials } from '../../controllers/authControllerPassport.js'
import { RudiError, statusOK } from '../../utils/errors.js'
import { getContext, logD, logE, logV, logW, sysInfo } from '../../utils/logger.js'
import { uuidv4 } from '../../utils/utils.js'
import {
  dbClose,
  dbCreateRoles,
  dbCreateUserCheckExists,
  dbDeleteUserWithId,
  dbGetRoles,
  dbGetUserById,
  dbGetUserRoles,
  dbGetUsers,
  dbOpen,
  dbOpenOrCreate,
  dbRegisterUser,
  dbUpdateUser,
  dbUpdateUserRoles,
  TBL_ROLES,
  TBL_USER_ROLES,
  TBL_USERS,
} from '../database.js'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
const USER_ID_START_VALUE = 6000

export const ROLE_SU = 'SuperAdmin'
export const ROLE_ADMIN = 'Admin'
export const ROLE_EDIT = 'Editeur'
export const ROLE_READ = 'Lecteur'
export const ROLE_ALL = 'All'

const initialRoles = [
  { role: ROLE_SU, desc: 'a tous les droits', hide: true },
  { role: ROLE_ADMIN, desc: 'administration, création et validation des comptes' },
  { role: 'Moniteur', desc: 'accès au monitoring', hide: true },
  { role: ROLE_EDIT, desc: 'édition et suppression des métadonnées' },
  { role: ROLE_READ, desc: 'lecture seule des métadonnées' },
]

const sqlGet = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
const sqlCreateRoleTable =
  `CREATE TABLE IF NOT EXISTS ${TBL_ROLES} (` +
  `role TEXT PRIMARY KEY NOT NULL UNIQUE,` +
  `desc TEXT,` +
  `hide INTEGER(1));`

const sqlCreateUserTable =
  `CREATE TABLE IF NOT EXISTS ${TBL_USERS} (` +
  `id INTEGER PRIMARY KEY AUTOINCREMENT,` +
  `username TEXT NOT NULL UNIQUE,` +
  `password TEXT NOT NULL,` +
  `email TEXT);`

const sqlCreateUserRoleTable =
  `CREATE TABLE IF NOT EXISTS ${TBL_USER_ROLES} (` +
  `userId INTEGER,` +
  `role TEXT,` +
  `PRIMARY KEY(userId,role),` +
  `CONSTRAINT Roles_fk_user_Id FOREIGN KEY (userId) REFERENCES ${TBL_USERS}(id) ` +
  `ON UPDATE CASCADE ON DELETE CASCADE,` +
  `CONSTRAINT Roles_fk_role FOREIGN KEY (role) REFERENCES ${TBL_ROLES}(role) ` +
  `ON UPDATE CASCADE ON DELETE CASCADE);`

// -------------------------------------------------------------------------------------------------
// Functions
// -------------------------------------------------------------------------------------------------
const dbInitTable = (openedDb, tableName, sqlCreateReq) => {
  const fun = 'initTable'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.get(sqlGet, [tableName], (err, row) => {
      if (err) {
        if (!openedDb) dbClose(db)
        return reject(err)
      }
      if (row) {
        if (!openedDb) dbClose(db)
        return resolve(statusOK(`Table exists: '${tableName}'`))
      }
      db.run(sqlCreateReq, (err) => {
        if (!openedDb) dbClose(db)
        if (err) {
          logE(mod, `${fun}.${tableName}.create`, err.message)
          return reject(err)
        }
        sysInfo(
          mod,
          `${fun}.${tableName}.create`,
          `Table Created : ${tableName}`,
          getContext(null, { opType: `init_table_${tableName}`.toLowerCase() })
        )
        return resolve(statusOK(`Table created: ${tableName}`))
      })
    })
  })
}

const dbNormalizeRoleTable = async (openedDb) => {
  const db = openedDb || dbOpen()
  await dbNormalizeRoleTableAddHide(db)
  await dbRenameRoles(db)
  await dbRenameUserRoles(db)
  if (!openedDb) dbClose(db)
}
const dbNormalizeRoleTableAddHide = (openedDb) => {
  const fun = 'dbNormalizeRoleTableAddHide'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${TBL_ROLES})`, (err, rows) => {
      if (err) {
        if (!openedDb) dbClose(db)
        logD(mod, `${fun}.pragma`, err.message)
        return reject(new RudiError(`RoleHide Pragma failed: ${err.message}`))
      }
      if (rows.find((row) => row.name === 'hide')) {
        if (!openedDb) dbClose(db)
        // log.d(mod, `${fun}`, `Column 'hide' exists`)
        return resolve(statusOK(`Column 'hide' exists`))
      }
      db.run(`ALTER TABLE ${TBL_ROLES} ADD hide INTEGER(1) DEFAULT 0`, (err) => {
        if (err) {
          if (!openedDb) dbClose(db)
          logD(mod, `${fun}.addHide`, err.message)
          return reject(err)
        }
        db.run(`UPDATE ${TBL_ROLES} SET hide=1 WHERE role='${ROLE_SU}' OR role='Moniteur' `, (err) => {
          if (err) {
            if (!openedDb) dbClose(db)
            logD(mod, `${fun}.setHideFlag`, err.message)
            return reject(err)
          }
          return resolve(statusOK(`Column 'hide added & role flags set`))
        })
      })
    })
  })
}
const dbRenameUserRoles = (openedDb) => {
  const fun = 'dbRenameUserRoles'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    dbGetUserRoles(db).then((roleList) => {
      const found = roleList.find(
        (roleDescPair) =>
          roleDescPair.role === 'Createur' || roleDescPair.role === 'Créateur' || roleDescPair.role === 'Gestionnaire'
      )
      if (!found) {
        if (!openedDb) dbClose(db)
        logD(mod, `${fun}`, `UserRoles already renamed`)
        return resolve(statusOK(`UserRoles already renamed`))
      }
      db.run(`UPDATE ${TBL_USER_ROLES} SET role='Lecteur' WHERE role='Createur' OR role='Créateur'`, (err) => {
        if (err) {
          if (!openedDb) dbClose(db)
          logD(mod, `${fun}.Lecteur`, err.message)
          return reject(new RudiError(`${fun}.Lecteur: ${err}`))
        }
        db.run(`UPDATE ${TBL_USER_ROLES} SET role='Editeur' WHERE role='Gestionnaire'`, (err) => {
          if (!openedDb) dbClose(db)
          if (err) {
            logD(mod, `${fun}.Editeur`, err.message)
            return reject(new RudiError(`${fun}.Editeur: ${err}`))
          }
          logD(mod, `${fun}`, `UserRoles renamed`)
          return resolve(statusOK(`UserRoles renamed`))
        })
      })
    })
  })
}
const dbRenameRoles = (openedDb) => {
  const fun = 'dbRenameRoles'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    dbGetRoles(db)
      .then((roleList) => {
        const found = roleList.find(
          (roleDescPair) =>
            roleDescPair.role === 'Createur' || roleDescPair.role === 'Créateur' || roleDescPair.role === 'Gestionnaire'
        )
        if (!found) {
          if (!openedDb) dbClose(db)
          logD(mod, `${fun}`, `Roles already renamed`)
          return resolve(statusOK(`Roles already renamed`))
        }
        db.run(
          `UPDATE ${TBL_ROLES} SET role='Lecteur', desc='lecture seule des métadonnées' WHERE role='Createur' OR role='Créateur'`,
          (err) => {
            if (err) {
              if (!openedDb) dbClose(db)
              logD(mod, `${fun}.Lecteur`, err.message)
              return reject(new RudiError(`${fun}.Lecteur: ${err}`))
            }
            db.run(
              `UPDATE ${TBL_ROLES} SET role='Editeur',desc='édition et suppression des métadonnées' WHERE role='Gestionnaire'`,
              (err) => {
                if (!openedDb) dbClose(db)
                if (err) {
                  logD(mod, `${fun}.Editeur`, err.message)
                  return reject(new RudiError(`${fun}.Editeur: ${err}`))
                }
                logD(mod, `${fun}`, `Roles renamed`)
                return resolve(statusOK(`Roles renamed`))
              }
            )
          }
        )
      })
      .catch((err) => {
        if (!openedDb) dbClose(db)
        reject(new RudiError(`RenameRoles.getRoles: ${err}`))
      })
  })
}

const dbNormalizeUserTableName = (openedDb, oldTblName) => {
  const fun = 'dbNormalizeUsersTableName'
  const tempName = `x${oldTblName}x`
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${oldTblName}'`, [], (err, row) => {
      if (err) {
        if (!openedDb) dbClose(db)
        logE(mod, `${fun}.check`, err.message)
        return reject(err)
      }
      if (!row) {
        if (!openedDb) dbClose(db)
        return resolve(`No table found with name '${oldTblName}'`)
      }
      logD(mod, `${fun}.check`, JSON.stringify(row))

      db.run(`ALTER TABLE '${oldTblName}' RENAME TO '${tempName}'`, [], (err, row) => {
        if (err) {
          if (!openedDb) dbClose(db)
          logE(mod, `${fun}.renameToto`, err.message)
          return reject(err)
        }
        logD(mod, `${fun}.renameToto`, JSON.stringify(row))
        db.run(`ALTER TABLE '${tempName}' RENAME TO '${TBL_USERS}'`, [], (err, row) => {
          if (!openedDb) dbClose(db)
          if (err) {
            logE(mod, `${fun}.renameReal`, err.message)
            reject(err)
          } else {
            logD(mod, fun, JSON.stringify(row))
            resolve('Users table name normalized')
          }
        })
      })
    })
  })
}

const dbNormalizeUserTableId = async (db) => {
  try {
    const dummyUserName = 'dummy'
    let dummyUsr = await dbGetUserById(db, USER_ID_START_VALUE)
    if (!dummyUsr)
      dummyUsr = await dbRegisterUser(
        db,
        {
          username: dummyUserName,
          email: 'x',
          password: 'x',
          id: USER_ID_START_VALUE,
        },
        true
      )
    if (dummyUsr?.username === dummyUserName) await dbDeleteUserWithId(db, USER_ID_START_VALUE, true)
    return statusOK(`Users table IDs normalized`)
  } catch (err) {
    logE(mod, 'dbNormalizeUsersTableId', err)
    throw err
  }
}

/**
 * Super User credentials were specified by the admin, we create or update the Super User in user DB
 * @param {*} db
 * @param {*} b64SuCreds
 * @returns
 */
const dbInitSuperUserWithCreds = async (db, b64SuCreds) => {
  const fun = 'dbInitSuperUserWithCreds'
  try {
    const [username, password] = decodeCredentials(b64SuCreds)
    setConfSuName(username)

    const id = getConfSuId()
    const email = getConfSuMail()
    const roles = [ROLE_SU]

    const suInfo = { id, username, password, email }
    const suRoleInfo = { userId: id, username, roles }

    const dbUsrInfo = await dbGetUserById(db, id) // NOSONAR
    if (dbUsrInfo) {
      // Super User already exists
      const msg = `Super User already exists for id ${id} (username: '${dbUsrInfo.username}', role: ${dbUsrInfo.roles}) => overwriting the Super User in user DB`
      logW(mod, fun, msg)
      await Promise.all([dbUpdateUser(db, suInfo), dbUpdateUserRoles(db, suRoleInfo)])
      logW(mod, fun, `Super user updated: '${username}' (id ${id}, role ${ROLE_SU})`)
    } else {
      // Super User does not exist
      logW(mod, fun, `Creating super user: '${username}' (id ${id})`)
      await dbCreateUserCheckExists(db, suInfo)
      await dbUpdateUserRoles(db, suRoleInfo)
      logW(mod, fun, `Super user created: '${username}' (id ${id}, role ${ROLE_SU})`)
    }
    return username
  } catch (error) {
    logE(mod, fun, error)
    throw error
  }
}

const dbCreateSuperUser = async (db) => {
  const fun = 'dbCreateSuperUser'
  try {
    const id = getConfSuId()
    const dbSuInfo = await dbGetUserById(db, id) // NOSONAR
    if (dbSuInfo) {
      logV(mod, fun, `Super User '${dbSuInfo.username}' exists in DB, no action required`)
      return
    }
    const username = getConfSuName()
    const email = getConfSuMail()
    const roles = [ROLE_SU]

    const clearPassword = uuidv4()
    const password = hashPassword(clearPassword)
    // const b64Password = encodeBase64url(clearPassword)

    const suInfo = { id, username, password, email }
    const suRoleInfo = { userId: id, username, roles }

    await dbCreateUserCheckExists(db, suInfo)
    await dbUpdateUserRoles(db, suRoleInfo)
    logW(mod, fun, `Super user created: '${username}' (id ${id}, role ${ROLE_SU})`)
    console.error('')
    console.error('=============================================================================')
    console.error(`==                                                                         ==`)
    console.error(`==             A PASSWORD WAS GENERATED FOR THE SUPER USER:                ==`)
    console.error(`==                                                                         ==`)
    console.error(`==                 ${clearPassword}                    ==`)
    console.error(`==                                                                         ==`)
    console.error('=============================================================================')
    console.error('')
  } catch (err) {
    logE(mod, fun, `Error: ${err}`)
  }
}

export async function dbInitialize() {
  const fun = 'dbInitialize'
  try {
    const DB_DIR = dirname(getDbPath())
    if (!statSync(DB_DIR).isDirectory())
      throw new RudiError(`Database folder not found: ${DB_DIR}`, 500, 'Config error')

    const db = await dbOpenOrCreate()

    const initRolesRes = await dbInitTable(db, TBL_ROLES, sqlCreateRoleTable)
    if (initRolesRes.message?.startsWith('Table created')) await dbCreateRoles(db, initialRoles)
    else await dbNormalizeRoleTable(db)
    logD(mod, fun, 'Table initialized: Roles')

    await dbInitTable(db, TBL_USER_ROLES, sqlCreateUserRoleTable)
    logD(mod, fun, 'Table initialized: UserRoles')

    await dbNormalizeUserTableName(db, 'x')
    await dbNormalizeUserTableName(db, 'users')
    logD(mod, fun, 'Table normalized: Users')

    await dbInitTable(db, TBL_USERS, sqlCreateUserTable)
    await dbNormalizeUserTableId(db)
    logD(mod, fun, 'Table initialized: Users')

    await checkSuperUser(db)

    await dbGetUsers(db)
    await dbGetUserRoles(db)
    await dbGetRoles(db)
    dbClose(db)
    logD(mod, fun, 'DB initialized')
  } catch (error) {
    logE(mod, fun, error)
    throw error
  }
}

/**
 * If Super User credentials were given through the CLI argument --su or an environment variable MANAGER_SU,
 * the Super User credentials will be (over)written in the user database.
 * Otherwise, if no Super User is found in the DB, the credentials given in the custom configuration file will be used.
 * If no CLI/var env are given and a super user already exists in DB, we leave things as they are.
 * @param {*} db an sqlite3 database (possibly null)
 */
const checkSuperUser = async (db) => {
  const fun = 'checkSuperUser'
  const suCreds = getOptSuCreds()
  if (suCreds) {
    // Super User credentials were given through the CLI argument --su or an environment variable MANAGER_SU
    // => the Super User credentials will be (over)written in the user database.
    const suName = await dbInitSuperUserWithCreds(db, suCreds)
    logW(mod, fun, `User created/updated: SU (${suName})`)
  } else {
    // No Super User credentials were given
    await dbCreateSuperUser(db)
  }
}
