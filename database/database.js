const mod = 'db'

// ---- External dependencies -----
const sqlite3 = require('sqlite3').verbose()
// const { genSaltSync, hashSync } = require('bcrypt')
const Promise = require('bluebird')

// ---- Internal dependencies -----
const { getDbConf } = require('../config/config')
const { ForbiddenError, InternalServerError, NotFoundError, statusOK } = require('../utils/errors')
const { hashPassword } = require('../utils/secu')
const log = require('../utils/logger')

// ---- Constants -----
const DB_NAME = getDbConf('db_filename')
const DB_FILE = `${getDbConf('db_directory')}${DB_NAME ? `/${DB_NAME}` : ''}`.trim()

const TBL_USERS = 'Users'
exports.TBL_USERS = TBL_USERS

const TBL_ROLES = 'Roles'
exports.TBL_ROLES = TBL_ROLES

const TBL_USER_ROLES = 'User_Roles'
exports.TBL_USER_ROLES = TBL_USER_ROLES

// ---- Functions -----
const open = function () {
  const fun = 'open'
  const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      log.e(mod, fun, err)
      log.e(mod, fun, err.message)
    } else {
      // TODO: return something?
    }
  })
  return db.exec('PRAGMA foreign_keys = ON')
}

const close = (db) => {
  db.close((err) => {
    if (err) log.e(mod, 'dbClose', err.message)
  })
  return statusOK('DB closed')
}

exports.dbOpenOrCreate = () => {
  const fun = 'dbOpenOrCreate'
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        log.e(mod, fun, err)
        return reject(err)
      }
      log.v(mod, fun, 'Creation of (or Connected to) the rudi_manager database.')
    })
    resolve(db)
  })
}

// ---- Controllers -----
exports.dbNormalizeUserTableName = (openedDb, oldTblName) => {
  const fun = 'normalizeUserTableName'
  const tempName = `x${oldTblName}x`
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${oldTblName}'`,
      [],
      (err, row) => {
        if (err) {
          if (!openedDb) close(db)
          log.d(mod, `${fun}.check`, err.message)
          return reject(err)
        }
        if (!row) {
          if (!openedDb) close(db)
          return resolve(`No table found with name '${oldTblName}'`)
        }

        console.log(mod, `${fun}.check`, JSON.stringify(row))

        db.run(`ALTER TABLE '${oldTblName}' RENAME TO '${tempName}'`, [], (err, row) => {
          if (err) {
            if (!openedDb) close(db)
            log.e(mod, `${fun}.renameToto`, err.message)
            return reject(err)
          }
          console.log(mod, `${fun}.renameToto`, JSON.stringify(row))
          db.run(`ALTER TABLE '${tempName}' RENAME TO '${TBL_USERS}'`, [], (err, row) => {
            if (!openedDb) close(db)
            if (err) {
              log.e(mod, `${fun}.renameReal`, err.message)
              reject(err)
            } else {
              console.log(mod, fun, JSON.stringify(row))
              resolve('Users table name normalized')
            }
          })
        })
      }
    )
  })
}

exports.dbGetUserByUsername = (openedDb, username) => {
  const fun = 'getUserByUsername'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_USERS} WHERE username = ?`, [username], function (err, userInfo) {
      if (!openedDb) close(db)
      if (err) {
        log.e(mod, fun, err.message)
        reject(err)
      } else {
        // const { id, username, email } = userInfo;
        resolve(userInfo)
      }
    })
  })
}

exports.dbGetUserById = (openedDb, id) => {
  const fun = 'dbGetUserById'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_USERS} WHERE id = ?`, [id], function (err, userInfo) {
      if (!openedDb) close(db)
      if (err) {
        log.e(mod, fun, err.message)
        reject(err)
      } else {
        // const { id, username, email } = userInfo;
        resolve(userInfo)
      }
    })
  })
}

exports.dbExistsUser = async (openedDb, username) => {
  const user = await this.dbGetUserByUsername(openedDb, username)
  return !!user?.username
}

exports.dbGetUsers = (openedDb) => {
  const fun = 'getUsers'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT ${TBL_USERS}.id, ${TBL_USERS}.username, ${TBL_USERS}.email, GROUP_CONCAT(${TBL_USER_ROLES}.role) ` +
        `AS roles FROM ${TBL_USERS} LEFT JOIN ${TBL_USER_ROLES} ON ${TBL_USER_ROLES}.userId = ${TBL_USERS}.id ` +
        `GROUP BY ${TBL_USERS}.id;`,
      (err, rows) => {
        if (!openedDb) close(db)
        if (err) {
          log.e(mod, fun, err.message)
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
exports.dbCreateUserCheckExists = (openedDb, user) => {
  const fun = 'safeCreateUser'
  const { username, password, email, id } = user
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_USERS} WHERE username = ?`, [username], (err, row) => {
      if (err) {
        if (!openedDb) close(db)
        log.e(mod, fun + ' doesUserExist', err.message)
        return reject(err)
      }
      if (row?.id) {
        if (!openedDb) close(db)
        const errMsg = `User '${username}' already exists`
        log.e(mod, fun + ' userExists', errMsg)
        return reject(new ForbiddenError(errMsg))
      } else {
        db.run(
          `INSERT INTO ${TBL_USERS}(username,password,email${id ? ',id' : ''})` +
            ` VALUES(?,?,?${id ? ',?' : ''})`,
          [username, password, email, id],
          (err) => {
            if (err) {
              if (!openedDb) close(db)
              log.e(mod, fun + ' cannotCreateUser', err.message)
              return reject(err)
            }
            log.i(
              mod,
              fun,
              `${TBL_USERS} : user created: '${username}'`,
              log.getContext(null, { opType: 'post_user' })
            )
            db.get(`SELECT * FROM ${TBL_USERS} where username = ?`, [username], (err, userInfo) => {
              if (!openedDb) close(db)
              if (err) {
                log.e(mod, fun + ' retrieveUserInfo', err.message)
                reject(err)
              } else {
                const { id, username } = userInfo
                resolve({ id, username })
              }
            })
          }
        )
      }
    })
  })
}

exports.dbRegisterUser = async (db, { username, email, password, id }) => {
  try {
    const userCreds = {
      username,
      password: hashPassword(password),
      email,
    }
    if (id) userCreds.id = id

    const usr = await this.dbCreateUserCheckExists(db, userCreds)
    return { id: usr.id, username: usr.username }
  } catch (err) {
    log.e(mod, 'registerUser', err)
    throw err
  }
}

exports.dbCreateUser = (openedDb, user) => {
  const fun = 'createUser'
  const { username, password, email } = user

  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO ${TBL_USERS}(username,password,email) VALUES(?,?,?)`,
      [username, password, email],
      (err) => {
        if (err) {
          if (!openedDb) close(db)
          log.e(mod, fun + ' insert', err.message)
          return reject(err)
        }
        log.i(
          mod,
          fun,
          `(${TBL_USERS}) user created: '${username}'`,
          log.getContext(null, { opType: 'post_user' })
        )
        db.get(`SELECT * FROM ${TBL_USERS} where username = ?`, [username], (err, row) => {
          if (!openedDb) close(db)
          if (err) {
            log.e(mod, fun + ' select', err.message)
            return reject(err)
          }
          resolve({ id: row.id, username: row.username })
        })
      }
    )
  })
}
exports.dbUpdatePassword = (openedDb, username, password) => {
  const fun = 'updatePassword'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    // db.serialize(() => { // Needed for consecutive transactions
    db.run(
      `UPDATE ${TBL_USERS} SET password = ? WHERE username = ?`,
      [password, username],
      (err) => {
        if (!openedDb) close(db)
        if (err) {
          log.e(mod, fun, err.message)
          return reject(err.message)
        }
        log.i(
          mod,
          fun,
          `${TBL_USERS}: password reset for user '${username}'`,
          log.getContext(null, { opType: 'put_password' })
        )
        resolve({ username: username })
      }
    )
    // });
  })
}

exports.dbDeleteUserWithName = (openedDb, username) => {
  const fun = 'deleteUserWithName'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USERS} WHERE username = ?`, [username], function (err) {
      if (!openedDb) close(db)
      if (err) {
        log.e(mod, fun, err.message)
        return reject(err)
      }
      log.i(
        mod,
        fun,
        `${TBL_USERS} : A row has been deleted with username '${username}'`,
        log.getContext(null, { opType: 'delete_user' })
      )
      resolve({ username: username })
    })
  })
}

exports.dbDeleteUser = (openedDb, id) => {
  const fun = 'deleteUser'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USERS} WHERE id = ?`, [id], (err) => {
      if (!openedDb) close(db)
      if (err) {
        log.e(mod, fun, err.message)
        return reject(err)
      }
      log.i(
        mod,
        fun,
        `${TBL_USERS} : A row was deleted with id ${id}`,
        log.getContext(null, { opType: 'delete_user' })
      )
      resolve({ id })
    })
  })
}

// ROLES
exports.dbCreateRoles = (openedDb, roles) => {
  const fun = 'createRoles'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      roles.forEach((role) => {
        db.run(`INSERT INTO ${TBL_ROLES}(role,desc) VALUES(?,?)`, [role.role, role.desc], (err) => {
          if (err) {
            log.e(mod, fun, err.message)
            if (!openedDb) close(db)
            return reject(err)
          }
          log.i(
            mod,
            fun,
            `(${TBL_ROLES}) A role has been created with name '${role.role}'`,
            log.getContext(null, { opType: 'add_role' })
          )
        })
      })
      if (!openedDb) close(db)
      resolve({ roles })
    })
  })
}

exports.dbGetRoles = (openedDb) => {
  const fun = 'getRoles'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${TBL_ROLES}`, (err, rows) => {
      if (!openedDb) close(db)
      if (err) {
        log.e(mod, fun, err.message)
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}
exports.dbGetRoleById = (openedDb, role) => {
  const fun = 'getRoleById'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_ROLES} WHERE role = ?`, [role], function (err, row) {
      if (!openedDb) close(db)
      if (err) {
        log.e(mod, fun, err.message)
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}
exports.dbGetUserRolesByUsername = async (openedDb, username) => {
  const fun = 'getUserRolesByUsername'
  try {
    const user = await this.dbGetUserByUsername(openedDb, username)
    if (user) {
      const db = openedDb || open()
      return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${TBL_USER_ROLES} WHERE userId = ?`, [user.id], function (err, rows) {
          if (!openedDb) close(db)
          if (err) {
            log.e(mod, fun, err.message)
            reject(err)
          } else {
            resolve(rows)
          }
        })
      })
    } else {
      return Promise.reject(new Error(`User ${username} not found!`))
    }
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}
exports.dbDeleteUserRole = (openedDb, userId, role) => {
  const fun = 'deleteUserRole'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USER_ROLES} WHERE userId = ? AND role = ?`, [userId, role], (err) => {
      if (!openedDb) close(db)
      if (err) {
        log.e(mod, fun, err.message)
        return reject(err)
      }
      log.i(
        mod,
        fun,
        `${TBL_USER_ROLES}: A role was deleted with userId ${userId} and role '${role}'`,
        log.getContext(null, { opType: 'delete_userRole' })
      )
      resolve({ userId, role })
    })
  })
}

exports.dbCreateUserRole = (openedDb, userRole) => {
  const fun = 'dbCreateUserRole'
  const { userId, role } = userRole
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO ${TBL_USER_ROLES}(userId,role) VALUES(?,?)`, [userId, role], (err) => {
      if (!openedDb) close(db)
      if (err) {
        log.e(mod, fun, err.message)
        if (`${err.message}`.startsWith('SQLITE_CONSTRAINT: UNIQUE constraint failed'))
          return reject(
            new InternalServerError(`Role already assigned to user (${err.message})`, mod, fun)
          )
        if (`${err.message}`.startsWith('SQLITE_CONSTRAINT: FOREIGN KEY constraint failed'))
          return reject(
            new InternalServerError(`User or role not found (${err.message})`, mod, fun)
          )
        reject(err)
      }
      log.i(
        mod,
        fun,
        `(${TBL_USER_ROLES}) A row was inserted with userId ${userId} and role '${role}'`,
        log.getContext(null, { opType: 'post_userRole' })
      )
      resolve(userRole)
    })
  })
}

// Default Form
exports.dbGetDefaultForm = (openedDb, user) => {
  const fun = 'getDefaultForm'
  if (user) {
    const db = openedDb || open()
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM Default_Value_Form WHERE userId = ?`, [user.id], function (err, rows) {
        if (!openedDb) close(db)
        if (err) {
          log.e(mod, fun, err.message)
          return reject(err)
        }
        resolve(
          rows.map((row) => {
            return { name: row.name, defaultValue: JSON.parse(row.defaultValue) }
          })
        )
      })
    })
  } else {
    return Promise.reject(new NotFoundError(`Default value for '${user.username}' not found!`))
  }
}
exports.dbGetDefaultFormWithName = (openedDb, user, name) => {
  const fun = 'getDefaultFormWithName'
  if (user) {
    const db = openedDb || open()
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM Default_Value_Form WHERE userId = ? and name = ?`,
        [user.id, name],
        (err, row) => {
          if (!openedDb) close(db)
          if (err) {
            log.e(mod, fun, err.message)
            return reject(err)
          }
          resolve(JSON.parse(row.defaultValue))
        }
      )
    })
  } else {
    return Promise.reject(
      new NotFoundError(`Default value for '${user.username}' and name: '${name}' not found!`)
    )
  }
}
exports.dbDeleteDefaultForm = (openedDb, user, name) => {
  const fun = 'deleteDefaultForm'
  const db = openedDb || open()
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Default_Value_Form WHERE userId = ? AND name = ?`,
      [user.id, name],
      (err) => {
        if (!openedDb) close(db)
        if (err) {
          log.e(mod, fun, err.message)
          return reject(err)
        }
        log.i(
          mod,
          fun,
          `(Default_Value_Form) A row was deleted with userId ${user.id} and name : ${name}`,
          log.getContext(null, { opType: 'delete_defaultForm' })
        )
        resolve({})
      }
    )
  })
}

exports.dbUpdateDefaultForm = (openedDb, user, data) => {
  const fun = 'updateDefaultForm'
  const db = openedDb || open()
  return this.dbGetDefaultFormWithName(db, user, data.name).then((defaultValue) => {
    if (!defaultValue) {
      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Default_Value_Form(userId,name,defaultValue) VALUES(?,?,?)`,
          [user.id, data.name, JSON.stringify(data.defaultValue)],
          (err) => {
            if (!openedDb) close(db)

            if (err) {
              log.e(mod, fun, err.message)
              return reject(err)
            }
            log.i(
              mod,
              fun,
              `(Default_Value_Form) A row was inserted with userId ${user.id} and name : ${data.name}`,
              log.getContext(null, { opType: 'post_defaultForm' })
            )
            resolve(data)
          }
        )
      })
    } else {
      // edit
      return new Promise((resolve, reject) => {
        db.run(
          `UPDATE Default_Value_Form SET defaultValue = ? WHERE userId = ? and name = ?`,
          [JSON.stringify(data.defaultValue), user.id, data.name],
          (err) => {
            if (!openedDb) close(db)
            if (err) {
              log.e(mod, fun, err.message)
              return reject(err)
            }
            log.i(
              mod,
              fun,
              `Default_Value_Form : A row has been edited with userId ${user.id} and name : ${data.name}`,
              log.getContext(null, { opType: 'put_defaultForm' })
            )
            resolve(data)
          }
        )
      })
    }
  })
}

// OTHER
exports.dbOpen = open
exports.dbClose = close
