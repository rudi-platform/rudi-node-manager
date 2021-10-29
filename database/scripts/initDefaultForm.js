const databaseManager = require('../database');
const log = require('../../utils/logger');
const mod = 'database';

const sqlCreateDefaultFormTable =
  'CREATE TABLE IF NOT EXISTS Default_Form (userId INTEGER PRIMARY KEY, defaultValue TEXT,' +
  'CONSTRAINT Roles_fk_user_Id FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE);';

exports.initDefaultFormTable = () => {
  const fun = 'initDefaultFormTable';
  const db = databaseManager.open();
  db.get(
    `SELECT name FROM sqlite_master WHERE type=? AND name=?`,
    ['table', 'Default_Form'],
    function (err, row) {
      if (err) {
        log.e(mod, fun, err.message);
        databaseManager.close(db);
      } else {
        if (!row) {
          db.run(sqlCreateDefaultFormTable, (err) => {
            if (err) {
              log.e(mod, fun, err.message);
              databaseManager.close(db);
            } else {
              log.i(mod, fun, 'Table Created : Default_Form');
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
