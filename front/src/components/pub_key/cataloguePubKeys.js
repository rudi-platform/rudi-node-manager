import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import EditPubKeyCard from './editPubKeyCard';
import PubKeyCard from './pubKeyCard';
import { GeneralContext } from '../../generalContext';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';

const API_PUB_URL = 'api/admin/pub_keys'
const formPubKeysUrl = 'pub_keys'

/**
 * Composant : CataloguePubKey
 * @return {void}
 */
export default function CataloguePubKeys({ display, specialSearch, editMode }) {
  const [pubKeys, setPubKeys] = useState([]);
  const [formUrl, setFormUrl] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
  const [currentOffset, setCurrentOffset] = useState(0);

  const generalConf = useContext(GeneralContext);
  const { defaultErrorHandler } = useDefaultErrorHandler();

  useEffect(() => {
    getInitialData();
  }, []);

  useEffect(() => {
    setFormUrl(`${generalConf.formUrl}${formPubKeysUrl}`);
  }, [generalConf]);

  const refresh = () => {
    setHasMore(true);
    getInitialData();
  };

  /**
   * Fetch the first page of the public keys list
   */
  function getInitialData() {
    axios
      .get(API_PUB_URL, {
        params: { limit: PAGE_SIZE, offset: 0 },
      })
      .then((res) => {
        setCurrentOffset(PAGE_SIZE);
        setPubKeys(res.data);
      })
      .catch((e) => {
        defaultErrorHandler(e);
      });
  }

  /**
   * récupere la page suivante
   * @return {Function} fonction utilisée par InfiniteScroll
   */
  function fetchMoreData() {
    return () => {
      axios
        .get(API_PUB_URL, {
          params: { limit: PAGE_SIZE, offset: currentOffset },
        })
        .then((res) => {
          const conts = res.data;
          setCurrentOffset(currentOffset + PAGE_SIZE);
          if (conts.length === 0) {
            setHasMore(false);
          }
          setPubKeys(pubKeys.concat(conts));
        })
        .catch((e) => {
          defaultErrorHandler(e);
        });
    };
  }

  return (
    <div className="tempPaddingTop">
      <div className="row catalogue">
        <div className="col-9">
          <div className="row">
            {display && display.editJDD && formUrl && (
              <EditPubKeyCard formUrl={formUrl} refresh={refresh}></EditPubKeyCard>
            )}
            <InfiniteScroll
              dataLength={pubKeys.length}
              next={fetchMoreData()}
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
            >
              {pubKeys.map((pubKey, i) => {
                return (
                  <PubKeyCard
                    pubKey={pubKey}
                    formUrl={formUrl}
                    refresh={refresh}
                    key={pubKey.name}
                  ></PubKeyCard>
                );
              })}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  );
}
CataloguePubKeys.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
};
