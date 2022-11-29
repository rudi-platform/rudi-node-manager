import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'

import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import { GeneralContext } from '../../generalContext'
import { EditObjCard, ObjCard } from '../generic/objCard'
import { getApiData } from '../../App'

const PAGE_SIZE = 20

ObjCatalogue.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
  formUrlObj: PropTypes.string,
  propId: PropTypes.string,
  propName: PropTypes.string,
  propNamesToDisplay: PropTypes.object,
  btnTextAdd: PropTypes.string,
  btnTextChg: PropTypes.string,
  deleteConfirmMsg: PropTypes.func,
  deleteMsg: PropTypes.func,
}

/**
 * Composant : CatalogueContact
 * @return {void}
 */
export default function ObjCatalogue({
  display,
  formUrlObj,
  propId,
  propName,
  propNamesToDisplay,
  btnTextAdd,
  btnTextChg,
  deleteConfirmMsg,
  deleteMsg,
}) {
  const [listObj, setListObj] = useState([])
  const [formUrl, setFormUrl] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)

  const { defaultErrorHandler } = useDefaultErrorHandler()

  const generalConf = useContext(GeneralContext)
  const editUrl = `${generalConf.formUrl}${formUrlObj}`
  const getApiUrlObj = (suffix) => getApiData(`${formUrlObj}${suffix ? `/${suffix}` : ''}`)

  useEffect(() => getInitialData(), [])
  useEffect(() => setFormUrl(editUrl), [generalConf])

  const deleteUrl = (id) => getApiUrlObj(id)
  const refresh = () => {
    setHasMore(true)
    getInitialData()
  }

  /**
   * recup la 1er page des contacts
   */
  function getInitialData() {
    // const params = new URLSearchParams(`limit=${PAGE_SIZE}&offset=0`);
    // const fetchUrl = getApiUrlObj(`?sort_by=-updateAt&limit=${PAGE_SIZE}&offset=0`);
    const fetchUrl = getApiUrlObj(`?sort_by=-updateAt&limit=${PAGE_SIZE}&offset=0`)
    // console.log('url:', fetchUrl);
    axios
      .get(fetchUrl)
      .then((res) => {
        setCurrentOffset(PAGE_SIZE)
        setListObj(res.data)
        // if (res.data?.length < PAGE_SIZE) setHasMore(false);
      })
      .catch((err) => defaultErrorHandler(err))
  }

  /**
   * Fonction utilisée par InfiniteScroll
   * Récupere la page suivante
   */
  const fetchMoreData = () => {
    const fetchUrl = getApiUrlObj()
    // console.log(fetchUrl);
    axios
      .get(fetchUrl, { params: { sort_by: '-updateAt', limit: PAGE_SIZE, offset: currentOffset } })
      .then((res) => {
        const partialListObj = res.data
        setCurrentOffset(currentOffset + PAGE_SIZE)
        if (partialListObj.length === 0) {
          setHasMore(false)
          console.log('(fetchMoreData 0) partialListObj.length=', partialListObj.length)
          console.log('(fetchMoreData 0) hasMore=', hasMore)
        } else {
          console.log('(fetchMoreData +) partialListObj.length=', partialListObj.length)
          console.log('(fetchMoreData +) hasMore=', hasMore)

          setListObj(listObj.concat(partialListObj))
        }
      })
      .catch((err) => defaultErrorHandler(err))
  }

  return (
    <div className="tempPaddingTop">
      <div className="row catalogue">
        <div className="col-9">
          <div className="row">
            {display && display.editJDD && formUrl && (
              <EditObjCard
                idField={propId}
                formUrl={formUrl}
                deleteUrl={deleteUrl}
                deleteConfirmMsg={deleteConfirmMsg}
                deleteMsg={deleteMsg}
                btnTextAdd={btnTextAdd}
                btnTextChg={btnTextChg}
                refresh={refresh}
              ></EditObjCard>
            )}
            <InfiniteScroll
              dataLength={listObj.length}
              next={fetchMoreData}
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
            >
              {listObj.map((obj, i) => (
                <ObjCard
                  formUrl={formUrl}
                  obj={obj}
                  propId={propId}
                  propName={propName}
                  display={display}
                  displayFields={propNamesToDisplay}
                  deleteUrl={deleteUrl}
                  deleteConfirmMsg={deleteConfirmMsg}
                  deleteMsg={deleteMsg}
                  refresh={refresh}
                  key={`${obj[propId]}-${i}`}
                ></ObjCard>
              ))}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  )
}
