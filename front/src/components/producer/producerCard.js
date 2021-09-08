import React from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ModalContext, DefaultErrorOption } from '../modals/ModalContext';

/**
 * Composant : ProducerCard
 * @return {ReactNode}
 */
export default function ProducerCard({ formUrl, organization }) {
  const { changeOptions, toggle } = React.useContext(ModalContext);

  /**
   * call for organization deletion
   * @param {*} organization organization a suppr
   */
  function deleteOrganization(organization) {
    axios
      .delete(`${process.env.PUBLIC_URL}/api/admin/organizations/${organization.organization_id}`)
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
    <div className="col-12" key={organization.organization_id}>
      <div className="card tempMargin">
        <h5 className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <a>{organization.organization_name}</a>
            <div className="btn-group" role="group">
              <a
                href={`${formUrl}?update=${organization.organization_id}`}
                className="btn btn-warning"
              >
                <Pencil />
              </a>
              <button
                type="button"
                className="btn btn-danger"
                onClick={(e) => deleteOrganization(organization)}
              >
                <Trash />
              </button>
            </div>
          </div>
        </h5>
      </div>
    </div>
  );
}
ProducerCard.propTypes = {
  organization: PropTypes.object,
  formUrl: PropTypes.string,
};
