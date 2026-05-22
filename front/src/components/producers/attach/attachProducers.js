import axios from 'axios'
import { useContext, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { BackConfContext } from '../../../context/backConfContext'
import useDefaultErrorHandler from '../../../utils/useDefaultErrorHandler'
import { Loader } from '../../other/loader/loader'
import { ProducerCard } from '../producer-card/producerCard'
import { SearchProducers } from '../search-producer/searchProducers'

const PAGE_SIZE = 20

export default function AttachProducers({ logout }) {
  const [searchResults, setSearchResults] = useState(null)
  const [name, setName] = useState('')
  const [uuid, setUuid] = useState('')

  const [sortBy, setSortBy] = useState('-updatedAt')
  const [currentOffset, setCurrentOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [displayLoader, setDisplayLoader] = useState(true)

  const { defaultErrorHandler } = useDefaultErrorHandler()
  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])
  useEffect(() => {
    if (currentOffset < 0) {
      setCurrentOffset(0)
    }

    if (name || uuid) {
      search()
    }
  }, [currentOffset])

  const getPortalOrgsUrl = (...args) => back?.isLoaded && back.getBackCatalog('/portal/organizations', ...args)
  const attachOrgUrl = (id) => getPortalOrgsUrl(id, 'attach')

  const handleCriteria = async ({ searchUuid, searchName }) => {
    console.groupCollapsed('handleCriteria')
    setUuid(searchUuid)
    setName(searchName)
    setHasMore(true)
    setCurrentOffset(0)
    setSearchResults([])
    console.log('searchUuid', searchUuid)
    console.log('searchName', searchName)
    await search(searchUuid, searchName)
    console.groupEnd()
  }

  const search = async (cardUuid = uuid, cardName = name) => {
    if (displayLoader) {
      setIsLoading(true)
    }
    try {
      let params = {
        sort_by: sortBy,
        limit: PAGE_SIZE,
        offset: currentOffset,
      }
      if (cardUuid) {
        params['uuid'] = cardUuid
      }
      if (cardName) {
        params['name'] = cardName
      }
      console.log('params', params)
      await axios
        .get(getPortalOrgsUrl(), { params })
        .then((res) => {
          if (res.data?.total < PAGE_SIZE || res.data?.elements.length < PAGE_SIZE) {
            setHasMore(false)
          }
          setIsLoading(false)

          let results = res.data?.elements ?? undefined
          if (results) {
            setSearchResults((values) => values.concat(results))
          }
        })
        .catch((err) => {
          setIsLoading(false)
          defaultErrorHandler(err)
        })
    } catch (err) {
      defaultErrorHandler(err)
    }
  }

  const endListMessage = () => {
    return searchResults && searchResults.length === 0 ? (
      <i>Aucune organisation trouvée pour cette recherche.</i>
    ) : (
      <i>Aucune donnée supplémentaire</i>
    )
  }

  return (
    <div className={'tempPaddingTop'}>
      <div className="row catalogue">
        <div className="col-2"></div>
        <div className="col-8">
          <div className="row">
            <SearchProducers handleCriteria={handleCriteria}></SearchProducers>
          </div>
          {!isLoading && searchResults && (
            <div className="row my-5">
              <h1>Résultats</h1>
              <InfiniteScroll
                dataLength={searchResults.length}
                hasMore={hasMore}
                next={() => {
                  setCurrentOffset(currentOffset + PAGE_SIZE)
                  setDisplayLoader(false)
                }}
                loader={<Loader fullScreen={false} size={'sm'}></Loader>}
                endMessage={endListMessage()}
              >
                {searchResults.map((producer) => (
                  <ProducerCard
                    editMode={false}
                    hideEdit={true}
                    producer={producer}
                    key={`${producer.organization_id}`}
                    propId="organization_id"
                    propName="organization_name"
                    displayFields={{
                      organization_id: "Identifiant de l'organisation",
                      organization_caption: 'Nom complet',
                      organization_summary: 'Description',
                      organization_address: 'Adresse',
                    }}
                    attachUrl={attachOrgUrl}
                  ></ProducerCard>
                ))}
              </InfiniteScroll>
            </div>
          )}
          {isLoading && displayLoader && (
            <div className="row my-5">
              <Loader fullScreen={false} size={'md'}></Loader>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
