import React, { Component } from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Composant : ProducerCard
 * @return {void}
 */
class ProducerCard extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      formUrl: props.formUrl,
      organization: props.organization,
    };
  }

  /**
   * trigger a la création du composant :
   */
  componentDidMount() {}
  /**
   * call for organization deletion
   * @param {*} organization organization a suppr
   */
  deleteOrganization(organization) {
    axios
      .delete(`${process.env.PUBLIC_URL}/api/admin/organizations/${organization.organization_id}`)
      .then((res) => {
        // TODO
      })
      .catch((e) => {
        console.log(e);
        // TODO
      });
  }

  /**
   * render le composant
   * @return {ReactNode} html du composant
   */
  render() {
    return (
      <div className="col-12" key={this.state.organization.organization_id}>
        <div className="card tempMargin">
          <h5 className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <a>{this.state.organization.organization_name}</a>
              <div className="btn-group" role="group">
                <a
                  href={`${this.state.formUrl}?update=${this.state.organization.organization_id}`}
                  className="btn btn-warning"
                >
                  <Pencil />
                </a>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={(e) => this.deleteOrganization(this.state.organization)}
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
}
ProducerCard.propTypes = {
  organization: PropTypes.object,
  formUrl: PropTypes.string,
};

export default ProducerCard;
