const errorHandler = require('./errorHandler')
const {
  dbGetUsers,
  dbGetUserByUsername,
  dbDeleteUserWithName,
  dbDeleteUser,
} = require('../database/database')

exports.getUsersList = (req, res, next) => {
  dbGetUsers()
    .then((rows) => res.status(200).json(rows))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_users' })
      res.status(error.statusCode).json(error)
    })
}
exports.getUserByUsername = (req, res, next) => {
  const { username } = req.params
  dbGetUserByUsername(null, username)
    .then((userInfo) => {
      const { id, username, email } = userInfo
      res.status(200).json({ id, username, email })
    })
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_user' })
      res.status(error.statusCode).json(error)
    })
}
exports.deleteUserWithName = (req, res, next) => {
  const { username } = req.params
  dbDeleteUserWithName(null, username)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'delete_user' })
      res.status(error.statusCode).json(error)
    })
}

exports.deleteUser = (req, res, next) => {
  const { id } = req.params
  dbDeleteUser(null, id)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'delete_user' })
      res.status(error.statusCode).json(error)
    })
}

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
