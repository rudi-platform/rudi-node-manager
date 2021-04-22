import React, {Component} from 'react';
import axios from 'axios';
import {withRouter} from 'react-router-dom';
import Moment from 'react-moment';
import ReactCountryFlag from 'react-country-flag';
import ISO6391 from 'iso-639-1';
import {Pencil} from 'react-bootstrap-icons';
import PropTypes from 'prop-types';

/*
TODO :
- responsive
- error display/redirect
- test de présence
- trancher : flag vs Text
- remove key={...+i} when possible
*/

/**
 * Composant : Détail d'une Métadonnée
 * @return {void}
 */
class MetadataDetail extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.id = props.match.params.id;
    this.state = {
      isFetching: true,
      isError: false,
      metadata: {},
    };
    this.isFlag = false;
  }

  /**
   * render le composant
   * @return {ReactNode} html du composant
   */
  render() {
    return ( <div>
      {!this.state.isFetching && !this.state.isError &&
            <div className="card tempPaddingTop">
              <h5 className="card-header">{this.state.metadata.resource_title}
                <a href="#" className="btn btn-secondary">Modifier <Pencil/></a>
              </h5>
              <div className="card-body">
                {this.state.metadata.synopsis.length && <p className="card-text">{this.state.metadata.synopsis[0].text}</p>}
                {this.state.metadata.summary.length && <p className="card-text">{this.state.metadata.summary[0].text}</p>}
                <div><a href="#" className="btn btn-secondary">{this.state.metadata.theme}</a></div>
                <div>{this.state.metadata.keywords.map((keyword, i) => {
                  return (
                    <a href="#" className="btn btn-secondary" key={keyword+i}>{keyword}</a>
                  );
                })}</div>
                {this.state.metadata.local_id && <div className="card-text">Id Local :
                  <small className="text-muted">{this.state.metadata.local_id}</small>
                </div>}
                <div className="card-text">DOI : <small className="text-muted">{this.state.metadata.doi}</small></div>
                <div className="card-text">Producteur :
                  <small className="text-muted">{this.state.metadata.producer.organization_name}</small>
                </div>
                <div className="card-text">

                </div>
                <div className="row">
                  {this.state.metadata.contacts.map((contact, i) => {
                    return (
                      <div className="col-4" key={contact.contact_id+i}>
                        <div className="card">
                          <h5 className="card-header">{contact.contact_name}</h5>
                          <div className="card-text">Organisation :
                            <small className="text-muted">{contact.organization_name}</small>
                          </div>
                          <div className="card-text">Role : <small className="text-muted">{contact.role}</small></div>
                          <div className="card-text">Mail : <small className="text-muted">{contact.email}</small></div>
                        </div>
                      </div>
                    );
                  })}

                </div>
                <div className="card-text">Langue de la ressource :
                  {this.isFlag && this.state.metadata.resource_languages.map((flag, i) => {
                    return (
                      <ReactCountryFlag
                        key={lang}
                        countryCode={flag}
                        svg
                        title={flag}
                      />
                    );
                  })}{!this.isFlag && this.state.metadata.resource_languages.map((lang, i) => {
                    return (
                      <span key={lang}>{ISO6391.getNativeName(lang)} </span>
                    );
                  })}
                </div>
                {this.state.metadata.temporal_spread && <div className="card-text">temporal_spread : <small className="text-muted">
                  <Moment format="DD/MM/YYYY">
                    {this.state.metadata.temporal_spread.start_date}
                  </Moment> - <Moment format="DD/MM/YYYY">
                    {this.state.metadata.temporal_spread.end_date}
                  </Moment></small></div>}
                <div className="card-text">geography : <small className="text-muted">TODO</small></div>
                <div className="row">
                  <div className="col-4">
                    <div className="card">
                      <h5 className="card-header">Historique du jeu de donnée</h5>
                      {this.state.metadata.dataset_dates.created && <div className="card-text">Créé : <small className="text-muted">
                        <Moment format="DD/MM/YYYY HH:mm:ss">
                          {this.state.metadata.dataset_dates.created}
                        </Moment>
                      </small></div>}
                      {this.state.metadata.dataset_dates.published && <div className="card-text">Publié :
                        <small className="text-muted">
                          <Moment format="DD/MM/YYYY HH:mm:ss">{this.state.metadata.dataset_dates.published}</Moment>
                        </small>
                      </div>}
                      {this.state.metadata.dataset_dates.validated && <div className="card-text">Validé :
                        <small className="text-muted">
                          <Moment format="DD/MM/YYYY HH:mm:ss">{this.state.metadata.dataset_dates.validated}</Moment>
                        </small>
                      </div>}
                      {this.state.metadata.dataset_dates.updated && <div className="card-text">Mis a jour :
                        <small className="text-muted">
                          <Moment format="DD/MM/YYYY HH:mm:ss">{this.state.metadata.dataset_dates.updated}</Moment>
                        </small>
                      </div>}
                      {this.state.metadata.dataset_dates.deleted && <div className="card-text">Supprimé :
                        <small className="text-muted">
                          <Moment format="DD/MM/YYYY HH:mm:ss">{this.state.metadata.dataset_dates.deleted}</Moment>
                        </small>
                      </div>}
                    </div>
                  </div>
                </div>

                <div className="card-text">storage_status :
                  <small className="text-muted">{this.state.metadata.storage_status}</small>
                </div>
                <div className="card-text">available_formats :
                  <small className="text-muted">{this.state.metadata.available_formats.media_type}</small>
                </div>

              </div>
            </div>
      }
    </div>);
  };

  /**
 * init component
 */
  componentDidMount() {
    this.fetchMetadata();
  }

  /**
   * fetch les infos de la metadonnée
   */
  fetchMetadata() {
    this.setState({...this.state, isFetching: true});
    axios.get('/api/v1/resources/' + this.id)
        .then((response) => {
          this.setState({metadata: response.data.body, isFetching: false, isError: false});
        })
        .catch((e) => {
          console.log(e);
          this.setState({...this.state, isFetching: false, isError: true});
        });
  };
}
MetadataDetail.propTypes = {
  match: PropTypes.object,
};


export default withRouter(MetadataDetail);
