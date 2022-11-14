const mod = 'db';

// ---- External dependencies -----
const sqlite3 = require('sqlite3').verbose();
const Promise = require('bluebird');

// ---- Internal dependencies -----
const { getDbConf } = require('../config/config');
const { ForbiddenError, InternalServerError } = require('../utils/errors');
const log = require('../utils/logger');

// ---- Constants -----
const DB_NAME = getDbConf('db_filename');
const DB_FILE = `${getDbConf('db_directory')}${DB_NAME ? `/${DB_NAME}` : ''}`.trim();

const TBL_USERS = 'Users';
exports.TBL_USERS = TBL_USERS;

const TBL_ROLES = 'Roles';
exports.TBL_ROLES = TBL_ROLES;

const TBL_USER_ROLES = 'User_Roles';
exports.TBL_USER_ROLES = TBL_USER_ROLES;

// ---- Functions -----
const open = function () {
  const fun = 'open';
  const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      log.e(mod, fun, err);
      log.e(mod, fun, err.message);
    } else {
      // TODO: return something?
    }
  });
  return db.exec('PRAGMA foreign_keys = ON');
};
const close = function (db) {
  const fun = 'close';
  db.close((err) => {
    if (err) log.e(mod, fun, err.message);
  });
};

// ---- Controllers -----
exports.normalizeUserTableName = () => {
  const fun = 'normalizeUserTableName';
  const oldTblName = 'users';
  const fakeName = 'totox';
  const db = open();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${oldTblName}'`,
      [],
      (err, row) => {
        if (err) {
          log.d(mod, `${fun}.check`, err.message);
          close(db);
          return reject(err);
        }
        if (!row) {
          close(db);
          // log.d(mod, `${fun}.check`, `No table found with name '${oldTblName}'`);
          return resolve(`No table found with name '${oldTblName}'`);
        }

        console.log(mod, `${fun}.check`, JSON.stringify(row));

        db.run(`ALTER TABLE '${oldTblName}' RENAME TO '${fakeName}'`, [], (err, row) => {
          if (err) {
            log.e(mod, `${fun}.renameToto`, err.message);
            close(db);
            return reject(err);
          }
          if (!row) {
            close(db);
            return resolve(`Renaming table '${oldTblName}' to temp name '${fakeName}'`);
          }
          console.log(mod, `${fun}.renameToto`, JSON.stringify(row));
          db.run(`ALTER TABLE '${fakeName}' RENAME TO '${TBL_USERS}'`, [], (err, row) => {
            if (err) {
              log.e(mod, `${fun}.renameReal`, err.message);
              close(db);
              return reject(err);
            } else {
              console.log(mod, fun, JSON.stringify(row));
              close(db);
              return resolve('Users table name normalized');
            }
          });
        });
      }
    );
  });
};

exports.getUserByUsername = (username) => {
  const fun = 'getUserByUsername';
  const db = open();
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_USERS} WHERE username = ?`, [username], function (err, userInfo) {
      if (err) {
        log.e(mod, fun, err.message);
        reject(err);
      } else {
        // const { id, username, email } = userInfo;
        resolve(userInfo);
      }

      close(db);
    });
  });
};

exports.existsUser = async (username) => {
  const user = await this.getUserByUsername(username);
  return !!user?.username;
};

exports.getUsers = () => {
  const fun = 'getUsers';
  const db = open();
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT ${TBL_USERS}.id, ${TBL_USERS}.username, ${TBL_USERS}.email, GROUP_CONCAT(${TBL_USER_ROLES}.role) ` +
        `AS roles FROM ${TBL_USERS} LEFT JOIN ${TBL_USER_ROLES} ON ${TBL_USER_ROLES}.userId = ${TBL_USERS}.id ` +
        `GROUP BY ${TBL_USERS}.id;`,
      (err, rows) => {
        if (err) {
          log.e(mod, fun, err.message);
          reject(err);
        } else {
          const result = rows.map((row) => {
            if (row.roles) row.roles = row.roles.split(',');
            return row;
          });
          resolve(result);
        }
        close(db);
      }
    );
  });
};

/**
 * Check if the users exists, creates it if not.
 * @param {Object} user
 * @return {Promise} User id and username when successful
 * @throws {ForbiddenError} user already exists
 */
exports.safeCreateUser = (user) => {
  const fun = 'safeCreateUser';
  console.log(user)
  const { username, password, email, id } = user;
  const db = open();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(`SELECT * FROM ${TBL_USERS} WHERE username = ?`, [username], (err, row) => {
        if (err) {
          log.e(mod, fun + ' doesUserExist', err.message);
          reject(err);
        } else {
          if (row?.id) {
            log.e(mod, fun + ' userExists', err.message);
            reject(new ForbiddenError(`User '${username}' already exists`));
          } else {
            db.run(
              `INSERT INTO ${TBL_USERS}(username,password,email${id ? ',id' : ''})` +
                ` VALUES(?,?,?${id ? ',?' : ''})`,
              [username, password, email, id],
              (err) => {
                if (err) {
                  log.e(mod, fun + ' cannotCreateUser', err.message);
                  reject(err);
                } else {
                  log.i(
                    mod,
                    fun,
                    `${TBL_USERS} : user created: '${username}'`,
                    log.getContext(null, { opType: 'post_user' })
                  );
                  db.get(
                    `SELECT * FROM ${TBL_USERS} where username = ?`,
                    [username],
                    (err, userInfo) => {
                      if (err) {
                        log.e(mod, fun + ' retrieveUserInfo', err.message);
                        reject(err);
                      } else {
                        const { id, username } = userInfo;
                        resolve({ id, username });
                      }
                    }
                  );
                }
              }
            );
          }
        }
        close(db);
      });
    });
  });
};

exports.createUser = (user) => {
  const fun = 'createUser';
  const { username, password, email } = user;

  const db = open();
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `INSERT INTO ${TBL_USERS}(username,password,email) VALUES(?,?,?)`,
        [username, password, email],
        (err) => {
          if (err) {
            log.e(mod, fun, err.message);
            reject(err);
          } else {
            log.i(
              mod,
              fun,
              `(${TBL_USERS}) user created: '${username}'`,
              log.getContext(null, { opType: 'post_user' })
            );
            db.get(`SELECT * FROM ${TBL_USERS} where username = ?`, [username], (err, row) => {
              if (err) {
                log.e(mod, fun, err.message);
                reject(err);
              } else {
                // console.log(JSON.stringify(row));
                resolve({ id: row.id, username: row.username });

                // TODO : replace by count SELECT COUNT (*) FROM ${USER_TABLE};
                // db.get(
                //   `SELECT COUNT (*) FROM ${TBL_USER_ROLES} WHERE role = ?`,
                //   ['SuperAdmin'],
                //   (err, result) => {
                //     if (err) {
                //       log.e(mod, fun, err.message);
                //       reject(err);
                //     } else {
                //       if (result && result['COUNT (*)'] < 1) {
                //         createUserRole({ userId: id, role: 'SuperAdmin' })
                //           .then(() => {
                //             resolve({ id: this.lastID, username: username });
                //           })
                //           .catch((err) => {
                //             log.e(mod, fun, err.message);
                //             reject(err);
                //           });
                //       } else {
                //         resolve({ id: this.lastID, username: username });
                //       }
                //     }
                //   },
                // );
              }
            });
          }
          close(db);
        }
      );
    });
  });
};
exports.updatePassword = (username, password) => {
  const fun = 'updatePassword';
  const db = open();
  return new Promise((resolve, reject) => {
    // db.serialize(() => { // Needed for consecutive transactions
    db.run(
      `UPDATE ${TBL_USERS} SET password = ? WHERE username = ?`,
      [password, username],
      (err) => {
        if (err) {
          log.e(mod, fun, err.message);
          reject(err.message);
        } else {
          log.i(
            mod,
            fun,
            `${TBL_USERS}: password reset for user '${username}'`,
            log.getContext(null, { opType: 'put_password' })
          );
          resolve({ username: username });
        }
        close(db);
      }
    );
    // });
  });
};
exports.deleteUserWithName = (username) => {
  const fun = 'deleteUserWithName';
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USERS} WHERE username = ?`, [username], function (err) {
      if (err) {
        log.e(mod, fun, err.message);
        reject(err);
      } else {
        log.i(
          mod,
          fun,
          `${TBL_USERS} : A row has been deleted with username ${username}`,
          log.getContext(null, { opType: 'delete_user' })
        );
        resolve({ username: username });
      }
      close(db);
    });
  });
};

exports.deleteUser = (id) => {
  const fun = 'deleteUser';
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${TBL_USERS} WHERE id = ?`, [id], function (err) {
      if (err) {
        log.e(mod, fun, err.message);
        reject(err);
      } else {
        log.i(
          mod,
          fun,
          `${TBL_USERS} : A row has been deleted with id ${id}`,
          log.getContext(null, { opType: 'delete_user' })
        );
        resolve({ id: id });
      }
      close(db);
    });
  });
};

// ROLES
exports.createRoles = (roles) => {
  const fun = 'createRoles';
  const db = open();
  return new Promise((resolve, reject) => {
    db.serialize(function () {
      roles.forEach((role) => {
        db.run(
          `INSERT INTO ${TBL_ROLES}(role,desc) VALUES(?,?)`,
          [role.role, role.desc],
          function (err) {
            if (err) {
              log.e(mod, fun, err.message);
              reject(err);
            } else {
              log.i(
                mod,
                fun,
                `(${TBL_ROLES}) A row has been inserted with name ${role.role}`,
                log.getContext(null, { opType: 'add_role' })
              );
            }
          }
        );
      });
      resolve({ roles });
      close(db);
    });
  });
};
exports.getRoles = () => {
  const fun = 'getRoles';
  const db = open();
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${TBL_ROLES}`, function (err, rows) {
      if (err) {
        log.e(mod, fun, err.message);
        reject(err);
      } else {
        resolve(rows);
      }
      close(db);
    });
  });
};
exports.getRoleById = (role) => {
  const fun = 'getRoleById';
  const db = open();
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${TBL_ROLES} WHERE role = ?`, [role], function (err, row) {
      if (err) {
        log.e(mod, fun, err.message);
        reject(err);
      } else {
        resolve(row);
      }
      close(db);
    });
  });
};
exports.getUserRolesByUsername = (username) => {
  const fun = 'getUserRolesByUsername';
  return this.getUserByUsername(username)
    .then((user) => {
      if (user) {
        const db = open();
        return new Promise((resolve, reject) => {
          db.all(
            `SELECT * FROM ${TBL_USER_ROLES} WHERE userId = ?`,
            [user.id],
            function (err, rows) {
              if (err) {
                log.e(mod, fun, err.message);
                reject(err);
              } else {
                resolve(rows);
              }
              close(db);
            }
          );
        });
      } else {
        return Promise.reject(new Error(`User ${username} not found!`));
      }
    })
    .catch((err) => {
      log.e(mod, fun, err);
      throw err;
    });
};
exports.deleteUserRole = (userId, role) => {
  const fun = 'deleteUserRole';
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM ${TBL_USER_ROLES} WHERE userId = ? AND role = ?`,
      [userId, role],
      function (err) {
        if (err) {
          log.e(mod, fun, err.message);
          reject(err);
        } else {
          log.i(
            mod,
            fun,
            `${TBL_USER_ROLES} : A row has been deleted with userId ${userId} and role ${role}`,
            log.getContext(null, { opType: 'delete_userRole' })
          );
          resolve({ userId, role });
        }
        close(db);
      }
    );
  });
};

const createUserRole = (userRole) => {
  const fun = 'createUserRole';
  const { userId, role } = userRole;
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO ${TBL_USER_ROLES}(userId,role) VALUES(?,?)`,
      [userId, role],
      function (err) {
        if (err) {
          log.e(mod, fun, err.message);
          if (`${err.message}`.startsWith('SQLITE_CONSTRAINT: UNIQUE constraint failed'))
            reject(
              new InternalServerError(`Role already assigned to user (${err.message})`, mod, fun)
            );
          else if (`${err.message}`.startsWith('SQLITE_CONSTRAINT: FOREIGN KEY constraint failed'))
            reject(new InternalServerError(`User or role not found (${err.message})`, mod, fun));
          else reject(err);
        } else {
          log.i(
            mod,
            fun,
            `(${TBL_USER_ROLES}) A row has been inserted with userId ${userId} and role ${role}`,
            log.getContext(null, { opType: 'post_userRole' })
          );
          resolve(userRole);
        }
        close(db);
      }
    );
  });
};
exports.createUserRole = createUserRole;

// Default Form
exports.getDefaultForm = (user) => {
  const fun = 'getDefaultForm';
  if (user) {
    const db = open();
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM Default_Value_Form WHERE userId = ?`, [user.id], function (err, rows) {
        if (err) {
          log.e(mod, fun, err.message);
          reject(err);
        } else {
          resolve(
            rows.map((row) => {
              return { name: row.name, defaultValue: JSON.parse(row.defaultValue) };
            })
          );
        }
        close(db);
      });
    });
  } else {
    return Promise.reject(new Error(`Default value for ${user.username} not found!`));
  }
};
exports.getDefaultFormWithName = (user, name) => {
  const fun = 'getDefaultFormWithName';
  if (user) {
    const db = open();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM Default_Value_Form WHERE userId = ? and name = ?`,
        [user.id, name],
        function (err, row) {
          if (err) {
            log.e(mod, fun, err.message);
            reject(err);
          } else {
            resolve(JSON.parse(row.defaultValue));
          }
          close(db);
        }
      );
    });
  } else {
    return Promise.reject(
      new Error(`Default value for ${user.username} and name : ${name} not found!`)
    );
  }
};
exports.deleteDefaultForm = (user, name) => {
  const fun = 'deleteDefaultForm';
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Default_Value_Form WHERE userId = ? AND name = ?`,
      [user.id, name],
      function (err) {
        if (err) {
          log.e(mod, fun, err.message);
          reject(err);
        } else {
          log.i(
            mod,
            fun,
            `Default_Value_Form : A row has been deleted with userId ${user.id} and name : ${name}`,
            log.getContext(null, { opType: 'delete_defaultForm' })
          );
          resolve({});
        }
        close(db);
      }
    );
  });
};

exports.updateDefaultForm = (user, data) => {
  const fun = 'updateDefaultForm';
  return this.getDefaultFormWithName(user, data.name).then((defaultValue) => {
    const db = open();
    if (!defaultValue) {
      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Default_Value_Form(userId,name,defaultValue) VALUES(?,?,?)`,
          [user.id, data.name, JSON.stringify(data.defaultValue)],
          function (err) {
            if (err) {
              log.e(mod, fun, err.message);
              reject(err);
            } else {
              log.i(
                mod,
                fun,
                `(Default_Value_Form) A row has been inserted with userId ${user.id} and name : ${data.name}`,
                log.getContext(null, { opType: 'post_defaultForm' })
              );
              resolve(data);
            }
            close(db);
          }
        );
      });
    } else {
      // edit
      return new Promise((resolve, reject) => {
        db.run(
          `UPDATE Default_Value_Form SET defaultValue = ? WHERE userId = ? and name = ?`,
          [JSON.stringify(data.defaultValue), user.id, data.name],
          function (err) {
            if (err) {
              log.e(mod, fun, err.message);
              reject(err);
            } else {
              log.i(
                mod,
                fun,
                `Default_Value_Form : A row has been edited with userId ${user.id} and name : ${data.name}`,
                log.getContext(null, { opType: 'put_defaultForm' })
              );
              resolve(data);
            }
            close(db);
          }
        );
      });
    }
  });
};

// OTHER
exports.open = open;
exports.close = close;
exports.openOrCreateDB = () => {
  const fun = 'openOrCreateDB';
  return new sqlite3.Database(DB_FILE, (err) => {
    if (err) log.e(mod, fun, err);
    else log.v(mod, fun, 'Creation of (or Connected to) the rudi_manager database.');
  });
};
