import axios from 'axios'
import React, { createContext, useEffect, useState } from 'react'
import { getApiData, getApiFront } from './App'
import useToken from './useToken'

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

export const PMFrontContextProvider = ({ children }) => {
  const { token } = useToken()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const callBackApi = async (token) => {
    if (!token) return defaultFrontContext

    try {
      const values = await Promise.all([
        axios.get(getApiFront('formUrl')),
        axios.get(getApiData('enum/themes/fr')),
        axios.get(getApiFront('user-info')),
      ])

      const backData = {
        formUrl: `${values[0].data}`,
        themeLabels: values[1].data,
        userInfo: values[2].data,
      }
      const userInfo = backData.userInfo || {}
      if (
        !userInfo?.roles ||
        userInfo.roles.length === 0 ||
        (userInfo.roles.length === 1 && userInfo.roles[0] === 'Lecteur')
      ) {
        backData.isEditor = false
        backData.isAdmin = false
      } else if (
        userInfo.roles.findIndex((role) => role === 'SuperAdmin' || role === 'Admin') > -1
      ) {
        backData.isEditor = true
        backData.isAdmin = true
      } else if (userInfo.roles.findIndex((role) => role === 'Editeur') > -1) {
        backData.isEditor = true
        backData.isAdmin = false
      }
      return backData
    } catch (err) {
      console.error('T (callBackApi) ERR:', err)
      return defaultFrontContext
    }
  }

  const isEditor = () => !!data?.isEditor
  const isAdmin = () => !!data?.isAdmin

  const getBackData = async (token) => {
    setLoading(true)
    const newData = await callBackApi(token)
    setData(newData)
    setLoading(false)
  }
  useEffect(() => {
    getBackData(token)
  }, [token])
  return (
    <PMFrontContext.Provider value={{ loading, frontContext: data }}>
      {children}
    </PMFrontContext.Provider>
  )
}
export const usePMFrontContext = () => React.useContext(PMFrontContext)
