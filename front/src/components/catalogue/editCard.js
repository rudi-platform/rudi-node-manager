import React, { Component } from 'react';
import { Plus, Pencil, Trash, Check } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Composant : EditCard
 * @return {void}
 */
class EditCard extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      formUrl: props.formUrl,
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
   * call for metadata deletion
   */
  deleteRessource() {
    axios
      .delete(`${process.env.PUBLIC_URL}/api/admin/ressources/${this.state.editID}`)
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
      <div className="col-12">
        <div className="card tempMargin">
          <div className="card-body">
            <div>
              <a href={this.state.formUrl} className="btn btn-secondary">
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
                  value={this.state.editID}
                  onChange={this.handleChange}
                />
                <button type="button" className="btn btn-success">
                  <Check />
                </button>
                <a
                  className="btn btn-warning"
                  href={`${this.state.formUrl}?update=${this.state.editID}`}
                >
                  <Pencil />
                </a>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={(e) => this.deleteRessource()}
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
}
EditCard.propTypes = {
  formUrl: PropTypes.string,
};

export default EditCard;
