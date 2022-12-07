import React, { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'

import useToken from './useToken'
import { getApiData, getApiFront, getApiOpen } from './utils/frontOptions'

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

PMFrontContextProvider.propTypes = {
  children: PropTypes.object,
}
/**
 * Returns the app general Context
 * @param {Object} param0
 * @return {React.Context.Provider}
 */
export function PMFrontContextProvider({ children }) {
  const { token } = useToken()

  const [appInfo, setAppInfo] = useState({})
  // const [loading, setLoading] = useState(false)

  const isAdmin = (roles = []) =>
    roles.findIndex((role) => role === 'SuperAdmin' || role === 'Admin') > -1
  const isEditor = (roles = []) =>
    roles.findIndex((role) => role === 'SuperAdmin' || role === 'Admin' || role === 'Editeur') > -1

  useEffect(() => {
    const callBackApi = async () => {
      if (!token) return defaultFrontContext

      try {
        const values = await Promise.all([
          axios.get(getApiFront('formUrl')),
          axios.get(getApiData('enum/themes/fr')),
          axios.get(getApiFront('user-info')),
          axios.get(getApiOpen('tag')),
          axios.get(getApiOpen('hash')),
        ])
        const userInfo = values[2].data
        const backValues = {
          formUrl: `${values[0].data}`,
          themeLabels: values[1].data,
          appTag: `${values[3].data}`,
          gitHash: `${values[4].data}`,
          userInfo,
          isEditor: !!isEditor(userInfo?.roles || []),
          isAdmin: !!isAdmin(userInfo?.roles || []),
        }
        // console.debug('T (context.useEffect) backValues:', backValues)

        return backValues
      } catch (err) {
        console.error('T (callBackApi) ERR:', err)
        return defaultFrontContext
      }
    }

    const getBackData = async () => {
      // setLoading(true)
      const newData = await callBackApi()
      setAppInfo(newData)
      // setLoading(false)
      // console.log('T (getBackData) Data received:', newData)
    }

    getBackData()
  }, [token])

  const setUserInfo = (userInfo) => {
    setAppInfo((appInfo) => {
      return {
        ...appInfo,
        userInfo,
        isAdmin: isAdmin(userInfo?.roles || []),
        isEditor: isEditor(userInfo?.roles || []),
      }
    })
  }

  return (
    <PMFrontContext.Provider value={{ appInfo, setUserInfo }}>{children}</PMFrontContext.Provider>
  )
}
