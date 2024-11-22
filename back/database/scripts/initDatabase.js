const mod = 'initDb'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { statSync } from 'fs'
import { dirname } from 'path'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getBackOptions, OPT_SU_CREDS } from '../../config/backOptions.js'
import {
  getDbPath,
  getSuId,
  getSuMail,
  getSuName,
  getSuPwd,
  isSuPwdHashed as isSuPwdB64,
  setSuName,
} from '../../config/config.js'
import { decodeCredentials } from '../../controllers/authControllerPassport.js'
import { RudiError, statusOK } from '../../utils/errors.js'
import { getContext, logD, logE, logI, logW, sysInfo } from '../../utils/logger.js'
import { beautify, decodeBase64 } from '../../utils/utils.js'
import {
  dbClose,
  dbCreateRoles,
  dbCreateUserCheckExists,
  dbCreateUserRole,
  dbDeleteUserWithId,
  dbExistsUser,
  dbGetRoles,
  dbGetUserById,
  dbGetUserByUsername,
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

const dbInitSuperUser = async (db, b64SuCreds) => {
  const fun = 'dbInitSuperUser'
  try {
    const [username, password] = decodeCredentials(b64SuCreds)
    setSuName(username)

    const dbUsrInfo = await dbGetUserByUsername(db, username)
    if (dbUsrInfo) {
      // Super user already exists, updating the password
      await dbUpdateUser(db, {
        ...dbUsrInfo,
        password,
        isSuPwdHashed: true,
      })
      await dbUpdateUserRoles(db, {
        userId: dbUsrInfo.id,
        username,
        roles: [ROLE_SU],
      })
      logW(mod, fun, `Super user updated: '${username}' (id ${dbUsrInfo.id}, role ${ROLE_SU})`)
    } else {
      // Super user doesn't exists, creating the user
      const id = getSuId()
      const testUserExist = await dbGetUserById(db, id) // NOSONAR
      if (testUserExist) {
        logW(
          mod,
          fun,
          `User already exists for id ${id} (username: '${testUserExist.username}', role: ${testUserExist.roles}), skipping creation of a new super user`
        )
        return
      }
      logW(mod, fun, `Creating super user: '${username}' (id ${id})`)
      const suUsrInfo = {
        id,
        username,
        password,
        email: getSuMail(),
        role: [ROLE_SU],
      }
      const { id: checkId, username: checkUsr } = await dbCreateUserCheckExists(db, suUsrInfo)
      logW(mod, fun, `Super user created: '${checkUsr}' (id ${checkId})`)

      await dbUpdateUserRoles(db, {
        userId: id,
        username,
        roles: [ROLE_SU],
      })
      logW(mod, fun, `Super user updated: '${username}' (id ${id}, role ${ROLE_SU})`)
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
    const encodedSuPwd = getSuPwd()
    const isSuPwdHashed = isSuPwdB64()

    if (!getSuName() || !encodedSuPwd) {
      logE(mod, fun, 'No super user config was found')
      throw new RudiError('Conf needed: database.db_su_usr + database.db_su_pwd')
    }

    if (await dbExistsUser(db, getSuName)) return // NOSONAR

    const suId = getSuId()
    const suInfo = await dbGetUserById(db, suId) // NOSONAR
    if (suInfo) {
      logI(mod, fun, `Super user exists: ${beautify(suInfo)}`)
      return
    } // NOSONAR

    const suPwd = !isSuPwdHashed ? decodeBase64(encodedSuPwd) : encodedSuPwd

    const superUser = {
      id: suId,
      username: getSuName(),
      password: suPwd,
      isSuPwdHashed,
      email: getSuMail(),
      role: ROLE_SU,
    }

    const res = await dbRegisterUser(db, superUser)
    const { id, username } = res
    try {
      await dbCreateUserRole(db, { userId: id, role: superUser.role })
      const msg = `Super user role created: '${username}' (id ${id}, role ${superUser.role})`
      logI(mod, fun, msg)
      return statusOK(msg)
    } catch (err) {
      logE(mod, fun, `Error: ${err}`)
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

    const suCreds = getBackOptions(OPT_SU_CREDS)
    if (suCreds) {
      // log.i(mod, fun, `suCreds: ${suCreds}`)
      const suName = await dbInitSuperUser(db, suCreds)
      logW(mod, fun, `User created/updated: SU (${suName})`)
    } else {
      await dbCreateSuperUser(db)
      logD(mod, fun, `User created: SU (${getSuName()})`)
    }

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
