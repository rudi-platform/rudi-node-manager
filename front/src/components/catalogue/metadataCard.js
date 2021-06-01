import React, { Component } from 'react';
import { Pencil, Trash, Check, CloudDownload, Eye } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';

/**
 * Composant : metadataCard
 * @return {void}
 */
class MetadataCard extends Component {
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
   * download le fichier via media_id
   * @param {*} ressource connector du fichier
   */
  downloadFile(ressource) {
    window.open(`${process.env.PUBLIC_URL}/api/media/download/${ressource.media_id}`);
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
      <div className="col-12" key={this.state.metadata.global_id}>
        <div className="card tempMargin">
          <h5 className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <a href={`${this.state.formUrl}?read-only=${this.state.metadata.global_id}`}>
                {this.state.metadata.resource_title}
              </a>
              {!this.state.metadata.dataset_dates.published &&
                !this.state.metadata.dataset_dates.deleted && (
                  <span className="badge badge-warning badge-pill">waiting</span>
                )}
              {this.state.metadata.dataset_dates.published &&
                !this.state.metadata.dataset_dates.deleted && (
                  <span className="badge badge-success badge-pill">published</span>
                )}
              {this.state.metadata.dataset_dates.deleted && (
                <span className="badge badge-danger badge-pill">deleted</span>
              )}
              {this.props.display && this.props.display.editJDD && (
                <div className="btn-group" role="group">
                  <button type="button" className="btn btn-success">
                    <Check />
                  </button>
                  <a
                    className="btn btn-warning"
                    href={`${this.state.formUrl}?update=${this.state.metadata.global_id}`}
                  >
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
            <p className="card-text">{this.getLangText(this.state.metadata.summary)}</p>
            <p className="card-text">
              Producteur :
              <small className="text-muted">{this.state.metadata.producer.organization_name}</small>
            </p>
            <p className="card-text">
              global_id : <small className="text-muted"> {this.state.metadata.global_id}</small>
            </p>
            <p className="card-text">
              media_id :
              {this.state.metadata.available_formats.map((ressource, i) => {
                return (
                  <span key={`${ressource.media_id}`}>
                    <small className="text-muted"> {ressource.media_id}</small>
                    <button
                      type="button"
                      className="btn btn-success button-margin"
                      onClick={(e) => this.downloadFile(ressource)}
                    >
                      Download <CloudDownload />
                    </button>
                    <a
                      className="btn btn-success button-margin"
                      href={`/show/${ressource.media_id}`}
                    >
                      Visualisation <Eye />
                    </a>
                  </span>
                );
              })}
            </p>

            <a href="#" className="btn btn-secondary button-margin">
              {this.state.metadata.theme}
            </a>
          </div>
        </div>
      </div>
    );
  }
}
MetadataCard.propTypes = {
  metadata: PropTypes.object,
  formUrl: PropTypes.string,
  display: PropTypes.object,
};

export default MetadataCard;
