import axios from 'axios'
import PropTypes from 'prop-types'
import React, { createContext, useEffect, useState } from 'react'

import useToken from '../useToken'
import { getApiData, getApiFront, getApiOpen } from '../utils/frontOptions'
import { ensureEndsWithSlash } from '../utils/utils'

const callBackend = async (token) => {
  try {
    if (!token) {
      const tags = await axios.get(getApiOpen('tags'))
      const backValues = Object.assign(defaultContext, {
        appTag: `${tags?.data?.tag}`,
        gitHash: `${tags?.data?.hash}`,
      })
      return backValues
    }
    const values = await Promise.all([
      axios.get(getApiData('enum/themes/fr')),
      axios.get(getApiFront('node-urls')),
      axios.get(getApiOpen('tags')),
    ])
    const themeLabels = values[0].data

    const nodeUrls = values[1].data
    const formUrl = ensureEndsWithSlash(nodeUrls?.console_url)
    const apiExtUrl = ensureEndsWithSlash(nodeUrls?.api_url)
    const portalConnected = !!nodeUrls.portal_url

    const pmTags = values[2].data
    const appTag = pmTags?.tag
    const gitHash = pmTags?.hash

    const backValues = {
      themeLabels,
      formUrl,
      apiExtUrl,
      portalConnected,
      appTag,
      gitHash,
    }
    // console.debug('T (context.useEffect) backValues:', backValues)
    // setAppInfo(backValues)
    return backValues
  } catch (err) {
    console.error('E (callBackend)', err)
    return defaultContext
  }
}

/**
 * We use this context to memorize
 * - the URL for the console formular (formUrl)
 * - the theme labels
 * - the user info (username + roles)
 * - the display flags that set if the user sees the Users menu (isAdmin) + the Data management menu (isEditor))
 */
const defaultContext = {
  themeLabels: {}, // the theme labels
  userInfo: {}, // the user info (username + roles)
  formUrl: '', // the URL for the console formular
  isEditor: false, // set true if the user sees the Data management menu ("Gestion")
  isAdmin: false, // set true if the user sees  the Users menu ("Utilisateurs")
}

export const BackDataContext = createContext(defaultContext)

BackDataContextProvider.propTypes = {
  children: PropTypes.object,
}
/**
 * Returns the app general Context
 * @param {Object} children
 * @return {React.Context.Provider}
 */
export function BackDataContextProvider({ children }) {
  const { token } = useToken()

  const [appInfo, setAppInfo] = useState({})
  // const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const getBackData = async () => setAppInfo(await callBackend(token))
    getBackData()
  }, [token])

  return <BackDataContext.Provider value={{ appInfo }}>{children}</BackDataContext.Provider>
}
