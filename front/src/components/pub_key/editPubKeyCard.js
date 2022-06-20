import React, { useState } from 'react';
import { Plus, Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ModalContext, DefaultOkOption, DefaultConfirmOption } from '../modals/ModalContext';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';

/**
 * Composant : EditPubKeyCard
 * @return {void}
 */
export default function EditPubKeyCard({ formUrl, refresh }) {
  const [editID, setEditID] = useState('');
  const { changeOptions, toggle } = React.useContext(ModalContext);
  const { defaultErrorHandler } = useDefaultErrorHandler();
  /**
   * met a jour le state lors de la modification de l'input de modification de JDD
   * @param {*} event event
   */
  const handleChange = (event) => {
    setEditID(event.target.value);
  };

  /**
   * call for public key deletion
   */
  function deletePubKey() {
    axios
      .delete(`api/admin/pub_keys/${editID}`)
      .then((res) => {
        const options = DefaultOkOption;
        options.text = [`La clé publique ${res.data.name} a été retirée`];
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
        defaultErrorHandler(e);
      });
  }

  /**
   * call for confirmation before the public key deletion
   */
  function triggerDeletePubKey() {
    const options = DefaultConfirmOption;
    options.text = [`Confirmez vous la suppression de la clé publique ${editID}?`];
    options.buttons = [
      {
        text: 'Oui',
        action: () => {
          deletePubKey();
        },
      },
      {
        text: 'Non',
        action: () => {},
      },
    ];
    changeOptions(options);
    toggle();
  }

  return (
    <div className="col-12">
      <div className="card tempMargin">
        <div className="card-body">
          <div>
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Ajouter une clé publique <Plus />
            </a>
          </div>
          <div className="card-text">
            Modifier une clé publique :
            <div className="btn-group" role="group">
              <input
                type="text"
                className="form-control"
                placeholder="name"
                value={editID}
                onChange={handleChange}
              />
              <a
                href={`${formUrl}?update=${editID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-warning"
              >
                <Pencil />
              </a>
              <button
                type="button"
                className="btn btn-danger"
                onClick={(e) => triggerDeletePubKey()}
              >
                <Trash />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EditPubKeyCard.propTypes = {
  formUrl: PropTypes.string,
  refresh: PropTypes.func,
};
