import axios from 'axios'

import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import InfiniteScroll from 'react-infinite-scroll-component'

import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import LicenceCard from './licenceCard'


CatalogueLicence.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
}

/**
 * Composant : CatalogueLicence
 * @return {ReactNode}
 */
export default function CatalogueLicence({ display }) {
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const [metadatas, setMetadatas] = useState([])
  const [formUrl, setFormUrl] = useState('')
  const [hasMore] = useState(false)

  useEffect(() => {
    axios
      .get(`api/front/formUrl`)
      .then((res) => setFormUrl(res.data))
      .catch((err) => defaultErrorHandler(err))
    getInitialData()
  }, [])
  /**
   * recup la 1er page des métadonnéees
   */
  function getInitialData() {
    axios
      .get(`api/data/licences`)
      .then((res) => setMetadatas(res.data))
      .catch((err) => defaultErrorHandler(err))
  }

  return (
    <div className="tempPaddingTop">
      <div className="row catalogue">
        <div className="col-9">
          <div className="row">
            <InfiniteScroll
              dataLength={metadatas.length}
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
            >
              {metadatas.map((metadata) => {
                return (
                  <LicenceCard
                    metadata={metadata}
                    formUrl={formUrl}
                    display={display}
                    key={metadata.concept_id}
                  ></LicenceCard>
                )
              })}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  )
}