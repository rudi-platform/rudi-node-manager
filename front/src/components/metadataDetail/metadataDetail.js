import React, { Component } from 'react';
import axios from 'axios';
import {
    useParams
} from "react-router-dom";
import { withRouter } from "react-router";
import Moment from 'react-moment';
import ReactCountryFlag from "react-country-flag"
import ISO6391 from 'iso-639-1';
import { Pencil } from 'react-bootstrap-icons';

/*
TODO :
- responsive
- error display/redirect
- test de présence
- trancher : flag vs Text
- remove key={...+i} when possible
*/
class MetadataDetail extends Component {
    constructor(props) {
        super(props);
        this.id = props.match.params.id;
        this.state = {
            isFetching: true,
            isError: false,
            metadata: {}
        };
        this.isFlag = false;
    }

    render = () => <div>
        {!this.state.isFetching && !this.state.isError &&
            <div class="card tempPaddingTop">
                <h5 class="card-header">{this.state.metadata.resource_title} <a href="#" class="btn btn-secondary">Modifier <Pencil/></a></h5>
                <div class="card-body">
                    <p class="card-text">{this.state.metadata.abstract[0].text}</p>
                    <p class="card-text">{this.state.metadata.summary[0].text}</p>
                    <div><a href="#" class="btn btn-secondary">{this.state.metadata.theme}</a></div>
                        <div>{this.state.metadata.keywords.map((keyword, i) => {
                            return (
                                <a href="#" class="btn btn-secondary" key={keyword+i}>{keyword}</a>
                            )
                        })}</div>
                    <div class="card-text">Id Local : <small class="text-muted">{this.state.metadata.local_id}</small></div>
                    <div class="card-text">DOI : <small class="text-muted">{this.state.metadata.doi}</small></div>
                    <div class="card-text">Producteur : <small class="text-muted">{this.state.metadata.producer.organization_name}</small></div>
                    <div class="card-text">
                        
                    </div>
                    <div class="row">
                            {this.state.metadata.contacts.map((contact, i) => {
                                return (
                                    <div class="col-4" key={contact.contact_id+i}>
                                        <div class="card">
                                            <h5 class="card-header">{contact.contact_name}</h5>
                                            <div class="card-text">Organisation : <small class="text-muted">{contact.organization_name}</small></div>
                                            <div class="card-text">Role : <small class="text-muted">{contact.role}</small></div>
                                            <div class="card-text">Mail : <small class="text-muted">{contact.email}</small></div>
                                        </div>
                                    </div>
                                )
                            })}

                        </div>
                    <div class="card-text">Langue de la ressource : 
{this.isFlag && this.state.metadata.resource_languages.map((flag, i) => {
                            return (
                                <ReactCountryFlag
                                    countryCode={flag}
                                    svg
                                    title={flag}
                                />
                            )
                        })}{!this.isFlag && this.state.metadata.resource_languages.map((lang, i) => {
                            return (
                                <span key={lang}>{ISO6391.getNativeName(lang)} </span>
                            )
                        })}
                    </div>
                    <div class="card-text">temporal_spread : <small class="text-muted">
                            <Moment format="DD/MM/YYYY">
                                {this.state.metadata.temporal_spread.start_date}
                            </Moment> - <Moment format="DD/MM/YYYY">
                                {this.state.metadata.temporal_spread.end_date}
                            </Moment></small></div>
                    <div class="card-text">geography : <small class="text-muted">TODO</small></div>
<div class="row">
                    <div class="col-4">
                                        <div class="card">
                                            <h5 class="card-header">Historique du jeu de donnée</h5>
                                            <div class="card-text">Créé : <small class="text-muted">
                                                <Moment format="DD/MM/YYYY HH:mm:ss">
                                                    {this.state.metadata.dataset_dates.created}
                                                </Moment>
                                            </small></div>
                                            <div class="card-text">Publié : <small class="text-muted"><Moment format="DD/MM/YYYY HH:mm:ss">{this.state.metadata.dataset_dates.published}</Moment></small></div>
                                            <div class="card-text">Validé : <small class="text-muted"><Moment format="DD/MM/YYYY HH:mm:ss">{this.state.metadata.dataset_dates.validated}</Moment></small></div>
                                            <div class="card-text">Mis a jour : <small class="text-muted"><Moment format="DD/MM/YYYY HH:mm:ss">{this.state.metadata.dataset_dates.updated}</Moment></small></div>
                                            <div class="card-text">Supprimé : <small class="text-muted"><Moment format="DD/MM/YYYY HH:mm:ss">{this.state.metadata.dataset_dates.deleted}</Moment></small></div>
                                        </div>
                                    </div>
                                    </div>

                    <div class="card-text">storage_status : <small class="text-muted">{this.state.metadata.storage_status}</small></div>
                    <div class="card-text">available_formats : <small class="text-muted">{this.state.metadata.available_formats.media_type}</small></div>
                    
                </div>
                </div>
        }
    </div>;


    componentDidMount() {
            this.fetchMetadata();
    }

    fetchMetadata = () => {
            this.setState({ ...this.state, isFetching: true });
        axios.get('/api/v1/resources/' + this.id)
            .then(response => {
            this.setState({ metadata: response.data.body, isFetching: false, isError: false })
        })
            .catch(e => {
                console.log(e);
                this.setState({...this.state, isFetching: false, isError: true });
            });

    };
}



export default withRouter(MetadataDetail);