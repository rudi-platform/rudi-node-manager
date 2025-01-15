import axios from 'axios'

import PropTypes from 'prop-types'
import React, { useContext, useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import { BackConfContext } from '../../context/backConfContext.js'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import { EditObjCard, ObjCard } from '../generic/objCard'

const PAGE_SIZE = 20

ObjCatalogue.propTypes = {
  editMode: PropTypes.bool,
  shouldPad: PropTypes.bool,
  shouldRefresh: PropTypes.bool,
  logout: PropTypes.func,
  hideEdit: PropTypes.bool,
  objType: PropTypes.string,
  propId: PropTypes.string,
  propName: PropTypes.string,
  propNamesToDisplay: PropTypes.object,
  propSortBy: PropTypes.string,
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
  editMode,
  shouldPad = true,
  shouldRefresh,
  logout,
  hideEdit,
  objType,
  propId,
  propName,
  propNamesToDisplay,
  propSortBy,
  btnTextAdd,
  btnTextChg,
  deleteConfirmMsg,
  deleteMsg,
}) {
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const [isEdit, setIsEdit] = useState(!!editMode)
  useEffect(() => setIsEdit(!!editMode), [editMode])

  const [objList, setObjList] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(-1)
  const initialRender = useRef(true)

  const getCatalogUrlObj = (suffix) => back?.isLoaded && back.getBackCatalog(objType, suffix)
  const deleteUrl = (id) => getCatalogUrlObj(id)

  const [sortBy, setSortBy] = useState(propSortBy || '-updatedAt')
  useEffect(() => setSortBy(propSortBy || '-updatedAt'), [propSortBy])

  const refresh = () => {
    setHasMore(true)
    setObjList([])
    getInitialData()

    if (currentOffset === 0) {
      setCurrentOffset(-1)
    } else {
      setCurrentOffset(0)
    }
  }
  useEffect(() => refresh(), [shouldRefresh])

  const [isTabVisible, setIsTabVisible] = useState(true)
  document.addEventListener('visibilitychange', () => {
    setIsTabVisible(document.visibilityState === 'visible')
  })
  useEffect(() => {
    if (isTabVisible) refresh()
  }, [isTabVisible])

  useEffect(() => {
    if (initialRender.current) initialRender.current = false
    else if (currentOffset < 0) setCurrentOffset(0)
    else fetchMoreData()
  }, [currentOffset])

  /**
   * recup la 1er page
   */
  function getInitialData() {
    axios
      .get(getCatalogUrlObj(), {
        params: { sort_by: sortBy, limit: PAGE_SIZE, offset: 0 },
      })
      .then((res) => {
        if (res.data?.length < PAGE_SIZE) setHasMore(false)
      })
      .catch((err) => (err.response?.status == 401 ? logout() : defaultErrorHandler(err)))
  }

  /**
   * Fonction utilisée par InfiniteScroll
   * Récupere la page suivante
   */
  const fetchMoreData = () => {
    axios
      .get(getCatalogUrlObj(), {
        params: { sort_by: sortBy, limit: PAGE_SIZE, offset: currentOffset },
      })
      .then((res) => {
        const data = res.data
        if (data.length < PAGE_SIZE) setHasMore(false)
        setObjList((listObj) => listObj.concat(data))
      })
      .catch((err) => (err.response?.status == 401 ? logout() : defaultErrorHandler(err)))
  }

  return (
    <div className={shouldPad ? 'tempPaddingTop' : ''}>
      <div className="row catalogue">
        <div className="col-9">
          <div className="row">
            {isEdit && !!btnTextAdd && (
              <EditObjCard
                objType={objType}
                idField={propId}
                deleteUrl={deleteUrl}
                deleteConfirmMsg={deleteConfirmMsg}
                deleteMsg={deleteMsg}
                btnTextAdd={btnTextAdd}
                btnTextChg={btnTextChg}
                refresh={refresh}
              ></EditObjCard>
            )}
            <InfiniteScroll
              dataLength={objList.length}
              next={() => setCurrentOffset(currentOffset + PAGE_SIZE)}
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
              endMessage={<i>Aucune donnée supplémentaire</i>}
            >
              {objList.map((obj) => (
                <ObjCard
                  editMode={isEdit}
                  hideEdit={hideEdit}
                  objType={objType}
                  obj={obj}
                  propId={propId}
                  propName={propName}
                  displayFields={propNamesToDisplay}
                  deleteUrl={deleteUrl}
                  deleteConfirmMsg={deleteConfirmMsg}
                  deleteMsg={deleteMsg}
                  refresh={refresh}
                  key={`${obj[propId]}`}
                ></ObjCard>
              ))}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  )
}
