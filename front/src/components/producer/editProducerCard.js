import React, { Component } from 'react';
import { Plus, Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';

/**
 * Composant : EditProducerCard
 * @return {void}
 */
class EditProducerCard extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      editID: '',
    };

    this.handleChange = this.handleChange.bind(this);
  }
  /**
   * met a jour le state lors de la modification de l'input de modification de JDD
   * @param {*} event event
   */
  handleChange(event) {
    this.setState({ editID: event.target.value });
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
      <div className="col-12">
        <div className="card tempMargin">
          <div className="card-body">
            <div>
              <a className="btn btn-secondary">
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
                  value={this.state.editID}
                  onChange={this.handleChange}
                />
                <a className="btn btn-warning">
                  <Pencil />
                </a>
                <button type="button" className="btn btn-danger">
                  <Trash />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
EditProducerCard.propTypes = {
  formUrl: PropTypes.string,
};

export default EditProducerCard;
