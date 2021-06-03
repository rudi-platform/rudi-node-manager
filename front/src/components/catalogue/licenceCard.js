import React, { Component } from 'react';
import { Pencil, Trash, Check } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';

/**
 * Composant : LicenceCard
 * @return {void}
 */
class LicenceCard extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      formUrl: props.formUrl,
      metadata: props.metadata,
    };
  }

  /**
   * trigger a la création du composant :
   */
  componentDidMount() {}

  /**
   * affiche le text en fonction de la langue choisi
   * @param {*} langObjectArray Array d'objet au format {lang:'', text:''}
   * @param {String} lang langue selectionnée
   * @return {String} text dans la langue appropriée
   */
  getLangText(langObjectArray, lang) {
    // TODO
    return langObjectArray[0].text;
  }

  /**
   * render le composant
   * @return {ReactNode} html du composant
   */
  render() {
    return (
      <div className="col-12" key={this.state.metadata.concept_id}>
        <div className="card tempMargin">
          <h5 className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <a>{this.getLangText(this.state.metadata.pref_label)}</a>
              {this.props.display && this.props.display.editJDD && (
                <div className="btn-group" role="group">
                  <button type="button" className="btn btn-success">
                    <Check />
                  </button>
                  <a className="btn btn-warning">
                    <Pencil />
                  </a>
                  <button type="button" className="btn btn-danger">
                    <Trash />
                  </button>
                </div>
              )}
            </div>
          </h5>
          <div className="card-body">
            <p className="card-text">
              id :<small className="text-muted">{this.state.metadata.concept_id}</small>
            </p>
            <p className="card-text">
              code :<small className="text-muted">{this.state.metadata.concept_code}</small>
            </p>
            <p className="card-text">
              role : <small className="text-muted"> {this.state.metadata.concept_role}</small>
            </p>
            <p className="card-text">
              uri : <small className="text-muted"> {this.state.metadata.concept_uri}</small>
            </p>
          </div>
        </div>
      </div>
    );
  }
}
LicenceCard.propTypes = {
  metadata: PropTypes.object,
  formUrl: PropTypes.string,
  display: PropTypes.object,
};

export default LicenceCard;
