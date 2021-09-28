import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import EditContactCard from './editContactCard';
import ContactCard from './contactCard';

/**
 * Composant : CatalogueContact
 * @return {void}
 */
export default function CatalogueContact({ display, specialSearch, editMode }) {
  const [contacts, setContacts] = useState([]);
  const [formUrl, setFormUrl] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
  const [currentOffset, setCurrentOffset] = useState(0);

  useEffect(() => {
    axios.get(`${process.env.PUBLIC_URL}/api/v1/formUrl`).then((res) => {
      setFormUrl(`${res.data}contacts`);
    });
    getInitialData();
  }, []);

  const refresh = () => {
    setHasMore(true);
    getInitialData();
  };

  /**
   * recup la 1er page des contacts
   */
  function getInitialData() {
    axios
      .get(`${process.env.PUBLIC_URL}/api/admin/contacts`, {
        params: { limit: PAGE_SIZE, offset: currentOffset },
      })
      .then((res) => {
        setCurrentOffset(PAGE_SIZE);
        setContacts(res.data);
      });
  }

  /**
   * récupere la page suivante
   * @return {Function} fonction utilisée par InfiniteScroll
   */
  function fetchMoreData() {
    return () => {
      currentOffset += PAGE_SIZE;
      axios
        .get(`${process.env.PUBLIC_URL}/api/admin/contacts`, {
          params: { limit: PAGE_SIZE, offset: currentOffset },
        })
        .then((res) => {
          const conts = res.data;
          setCurrentOffset(currentOffset + PAGE_SIZE);
          if (conts.length === 0) {
            setHasMore(false);
          }
          setContacts(contacts.concat(conts));
        });
    };
  }

  return (
    <div className="tempPaddingTop">
      <div className="row">
        <div className="col-9">
          <div className="row">
            {display && display.editJDD && formUrl && (
              <EditContactCard formUrl={formUrl} refresh={refresh}></EditContactCard>
            )}
            <InfiniteScroll
              dataLength={contacts.length}
              next={fetchMoreData()}
              hasMore={hasMore}
              loader={<h4>Loading...</h4>}
            >
              {contacts.map((contact, i) => {
                return (
                  <ContactCard
                    contact={contact}
                    formUrl={formUrl}
                    refresh={refresh}
                    key={contact.contact_id}
                  ></ContactCard>
                );
              })}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  );
}
CatalogueContact.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
};
