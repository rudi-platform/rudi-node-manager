import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import ContactCard from './contactCard';
import { GeneralContext } from '../../generalContext';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';
import EditObjCard from '../generic/editObjCard';

const idField = 'contact_id';

const deleteUrl = (id) => `api/admin/contacts/${id}`;
const deleteConfirmMsg = (id) => `Confirmez vous la suppression du contact ${id}?`;
const deleteMsg = (data) => `Le contact ${data.contact_name} a été supprimé`;

const btnTextAdd = 'Ajouter un contact';
const btnTextChg = 'Modifier un contact :';

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

  const generalConf = useContext(GeneralContext);
  const { defaultErrorHandler } = useDefaultErrorHandler();

  useEffect(() => getInitialData(), []);
  useEffect(() => setFormUrl(`${generalConf.formUrl}contacts`), [generalConf]);

  const refresh = () => {
    setHasMore(true);
    getInitialData();
  };

  /**
   * recup la 1er page des contacts
   */
  function getInitialData() {
    axios
      .get(`api/admin/contacts`, {
        params: { limit: PAGE_SIZE, offset: 0 },
      })
      .then((res) => {
        setCurrentOffset(PAGE_SIZE);
        setContacts(res.data);
      })
      .catch((e) => defaultErrorHandler(e));
  }

  /**
   * récupere la page suivante
   * @return {Function} fonction utilisée par InfiniteScroll
   */
  const fetchMoreData = () =>
    axios
      .get(`api/admin/contacts`, {
        params: { limit: PAGE_SIZE, offset: currentOffset },
      })
      .then((res) => {
        const conts = res.data;
        setCurrentOffset(currentOffset + PAGE_SIZE);
        if (conts.length === 0) setHasMore(false);
        setContacts(contacts.concat(conts));
      })
      .catch((e) => defaultErrorHandler(e));

  return (
    <div className="tempPaddingTop">
      <div className="row catalogue">
        <div className="col-9">
          <div className="row">
            {display && display.editJDD && formUrl && (
              <EditObjCard
                idField={idField}
                urlEdit={formUrl}
                urlDelete={deleteUrl}
                msgConfirmDelete={deleteConfirmMsg}
                msgDelete={deleteMsg}
                btnTextAdd={btnTextAdd}
                btnTextChg={btnTextChg}
                refresh={refresh}
              ></EditObjCard>
            )}
            <InfiniteScroll
              dataLength={contacts.length}
              next={fetchMoreData}
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
