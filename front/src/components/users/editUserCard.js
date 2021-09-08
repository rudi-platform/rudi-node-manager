import React, { useState } from 'react';
import { Plus, Pencil, Trash } from 'react-bootstrap-icons';
import axios from 'axios';
import { ModalContext, DefaultErrorOption } from '../modals/ModalContext';

/**
 * Composant : EditCard
 * @return {ReactNode}
 */
export default function EditCard({}) {
  const [editID, setEditID] = useState('');

  const { changeOptions, toggle } = React.useContext(ModalContext);
  /**
   * met a jour le state lors de la modification de l'input de modification de JDD
   * @param {*} event event
   */
  const handleChange = (event) => {
    setEditID(event.target.value);
  };
  /**
   * call for user deletion
   * @param {*} user utilisateur
   */
  function deleteUser() {
    axios
      .delete(`${process.env.PUBLIC_URL}/api/v1/users/${editID}`)
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
            <a className="btn btn-secondary">
              Ajouter un Utilisateur <Plus />
            </a>
          </div>
          <div className="card-text">
            Modifier un Utilisateur :
            <div className="btn-group" role="group">
              <input
                type="text"
                className="form-control"
                placeholder="username"
                value={editID}
                onChange={handleChange}
              />
              <a className="btn btn-warning">
                <Pencil />
              </a>
              <button type="button" className="btn btn-danger" onClick={(e) => deleteUser()}>
                <Trash />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
EditCard.propTypes = {};
