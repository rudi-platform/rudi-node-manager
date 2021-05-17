const bcrypt = require('bcrypt');

exports.checkPassword = function(password, passwordHash) {
  return bcrypt.compare(String(password), String(passwordHash));
};

exports.generatePasswordHash = function(password) {
  return bcrypt.genSalt(10)
      .then((salt) => {
        return bcrypt.hash(password, salt)
            .then((passwordHash)=> {
              return {passwordHash, salt};
            });
      });
};
