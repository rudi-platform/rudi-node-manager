import axios from 'axios'

import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import { BackConfContext } from '../../context/backConfContext.js'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import LicenceCard from './licenceCard'

CatalogueLicence.propTypes = {
  editMode: PropTypes.bool,
  logout: PropTypes.func,
}

/**
 * Composant : CatalogueLicence
 * @return {ReactNode}
 */
export default function CatalogueLicence({ editMode, logout }) {
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const [isEdit, setIsEdit] = useState(!!editMode)
  useEffect(() => setIsEdit(!!editMode), [editMode])

  const [licences, setLicences] = useState([])
  const [hasMore] = useState(false)

  useEffect(() => {
    getInitialData()
  }, [])
  /**
   * recup la 1er page des métadonnéees
   */
  const getInitialData = () =>
    back?.isLoaded &&
    axios
      .get(back.getBackCatalog('licences'))
      .then((res) => setLicences(res.data))
      .catch((err) => (err.response?.status == 401 ? logout() : defaultErrorHandler(err)))

  return (
    <div className="tempPaddingTop">
      <div className="row catalogue">
        <div className="col-9">
          <div className="row">
            {licences.length ? (
              <InfiniteScroll dataLength={licences.length} hasMore={hasMore} loader={<h4>Loading...</h4>}>
                {licences.map((licence) => {
                  return <LicenceCard obj={licence} editMode={isEdit} key={licence.concept_id}></LicenceCard>
                })}
              </InfiniteScroll>
            ) : (
              'Aucune donnée trouvée'
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
