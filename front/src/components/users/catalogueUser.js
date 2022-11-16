import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import InfiniteScroll from 'react-infinite-scroll-component'
import PropTypes from 'prop-types'
import EditUserCard from './editUserCard'
import UserCard from './userCard'
import { GeneralContext } from '../../generalContext'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'

const propId = 'id'

/**
 * Composant : CatalogueUser
 * @return {ReactNode}
 */
export default function CatalogueUser({ display }) {
  const [objList, setListObj] = useState([])
  const [formUrl, setFormUrl] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const PAGE_SIZE = 20
  const [currentOffset, setCurrentOffset] = useState(0)
  const generalConf = useContext(GeneralContext)

  const { defaultErrorHandler } = useDefaultErrorHandler()

  useEffect(() => getInitialData(), [])
  useEffect(() => setFormUrl(`${generalConf.formUrl}users`), [generalConf])

  const refresh = () => getInitialData()

  /**
   * recup la 1er page des métadonnéees et les countBy
   */
  function getInitialData() {
    axios
      .get(`api/secu/users`)
      .then((res) => {
        setCurrentOffset(PAGE_SIZE)
        setListObj(res.data)
      })
      .catch((e) => defaultErrorHandler(e))
  }

  /**
   * Fonction utilisée par InfiniteScroll
   * Récupere la page suivante
   */
  const fetchMoreData = () => {
    axios
      .get(`api/secu/users`, { params: { limit: PAGE_SIZE, offset: currentOffset } })
      .then((res) => {
        const partialObjList = res.data
        setCurrentOffset(currentOffset + PAGE_SIZE)
        if (partialObjList.length === 0) setHasMore(false)
        setListObj(objList.concat(partialObjList))
      })
      .catch((e) => defaultErrorHandler(e))
  }

  return (
    <div className="tempPaddingTop">
      <div className="row catalogue">
        <div className="col-9">
          <div className="row">
            {display && display.editJDD && (
              <EditUserCard formUrl={formUrl} refresh={refresh}></EditUserCard>
            )}
            <InfiniteScroll
              dataLength={objList.length}
              next={fetchMoreData}
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
            >
              {objList.map((obj) => (
                <UserCard
                  user={obj}
                  display={display}
                  refresh={refresh}
                  key={obj[propId]}
                ></UserCard>
              ))}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  )
}
CatalogueUser.propTypes = {
  display: PropTypes.object,
  editMode: PropTypes.object,
}
