const errorHandler = require('./errorHandler');
const databaseManager = require('../database/database');

exports.getUsersList = (req, res, next) => {
  databaseManager
    .getUsers()
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_users' });
      res.status(error.statusCode).json(error);
    });
};
exports.getUserByUsername = (req, res, next) => {
  const { username } = req.params;
  databaseManager
    .getUserByUsername(username)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_user' });
      res.status(error.statusCode).json(error);
    });
};
exports.deleteUserWithName = (req, res, next) => {
  const { username } = req.params;
  databaseManager
    .deleteUserWithName(username)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'delete_user' });
      res.status(error.statusCode).json(error);
    });
};

exports.deleteUser = (req, res, next) => {
  const { id } = req.params;
  databaseManager
    .deleteUser(id)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'delete_user' });
      res.status(error.statusCode).json(error);
    });
};

// exports.putPassword = (req, res, next) => {
//   const { username, password } = req.body;
//   return databaseManager
//     .updatePassword(username, password)
//     .then((data) => res.status(200).send(`Password changed for user '${data.username}'`))
//     .catch((err) => {
//       const error = errorHandler.error(err, req, { opType: 'put_password' });
//       res.status(error.statusCode).json(error);
//     });
// };
