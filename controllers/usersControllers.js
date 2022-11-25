const errorHandler = require('./errorHandler')
const {
  dbDeleteUserWithId: dbDeleteUser,
  dbDeleteUserWithName,
  dbGetUserByEmail,
  dbGetUserById,
  dbGetUserByUsername,
  dbGetUsers,
  dbOpen,
  dbUpdateUserRoles,
  dbUpdateUser,
  dbCreateUser,
  dbUpdatePassword,
} = require('../database/database')
const { NotFoundError, RudiError, BadRequestError, ForbiddenError } = require('../utils/errors')

exports.getUsersList = async (req, res, next) => {
  try {
    const users = await dbGetUsers()
    return res.status(200).json(users)
  } catch (err) {
    const error = errorHandler.error(err, req, { opType: 'get_users' })
    res.status(error.statusCode).json(new RudiError(error.message))
  }
}

exports.getUserByUsername = async (req, res, next) => {
  try {
    const { username: name } = req.params
    const userInfo = await dbGetUserByUsername(null, name)
    if (!userInfo) return res.status(404).json(new NotFoundError(`User not found: '${name}'`))
    const { id, username, email } = userInfo
    return res.status(200).json({ id, username, email })
  } catch (err) {
    const error = errorHandler.error(err, req, { opType: 'get_user' })
    return res.status(error.statusCode || 500).json(new RudiError(error.message))
  }
}

exports.deleteUserWithName = async (req, res, next) => {
  try {
    // ONLY ADMIN !
    const { username } = req.params
    const db = dbOpen()
    const userInfo = await dbGetUserByUsername(db, username)
    if (!userInfo) return res.status(404).json(new NotFoundError(`User not found: ${username}`))
    await dbDeleteUserWithName(db, username)
    return res.status(200).json({ message: `User deleted: ${username}` })
  } catch (err) {
    const error = errorHandler.error(err, req, { opType: 'delete_user' })
    return res.status(error.statusCode).json(new RudiError(error.message))
  }
}

exports.deleteUserWithId = async (req, res, next) => {
  try {
    // ONLY ADMIN !
    const { id } = req.params
    const db = dbOpen()
    const userInfo = await dbGetUserById(db, id)
    if (!userInfo) return res.status(404).json(new NotFoundError(`User '${id}' not found`))
    await dbDeleteUser(db, id)
    return res.status(200).json({ message: `User deleted: ${userInfo.username}` })
  } catch (err) {
    const error = errorHandler.error(err, req, { opType: 'delete_user' })
    res.status(error.statusCode).json(new RudiError(error.message))
  }
}

exports.resetPassword = async (req, res, next) => {
  try {
    // ONLY ADMIN !
    const { username } = req.body
    dbUpdatePassword(null, username, ' ')
  } catch (err) {
    const error = errorHandler.error(err, req, { opType: 'reset_pwd' })
    return res.status(500).json(new RudiError(error.message))
  }
}

exports.createUser = async (req, res, next) => {
  try {
    const userInfo = req.body
    console.log('T (addUser) userInfo', userInfo)
    const { id, username, email, password, roles } = userInfo
    if (!id)
      return res.status(400).json(new BadRequestError('La requête doit comporter un id non null'))
    if (!username)
      return res
        .status(400)
        .json(new BadRequestError('La requête doit comporter un username non null'))
    if (!email)
      return res
        .status(400)
        .json(new BadRequestError('La requête doit comporter un email non null'))
    if (!password)
      return res
        .status(400)
        .json(new BadRequestError('La requête doit comporter un mot de passe non null'))

    const db = dbOpen()

    const dbUserSameId = await dbGetUserById(db, id)
    if (!!dbUserSameId)
      return res.status(403).json(new ForbiddenError(`Un utilisateur existe déjà avec l'id ${id}`))

    const dbUserSameName = await dbGetUserByUsername(db, username)
    if (!!dbUserSameName)
      return res.status(403).json(new ForbiddenError(`Ce nom est déjà utilisé: '${username}'`))

    const dbUserSameMail = await dbGetUserByEmail(db, email)
    if (dbUserSameMail)
      return res.status(403).json(new ForbiddenError(`Cet email est déjà utilisé: '${email}'`))

    await dbCreateUser(db, { username, password, email })
    await dbUpdateUserRoles(db, { userId: id, username, roles })
    return res.status(200).json({ status: 'OK' })
  } catch (err) {
    const error = errorHandler.error(err, req, { opType: 'add_user' })
    return res.status(500).json(new RudiError(error.message))
  }
}

exports.editUser = async (req, res, next) => {
  try {
    const userInfo = req.body
    // console.log('T (editUser) userInfo', userInfo)
    const { id, username, email } = userInfo
    const db = dbOpen()
    const dbUser = await dbGetUserById(db, id)
    const dbUserSameName = await dbGetUserByUsername(db, username)
    if (dbUserSameName && dbUserSameName.id !== dbUser.id)
      return res.status(403).json(`Ce nom est déjà utilisé: '${username}'`)

    const dbUserSameMail = await dbGetUserByEmail(db, email)
    if (dbUserSameMail && dbUserSameMail.id !== dbUser.id)
      return res.status(403).json(`Cet email est déjà utilisé: '${email}'`)

    await dbUpdateUser(db, userInfo)
    await dbUpdateUserRoles(db, userInfo)
    return res.status(200).json({ status: 'OK' })
  } catch (err) {
    const error = errorHandler.error(err, req, { opType: 'edit_user' })
    return res.status(500).json(new RudiError(error.message))
  }
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
