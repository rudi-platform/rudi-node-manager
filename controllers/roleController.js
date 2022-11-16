const errorHandler = require('./errorHandler');
const {
  dbGetRoles,
  dbGetRoleById,
  dbGetUserRolesByUsername,
  dbDeleteUserRole,
  dbCreateUserRole,
} = require('../database/database');

exports.getRoleList = (req, res, next) => {
  return dbGetRoles()
    .then((rows) => res.status(200).json(rows))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_roles' });
      res.status(error.statusCode).json(error);
    });
};

exports.getRoleById = (req, res, next) => {
  const { role } = req.params;
  return dbGetRoleById(null, role)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_role' });
      res.status(error.statusCode).json(error);
    });
};

// User_Roles
exports.getUserRolesByUsername = (req, res, next) => {
  const { username } = req.params;
  return dbGetUserRolesByUsername(null, username)
    .then((rows) => res.status(200).json(rows))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'get_userRole' });
      res.status(error.statusCode).json(error);
    });
};
exports.deleteUserRole = (req, res, next) => {
  const { userId, role } = req.params;
  return dbDeleteUserRole(null, userId, role)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      const error = errorHandler.error(err, req, { opType: 'delete_userRole' });
      res.status(error.statusCode).json(error);
    });
};
exports.postUserRole = (req, res, next) => {
  const data = req.body;
  return dbCreateUserRole(null, data)
    .then((row) => res.status(200).json(row))
    .catch((err) => {
      console.error(err);
      const error = errorHandler.error(err, req, { opType: 'post_userRole' });
      res.status(error.statusCode).json(error);
    });
};
