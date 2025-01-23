const mod = 'db'

// -------------------------------------------------------------------------------------------------
// External dependencies
// -------------------------------------------------------------------------------------------------
import { hashPassword } from '@aqmo.org/jwt-lib'

import sqlt3 from 'sqlite3'
const { verbose, VERSION } = sqlt3

const { Database, OPEN_READWRITE } = verbose()

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
import { getContext, logD, logE, logI, logV } from '../utils/logger.js'

logD('sqlite3.VERSION:', VERSION)

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
const dbOpen = () => {
  const fun = 'dbOpen'
  const db = new Database(DB_FILE, OPEN_READWRITE, (err) => {
    if (err) {
      logE(mod, fun, err)
      logE(mod, fun, err.message)
    } else {
      // TODO: return something?
    }
  })
  return db.exec('PRAGMA foreign_keys = ON')
}
const _dbOpen = dbOpen
export { _dbOpen as dbOpen }

const dbClose = (db) => {
  db.close((err) => {
    if (err && err.message !== 'SQLITE_MISUSE: Database handle is closed') logE(mod, 'dbClose', err.message)
  })
  return statusOK('DB closed')
}
const _dbClose = dbClose
export { _dbClose as dbClose }

export function dbOpenOrCreate() {
  const fun = 'dbOpenOrCreate'
  return new Promise((resolve, reject) => {
    const db = new Database(DB_FILE, (err) => {
      if (err) {
        logE(mod, fun, err)
        return reject(err)
      }
      logV(mod, fun, 'Connection to the RUDI manager database')
    })
    resolve(db)
  })
}

// ---- Controllers -----
export async function dbGetHashedPassword(openedDb, username) {
  const fun = 'dbGetHashedPassword'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.get(`SELECT  password FROM ${TBL_USERS} WHERE username = ?`, [username], (err, row) => {
      if (!openedDb) dbClose(db)
      if (err) {
        logE(mod, fun, err.message)
        reject(err)
      } else {
        if (!row) return reject(new UnauthorizedError('No user found'))
        return resolve({ username, password: row.password })
      }
    })
  })
}

/**
 * Retrieve the user info in DB from a key+value pair
 * @param {Database?} openedDb an sqlite3 database (possibly null)
 * @param {String} field the field used to find the user
 * @param {String | number} val the value for above field
 * @returns {Object} the user info
 */
export function dbGetUserByField(openedDb, field, val) {
  const fun = 'dbGetUserByField'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT ${TBL_USERS}.id, ${TBL_USERS}.username, ${TBL_USERS}.email,` +
        ` GROUP_CONCAT(${TBL_USER_ROLES}.role) AS roles FROM ${TBL_USERS}` +
        ` LEFT JOIN ${TBL_USER_ROLES} ON ${TBL_USER_ROLES}.userId = ${TBL_USERS}.id` +
        ` GROUP BY ${TBL_USERS}.id HAVING ${TBL_USERS}.${field} = ?;`,
      // `SELECT id, username, email FROM ${TBL_USERS} WHERE ${field} = ?`,
      [val],
      (err, userInfo) => {
        if (!openedDb) dbClose(db)
        if (err) {
          logE(mod, fun, err)
          // console.error(' T (dbGetUserByField) ERR', err)
          return reject(err)
        } else {
          if (!userInfo || Object.keys(userInfo).length === 0) {
            // console.error(`T (dbGetUserByField) User not found with '${field}' = '${val}'`, err)
            return resolve(null)
          }
          // console.log(`T (dbGetUserByField) Found with '${field}' = '${val}'`, userInfo)
          return resolve(userInfo)
        }
      }
    )
  })
}

/**
 * Retrieve the user info in DB from their username
 * @param {Database?} openedDb an sqlite3 database (possibly null)
 * @param {String} username the user's username
 * @returns {Object} the user info
 */
export const dbGetUserByUsername = (openedDb, username) => dbGetUserByField(openedDb, 'username', username)

/**
 * Retrieve the user info in DB from their id
 * @param {Database?} openedDb an sqlite3 database (possibly null)
 * @param {number} id the user's id
 * @returns {Object} the user info
 */
export const dbGetUserById = (openedDb, id) => dbGetUserByField(openedDb, 'id', id)
/**
 * Retrieve the user info in DB from their e-mail
 * @param {Database?} openedDb an sqlite3 database (possibly null)
 * @param {String} email the user's e-mail
 * @returns {Object} the user info
 */
export const dbGetUserByEmail = (openedDb, email) => dbGetUserByField(openedDb, 'email', email)

/**
 * Checks if the user was created
 * @param {Database?} openedDb an sqlite3 database (possibly null)
 * @param {String} username the user's e-mail
 * @returns {Object} the user info
 */
export async function dbExistsUser(openedDb, username) {
  const userInfo = await dbGetUserByUsername(openedDb, username) // NOSONAR
  return !!userInfo?.username
}

export function dbGetUsers(openedDb) {
  const fun = 'getUsers'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT ${TBL_USERS}.id, ${TBL_USERS}.username, ${TBL_USERS}.email, GROUP_CONCAT(${TBL_USER_ROLES}.role)` +
        ` AS roles FROM ${TBL_USERS} LEFT JOIN ${TBL_USER_ROLES} ON ${TBL_USER_ROLES}.userId = ${TBL_USERS}.id` +
        ` GROUP BY ${TBL_USERS}.id HAVING ${TBL_USERS}.id > 0;`,
      (err, rows) => {
        if (!openedDb) dbClose(db)
        if (err) {
          logE(mod, fun, err.message)
          reject(err)
        } else {
          const result = rows.map((row) => {
            if (row.roles) row.roles = row.roles.split(',')
            return row
          })
          resolve(result)
        }
      }
    )
  })
}

/**
 * Check if the users exists, creates it if not.
 * @param {Object} user
 * @return {Promise} User id and username when successful
 * @throws {ForbiddenError} user already exists
 */
export function dbCreateUserCheckExists(openedDb, user, silent = false) {
  const fun = 'safeCreateUser'
  const { username, password, email, id } = user
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_USERS} WHERE username = ?`, [username], (err, row) => {
      if (err) {
        if (!openedDb) dbClose(db)
        logE(mod, fun + ' doesUserExist', err.message)
        return reject(err)
      }
      if (row?.id) {
        if (!openedDb) dbClose(db)
        const errMsg = `User '${username}' already exists`
        logE(mod, fun + ' userExists', errMsg)
        return reject(new ForbiddenError(errMsg))
      } else {
        const sqlReq =
          `INSERT INTO ${TBL_USERS}(username,password,email${id ? ',id' : ''})` + ` VALUES(?,?,?${id ? ',?' : ''})`
        db.run(sqlReq, [username, password, email, id], (err) => {
          if (err) {
            if (!openedDb) dbClose(db)
            logE(mod, fun + '.cannotCreateUser', err.message)
            logE(mod, fun + '.sqlReq', sqlReq)
            return reject(err)
          }
          if (!silent)
            logI(mod, fun, `${TBL_USERS} : user created: '${username}'`, getContext(null, { opType: 'post_user' }))
          db.get(`SELECT * FROM ${TBL_USERS} where username = ?`, [username], (err, userInfo) => {
            if (!openedDb) dbClose(db)
            if (err) {
              logE(mod, fun + ' retrieveUserInfo', err.message)
              reject(err)
            } else {
              const { id, username } = userInfo
              resolve({ id, username })
            }
          })
        })
      }
    })
  })
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

export function dbCreateUser(openedDb, userInfo) {
  const fun = 'dbCreateUser'
  const { username, password, email } = userInfo

  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO ${TBL_USERS}(username,password,email) VALUES(?,?,?)`, [username, password, email], (err) => {
      if (err) {
        if (!openedDb) dbClose(db)
        logE(mod, fun + '.insert', err.message)
        return reject(err)
      }
      logI(mod, fun, `(${TBL_USERS}) user created: '${username}'`, getContext(null, { opType: 'post_user' }))
      db.get(`SELECT * FROM ${TBL_USERS} where username = ?`, [username], (err, row) => {
        if (!openedDb) dbClose(db)
        if (err) {
          logE(mod, fun + '.select', err.message)
          return reject(err)
        }
        resolve({ id: row.id, username: row.username })
      })
    })
  })
}

export function dbUpdateUser(openedDb, userInfo) {
  const fun = 'dbUpdateUser'
  const { id, username, password, email } = userInfo
  logD(mod, fun, `userInfo: ${beautify({ ...userInfo, password: '***' })}`)
  const db = openedDb ?? dbOpen()
  const sqlReq =
    `UPDATE ${TBL_USERS} SET username = ?, email = ?` + (password ? `, password = '${password}'` : '') + ` WHERE id = ?`
  return new Promise((resolve, reject) => {
    db.run(sqlReq, [username, email, id], (err) => {
      if (err) {
        if (!openedDb) dbClose(db)
        logE(mod, fun + ' insert', err.message)
        return reject(err)
      }
      logI(mod, fun, `(${TBL_USERS}) user updated: '${username}'`)
      db.get(`SELECT * FROM ${TBL_USERS} where username = ?`, [username], (err, row) => {
        if (!openedDb) dbClose(db)
        if (err) {
          logE(mod, fun + '.select', err.message)
          return reject(err)
        }
        if (!row) {
          logE(mod, fun + '.select', `User doesn't exist: ${username}`)
          return reject(new BadRequestError(`User doesn't exist: ${username}`))
        }
        resolve({ id: row.id, username: row.username })
      })
    })
  })
}

export async function dbHashAndUpdatePassword(openedDb, username, password) {
  const hashedPwd = hashPassword(password)
  return await dbUpdatePasswordWithField(openedDb, 'username', username, hashedPwd)
}

export function dbUpdatePasswordWithField(openedDb, key, val, password) {
  const fun = 'dbUpdatePasswordWithField'
  const db = openedDb ?? dbOpen()
  logI(mod, fun, `Password reset for user '${val}'`)
  return new Promise((resolve, reject) => {
    db.run(`UPDATE ${TBL_USERS} SET password = ? WHERE ${key} = ?`, [password, val], (err) => {
      if (!openedDb) dbClose(db)
      if (err) {
        logE(mod, fun, err.message)
        return reject(err.message)
      }
      logI(mod, fun, `${TBL_USERS}: password reset for user '${val}'`, getContext(null, { opType: 'put_password' }))
      resolve({ key: val })
    })
  })
}

export function dbDeleteUserWithId(openedDb, id, silent = false) {
  const fun = 'dbDeleteUserWithId'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USERS} WHERE id = ?`, [id], (err) => {
      if (!openedDb) dbClose(db)
      if (err) {
        logE(mod, fun, err.message)
        return reject(err)
      }
      if (!silent)
        logI(mod, fun, `${TBL_USERS} : A row was deleted with id ${id}`, getContext(null, { opType: 'delete_user_id' }))
      resolve({ id })
    })
  })
}

export function dbDeleteUserWithName(openedDb, name, silent = false) {
  const fun = 'dbDeleteUserWithName'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USERS} WHERE name = ?`, [name], (err) => {
      if (!openedDb) dbClose(db)
      if (err) {
        logE(mod, fun, err.message)
        return reject(err)
      }
      if (!silent)
        logI(
          mod,
          fun,
          `${TBL_USERS} : A row was deleted with name ${name}`,
          getContext(null, { opType: 'delete_user_name' })
        )
      resolve({ name })
    })
  })
}

// ROLES
export function dbCreateRoles(openedDb, roles) {
  const fun = 'createRoles'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      roles.forEach((role) => {
        db.run(`INSERT INTO ${TBL_ROLES}(role,desc,hide) VALUES(?,?,?)`, [role.role, role.desc, !!role.hide], (err) => {
          if (err) {
            logE(mod, fun, err.message)
            if (!openedDb) dbClose(db)
            return reject(err)
          }
          logI(
            mod,
            fun,
            `(${TBL_ROLES}) A role has been created with name '${role.role}'`,
            getContext(null, { opType: 'add_role' })
          )
        })
      })
      if (!openedDb) dbClose(db)
      resolve({ roles })
    })
  })
}

export function dbGetRoles(openedDb) {
  const fun = 'getRoles'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${TBL_ROLES}`, (err, rows) => {
      if (!openedDb) dbClose(db)
      if (err) {
        logE(mod, fun, err.message)
        return reject(err)
      } else {
        const roles = []
        rows.map((roleInfo) => {
          if (roleInfo.role !== 'Moniteur' || roleInfo.role !== 'SuperAdmin') roles.push(roleInfo)
        })
        return resolve(roles)
      }
    })
  })
}
export function dbGetUserRoles(openedDb) {
  const fun = 'getRoles'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${TBL_USER_ROLES}`, (err, rows) => {
      if (!openedDb) dbClose(db)
      if (err) {
        logE(mod, fun, err.message)
        return reject(err)
      } else {
        return resolve(rows)
      }
    })
  })
}
export function dbGetRoleById(openedDb, role) {
  const fun = 'dbGetRoleById'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_ROLES} WHERE role = ?`, [role], function (err, row) {
      if (!openedDb) dbClose(db)
      if (err) {
        logE(mod, fun, err.message)
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

/**
 * Retrieves user's roles from their username
 * @param {Database} openedDb
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
 * @param {Database} openedDb
 * @param {String} username The user's id
 * @returns {Array} The array of user's roles
 */
export function dbGetUserRolesByUserId(openedDb, userId) {
  const fun = 'dbGetUserRolesByUserId'
  return new Promise((resolve, reject) => {
    if (userId !== 0 && !userId) return reject(new BadRequestError(`User id not provided`))
    const db = openedDb ?? dbOpen()
    dbGetUserById(db, userId)
      .then((userInfo) => {
        if (!userInfo) {
          if (!openedDb) dbClose(db)
          return reject(new Error(`User ${userId} not found!`))
        }
        const id = userInfo?.id

        db.all(`SELECT role FROM ${TBL_USER_ROLES} WHERE userId = ?`, [id], (err, rows) => {
          if (!openedDb) dbClose(db)
          if (err) {
            logE(mod, fun, err.message)
            return reject(err)
          } else {
            return resolve(rows.map((row) => row?.role))
          }
        })
      })
      .catch((err) => {
        if (!openedDb) dbClose(db)
        reject(err)
      })
  })
}

export async function dbGetUserInfoByUsername(openedDb, username) {
  const db = openedDb ?? dbOpen()
  const userInfo = await dbGetUserByUsername(db, username)
  userInfo.roles = await dbGetUserRolesByUserId(db, userInfo.id)
  if (!openedDb) dbClose(db)
  return userInfo
}

export function dbDeleteUserRole(openedDb, userId, role) {
  const fun = 'deleteUserRole'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USER_ROLES} WHERE userId = ? AND role = ?`, [userId, role], (err) => {
      if (!openedDb) dbClose(db)
      if (err) {
        logE(mod, fun, err.message)
        return reject(err)
      }
      logI(
        mod,
        fun,
        `${TBL_USER_ROLES}: A role was deleted with userId ${userId} and role '${role}'`,
        getContext(null, { opType: 'delete_userRole' })
      )
      resolve({ userId, role })
    })
  })
}

export function dbCreateUserRole(openedDb, { userId, username, role }) {
  const fun = 'dbCreateUserRole'
  if (userId !== 0 && !userId) Promise.reject(new BadRequestError('Input parameter userId must be defined'))
  if (!role) Promise.reject(new BadRequestError('Input parameter role must be defined'))
  // console.trace(`T (${fun})`, { userId, username, role })
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    try {
      db.run(`INSERT INTO ${TBL_USER_ROLES}(userId,role) VALUES(?,?)`, [userId, role], (err) => {
        if (!openedDb) dbClose(db)
        if (err) {
          logE(mod, fun, err.message)
          if (`${err.message}`?.startsWith('SQLITE_CONSTRAINT: UNIQUE constraint failed'))
            return reject(new BadRequestError(`Role already assigned to user`))
          if (`${err.message}`?.startsWith('SQLITE_CONSTRAINT: FOREIGN KEY constraint failed')) {
            return reject(
              new BadRequestError(`User ${userId}` + (username && ` (${username})`) + ` or role '${role}' not found`)
            )
          }
          return reject(new InternalServerError(err))
        }
        logI(
          mod,
          fun,
          `(${TBL_USER_ROLES}) A row was inserted with userId ${userId} and role '${role}'`,
          getContext(null, { opType: 'post_userRole' })
        )
        resolve({ userId, role })
      })
    } catch (e) {
      reject(
        new InternalServerError(
          `Role '${role}' could not be added to user '${username ?? userId}'. An error occured: ${e}`
        )
      )
    }
  })
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
