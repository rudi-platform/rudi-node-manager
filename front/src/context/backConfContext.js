import PropTypes from 'prop-types'
import React, { createContext, useContext, useEffect, useState } from 'react'

import axios from 'axios'
import { pathJoin } from '../utils/utils.js'
import { JwtContext } from './jwtContext'

/**
 * We use this context to memorize the URLs that were set for this Manager module
 */
const DEFAULT_CONF = {
  catalog_url: '', // the public URL of the RUDI Catalog module
  storage_url: '', // the public URL of the RUDI Storage module
  console_path: '', // the path to the Console formular
  front_path: '', // the path to this front
  back_path: '', // the path to the RUDI Manager backend api
  manager_path: '', // the path to the RUDI Manager app
  host_url: '', // the host URL
  portal_url: '', // the URL to the RUDI portal
}

let _cachedConf
const getCachedConf = async (token) => {
  try {
    // User not logged in: default values
    if (!token) {
      _cachedConf = null
      return DEFAULT_CONF
    }
    if (!_cachedConf?.host_url) {
      const confUrl = pathJoin(window.location.pathname, 'conf')
      try {
        _cachedConf = (await axios.get(confUrl))?.data
      } catch (e) {
        console.info(`Error initializing conf while reaching ${confUrl}:`, e.message)
        return DEFAULT_CONF
      }
      console.info('Back conf:', _cachedConf)
    }
    return _cachedConf
  } catch (err) {
    console.error('E (getCachedConf)', err.code, err.message)
    _cachedConf = null
    return DEFAULT_CONF
  }
}
export const BackConfContext = createContext(DEFAULT_CONF)

export class BackConf {
  constructor(conf) {
    this.conf = conf
  }
  getBackApi = (...url) => pathJoin(this.conf?.host_url, this.conf?.back_path, ...url)

  getBackFront = (...url) => getBackApi('front', ...url)
  getBackSecu = (...url) => getBackApi('secu', ...url)
  getBackCatalog = (...url) => getBackApi('catalog', ...url)
  getBackStorage = (...url) => getBackApi('storage', ...url)

  getConsole = (suffix, query) => mergeStrings('?', pathJoin(backConf?.host_url, backConf?.console_path, suffix), query)
}

// -------------------------------------------------------------------------------------------------
// Reach the backend
// -------------------------------------------------------------------------------------------------

BackConfContextProvider.propTypes = { children: PropTypes.object }
/**
 * Returns the app general Context
 * @param {Object} children
 * @return {React.Context.Provider}
 */
export async function BackConfContextProvider({ children }) {
  const { token } = useContext(JwtContext)

  const [backConf, setBackConf] = useState(new BackConf(DEFAULT_CONF))

  useEffect(() => {
    const getBackConf = async () => setBackConf(new BackConf(await getCachedConf(token)))
    getBackConf()
  }, [token])

  return <BackConfContext.Provider value={{ backConf }}>{children}</BackConfContext.Provider>
}
