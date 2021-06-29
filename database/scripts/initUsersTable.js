const databaseManager = require('../database');
const config = require('../../config/config');
const authControllerPassport = require('../../controllers/authControllerPassport');

const sqlCreateUsersTable =
  'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,' +
  'username TEXT NOT NULL UNIQUE,password TEXT NOT NULL,email TEXT);';

const initFirstUser = () => {
  databaseManager.getUsers().then((rows) => {
    if (!rows.length) {
      console.log('init first user');
      const firstUser = {
        username: config.database.first_user_name,
        password: config.database.first_user_pwd,
        confirmPassword: config.database.first_user_pwd,
        email: config.database.first_user_email,
      };
      authControllerPassport.registerUser(firstUser);
    }
  });
};
exports.initUsersTable = (db) => {
  db.get(
    `SELECT name FROM sqlite_master WHERE type=? AND name=?`,
    ['table', 'users'],
    function (err, row) {
      if (err) {
        console.log(err.message);
        databaseManager.close(db);
      } else {
        if (!row) {
          db.run(sqlCreateUsersTable, (err) => {
            if (err) {
              console.error(err.message);
              databaseManager.close(db);
            } else {
              console.log('Table Created : Users');

              databaseManager.close(db);
              initFirstUser();
            }
          });
        } else {
          databaseManager.close(db);
        }
      }
    },
  );
};
