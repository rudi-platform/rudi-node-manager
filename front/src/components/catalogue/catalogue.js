import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import MetadataCard from './metadataCard';
import EditCard from './editCard';
import { filterConf } from './conf';

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
      hasMore: true,
    };
    this.currentOffset = 0;
    this.PAGE_SIZE = 10;

    // TODO : global/conf
    this.countByConf = filterConf;
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
                <EditCard formUrl={this.state.formUrl}></EditCard>
              )}
              <InfiniteScroll
                dataLength={this.state.metadatas.length}
                next={this.fetchMoreData()}
                hasMore={this.state.hasMore}
                loader={<h4>Loading...</h4>}
              >
                {this.state.metadatas.map((metadata, i) => {
                  return (
                    <MetadataCard
                      metadata={metadata}
                      formUrl={this.state.formUrl}
                      display={this.props.display}
                      key={metadata.global_id}
                    ></MetadataCard>
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
