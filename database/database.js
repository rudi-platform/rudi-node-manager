const sqlite3 = require('sqlite3').verbose();
const Promise = require('bluebird');
const config = require('../config/config');

const open = function () {
  const db = new sqlite3.Database(
    `${config.database.db_directory}/rudy_manager.db`,
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err);
        console.error(err.message);
      } else {
      }
    },
  );
  return db.exec("PRAGMA foreign_keys = ON");
};
const close = function (db) {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
  });
};

exports.getUserByUsername = (username) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM Users WHERE username = ?`, [username], function (err, row) {
      if (err) {
        console.log(err.message);
        reject(err);
      } else {
        resolve(row);
      }
      close(db);
    });
  });
};
exports.getUsers = () => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT Users.id, Users.username, Users.email, GROUP_CONCAT(User_Roles.role) AS roles ' +
        'FROM Users LEFT JOIN User_Roles ON User_Roles.userId = Users.id ' +
        'GROUP BY Users.id;',
      function (err, rows) {
        if (err) {
          console.log(err.message);
          reject(err);
        } else {
          const result = rows.map((row) => {
            if (row.roles) {
              row.roles = row.roles.split(',');
            }
            return row;
          });
          resolve(result);
        }
        close(db);
      },
    );
  });
};
exports.createUser = (user) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.serialize(function () {
      db.run(
        `INSERT INTO Users(username,password,email) VALUES(?,?,?)`,
        [user.username, user.password, user.email],
        function (err) {
          if (err) {
            console.log(err.message);
            reject(err);
          } else {
            console.log(`Users : A row has been inserted with rowid ${this.lastID}`);
            const id = this.lastID;

            // TODO : replace by count SELECT COUNT (*) FROM Users;
            db.get(
              `SELECT COUNT (*) FROM User_Roles WHERE role = ?`,
              ['SuperAdmin'],
              function (err, result) {
                if (err) {
                  console.log(err.message);
                  reject(err);
                } else {
                  if (result && result['COUNT (*)'] < 1) {
                    createUserRole({ userId: id, role: 'SuperAdmin' })
                      .then(() => {
                        resolve({ id: this.lastID, username: user.username });
                      })
                      .catch((err) => {
                        console.log(err.message);
                        reject(err);
                      });
                  } else {
                    resolve({ id: this.lastID, username: user.username });
                  }
                }
              },
            );
          }
          close(db);
        },
      );
    });
  });
};
exports.deleteUser = (username) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM Users WHERE username = ?`, [username], function (err) {
      if (err) {
        console.log(err.message);
        reject(err);
      } else {
        console.log(`Users : A row has been deleted with username ${username}`);
        resolve({ username: username });
      }
      close(db);
    });
  });
};

// ROLES
exports.createRoles = (roles) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.serialize(function () {
      roles.forEach((role) => {
        db.run(`INSERT INTO Roles(role,desc) VALUES(?,?)`, [role.role, role.desc], function (err) {
          if (err) {
            console.log(err.message);
            reject(err);
          } else {
            console.log(`Roles : A row has been inserted with name ${role.role}`);
          }
        });
      });
      resolve({ roles });
      close(db);
    });
  });
};
exports.getRoles = () => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Roles', function (err, rows) {
      if (err) {
        console.log(err.message);
        reject(err);
      } else {
        resolve(rows);
      }
      close(db);
    });
  });
};
exports.getRoleById = (role) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM Roles WHERE role = ?`, [role], function (err, row) {
      if (err) {
        console.log(err.message);
        reject(err);
      } else {
        resolve(row);
      }
      close(db);
    });
  });
};
exports.getUserRolesByUsername = (username) => {
  return this.getUserByUsername(username)
    .then((user) => {
      if (user) {
        const db = open();
        return new Promise((resolve, reject) => {
          db.get(`SELECT * FROM User_Roles WHERE userId = ?`, [user.id], function (err, rows) {
            if (err) {
              console.log(err.message);
              reject(err);
            } else {
              resolve(rows);
            }
            close(db);
          });
        });
      } else {
        return Promise.reject(new Error(`User ${username} already exist!`));
      }
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};
exports.deleteUserRole = (userId, role) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM User_Roles WHERE userId = ? AND role = ?`, [userId, role], function (err) {
      if (err) {
        console.log(err.message);
        reject(err);
      } else {
        console.log(`User_Roles : A row has been deleted with userId ${userId} and role ${role}`);
        resolve({ userId, role });
      }
      close(db);
    });
  });
};

const createUserRole = (userRole) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO User_Roles(userId,role) VALUES(?,?)`,
      [userRole.userId, userRole.role],
      function (err) {
        if (err) {
          console.log(err.message);
          reject(err);
        } else {
          console.log(
            `User_Roles : A row has been inserted with userId ${userRole.userId} and role ${userRole.role}`,
          );
          resolve(userRole);
        }
        close(db);
      },
    );
  });
};
exports.createUserRole = createUserRole;

// OTHER
exports.open = open;
exports.close = close;
exports.openOrCreateDB = () => {
  return new sqlite3.Database(`${config.database.db_directory}/rudy_manager.db`, (err) => {
    if (err) {
      console.error(err);
    }
    console.log('Creation of (or Connected to) the rudy_manager database.');
  });
};
