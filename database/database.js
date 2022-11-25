const mod = 'db'

// ---- External dependencies -----
const sqlite3 = require('sqlite3').verbose()
// const { genSaltSync, hashSync } = require('bcrypt')
const Promise = require('bluebird')

// ---- Internal dependencies -----
const { getDbConf } = require('../config/config')
const {
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  statusOK,
  RudiError,
  BadRequestError,
} = require('../utils/errors')
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
const dbOpen = () => {
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

const dbClose = (db) => {
  db.close((err) => {
    if (err) log.e(mod, 'dbClose', err.message)
  })
  return statusOK('DB closed')
}

// exports.dbExec = (openedDb, sqlReq, params) => {
//   const fun = 'dbExec'
//   const db = openedDb || open()
//   return new Promise((resolve, reject) => {
//     db.run(`SELECT username, password FROM Users WHERE username = 'Oliv'`, [], (err, row) => {
//       if (!openedDb) close(db)
//       if (err) {
//         log.e(mod, fun, err)
//         return reject(err)
//       }
//       log.d(mod, fun, row)
//       return resolve(row)
//     })
//   })
// }

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
exports.dbGetHashedPassword = async (openedDb, username) => {
  const fun = 'dbGetHashedPassword'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT username, password FROM ${TBL_USERS} WHERE username = ?`,
      [username],
      (err, pwd) => {
        if (!openedDb) dbClose(db)
        if (err) {
          log.e(mod, fun, err.message)
          reject(err)
        } else {
          resolve(pwd)
        }
      }
    )
  })
}

exports.dbGetUserByField = (openedDb, field, val) => {
  const fun = 'dbGetUserByField'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, username, email FROM ${TBL_USERS} WHERE ${field} = ?`,
      [val],
      (err, userInfo) => {
        if (!openedDb) dbClose(db)
        if (err) {
          log.e(mod, fun, err.message)
          reject(err)
        } else {
          resolve(userInfo)
        }
      }
    )
  })
}
exports.dbGetUserByUsername = (openedDb, username) =>
  this.dbGetUserByField(openedDb, 'username', username)
exports.dbGetUserById = (openedDb, id) => this.dbGetUserByField(openedDb, 'id', id)
exports.dbGetUserByEmail = (openedDb, email) => this.dbGetUserByField(openedDb, 'email', email)

exports.dbExistsUser = async (openedDb, username) => {
  const user = await this.dbGetUserByUsername(openedDb, username)
  return !!user?.username
}

exports.dbGetUsers = (openedDb) => {
  const fun = 'getUsers'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT ${TBL_USERS}.id, ${TBL_USERS}.username, ${TBL_USERS}.email, GROUP_CONCAT(${TBL_USER_ROLES}.role)` +
        ` AS roles FROM ${TBL_USERS} LEFT JOIN ${TBL_USER_ROLES} ON ${TBL_USER_ROLES}.userId = ${TBL_USERS}.id` +
        ` GROUP BY ${TBL_USERS}.id HAVING ${TBL_USERS}.id > 0;`,
      (err, rows) => {
        if (!openedDb) dbClose(db)
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
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_USERS} WHERE username = ?`, [username], (err, row) => {
      if (err) {
        if (!openedDb) dbClose(db)
        log.e(mod, fun + ' doesUserExist', err.message)
        return reject(err)
      }
      if (row?.id) {
        if (!openedDb) dbClose(db)
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
              if (!openedDb) dbClose(db)
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
              if (!openedDb) dbClose(db)
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
  const fun = 'dbRegisterUser'
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
    log.e(mod, fun, err)
    throw err
  }
}

exports.dbCreateUser = (openedDb, userInfo) => {
  const fun = 'dbCreateUser'
  const { username, password, email } = userInfo

  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO ${TBL_USERS}(username,password,email) VALUES(?,?,?)`,
      [username, password, email],
      (err) => {
        if (err) {
          if (!openedDb) dbClose(db)
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
          if (!openedDb) dbClose(db)
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

exports.dbUpdateUser = (openedDb, userInfo) => {
  const fun = 'dbUpdateUser'
  const { id, username, password, email } = userInfo
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE ${TBL_USERS} SET username = ?, email = ?` +
        (!!password ? `, password = '${password}'` : '') +
        ` WHERE id = ?`,
      [username, email, id],
      (err) => {
        if (err) {
          if (!openedDb) dbClose(db)
          log.e(mod, fun + ' insert', err.message)
          return reject(err)
        }
        log.i(
          mod,
          fun,
          `(${TBL_USERS}) user updated: '${username}'`,
          log.getContext(null, { opType: 'post_user' })
        )
        db.get(`SELECT * FROM ${TBL_USERS} where username = ?`, [username], (err, row) => {
          if (!openedDb) dbClose(db)
          if (err) {
            log.e(mod, fun + '.select', err.message)
            return reject(err)
          }
          if (!row) {
            log.e(mod, fun + '.select', `User doesn't exist: ${username}`)
            return reject(new BadRequestError(`User doesn't exist: ${username}`))
          }
          resolve({ id: row.id, username: row.username })
        })
      }
    )
  })
}

exports.dbHashAndUpdatePassword = async (openedDb, username, password) => {
  const hashedPwd = await hashPassword(password)
  return await this.dbUpdatePassword(openedDb, username, hashedPwd)
}

exports.dbUpdatePassword = (openedDb, username, password) => {
  const fun = 'updatePassword'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    // db.serialize(() => { // Needed for consecutive transactions
    db.run(
      `UPDATE ${TBL_USERS} SET password = ? WHERE username = ?`,
      [password, username],
      (err) => {
        if (!openedDb) dbClose(db)
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
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USERS} WHERE username = ?`, [username], function (err) {
      if (!openedDb) dbClose(db)
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

exports.dbDeleteUserWithId = (openedDb, id) => {
  const fun = 'deleteUser'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USERS} WHERE id = ?`, [id], (err) => {
      if (!openedDb) dbClose(db)
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
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      roles.forEach((role) => {
        db.run(
          `INSERT INTO ${TBL_ROLES}(role,desc,hide) VALUES(?,?,?)`,
          [role.role, role.desc, !!role.hide],
          (err) => {
            if (err) {
              log.e(mod, fun, err.message)
              if (!openedDb) dbClose(db)
              return reject(err)
            }
            log.i(
              mod,
              fun,
              `(${TBL_ROLES}) A role has been created with name '${role.role}'`,
              log.getContext(null, { opType: 'add_role' })
            )
          }
        )
      })
      if (!openedDb) dbClose(db)
      resolve({ roles })
    })
  })
}

exports.dbGetRoles = (openedDb) => {
  const fun = 'getRoles'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${TBL_ROLES}`, (err, rows) => {
      if (!openedDb) dbClose(db)
      if (err) {
        log.e(mod, fun, err.message)
        return reject(err)
      } else {
        const roles = []
        rows.map((roleInfo) => {
          if (roleInfo.role != 'Moniteur' || roleInfo.role != 'SuperAdmin') roles.push(roleInfo)
        })
        return resolve(roles)
      }
    })
  })
}
exports.dbGetUserRoles = (openedDb) => {
  const fun = 'getRoles'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${TBL_USER_ROLES}`, (err, rows) => {
      if (!openedDb) dbClose(db)
      if (err) {
        log.e(mod, fun, err.message)
        return reject(err)
      } else {
        return resolve(rows)
      }
    })
  })
}
exports.dbGetRoleById = (openedDb, role) => {
  const fun = 'getRoleById'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_ROLES} WHERE role = ?`, [role], function (err, row) {
      if (!openedDb) dbClose(db)
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
      const db = openedDb || dbOpen()
      return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${TBL_USER_ROLES} WHERE userId = ?`, [user.id], function (err, rows) {
          if (!openedDb) dbClose(db)
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

exports.dbGetUserRolesByUserId = async (openedDb, userId) => {
  const fun = 'dbGetUserRolesByUserId'
  try {
    const user = await this.dbGetUserById(openedDb, userId)
    if (user) {
      const db = openedDb || dbOpen()
      return new Promise((resolve, reject) => {
        db.all(
          `SELECT role FROM ${TBL_USER_ROLES} WHERE userId = ?`,
          [user.id],
          function (err, rows) {
            if (!openedDb) dbClose(db)
            if (err) {
              log.e(mod, fun, err.message)
              reject(err)
            } else {
              resolve(rows.map((row) => row?.role))
            }
          }
        )
      })
    } else {
      return Promise.reject(new Error(`User ${userId} not found!`))
    }
  } catch (err) {
    log.e(mod, fun, err)
    throw err
  }
}

exports.dbDeleteUserRole = (openedDb, userId, role) => {
  const fun = 'deleteUserRole'
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USER_ROLES} WHERE userId = ? AND role = ?`, [userId, role], (err) => {
      if (!openedDb) dbClose(db)
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

exports.dbCreateUserRole = (openedDb, userInfo) => {
  const fun = 'dbCreateUserRole'
  const { userId, role } = userInfo
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO ${TBL_USER_ROLES}(userId,role) VALUES(?,?)`, [userId, role], (err) => {
      if (!openedDb) dbClose(db)
      if (err) {
        log.e(mod, fun, err.message)
        if (`${err.message}`?.startsWith('SQLITE_CONSTRAINT: UNIQUE constraint failed'))
          return reject(
            new InternalServerError(`Role already assigned to user (${err.message})`, mod, fun)
          )
        if (`${err.message}`?.startsWith('SQLITE_CONSTRAINT: FOREIGN KEY constraint failed'))
          return reject(
            new InternalServerError(`User or role not found (${err.message})`, mod, fun)
          )
        reject(new InternalServerError(err))
      }
      log.i(
        mod,
        fun,
        `(${TBL_USER_ROLES}) A row was inserted with userId ${userId} and role '${role}'`,
        log.getContext(null, { opType: 'post_userRole' })
      )
      resolve(userInfo)
    })
  })
}

exports.dbUpdateUserRoles = async (openedDb, userInfo) => {
  const fun = 'dbUpdateUserRoles'
  try {
    const { userId, username, roles: targetRoles } = userInfo
    const db = openedDb || dbOpen()
    let origRoles = await this.dbGetUserRolesByUserId(db, userId)
    // console.debug(`T (dbUpdateUserRoles) user '${username} (${userId})' -> dbRoles:`, origRoles)
    // console.debug(
    //   `T (dbUpdateUserRoles) user '${username} (${userId})' -> targetRoles:`,
    //   targetRoles
    // )
    await Promise.all(
      targetRoles.map((newRole) => {
        // console.debug(`T (dbUpdateUserRoles) user '${username}' -> role:`, newRole)
        new Promise((resolve, reject) => {
          const i = origRoles.indexOf(newRole)
          // console.log('T (dbUpdateUserRoles) found:', i)
          if (i === -1) {
            this.dbCreateUserRole(db, { userId, role: newRole })
              .then((res) => {
                log.i(mod, fun, `Role added to  user '${username}'`, newRole)
                return resolve(`Role added to user '${username}': ${newRole}`)
              })
              .catch((err) => reject(`(dbUpdateUserRoles.addNew) ${err}`))
          } else {
            origRoles.splice(i, 1)
            // console.log(`T (dbUpdateUserRoles) Role kept for user '${username}': ${newRole}`)
            // console.log(`T (dbUpdateUserRoles) Roles left:`, origRoles)
            resolve(`Role kept for user '${username}': ${newRole}`)
          }
        })
      })
    )
    // console.log(`T (dbUpdateUserRoles) origRoles left:`, origRoles)

    await Promise.all(
      origRoles.map(
        (roleToRemove) =>
          new Promise((resolve, reject) => {
            this.dbDeleteUserRole(db, userId, roleToRemove)
              .then((res) => {
                log.i(mod, fun, `Role removed to user '${username}': ${roleToRemove}`)
                return resolve(`Role removed to user '${username}': ${roleToRemove}`)
              })
              .catch((err) => reject(`(dbUpdateUserRoles.delOld) ${err}`))
          })
      )
    )
    if (!openedDb) dbClose(db)
  } catch (err) {
    log.e(mod, fun, `(dbUpdateUserRoles) ERR: ${err}`)
    throw new RudiError(err)
  }
}

// Default Form
exports.dbGetDefaultForm = (openedDb, user) => {
  const fun = 'getDefaultForm'
  if (user) {
    const db = openedDb || dbOpen()
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM Default_Value_Form WHERE userId = ?`, [user.id], function (err, rows) {
        if (!openedDb) dbClose(db)
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
    const db = openedDb || dbOpen()
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM Default_Value_Form WHERE userId = ? and name = ?`,
        [user.id, name],
        (err, row) => {
          if (!openedDb) dbClose(db)
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
  const db = openedDb || dbOpen()
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Default_Value_Form WHERE userId = ? AND name = ?`,
      [user.id, name],
      (err) => {
        if (!openedDb) dbClose(db)
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
  const db = openedDb || dbOpen()
  return this.dbGetDefaultFormWithName(db, user, data.name).then((defaultValue) => {
    if (!defaultValue) {
      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Default_Value_Form(userId,name,defaultValue) VALUES(?,?,?)`,
          [user.id, data.name, JSON.stringify(data.defaultValue)],
          (err) => {
            if (!openedDb) dbClose(db)

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
            if (!openedDb) dbClose(db)
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
exports.dbOpen = dbOpen
exports.dbClose = dbClose
