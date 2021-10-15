const databaseManager = require('../database/database');

exports.checkRolePerm = (role) => (req, res, next) => {
  const { username } = req.user;
  databaseManager
    .getUserRolesByUsername(username)
    .then((rows) => {
      if (rows.findIndex((elem) => elem.role === role || elem.role === 'SuperAdmin') >= 0) {
        next();
      } else {
        res.status(403).json('Forbidden');
      }
    })
    .catch((err) => {
      console.log(err);
      next(new Error('Not Authorize'));
    });
};
