import axios from 'axios'
import React, { createContext, useEffect, useState } from 'react'

import useToken from './useToken'
import { getApiData, getApiFront } from './App'

/**
 * We use this context to memorize
 * - the URL for the console formular (formUrl)
 * - the theme labels
 * - the user info (username + roles)
 * - the display flags that set if the user sees the Users menu (isAdmin) + the Data management menu (isEditor))
 */

export const defaultFrontContext = {
  formUrl: '', // the URL for the console formular
  themeLabels: {}, // the theme labels
  userInfo: {}, // the user info (username + roles)
  isEditor: false, // set true if the user sees the Data management menu ("Gestion")
  isAdmin: false, // set true if the user sees  the Users menu ("Utilisateurs")
}
const PMFrontContext = createContext(defaultFrontContext)

export const usePMFrontContext = () => React.useContext(PMFrontContext)

export const PMFrontContextProvider = ({ children }) => {
  const { token } = useToken()

  const [appInfo, setAppInfo] = useState({})
  const [loading, setLoading] = useState(false)

  const isAdmin = (roles = []) =>
    roles.findIndex((role) => role === 'SuperAdmin' || role === 'Admin') > -1
  const isEditor = (roles = []) =>
    roles.findIndex((role) => role === 'SuperAdmin' || role === 'Admin' || role === 'Editeur') > -1

  const callBackApi = async (token) => {
    if (!token) return defaultFrontContext

    try {
      const values = await Promise.all([
        axios.get(getApiFront('formUrl')),
        axios.get(getApiData('enum/themes/fr')),
        axios.get(getApiFront('user-info')),
      ])
      const userInfo = values[2].data?.roles
      const backValues = {
        formUrl: `${values[0].data}`,
        themeLabels: values[1].data,
        userInfo,
        isEditor: isEditor(userInfo),
        isAdmin: isAdmin(userInfo),
      }

      return backValues
    } catch (err) {
      console.error('T (callBackApi) ERR:', err)
      return defaultFrontContext
    }
  }

  const getBackData = async (token) => {
    setLoading(true)
    console.log('T (getBackData) Loading 1:', loading)
    const newData = await callBackApi(token)
    setAppInfo(newData)
    setLoading(false)
    console.log('T (getBackData) Loading 2:', loading)
    console.log('T (getBackData) Data received:', newData)
    console.log('T (getBackData) Data received:', newData)
    console.log('T (getBackData) Data loaded:', appInfo)
  }

  useEffect(() => {
    getBackData(token)
  }, [token])

  return (
    <PMFrontContext.Provider value={{ loading, data: appInfo }}>{children}</PMFrontContext.Provider>
  )
}
