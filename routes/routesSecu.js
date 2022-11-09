const express = require('express');
const router = new express.Router();
const { getUserByUsername, getUsersList, deleteUser } = require('../controllers/usersControllers');
const {
  getRoleList,
  getRoleById,
  getUserRolesByUsername,
  postUserRole,
  deleteUserRole,
} = require('../controllers/roleController');

router.get('/users', getUsersList);
router.get('/users/:username', getUserByUsername);
router.delete('/users/:id', deleteUser);

router.get('/roles', getRoleList);
router.get('/roles/:role', getRoleById);
router.get('/user-roles/:username', getUserRolesByUsername);
router.delete('/user-roles/:userId/:role', deleteUserRole);
router.post('/user-roles', postUserRole);

module.exports = router;
