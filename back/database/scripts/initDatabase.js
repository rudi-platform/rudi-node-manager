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
import { v4 as uuid4 } from 'uuid'
import { getOptSuCreds } from '../../config/backOptions.js'
import {
  getConfSuId,
  getConfSuMail,
  getConfSuName,
  getConfSuPwd,
  getDbPath,
  isConfSuPwdHashed,
  setConfSuName,
} from '../../config/config.js'
import { decodeCredentials } from '../../controllers/authControllerPassport.js'
import { RudiError, statusOK } from '../../utils/errors.js'
import { getContext, logD, logE, logV, logW, sysInfo } from '../../utils/logger.js'
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
const dbInitTable = async (openedDb, tableName, sqlCreateReq) => {
  const fun = 'initTable'
  const db = openedDb ?? dbOpen()
  try {
    const row = db.prepare(sqlGet).get(tableName)
    if (row) return statusOK(`Table exists: '${tableName}'`)
    db.exec(sqlCreateReq)
    sysInfo(
      mod,
      `${fun}.${tableName}.create`,
      `Table Created : ${tableName}`,
      getContext(null, { opType: `init_table_${tableName}`.toLowerCase() })
    )
    return statusOK(`Table created: ${tableName}`)
  } catch (err) {
    logE(mod, `${fun}.${tableName}.create`, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

const dbNormalizeRoleTable = async (openedDb) => {
  const db = openedDb ?? dbOpen()
  await dbNormalizeRoleTableAddHide(db)
  await dbRenameRoles(db)
  await dbRenameUserRoles(db)
  if (!openedDb) dbClose(db)
}
const dbNormalizeRoleTableAddHide = async (openedDb) => {
  const fun = 'dbNormalizeRoleTableAddHide'
  const db = openedDb ?? dbOpen()
  try {
    const rows = db.prepare(`PRAGMA table_info(${TBL_ROLES})`).all()
    if (rows.find((row) => row.name === 'hide')) {
      // log.d(mod, `${fun}`, `Column 'hide' exists`)
      return statusOK(`Column 'hide' exists`)
    }
    db.exec(`ALTER TABLE ${TBL_ROLES} ADD hide INTEGER(1) DEFAULT 0`)
    db.exec(`UPDATE ${TBL_ROLES} SET hide=1 WHERE role='${ROLE_SU}' OR role='Moniteur' `)
    return statusOK(`Column 'hide added & role flags set`)
  } catch (err) {
    logD(mod, `${fun}.pragma`, err.message)
    throw new RudiError(`RoleHide Pragma failed: ${err.message}`)
  } finally {
    if (!openedDb) dbClose(db)
  }
}
const dbRenameUserRoles = async (openedDb) => {
  const fun = 'dbRenameUserRoles'
  const db = openedDb ?? dbOpen()
  try {
    const roleList = await dbGetUserRoles(db)
    const found = roleList.find(
      (roleDescPair) =>
        roleDescPair.role === 'Createur' || roleDescPair.role === 'Créateur' || roleDescPair.role === 'Gestionnaire'
    )
    if (!found) {
      logD(mod, `${fun}`, `UserRoles already renamed`)
      return statusOK(`UserRoles already renamed`)
    }
    db.exec(`UPDATE ${TBL_USER_ROLES} SET role='Lecteur' WHERE role='Createur' OR role='Créateur'`)
    db.exec(`UPDATE ${TBL_USER_ROLES} SET role='Editeur' WHERE role='Gestionnaire'`)
    logD(mod, `${fun}`, `UserRoles renamed`)
    return statusOK(`UserRoles renamed`)
  } catch (err) {
    logD(mod, `${fun}`, err.message)
    throw new RudiError(`${fun}: ${err}`)
  } finally {
    if (!openedDb) dbClose(db)
  }
}
const dbRenameRoles = async (openedDb) => {
  const fun = 'dbRenameRoles'
  const db = openedDb ?? dbOpen()
  try {
    const roleList = await dbGetRoles(db)
    const found = roleList.find(
      (roleDescPair) =>
        roleDescPair.role === 'Createur' || roleDescPair.role === 'Créateur' || roleDescPair.role === 'Gestionnaire'
    )
    if (!found) {
      logD(mod, `${fun}`, `Roles already renamed`)
      return statusOK(`Roles already renamed`)
    }
    db.exec(
      `UPDATE ${TBL_ROLES} SET role='Lecteur', desc='lecture seule des métadonnées' WHERE role='Createur' OR role='Créateur'`
    )
    db.exec(
      `UPDATE ${TBL_ROLES} SET role='Editeur',desc='édition et suppression des métadonnées' WHERE role='Gestionnaire'`
    )
    logD(mod, `${fun}`, `Roles renamed`)
    return statusOK(`Roles renamed`)
  } catch (err) {
    logD(mod, `${fun}`, err.message)
    throw new RudiError(`${fun}: ${err}`)
  } finally {
    if (!openedDb) dbClose(db)
  }
}

const dbNormalizeUserTableName = async (openedDb, oldTblName) => {
  const fun = 'dbNormalizeUsersTableName'
  const tempName = `x${oldTblName}x`
  const db = openedDb ?? dbOpen()
  try {
    const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${oldTblName}'`).get()
    if (!row) return `No table found with name '${oldTblName}'`
    logD(mod, `${fun}.check`, JSON.stringify(row))

    db.exec(`ALTER TABLE '${oldTblName}' RENAME TO '${tempName}'`)
    db.exec(`ALTER TABLE '${tempName}' RENAME TO '${TBL_USERS}'`)
    logD(mod, fun, 'Users table name normalized')
    return 'Users table name normalized'
  } catch (err) {
    logE(mod, `${fun}.rename`, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
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
      logD(mod, fun, `SU info: ${JSON.stringify(dbSuInfo)}`)
      logV(mod, fun, `Super User '${dbSuInfo.username}' exists in DB, no action required`)
      return
    }
    const username = getConfSuName()
    const email = getConfSuMail()
    const roles = [ROLE_SU]

    const confSuPwd = getConfSuPwd()

    let clearPassword, password
    if (!confSuPwd) {
      clearPassword = uuid4()
      password = hashPassword(clearPassword)
    } else {
      password = isConfSuPwdHashed() ? confSuPwd : hashPassword(confSuPwd)
    }
    const suInfo = { id, username, password, email }
    const suRoleInfo = { userId: id, username, roles }

    await dbCreateUserCheckExists(db, suInfo)
    await dbUpdateUserRoles(db, suRoleInfo)

    logW(mod, fun, `Super user created: '${username}' (id ${id}, role ${ROLE_SU})`)
    if (!confSuPwd) {
      console.error('')
      console.error('=============================================================================')
      console.error(`==                                                                         ==`)
      console.error(`==             A PASSWORD WAS GENERATED FOR THE SUPER USER:                ==`)
      console.error(`==                                                                         ==`)
      console.error(`==                 ${clearPassword}                    ==`)
      console.error(`==                                                                         ==`)
      console.error('=============================================================================')
      console.error('')
    } else {
      logW(mod, fun, `SU password from conf`)
    }
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
    logD(mod, fun, `DB_DIR=${DB_DIR}`)
    logD(mod, fun, `DB_PATH=${getDbPath()}`)

    const db = await dbOpenOrCreate()

    const initRolesRes = await dbInitTable(db, TBL_ROLES, sqlCreateRoleTable)
    if (`${initRolesRes.message}`.startsWith('Table created')) await dbCreateRoles(db, initialRoles)
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
 * @param {*} db a node:sqlite database (possibly null)
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
