import React, { useState } from 'react';
import { Plus, Pencil, Trash, Check } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ModalContext, DefaultErrorOption } from '../modals/ModalContext';

/**
 * Composant : EditCard
 * @return {ReactNode}
 */
export default function EditCard({ formUrl }) {
  const { changeOptions, toggle } = React.useContext(ModalContext);

  const [editID, setEditID] = useState('');

  /**
   * met a jour le state lors de la modification de l'input de modification de JDD
   * @param {*} event event
   */
  const handleChange = (event) => {
    setEditID(event.target.value);
  };

  /**
   * call for metadata deletion
   */
  function deleteRessource() {
    axios
      .delete(`${process.env.PUBLIC_URL}/api/admin/ressources/${editID}`)
      .then((res) => {
        // TODO
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
    <div className="col-12">
      <div className="card tempMargin">
        <div className="card-body">
          <div>
            <a href={formUrl} className="btn btn-secondary">
              Ajouter un Jeu de Donnée <Plus />
            </a>
          </div>
          <div className="card-text">
            Modifier un Jeu de donnée :
            <div className="btn-group" role="group">
              <input
                type="text"
                className="form-control"
                placeholder="id du jeu de donnée"
                value={editID}
                onChange={handleChange}
              />
              <button type="button" className="btn btn-success">
                <Check />
              </button>
              <a className="btn btn-warning" href={`${formUrl}?update=${editID}`}>
                <Pencil />
              </a>
              <button type="button" className="btn btn-danger" onClick={(e) => deleteRessource()}>
                <Trash />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EditCard.propTypes = {
  formUrl: PropTypes.string,
};
