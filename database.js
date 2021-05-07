const sqlite3 = require('sqlite3').verbose();

const open = function() {
  return new sqlite3.Database('./db/rudy_manager.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the rudy_manager database.');
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


db.serialize(() => {
  db.each(`SELECT id as id,
      username as username
           FROM users`, (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log('TEST !');
    console.log(row.id + '\t' + row.name);
  });
});


exports.getUserByUsername = (username) => {
  const db = open();

  close(db);
};
exports.createUser = (user) => {

};
