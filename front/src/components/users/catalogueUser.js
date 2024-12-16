import axios from 'axios'
import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import { BackConfContext } from '../../context/backConfContext.js'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import ActOnUserCard from './actOnUserCard'
import UserCard from './userCard'

const PAGE_SIZE = 20

CatalogueUser.propTypes = {
  editMode: PropTypes.bool,
  logout: PropTypes.func,
}

/**
 * Composant : CatalogueUser
 * @return {ReactNode}
 */
export default function CatalogueUser({ editMode, logout }) {
  const { backConf } = useContext(BackConfContext)

  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const urlUsers = back?.getBackSecu('users')
  const urlRoles = back?.getBackSecu('roles')

  const { defaultErrorHandler } = useDefaultErrorHandler()

  const [isEdit, setIsEdit] = useState(!!editMode)
  useEffect(() => setIsEdit(!!editMode), [editMode])

  const [roleList, setRoleList] = useState([])
  const [userList, setUserList] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [currentOffset, setCurrentOffset] = useState(0)

  useEffect(() => {
    fetchUserData()
  }, [backConf])

  const refresh = () => fetchUserData()

  /**
   * recup la 1er page des métadonnéees et les countBy
   */
  const fetchUserData = () =>
    back?.isLoaded &&
    Promise.all([axios.get(urlRoles), axios.get(urlUsers)])
      .then((res) => {
        setRoleList(res[0].data)
        setUserList(res[1].data)
      })
      .catch((err) => (err.response?.status == 401 ? logout() : defaultErrorHandler(err)))

  /**
   * Fonction utilisée par InfiniteScroll
   * Récupere la page suivante
   */
  const fetchMoreData = () => {
    axios
      .get(urlUsers, { params: { limit: PAGE_SIZE, offset: currentOffset } })
      .then((res) => {
        const partialObjList = res.data
        setCurrentOffset(currentOffset + PAGE_SIZE)
        if (partialObjList.length < PAGE_SIZE) setHasMore(false)
        setUserList(userList.concat(partialObjList))
      })
      .catch((err) => (err.response?.status == 401 ? logout() : defaultErrorHandler(err)))
  }

  return (
    <div className="tempPaddingTop">
      <div className="row catalogue">
        <div className="col-9">
          <div className="row">
            {isEdit && <ActOnUserCard refresh={refresh} roleList={roleList}></ActOnUserCard>}
            {userList.length ? (
              <InfiniteScroll
                dataLength={userList.length}
                next={fetchMoreData}
                hasMore={hasMore}
                loader={<h4>Loading...</h4>}
                endMessage={<i>Aucune donnée supplémentaire</i>}
              >
                {userList.map((user) => (
                  <UserCard roleList={roleList} user={user} key={user.id} refresh={refresh}></UserCard>
                ))}
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
