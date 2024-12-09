import axios from 'axios'
import PropTypes from 'prop-types'
import React, { createContext, useEffect, useState } from 'react'

import { mergeStrings, pathJoin } from '../utils/utils.js'

export class InitData {
  constructor(data) {
    this.conf = data || {}

    this.backPath = this.conf.backPath
    this.consolePath = this.conf.consolePath
    this.frontPath = this.conf.frontPath

    this.catalogPubUrl = this.conf.catalogPubUrl
    this.storagePubUrl = this.conf.storagePubUrl

    this.portalConnected = this.conf.portalConnected

    this.appTag = this.conf.appTag
    this.gitHash = this.conf.gitHash

    this.themeLabels = this.conf.themeLabels

    this.isLoaded = this.catalogPubUrl !== '' && this.catalogPubUrl !== undefined
  }

  getBackApi = (...url) => pathJoin(this.backPath, ...url)

  getBackFront = (...url) => this.getBackApi('front', ...url)
  getBackSecu = (...url) => this.getBackApi('secu', ...url)
  getBackCatalog = (...url) => this.getBackApi('catalog', ...url)
  getBackStorage = (...url) => this.getBackApi('storage', ...url)

  getConsole = (suffix, query) => mergeStrings('?', pathJoin(this.consolePath, suffix), query)

  getCatalogPub = (...url) => pathJoin(this.catalogPubUrl, ...url)
  getStoragePub = (...url) => pathJoin(this.storagePubUrl, ...url)

  toString = () => JSON.stringify({ back_path: this.conf?.back_path })
}

/**
 * We use this context to memorize the URLs that were set for this Manager module
 */
const DEFAULT_CONF = new InitData()

export const BackConfContext = createContext(DEFAULT_CONF)

BackConfContextProvider.propTypes = { children: PropTypes.object }
/**
 * Returns the app general Context
 * @param {Object} children
 * @return {React.Context.Provider}
 */
export function BackConfContextProvider({ children }) {
  const [backConf, setBackConf] = useState(DEFAULT_CONF)

  let _cachedData
  const getCachedConf = async () => {
    try {
      if (!_cachedData?.isLoaded) {
        const confUrl = pathJoin(window.location, 'conf')
        try {
          const conf = (await axios.get(confUrl))?.data
          _cachedData = new InitData(conf)
          // console.info(`T (${here}) New conf:`, _cachedConf.isLoaded)
        } catch (e) {
          console.error(`Error initializing conf while reaching ${confUrl}:`, e.message)
          return DEFAULT_CONF
        }
      }
      return _cachedData
    } catch (err) {
      console.error('E (getCachedConf)', err.code, err.message)
      _cachedData = null
      return DEFAULT_CONF
    }
  }
  const getBackConf = async () => setBackConf(await getCachedConf())
  useEffect(() => {
    getBackConf()
  }, [])

  return <BackConfContext.Provider value={{ backConf }}>{children}</BackConfContext.Provider>
}
