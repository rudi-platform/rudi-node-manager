import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import EditUserCard from './editUserCard';
import UserCard from './userCard';
import { GeneralContext } from '../../generalContext';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';

/**
 * Composant : CatalogueUser
 * @return {ReactNode}
 */
export default function CatalogueUser({ editMode, display }) {
  const [users, setUser] = useState([]);
  const [formUrl, setFormUrl] = useState('');
  const [hasMore] = useState(false);
  const PAGE_SIZE = 20;
  const [currentOffset, setCurrentOffset] = useState(0);
  const generalConf = useContext(GeneralContext);

  const { defaultErrorHandler } = useDefaultErrorHandler();

  useEffect(() => getInitialData(), []);
  useEffect(() => setFormUrl(`${generalConf.formUrl}users`), [generalConf]);

  const refresh = () => getInitialData();

  /**
   * recup la 1er page des métadonnéees et les countBy
   */
  function getInitialData() {
    axios
      .get(`api/v1/users`)
      .then((res) => {
        setCurrentOffset(PAGE_SIZE);
        setUser(res.data);
      })
      .catch((e) => defaultErrorHandler(e));
  }

  /**
   * récupere la page suivante
   * @return {Function} fonction utilisée par InfiniteScroll
   */
  function fetchMoreData() {
    return () => {
      axios
        .get(`api/admin/users`, {
          params: { limit: PAGE_SIZE, offset: currentOffset },
        })
        .then((res) => {
          const userList = res.data;

          setCurrentOffset(currentOffset + PAGE_SIZE);
          if (userList.length === 0) {
            setHasMore(false);
          }
          setOrganizations(users.concat(userList));
        })
        .catch((e) => defaultErrorHandler(e));
    };
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
              dataLength={users.length}
              next={fetchMoreData()}
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
            >
              {users.map((user, i) => {
                return (
                  <UserCard
                    user={user}
                    display={display}
                    refresh={refresh}
                    key={user.id}
                  ></UserCard>
                );
              })}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  );
}
CatalogueUser.propTypes = {
  display: PropTypes.object,
  editMode: PropTypes.object,
};
