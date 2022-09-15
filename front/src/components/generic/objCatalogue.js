import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';

import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';
import { GeneralContext } from '../../generalContext';
import { EditObjCard, ObjCard } from '../generic/objCard';

const PAGE_SIZE = 20;
const API_URL = '/api/admin'

ObjCatalogue.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
  btnTextAdd: PropTypes.string,
  btnTextChg: PropTypes.string,
  propId: PropTypes.string,
  propName: PropTypes.string,
  propNamesToDisplay: PropTypes.object,
  formUrlObj: PropTypes.string,
  apiUrlObj: PropTypes.string,
  deleteConfirmMsg: PropTypes.func,
  deleteMsg: PropTypes.func,
};

/**
 * Composant : CatalogueContact
 * @return {void}
 */
export default function ObjCatalogue({
  display,
  specialSearch,
  editMode,
  btnTextAdd,
  btnTextChg,
  propId,
  propName,
  propNamesToDisplay,
  formUrlObj,
  deleteConfirmMsg,
  deleteMsg,
}) {
  const [listObj, setListObj] = useState([]);
  const [formUrl, setFormUrl] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);

  const { defaultErrorHandler } = useDefaultErrorHandler();

  const generalConf = useContext(GeneralContext);
  const editUrl = `${generalConf.formUrl}${formUrlObj}`;
  const apiUrlObj = `${API_URL}/${formUrlObj}`;

  useEffect(() => getInitialData(), []);
  useEffect(() => setFormUrl(editUrl), [generalConf]);

  const deleteUrl = (id) => `${apiUrlObj}/${id}`;
  const refresh = () => {
    setHasMore(true);
    getInitialData();
  };

  /**
   * recup la 1er page des contacts
   */
  function getInitialData() {
    axios
      .get(apiUrlObj, { params: { limit: PAGE_SIZE, offset: 0 } })
      .then((res) => {
        setCurrentOffset(PAGE_SIZE);
        setListObj(res.data);
      })
      .catch((e) => defaultErrorHandler(e));
  }

  /**
   * Fonction utilisée par InfiniteScroll
   * Récupere la page suivante
   */
  const fetchMoreData = () => {
    axios
      .get(apiUrlObj, { params: { limit: PAGE_SIZE, offset: currentOffset } })
      .then((res) => {
        const partialListObj = res.data;
        setCurrentOffset(currentOffset + PAGE_SIZE);
        if (partialListObj.length === 0) setHasMore(false);
        setListObj(listObj.concat(partialListObj));
      })
      .catch((e) => defaultErrorHandler(e));
  };

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
  );
}
