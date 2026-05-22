import axios from 'axios'
import { useContext, useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { BackConfContext } from '../../context/backConfContext'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import { ProducerCard } from './producer-card/producerCard'
import { ProducerManagmentCard } from './producerManagmentCard'

const PAGE_SIZE = 20

/**
 * Composant : CatalogueProducer
 * @return {void}
 */
export default function CatalogueProducer({ editMode, logout }) {
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const [isEdit, setIsEdit] = useState(!!editMode)
  useEffect(() => setIsEdit(editMode), [editMode])

  const [portalConnected, setPortalConnected] = useState(true)
  useEffect(() => setPortalConnected(back?.isLoaded && back.portalConnected), [backConf])

  const [producerList, setProducerList] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(-1)
  const initialRender = useRef(true)

  const getCatalogUrlObj = (suffix) => back?.isLoaded && back.getBackCatalog('organizations', suffix)
  const deleteUrl = (id) => getCatalogUrlObj(id)
  const sortBy = '-organization_status,-updatedAt'
  // const [sortBy, setSortBy] = useState('organization_status,-updatedAt')
  // useEffect(() => setSortBy('-updatedAt'), ['-updatedAt'])

  const refresh = () => {
    setHasMore(true)
    setProducerList([])
    getInitialData()

    if (currentOffset === 0) {
      setCurrentOffset(-1)
    } else {
      setCurrentOffset(0)
    }
  }
  useEffect(() => refresh(), [false])

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
        setProducerList((producers) => producers.concat(data))
      })
      .catch((err) => (err.response?.status == 401 ? logout() : defaultErrorHandler(err)))
  }
  return (
    <div className={'tempPaddingTop'}>
      <div className="row catalogue">
        <div className="col-9">
          <div className="row">
            <ProducerManagmentCard></ProducerManagmentCard>
            <InfiniteScroll
              dataLength={producerList.length}
              next={() => setCurrentOffset(currentOffset + PAGE_SIZE)}
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
              endMessage={<i>Aucune donnée supplémentaire</i>}
            >
              {producerList.map((producer) => (
                <ProducerCard
                  editMode={isEdit}
                  producer={producer}
                  key={`${producer.organization_id}`}
                  refresh={refresh}
                  deleteUrl={deleteUrl}
                ></ProducerCard>
              ))}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  )
}
