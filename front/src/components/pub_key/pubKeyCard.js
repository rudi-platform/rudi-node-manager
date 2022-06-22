import React from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ModalContext, DefaultOkOption, DefaultConfirmOption } from '../modals/ModalContext';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';

/**
 * Composant : PubKeyCard
 * @return {ReactNode}
 */
export default function PubKeyCard({ pubKey, formUrl, refresh }) {
  const { changeOptions, toggle } = React.useContext(ModalContext);
  const { defaultErrorHandler } = useDefaultErrorHandler();
  /**
   * Call for public key deletion
   * @param {*} pubKey The public key to delete
   */
  function deletePubKey(pubKey) {
    axios
      .delete(`api/admin/pub_keys/${pubKey.name}`)
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
   * Call for confirmation before public key deletion
   * @param {*} pubKey The public key to delete
   */
  function triggerDeletePubKey(pubKey) {
    const options = DefaultConfirmOption;
    options.text = [`Confirmez vous la suppression de la clé publique ${pubKey.name}?`];
    options.buttons = [
      {
        text: 'Oui',
        action: () => {
          deletePubKey(pubKey);
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
    <div className="col-12" key={pubKey.name}>
      <div className="card temp-margin">
        <h5 className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <a>{pubKey.name}</a>
            <div className="btn-group" role="group">
              <a
                href={`${formUrl}?update=${pubKey.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-warning"
              >
                <Pencil />
              </a>
              <button
                type="button"
                className="btn btn-danger"
                onClick={(e) => triggerDeletePubKey(pubKey)}
              >
                <Trash />
              </button>
            </div>
          </div>
        </h5>
        <div className="card-body">
          <p className="card-text">
            name :<small className="text-muted">{pubKey.name}</small>
          </p>
          <p className="card-text">
            url :<small className="text-muted">{pubKey.url}</small>
          </p>
          {pubKey.prop && (
            <p className="card-text">
              prop :<small className="text-muted">{pubKey.prop}</small>
            </p>
          )}
          <p className="card-text">
            pem :<small className="text-muted">{pubKey.pem}</small>
          </p>
          <p className="card-text">
            key :<small className="text-muted">{pubKey.key}</small>
          </p>
          <p className="card-text">
            type :<small className="text-muted">{pubKey.type}</small>
          </p>
        </div>
      </div>
    </div>
  );
}
PubKeyCard.propTypes = {
  pubKey: PropTypes.object,
  formUrl: PropTypes.string,
  refresh: PropTypes.func,
};
