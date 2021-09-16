import React, { useState } from 'react';
import { Plus, Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ModalContext, DefaultErrorOption } from '../modals/ModalContext';

/**
 * Composant : EditProducerCard
 * @return {ReactNode}
 */
export default function EditProducerCard({ formUrl }) {
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
   * call for organization deletion
   */
  function deleteOrganization() {
    axios
      .delete(`${process.env.PUBLIC_URL}/api/admin/organizations/${editID}`)
      .then((res) => {
        const options = DefaultOkOption;
        options.text = `Le Producteur ${res.data.organization_name} à été supprimé`;
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
              Ajouter un Producteur <Plus />
            </a>
          </div>
          <div className="card-text">
            Modifier un Producteur :
            <div className="btn-group" role="group">
              <input
                type="text"
                className="form-control"
                placeholder="id du producteur"
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
                onClick={(e) => deleteOrganization()}
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
EditProducerCard.propTypes = {
  formUrl: PropTypes.string,
};
