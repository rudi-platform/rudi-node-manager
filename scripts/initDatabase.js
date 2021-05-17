const databaseManager = require('../database');
const config = require('../config/config');
const authController = require('../controllers/authController');
const fs = require('fs');

const sqlCreateUsersTable = 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,'+
'username TEXT NOT NULL UNIQUE,password TEXT NOT NULL,salt TEXT NOT NULL);';

const initFirstUser = () => {
  databaseManager.getUsers().then((rows) => {
    // TODO : meilleur gestion des param d'init?
    if (!rows.length) {
      console.log('init first user');
      const firstUser = {
        username: config.database.first_user_name,
        password: config.database.first_user_pwd,
        confirmPassword: config.database.first_user_pwd,
      };
      authController.registerUser(firstUser);
    }
  });
};

try {
  fs.statSync(config.database.db_directory).isDirectory();
  const db = databaseManager.openOrCreateDB();

  db.run(sqlCreateUsersTable, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Table Created : Users');
    }
    databaseManager.close(db);
    initFirstUser();
  });
} catch (error) {
  console.error(error);
  throw error;
}


