const databaseManager = require('../database');

const sqlCreateUsersTable =
  'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,' +
  'username TEXT NOT NULL UNIQUE,password TEXT NOT NULL,email TEXT);';

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
            }
          });
        } else {
          databaseManager.close(db);
        }
      }
    },
  );
};
