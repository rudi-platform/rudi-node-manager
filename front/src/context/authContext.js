import axios from 'axios'
import PropTypes from 'prop-types'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { BackConfContext } from './backConfContext.js'
import { JwtContext } from './jwtContext'

/**
 * We use this context to memorize
 * - the user info (username + roles)
 * - the function to update the user info
 * - the display flags that set if the user sees the Users menu (isAdmin) + the Data management menu (isEditor))
 */
const defaultUserProfile = {
  userInfo: {}, // the user info (username + roles)
  isEditor: false, // set true if the user sees the Data management menu ("Gestion")
  isAdmin: false, // set true if the user sees  the Users menu ("Utilisateurs")
}

export const UserContext = createContext(defaultUserProfile)

UserContextProvider.propTypes = { children: PropTypes.object }
/**
 * Returns the user information as a context
 * @param {Object} children
 * @return {React.Context.Provider}
 */
export function UserContextProvider({ children }) {
  // Retrieve token from context
  const { token } = useContext(JwtContext)

  // Retrieve conf from back-end context
  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  // Retrieve user info
  const [userInfo, setUserInfo] = useState({})
  const getUserInfoFromBack = async (token) => {
    try {
      return !token || !back?.isLoaded ? {} : (await axios.get(back.getBackFront('user-info')))?.data
    } catch (err) {
      console.error('E (callAuthBackend)', err.code, err.status, err.message)
      return {}
    }
  }
  const updateUserInfo = () => {
    // no return for useEffect!
    getUserInfoFromBack(token).then((backUserInfo) => setUserInfo(backUserInfo))
  }
  useEffect(() => updateUserInfo(), [token, back])

  // Retrieve user's role
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEditor, setIsEditor] = useState(false)

  const hasRoleAdmin = (userInfo) =>
    userInfo?.roles?.findIndex((role) => role === 'SuperAdmin' || role === 'Admin') > -1 || false
  const hasRoleEditor = (userInfo) =>
    userInfo?.roles?.findIndex((role) => role === 'SuperAdmin' || role === 'Admin' || role === 'Editeur') > -1 || false

  useEffect(() => {
    setIsAdmin(hasRoleAdmin(userInfo))
    setIsEditor(hasRoleEditor(userInfo))
  }, [userInfo])

  return <UserContext.Provider value={{ userInfo, isAdmin, isEditor }}>{children}</UserContext.Provider>
}
