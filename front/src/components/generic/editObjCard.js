import React, { useContext, useState } from 'react';
import { Plus, Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { DefaultConfirmOption, DefaultOkOption, ModalContext } from '../modals/ModalContext';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';

EditObjCard.propTypes = {
  idField: PropTypes.string,
  urlEdit: PropTypes.string,
  refresh: PropTypes.func,
  urlDelete: PropTypes.func,
  msgConfirmDelete: PropTypes.func,
  msgDelete: PropTypes.func,
  btnTextAdd: PropTypes.string,
  btnTextChg: PropTypes.string,
};

/**
 * Composant : EditCard
 * @return {ReactNode}
 */
export default function EditObjCard({
  idField,
  urlEdit,
  urlDelete,
  msgConfirmDelete,
  msgDelete,
  btnTextAdd,
  btnTextChg,
  refresh,
}) {
  const [editID, setEditID] = useState('');

  const { changeOptions, toggle } = useContext(ModalContext);
  const { defaultErrorHandler } = useDefaultErrorHandler();
  /**
   * met a jour le state lors de la modification de l'input de modification de JDD
   * @param {*} event event
   * @return {void}
   */
  const handleChange = (event) => setEditID(event.target.value);

  /**
   * Call for organization deletion
   * @param {*} id Identifier of the object to delete
   */
  const deleteObj = (id) => {
    axios
      .delete(deleteUrl(id))
      .then((res) => {
        //  const options = getOkOptions(deleteMsg(res.data), refresh);
        const options = DefaultOkOption;
        options.text = [okText];
        options.buttons = [{ text: 'Ok', action: () => refresh() }];
        changeOptions(options);
        toggle();
      })
      .catch((e) => defaultErrorHandler(e));
  };

  /**
   * call for confirmation before object deletion
   * @param {*} id Identifier of the object to delete
   */
  const triggerDeleteObj = (id) => {
    // const options = getConfirmOptions(deleteConfirmMsg(id), () => deleteObj(id));
    const options = DefaultConfirmOption;
    options.text = [deleteConfirmMsg];
    options.buttons = [
      { text: 'Oui', action: () => deleteObj() },
      { text: 'Non', action: () => {} },
    ];
    changeOptions(options);
    toggle();
  };

  return (
    <div className="col-12">
      <div className="card edit-card-margin">
        <div className="card-body">
          <div className="inline">
            <a
              href={urlEdit}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              {btnTextAdd}
              <Plus />
            </a>
          </div>
          <div className="inline card-text on-right">
            {btnTextChg}&nbsp;
            <div className="btn-group" role="group">
              <input
                type="text"
                className="form-control"
                placeholder={idField}
                value={editID}
                onChange={handleChange}
              />
              <a
                href={`${urlEdit}?update=${editID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-warning"
              >
                <Pencil />
              </a>
              <button
                type="button"
                className="btn btn-danger"
                onClick={(e) => triggerDeleteObj(editID)}
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
