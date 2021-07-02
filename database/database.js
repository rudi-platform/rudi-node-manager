const sqlite3 = require('sqlite3').verbose();
const Promise = require('bluebird');
const config = require('../config/config');

const open = function () {
  return new sqlite3.Database(
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
exports.getUserById = (id) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM Users WHERE id = ?`, [id], function (err, row) {
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
exports.getUsers = (options) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Users', function (err, rows) {
      if (err) {
        console.log(err.message);
        reject(err);
      } else {
        if (!options || !options.password) {
          rows.forEach((row) => {
            delete row.password;
          });
        }
        resolve(rows);
      }
      close(db);
    });
  });
};
exports.createUser = (user) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Users(username,password,email) VALUES(?,?,?)`,
      [user.username, user.password, user.email],
      function (err) {
        if (err) {
          console.log(err.message);
          reject(err);
        } else {
          console.log(`Users : A row has been inserted with rowid ${this.lastID}`);
          resolve({ id: this.lastID });
        }
        close(db);
      },
    );
  });
};
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
