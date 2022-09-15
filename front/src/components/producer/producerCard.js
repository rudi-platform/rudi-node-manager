import React from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ModalContext, getOptConfirm, getOptOk } from '../modals/ModalContext';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';

ObjCard.propTypes = {
  objId: PropTypes.string,
  txtObjId: PropTypes.string,
  objName: PropTypes.string,
  formUrl: PropTypes.string,
  refresh: PropTypes.func,
};

/**
 * Composant : ProducerCard
 * @return {ReactNode}
 */
export default function ObjCard({ formUrl, objId, objName, txtObjId, refresh }) {
  const { changeOptions, toggle } = React.useContext(ModalContext);
  const { defaultErrorHandler } = useDefaultErrorHandler();

  /**
   * Call for organization deletion
   * @param {*} id Identifier of the object to delete
   */
  const deleteObj = (id) => {
    axios
      .delete(`api/admin/organizations/${id}`)
      .then((res) => {
        changeOptions(
          getOptOk(`Le Producteur ${res.data.organization_name} a été supprimé`, () => refresh()),
        );
        toggle();
      })
      .catch((e) => defaultErrorHandler(e));
  };
  /**
   * call for confirmation before organization deletion
   * @param {*} id Identifier of the organization to delete
   */
  const triggerDeleteObj = (id) => {
    changeOptions(
      getOptConfirm(`Confirmez vous la suppression du Producteur ${objName}?`, () => deleteObj(id)),
    );
    toggle();
  };
  
  return (
    <div className="col-12" key={objId}>
      <div className="card card-margin">
        <h5 className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <a>{objName}</a>
            <div className="btn-group" role="group">
              <a
                href={`${formUrl}?update=${objId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-warning"
              >
                <Pencil />
              </a>
              <button
                type="button"
                className="btn btn-danger"
                onClick={(e) => triggerDeleteObj(objId)}
              >
                <Trash />
              </button>
            </div>
          </div>
        </h5>
        <div className="card-body">
          <p className="card-text">
            {txtObjId} : <small className="text-muted">{objId}</small>
          </p>
        </div>
      </div>
    </div>
  );
}
