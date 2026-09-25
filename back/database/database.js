const mod = 'db'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { hashPassword } from '@aqmo.org/jwt-lib'

import { DatabaseSync } from 'node:sqlite'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { getConfSuName, getDbPath } from '../config/config.js'
import { beautify } from '../utils/utils.js'

import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  RudiError,
  STATUS_CODE,
  statusOK,
  UnauthorizedError,
} from '../utils/errors.js'
import { getContext, logD, logE, logI, logV, sysInfo } from '../utils/logger.js'

logD('node:sqlite (SQLite VERSION):', process.versions.sqlite)

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
const DB_FILE = getDbPath()

export const TBL_USERS = 'Users'
export const TBL_ROLES = 'Roles'
export const TBL_USER_ROLES = 'User_Roles'

// -------------------------------------------------------------------------------------------------
// Functions
// -------------------------------------------------------------------------------------------------
export const dbOpen = () => {
  const fun = 'dbOpen'
  let db
  try {
    db = new DatabaseSync(DB_FILE)
    db.exec('PRAGMA foreign_keys = ON')
  } catch (err) {
    logE(mod, fun, err)
    logE(mod, fun, err.message)
    throw err
  }
  return db
}

export const dbClose = (db) => {
  try {
    db.close()
  } catch (err) {
    if (err?.code !== 'ERR_INVALID_STATE') logE(mod, 'dbClose', err.message)
  }
  return statusOK('DB closed')
}

export function dbOpenOrCreate() {
  const fun = 'dbOpenOrCreate'
  return new Promise((resolve, reject) => {
    try {
      const db = new DatabaseSync(DB_FILE)
      logV(mod, fun, 'Connection to the RUDI manager database')
      resolve(db)
    } catch (err) {
      logE(mod, fun, err)
      return reject(err)
    }
  })
}

// ---- Controllers -----
export async function dbGetHashedPassword(openedDb, username) {
  const fun = 'dbGetHashedPassword'
  const db = openedDb ?? dbOpen()
  try {
    const row = db.prepare(`SELECT password FROM ${TBL_USERS} WHERE username = ?`).get(username)
    if (!row) throw new UnauthorizedError('User not found')
    return { username, password: row.password }
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

/**
 * Retrieve the user info in DB from a key+value pair
 * @param {DatabaseSync?} openedDb a node:sqlite database (possibly null)
 * @param {String} field the field used to find the user
 * @param {String | number} val the value for above field
 * @returns {Object} the user info
 */
export async function dbGetUserByField(openedDb, field, val) {
  const fun = 'dbGetUserByField'
  const db = openedDb ?? dbOpen()
  try {
    const userInfo = db
      .prepare(
        `SELECT ${TBL_USERS}.id, ${TBL_USERS}.username, ${TBL_USERS}.email,` +
          ` GROUP_CONCAT(${TBL_USER_ROLES}.role) AS roles FROM ${TBL_USERS}` +
          ` LEFT JOIN ${TBL_USER_ROLES} ON ${TBL_USER_ROLES}.userId = ${TBL_USERS}.id` +
          ` GROUP BY ${TBL_USERS}.id HAVING ${TBL_USERS}.${field} = ?;`
      )
      .get(val)
    if (!userInfo || Object.keys(userInfo).length === 0) return null
    return userInfo
  } catch (err) {
    logE(mod, fun, err)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

/**
 * Retrieve the user info in DB from their username
 * @param {DatabaseSync?} openedDb a node:sqlite database (possibly null)
 * @param {String} username the user's username
 * @returns {Object} the user info
 */
export const dbGetUserByUsername = (openedDb, username) => dbGetUserByField(openedDb, 'username', username)

/**
 * Retrieve the user info in DB from their id
 * @param {DatabaseSync?} openedDb a node:sqlite database (possibly null)
 * @param {number} id the user's id
 * @returns {Object} the user info
 */
export const dbGetUserById = (openedDb, id) => dbGetUserByField(openedDb, 'id', id)
/**
 * Retrieve the user info in DB from their e-mail
 * @param {DatabaseSync?} openedDb a node:sqlite database (possibly null)
 * @param {String} email the user's e-mail
 * @returns {Object} the user info
 */
export const dbGetUserByEmail = (openedDb, email) => dbGetUserByField(openedDb, 'email', email)

/**
 * Checks if the user was created
 * @param {DatabaseSync?} openedDb a node:sqlite database (possibly null)
 * @param {String} username the user's e-mail
 * @returns {Object} the user info
 */
export async function dbExistsUser(openedDb, username) {
  const userInfo = await dbGetUserByUsername(openedDb, username) // NOSONAR
  return !!userInfo?.username
}

export async function dbGetUsers(openedDb) {
  const fun = 'dbGetUsers'
  const db = openedDb ?? dbOpen()
  try {
    const rows = db
      .prepare(
        `SELECT ${TBL_USERS}.id, ${TBL_USERS}.username, ${TBL_USERS}.email, GROUP_CONCAT(${TBL_USER_ROLES}.role)` +
          ` AS roles FROM ${TBL_USERS} LEFT JOIN ${TBL_USER_ROLES} ON ${TBL_USER_ROLES}.userId = ${TBL_USERS}.id` +
          ` GROUP BY ${TBL_USERS}.id HAVING ${TBL_USERS}.id > 0;`
      )
      .all()
    const result = rows.map((row) => {
      if (row.roles) row.roles = row.roles.split(',')
      return row
    })
    return result
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

/**
 * Check if the users exists, creates it if not.
 * @param {Object} user
 * @return {Promise} User id and username when successful
 * @throws {ForbiddenError} user already exists
 */
export async function dbCreateUserCheckExists(openedDb, user, silent = false) {
  const fun = 'safeCreateUser'
  const { username, password, email, id } = user
  const db = openedDb ?? dbOpen()
  try {
    const row = db.prepare(`SELECT * FROM ${TBL_USERS} WHERE username = ?`).get(username)
    if (row?.id) {
      const errMsg = `User '${username}' already exists`
      logE(mod, fun + ' userExists', errMsg)
      throw new ForbiddenError(errMsg)
    }
    const sqlReq =
      `INSERT INTO ${TBL_USERS}(username,password,email${id ? ',id' : ''})` + ` VALUES(?,?,?${id ? ',?' : ''})`
    const params = id ? [username, password, email, id] : [username, password, email]
    db.prepare(sqlReq).run(...params)
    if (!silent)
      sysInfo(mod, fun, `${TBL_USERS} : user created: '${username}'`, getContext(null, { opType: 'post_user' }))
    const userInfo = db.prepare(`SELECT * FROM ${TBL_USERS} where username = ?`).get(username)
    const { id: userId, username: usrName } = userInfo
    return { id: userId, username: usrName }
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

export async function dbRegisterUser(db, { username, email, password, isSuPwdHashed, id }, silent = false) {
  const fun = 'dbRegisterUser'
  try {
    const userCreds = {
      username,
      password: isSuPwdHashed ? password : hashPassword(password),
      email,
    }
    if (id) userCreds.id = id

    const usrInfo = await dbCreateUserCheckExists(db, userCreds, silent)
    return { id: usrInfo.id, username: usrInfo.username }
  } catch (err) {
    logE(mod, fun, err)
    throw err
  }
}

export async function dbCreateUser(openedDb, userInfo) {
  const fun = 'dbCreateUser'
  const { username, password, email } = userInfo

  const db = openedDb ?? dbOpen()
  try {
    db.prepare(`INSERT INTO ${TBL_USERS}(username,password,email) VALUES(?,?,?)`).run(username, password, email)
    sysInfo(mod, fun, `(${TBL_USERS}) user created: '${username}'`, getContext(null, { opType: 'post_user' }))
    const row = db.prepare(`SELECT * FROM ${TBL_USERS} where username = ?`).get(username)
    return { id: row.id, username: row.username }
  } catch (err) {
    logE(mod, fun + '.insert', err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

export async function dbUpdateUser(openedDb, userInfo) {
  const fun = 'dbUpdateUser'
  const { id, username, password, email } = userInfo
  logD(mod, fun, `userInfo: ${beautify({ ...userInfo, password: '***' })}`)
  const db = openedDb ?? dbOpen()
  const sqlReq =
    `UPDATE ${TBL_USERS} SET username = ?, email = ?` + (password ? `, password = '${password}'` : '') + ` WHERE id = ?`
  try {
    db.prepare(sqlReq).run(username, email, id)
    sysInfo(mod, fun, `(${TBL_USERS}) user updated: '${username}'`)
    const row = db.prepare(`SELECT * FROM ${TBL_USERS} where username = ?`).get(username)
    if (!row) throw new BadRequestError(`User doesn't exist: ${username}`)
    return { id: row.id, username: row.username }
  } catch (err) {
    logE(mod, fun + ' insert', err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

export async function dbHashAndUpdatePassword(openedDb, username, password) {
  const hashedPwd = hashPassword(password)
  return await dbUpdatePasswordWithField(openedDb, 'username', username, hashedPwd)
}

export async function dbUpdatePasswordWithField(openedDb, key, val, password) {
  const fun = 'dbUpdatePasswordWithField'
  const db = openedDb ?? dbOpen()
  logI(mod, fun, `Password reset for user '${val}'`)
  try {
    db.prepare(`UPDATE ${TBL_USERS} SET password = ? WHERE ${key} = ?`).run(password, val)
    sysInfo(mod, fun, `${TBL_USERS}: password reset for user '${val}'`, getContext(null, { opType: 'put_password' }))
    return { key: val }
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

export async function dbDeleteUserWithId(openedDb, id, silent = false) {
  const fun = 'dbDeleteUserWithId'
  const db = openedDb ?? dbOpen()
  try {
    db.prepare(`DELETE FROM ${TBL_USERS} WHERE id = ?`).run(id)
    if (!silent) {
      const msg = `${TBL_USERS} : A row was deleted with id ${id}`
      sysInfo(mod, fun, msg, getContext(null, { opType: 'delete_user_id' }))
    }
    return { id }
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

export async function dbDeleteUserWithName(openedDb, name, silent = false) {
  const fun = 'dbDeleteUserWithName'
  const db = openedDb ?? dbOpen()
  try {
    db.prepare(`DELETE FROM ${TBL_USERS} WHERE name = ?`).run(name)
    if (!silent) {
      const msg = `${TBL_USERS} : A row was deleted with name ${name}`
      sysInfo(mod, fun, msg, getContext(null, { opType: 'delete_user_name' }))
    }
    return { name }
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

// ROLES
export async function dbCreateRoles(openedDb, roles) {
  const fun = 'dbCreateRoles'
  const db = openedDb ?? dbOpen()
  try {
    const insertRole = db.prepare(`INSERT INTO ${TBL_ROLES}(role,desc,hide) VALUES(?,?,?)`)
    roles.forEach((role) => {
      insertRole.run(role.role, role.desc, role.hide ? 1 : 0)
      const msg = `(${TBL_ROLES}) A role has been created with name '${role.role}'`
      sysInfo(mod, fun, msg, getContext(null, { opType: 'add_role' }))
    })
    return { roles }
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

export async function dbGetRoles(openedDb) {
  const fun = 'getRoles'
  const db = openedDb ?? dbOpen()
  try {
    const rows = db.prepare(`SELECT * FROM ${TBL_ROLES}`).all()
    const roles = []
    rows.map((roleInfo) => {
      if (roleInfo.role !== 'Moniteur' || roleInfo.role !== 'SuperAdmin') roles.push(roleInfo)
    })
    return roles
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}
export async function dbGetUserRoles(openedDb) {
  const fun = 'getRoles'
  const db = openedDb ?? dbOpen()
  try {
    return db.prepare(`SELECT * FROM ${TBL_USER_ROLES}`).all()
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}
export async function dbGetRoleById(openedDb, role) {
  const fun = 'dbGetRoleById'
  const db = openedDb ?? dbOpen()
  try {
    return db.prepare(`SELECT * FROM ${TBL_ROLES} WHERE role = ?`).get(role)
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

/**
 * Retrieves user's roles from their username
 * @param {DatabaseSync} openedDb
 * @param {String} username The user's username
 * @returns {Array} The array of user's roles
 */
export async function dbGetUserRolesByUsername(openedDb, username) {
  const fun = 'dbGetUserRolesByUsername'
  const db = openedDb ?? dbOpen()
  try {
    if (!username) throw new BadRequestError('The username should be provided')
    const userInfo = await dbGetUserByUsername(db, username)
    const id = userInfo.id
    if (!id && username !== getConfSuName()) {
      logE(mod, fun, `${username} != ${getConfSuName()}`)
      dbClose(db)
      throw new UnauthorizedError(`User not found: ${username}`)
    }
    const roles = await dbGetUserRolesByUserId(db, id)
    if (!openedDb) dbClose(db)
    return roles
  } catch (err) {
    if (!openedDb) dbClose(db)
    logE(mod, fun, err.toString())
    if (err[STATUS_CODE] === 400) throw new ForbiddenError(`Admin validation required for user '${username}'`)
    throw err
  }
}

export async function isValidatedUser(openedDb, userInfo) {
  const db = openedDb ?? dbOpen()
  try {
    let roles
    if (userInfo.id) roles = await dbGetUserRolesByUserId(db, userInfo.id)
    else if (userInfo.username) roles = await dbGetUserRolesByUsername(db, userInfo.username)
    else throw new UnauthorizedError(`User not found: ${userInfo.username ?? userInfo.id}`)
    if (!openedDb) dbClose(db)
    // console.debug('T (isValidatedUser) yes:', userInfo.username || userInfo.id, roles)
    return roles
  } catch (err) {
    if (!openedDb) dbClose(db)
    // console.error('T (isValidatedUser)', userInfo.username || userInfo.id)
    throw err
  }
}

/**
 * Retrieves user's roles from their id
 * @param {DatabaseSync} openedDb
 * @param {String} username The user's id
 * @returns {Array} The array of user's roles
 */
export async function dbGetUserRolesByUserId(openedDb, userId) {
  const fun = 'dbGetUserRolesByUserId'
  if (userId !== 0 && !userId) throw new BadRequestError(`User id not provided`)
  const db = openedDb ?? dbOpen()
  try {
    const userInfo = await dbGetUserById(db, userId)
    if (!userInfo) throw new Error(`User ${userId} not found!`)
    const id = userInfo?.id

    const rows = db.prepare(`SELECT role FROM ${TBL_USER_ROLES} WHERE userId = ?`).all(id)
    return rows.map((row) => row?.role)
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

export async function dbGetUserInfoByUsername(openedDb, username) {
  const db = openedDb ?? dbOpen()
  const userInfo = await dbGetUserByUsername(db, username)
  userInfo.roles = await dbGetUserRolesByUserId(db, userInfo.id)
  if (!openedDb) dbClose(db)
  return userInfo
}

export async function dbDeleteUserRole(openedDb, userId, role) {
  const fun = 'deleteUserRole'
  const db = openedDb ?? dbOpen()
  try {
    db.prepare(`DELETE FROM ${TBL_USER_ROLES} WHERE userId = ? AND role = ?`).run(userId, role)
    const msg = `${TBL_USER_ROLES}: A role was deleted with userId ${userId} and role '${role}'`
    sysInfo(mod, fun, msg, getContext(null, { opType: 'delete_userRole' }))
    return { userId, role }
  } catch (err) {
    logE(mod, fun, err.message)
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}

export async function dbCreateUserRole(openedDb, { userId, username, role }) {
  const fun = 'dbCreateUserRole'
  if (userId !== 0 && !userId) throw new BadRequestError('Input parameter userId must be defined')
  if (!role) throw new BadRequestError('Input parameter role must be defined')
  // console.trace(`T (${fun})`, { userId, username, role })
  const db = openedDb ?? dbOpen()
  try {
    db.prepare(`INSERT INTO ${TBL_USER_ROLES}(userId,role) VALUES(?,?)`).run(userId, role)
    const msg = `(${TBL_USER_ROLES}) A row was inserted with userId ${userId} and role '${role}'`
    sysInfo(mod, fun, msg, getContext(null, { opType: 'post_userRole' }))
    return { userId, role }
  } catch (err) {
    logE(mod, fun, err.message)
    if (`${err.message}`.startsWith('UNIQUE constraint failed'))
      throw new BadRequestError(`Role already assigned to user`)
    if (`${err.message}`.startsWith('FOREIGN KEY constraint failed')) {
      throw new BadRequestError(`User ${userId}` + (username && ` (${username})`) + ` or role '${role}' not found`)
    }
    throw new InternalServerError(
      `Role '${role}' could not be added to user '${username ?? userId}'. An error occured: ${err}`
    )
  } finally {
    if (!openedDb) dbClose(db)
  }
}

export async function dbUpdateUserRoles(openedDb, userInfo) {
  const fun = 'dbUpdateUserRoles'
  try {
    const { userId, username, roles: targetRoles } = userInfo
    if (userId !== 0 && !userId) Promise.reject(new BadRequestError(`Input parameter 'userId' must be defined`))
    if (!targetRoles) Promise.reject(new BadRequestError(`Input parameter 'roles' must be defined`))
    if (!Array.isArray(targetRoles)) throw new BadRequestError(`Parameter 'roles' should be an array`)
    const db = openedDb ?? dbOpen()
    let origRoles = await dbGetUserRolesByUserId(db, userId)
    await Promise.all(
      targetRoles.map((newRole) => {
        return new Promise((resolve, reject) => {
          const i = origRoles.indexOf(newRole)
          if (i === -1) {
            dbCreateUserRole(db, { userId, role: newRole, username })
              .then((res) => {
                logI(mod, fun, `Role added to  user '${username ?? userId}': ${newRole}`)
                return resolve(`Role added to user '${username ?? userId}': ${newRole}`)
              })
              .catch((err) => reject(new InternalServerError(`(dbUpdateUserRoles.addNew) ${err}`)))
          } else {
            origRoles.splice(i, 1)
            resolve(`Role kept for user '${username ?? userId}': ${newRole}`)
          }
        })
      })
    )
    await Promise.all(
      origRoles.map(
        (roleToRemove) =>
          new Promise((resolve, reject) => {
            dbDeleteUserRole(db, userId, roleToRemove)
              .then((res) => {
                logI(mod, fun, `Role removed to user '${username ?? userId}': ${roleToRemove}`)
                return resolve(`Role removed to user '${username ?? userId}': ${roleToRemove}`)
              })
              .catch((err) => reject(new InternalServerError(`(dbUpdateUserRoles.delOld) ${err}`)))
          })
      )
    )
    if (!openedDb) dbClose(db)
  } catch (err) {
    logE(mod, fun, `(dbUpdateUserRoles) ERR: ${err}`)
    throw new RudiError(err)
  }
}
