import axios from 'axios'
import PropTypes from 'prop-types'
import React, { createContext, useEffect, useState } from 'react'

import useToken from './useToken'
import { getApiData, getApiFront, getApiOpen } from './utils/frontOptions'
import { ensureEndsWithSlash } from './utils/utils'

/**
 * We use this context to memorize
 * - the URL for the console formular (formUrl)
 * - the theme labels
 * - the user info (username + roles)
 * - the display flags that set if the user sees the Users menu (isAdmin) + the Data management menu (isEditor))
 */
export const defaultFrontContext = {
  themeLabels: {}, // the theme labels
  userInfo: {}, // the user info (username + roles)
  formUrl: '', // the URL for the console formular
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
  const [isLoaded, setIsLoaded] = useState(false)

  const isAdmin = (roles = []) =>
    roles.findIndex((role) => role === 'SuperAdmin' || role === 'Admin') > -1
  const isEditor = (roles = []) =>
    roles.findIndex((role) => role === 'SuperAdmin' || role === 'Admin' || role === 'Editeur') > -1

  const callBackApi = async () => {
    try {
      if (!token) {
        const tags = await axios.get(getApiOpen('tags'))
        const backValues = Object.assign(defaultFrontContext, {
          appTag: `${tags?.data?.tag}`,
          gitHash: `${tags?.data?.hash}`,
        })
        return backValues
      }
      const values = await Promise.all([
        axios.get(getApiData('enum/themes/fr')),
        axios.get(getApiFront('user-info')),
        axios.get(getApiFront('node-urls')),
        axios.get(getApiOpen('tags')),
      ])
      const userInfo = values[1].data

      const nodeUrls = values[2].data
      const formUrl = ensureEndsWithSlash(nodeUrls?.console_url)
      const apiExtUrl = ensureEndsWithSlash(nodeUrls?.api_url)
      const portalConnected = !!nodeUrls.portal_url

      const pmTags = values[3].data
      const appTag = pmTags?.tag
      const gitHash = pmTags?.hash

      const backValues = {
        themeLabels: values[0].data,
        userInfo,
        isEditor: !!isEditor(userInfo?.roles || []),
        isAdmin: !!isAdmin(userInfo?.roles || []),
        formUrl,
        apiExtUrl,
        portalConnected,
        appTag,
        gitHash,
      }
      // console.debug('T (context.useEffect) backValues:', backValues)
      setAppInfo(backValues)
    } catch (err) {
      console.error('E (callBackApi)', err)
      return defaultFrontContext
    }
  }

  useEffect(() => {
    const getBackData = async () => {
      setIsLoaded(false)
      await callBackApi()
      setIsLoaded(true)
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
    <PMFrontContext.Provider value={{ appInfo, isLoaded, setUserInfo }}>
      {children}
    </PMFrontContext.Provider>
  )
}
