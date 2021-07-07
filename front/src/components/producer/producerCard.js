import React, { Component } from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';

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
                <a className="btn btn-warning">
                  <Pencil />
                </a>
                <button type="button" className="btn btn-danger">
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
