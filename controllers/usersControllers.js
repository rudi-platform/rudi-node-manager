const errorHandler = require('./errorHandler');
const databaseManager = require('../database/database');

const usersList = (req, res, next) => {
  databaseManager
    .getUsers()
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};
exports.getUserById = (req, res, next) => {
  const { id } = req.params;
  databaseManager
    .getUserById(id)
    .then((row) => {
      res.status(200).json(row);
    })
    .catch((err) => {
      error = errorHandler.error(error);
      res.status(501).json(error);
    });
};

module.exports.usersList = usersList;
