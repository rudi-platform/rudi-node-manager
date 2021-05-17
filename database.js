const sqlite3 = require('sqlite3').verbose();
const Promise = require('bluebird');
const config = require('./config/config');

const open = function() {
  return new sqlite3.Database(`${config.database.db_directory}/rudy_manager.db`, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Connected to the rudy_manager database.');
    }
  });
};
const close = function(db) {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Close the database connection.');
  });
};


/* db.serialize(() => {
  db.each(`SELECT id as id,
      username as username
           FROM users`, (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log('TEST !');
    console.log(row.id + '\t' + row.name);
  });
}); */


exports.getUserByUsername = (username) => {
  const db = open();

  close(db);
};
exports.getUsers = () => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Users', function(err, rows) {
      if (err) {
        console.log(err.message);
        reject(err);
      } else {
        console.log(rows);
        resolve(rows);
      }
      close(db);
    });
  });
};
exports.createUser = (user) => {
  const db = open();
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO Users(username,password,salt) VALUES(?,?,?)`,
        [user.username, user.passwordHash, user.salt], function(err) {
          if (err) {
            console.log(err.message);
            reject(err);
          } else {
            console.log(`A row has been inserted with rowid ${this.lastID}`);
            resolve({id: this.lastID});
          }
          close(db);
        });
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
