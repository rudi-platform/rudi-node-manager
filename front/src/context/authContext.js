import axios from 'axios'
import PropTypes from 'prop-types'
import React, { createContext, useEffect, useState } from 'react'

import useToken from '../useToken'
import { getApiFront } from '../utils/frontOptions'

const hasRoleAdmin = (userInfo) =>
  userInfo?.roles?.findIndex((role) => role === 'SuperAdmin' || role === 'Admin') > -1 || false

const hasRoleEditor = (userInfo) =>
  userInfo?.roles?.findIndex(
    (role) => role === 'SuperAdmin' || role === 'Admin' || role === 'Editeur'
  ) > -1 || false

const callAuthBackend = async (token) => {
  try {
    return !token ? {} : (await axios.get(getApiFront('user-info')))?.data
  } catch (err) {
    console.error('E (auth.callBackend)', err)
    return {}
  }
}

const defaultUserProfile = {
  userInfo: {}, // the user info (username + roles)
  setUserInfo: () => {},
  isEditor: false, // set true if the user sees the Data management menu ("Gestion")
  isAdmin: false, // set true if the user sees  the Users menu ("Utilisateurs")
}

export const UserContext = createContext(defaultUserProfile)

UserContextProvider.propTypes = {
  children: PropTypes.object,
}
/**
 * Returns the user information as a context
 * @param {Object} children
 * @return {React.Context.Provider}
 */
export function UserContextProvider({ children }) {
  const { token } = useToken()
  const [userInfo, setUserInfo] = useState({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEditor, setIsEditor] = useState(false)

  useEffect(() => {
    setIsAdmin(hasRoleAdmin(userInfo))
    setIsEditor(hasRoleEditor(userInfo))
  }, [userInfo])

  useEffect(() => {
    const getBackUserInfo = async () => setUserInfo(await callAuthBackend(token))
    getBackUserInfo()
  }, [token])

  return (
    <UserContext.Provider value={{ userInfo, isAdmin, isEditor, setUserInfo }}>
      {children}
    </UserContext.Provider>
  )
}
