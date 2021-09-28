import React from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ModalContext, DefaultErrorOption, DefaultOkOption } from '../modals/ModalContext';

/**
 * Composant : ContactCard
 * @return {ReactNode}
 */
export default function ContactCard({ contact, formUrl, refresh }) {
  const { changeOptions, toggle } = React.useContext(ModalContext);
  /**
   * call for contact deletion
   * @param {*} contact contact a suppr
   */
  function deleteContact(contact) {
    axios
      .delete(`${process.env.PUBLIC_URL}/api/admin/contacts/${contact.contact_id}`)
      .then((res) => {
        const options = DefaultOkOption;
        options.text = `Le Contact ${res.data.contact_name} a été supprimé`;
        options.buttons = [
          {
            text: 'Ok',
            action: () => {
              refresh();
            },
          },
        ];
        changeOptions(options);
        toggle();
      })
      .catch((e) => {
        console.log(e);
        const options = DefaultErrorOption;
        options.text = `${e.response.data}`;
        changeOptions(options);
        toggle();
      });
  }

  return (
    <div className="col-12" key={contact.contact_id}>
      <div className="card tempMargin">
        <h5 className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <a>{contact.contact_name}</a>
            <div className="btn-group" role="group">
              <a
                href={`${formUrl}?update=${contact.contact_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-warning"
              >
                <Pencil />
              </a>
              <button
                type="button"
                className="btn btn-danger"
                onClick={(e) => deleteContact(contact)}
              >
                <Trash />
              </button>
            </div>
          </div>
        </h5>
        <div className="card-body">
          <p className="card-text">
            email :<small className="text-muted">{contact.email}</small>
          </p>
        </div>
      </div>
    </div>
  );
}
ContactCard.propTypes = {
  contact: PropTypes.object,
  formUrl: PropTypes.string,
  refresh: PropTypes.func,
};
