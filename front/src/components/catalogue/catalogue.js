import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import { Plus, Pencil, Trash, Check } from 'react-bootstrap-icons';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';

// TODO : Split en sous composant
/**
 * Composant : Catalogue
 * @return {void}
 */
class Catalogue extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      metadatas: [],
      countBy: [],
      currentFilters: [],
      formUrl: '',
      editID: '',
      hasMore: true,
    };
    this.currentOffset = 0;
    this.PAGE_SIZE = 10;

    // TODO : global/conf
    this.countByConf = [
      {
        name: 'producer',
        displayName: 'organization_name',
        text: 'Source :',
        values: [],
        toFilterParam: (elem) => {
          return { 'producer.organization_name': `"${elem.producer.organization_name}"` };
        },
      },
      {
        name: 'theme',
        text: 'Theme :',
        values: [],
        toFilterParam: (elem) => {
          return { theme: `"${elem.theme}"` };
        },
      },
      {
        name: 'resource_languages',
        text: 'Language :',
        values: [],
        toFilterParam: (elem) => {
          return { resource_languages: `"${elem.resource_languages}"` };
        },
      },
    ];

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
   * download le fichier via media_id
   * @param {*} ressource connector du fichier
   */
  downloadFile(ressource) {
    window.open(`${process.env.PUBLIC_URL}/api/media/download/${ressource.media_id}`);
  }

  /**
   * crée l'object params pour la requete
   * @param {*} baseParams base des params
   * @return {*} params enrichis pour la requete
   */
  createParams(baseParams) {
    this.state.currentFilters.forEach((filter) => Object.assign(baseParams, filter));
    return baseParams;
  }
  /**
   * ajoute un filter pour la requete
   * @param {*} filterParam element a rajouter
   */
  addToFilter(filterParam) {
    this.setState(
      {
        currentFilters: this.state.currentFilters.concat(filterParam),
      },
      () => {
        this.currentOffset = 0;
        this.getInitialData();
      },
    );
    // TODO remove filter ?
  }

  /**
   * trigger a la création du composant : get la 1er page du catalogue
   */
  componentDidMount() {
    axios.get(`${process.env.PUBLIC_URL}/api/v1/formUrl`).then((res) => {
      const formUrl = res.data;
      this.setState({ formUrl });
    });

    this.getInitialData();
  }

  /**
   * recup la 1er page des metadonnées et les countBy
   */
  getInitialData() {
    axios
      .get(`${process.env.PUBLIC_URL}/api/v1/resources`, {
        params: this.createParams({ limit: this.PAGE_SIZE, offset: this.currentOffset }),
      })
      .then((res) => {
        const metadatas = res.data;
        this.setState({ metadatas });
      });
    // FIXME : Filtre not working with count_by yet (proposer : { $match: { filter  } }, au début du aggregate?)
    Promise.all(
      this.countByConf.map((count) =>
        axios.get(`${process.env.PUBLIC_URL}/api/v1/resources`, {
          params: this.createParams({ count_by: count.name }),
        }),
      ),
    ).then((values) => {
      const countBy = this.countByConf.map((count, i) => {
        count.values = values[i].data;
        return count;
      });
      this.setState({ countBy });
    });
  }

  /**
   * récupere la page suivante
   * @return {Function} fonction utilisée par InfiniteScroll
   */
  fetchMoreData() {
    return () => {
      this.currentOffset += this.PAGE_SIZE;
      axios
        .get(`${process.env.PUBLIC_URL}/api/v1/resources`, {
          params: this.createParams({ limit: this.PAGE_SIZE, offset: this.currentOffset }),
        })
        .then((res) => {
          const metadatas = res.data;
          if (metadatas.length === 0) {
            this.setState({ hasMore: false });
          }
          this.setState({
            metadatas: this.state.metadatas.concat(metadatas),
          });
        });
    };
  }

  /**
   * récupere le label pour un element d'un countBy
   * @param {*} filterElement element d'un countBy
   * @param {*} filterConfig configuration du countBy
   * @return {String} label de l'élément
   */
  getFilterLabel(filterElement, filterConfig) {
    let result = filterElement[filterConfig.name];
    if (filterConfig.displayName) {
      result = result[filterConfig.displayName];
    }
    return result;
  }

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

  // TODO :  sticky-top ?
  /**
   * render le composant
   * @return {ReactNode} html du composant
   */
  render() {
    return (
      <div className="tempPaddingTop">
        <div className="row">
          {this.props.display && this.props.display.searchbar && (
            <div className="col-3 border rounded  tempAlign">
              <div className="row">
                <div className="col-12 border rounded tempMargin">
                  <h5>Trier</h5>
                  <div className="btn-group" role="group" aria-label="sort">
                    <button type="button" className="btn btn-secondary">
                      Modifié
                    </button>
                    <button type="button" className="btn btn-secondary">
                      A à Z
                    </button>

                    <div className="btn-group" role="group">
                      <button
                        id="sortDrop"
                        type="button"
                        className="btn btn-secondary dropdown-toggle"
                        data-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        ...
                      </button>
                      <div className="dropdown-menu" aria-labelledby="sortDrop">
                        <a className="dropdown-item" href="#">
                          Alphabétique
                        </a>
                        <a className="dropdown-item" href="#">
                          Anti alphabétique
                        </a>
                        <a className="dropdown-item" href="#">
                          Récemment modifiés
                        </a>
                        <a className="dropdown-item" href="#">
                          Anciennement modifiés
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 border rounded tempMargin">
                  <h5>Rechercher</h5>
                  <div className="input-group flex-nowrap">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Recherche"
                      aria-label="Recherche"
                      aria-describedby="addon-wrapping"
                    />
                  </div>
                </div>
                <div className="col-12 border rounded tempMargin">
                  <h5>Filtrer</h5>
                  <div className="row">
                    {this.state.countBy.map((filter, i) => {
                      return (
                        <div className="col border rounded" key={filter.name}>
                          <span>{filter.text}</span>
                          <ul className="list-group">
                            {filter.values.map((filterValue, i) => {
                              return (
                                <li
                                  className="list-group-item d-flex justify-content-between align-items-center"
                                  key={this.getFilterLabel(filterValue, filter) + i}
                                  onClick={(e) =>
                                    this.addToFilter(filter.toFilterParam(filterValue))
                                  }
                                >
                                  {this.getFilterLabel(filterValue, filter)}
                                  <span className="badge badge-primary badge-pill">
                                    {filterValue.count}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="col-9">
            <div className="row">
              {this.props.display && this.props.display.editJDD && (
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
                          <button type="button" className="btn btn-danger">
                            <Trash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <InfiniteScroll
                dataLength={this.state.metadatas.length}
                next={this.fetchMoreData()}
                hasMore={this.state.hasMore}
                loader={<h4>Loading...</h4>}
              >
                {this.state.metadatas.map((metadata, i) => {
                  return (
                    <div className="col-12" key={metadata.global_id + i}>
                      <div className="card tempMargin">
                        <h5 className="card-header">
                          <div className="d-flex justify-content-between align-items-center">
                            <a href={`${this.state.formUrl}?read-only=${metadata.global_id}`}>
                              {metadata.resource_title}
                            </a>
                            {!metadata.dataset_dates.published &&
                              !metadata.dataset_dates.deleted && (
                                <span className="badge badge-warning badge-pill">waiting</span>
                              )}
                            {metadata.dataset_dates.published &&
                              !metadata.dataset_dates.deleted && (
                                <span className="badge badge-success badge-pill">published</span>
                              )}
                            {metadata.dataset_dates.deleted && (
                              <span className="badge badge-danger badge-pill">deleted</span>
                            )}
                            {this.props.display && this.props.display.editJDD && (
                              <div className="btn-group" role="group">
                                <button type="button" className="btn btn-success">
                                  <Check />
                                </button>
                                <a
                                  className="btn btn-warning"
                                  href={`${this.state.formUrl}?update=${metadata.global_id}`}
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
                          <p className="card-text">{this.getLangText(metadata.summary)}</p>
                          <p className="card-text">
                            Producteur :
                            <small className="text-muted">
                              {metadata.producer.organization_name}
                            </small>
                          </p>
                          <p className="card-text">
                            global_id :<small className="text-muted">{metadata.global_id}</small>
                          </p>
                          <p className="card-text">
                            media_id :
                            {metadata.available_formats.map((ressource, i) => {
                              return (
                                <span key={`${ressource.media_id}`}>
                                  <small className="text-muted">{ressource.media_id}</small>
                                  <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={(e) => this.downloadFile(ressource)}
                                  >
                                    Download
                                  </button>
                                </span>
                              );
                            })}
                          </p>

                          <a href="#" className="btn btn-secondary">
                            {metadata.theme}
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </InfiniteScroll>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
Catalogue.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
};

export default withRouter(Catalogue);
