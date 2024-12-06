import axios from 'axios'
import PropTypes from 'prop-types'
import React, { createContext, useContext, useEffect, useState } from 'react'

import { BackConfContext } from './backConfContext.js'
import { JwtContext } from './jwtContext'

/**
 * We use this context to memorize
 * - the URL for the console formular (consolePath)
 * - the theme labels
 */
const DEFAULT_BACK_VALS = {
  themeLabels: {}, // the theme labels
  consolePath: '', // the URL for the console formular
  catalogPubUrl: '', // the API module external URL
  portalConnected: false, // True if this RUDI node is connected to a RUDI portal
  appTag: '', // this RUDI node version
  gitHash: '', // last git hash
}

let _backValues = {}
const getCachedBackData = async (token, getBackFront) => {
  try {
    // User not logged in: default values
    if (!token) {
      _backValues = null
      return DEFAULT_BACK_VALS
    }
    if (!_backValues?.consolePath) {
      _backValues = (await axios.get(getBackFront('init-data?lang=fr')))?.data
      console.info('Back vals:', _backValues)
    }
    return _backValues
  } catch (err) {
    console.error('E (callBackend)', err.code, err.message)
    _backValues = null
    return DEFAULT_BACK_VALS
  }
}

export const BackDataContext = createContext(DEFAULT_BACK_VALS)

BackDataContextProvider.propTypes = { children: PropTypes.object }
/**
 * Returns the app general Context
 * @param {Object} children
 * @return {React.Context.Provider}
 */
export function BackDataContextProvider({ children }) {
  const { token } = useContext(JwtContext)
  const { getBackFront } = useContext(BackConfContext)

  const [appInfo, setAppInfo] = useState({})

  useEffect(() => {
    const getBackData = async () => setAppInfo(await getCachedBackData(token, getBackFront))
    getBackData()
  }, [token])

  return <BackDataContext.Provider value={{ appInfo }}>{children}</BackDataContext.Provider>
}
