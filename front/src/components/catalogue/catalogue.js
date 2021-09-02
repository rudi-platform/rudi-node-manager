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
      currentFilters: [{ sort_by: `-updatedAt` }],
      formUrl: '',
      hasMore: true,
    };
    this.currentOffset = 0;
    this.PAGE_SIZE = 10;

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
   * verifie si 2 Filtre sont du même type
   * @param {*} a filtre 1
   * @param {*} b filtre 2
   * @return {boolean} true si les 2 filtre sont du même type
   */
  isSameFilterType(a, b) {
    // Create arrays of property names
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
      return false;
    }
    return aProps[0] === bProps[0];
  }

  /**
   * verifie si 2 Filtre sont identique
   * @param {*} a filtre 1
   * @param {*} b filtre 2
   * @return {boolean} true si les 2 filtre sont identique
   */
  isSameFilter(a, b) {
    // Create arrays of property names
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
      return false;
    }
    const propName = aProps[0];
    return a[propName] === b[propName];
  }

  /**
   * ajoute un filter pour la requete
   * @param {*} filterParam element a rajouter
   */
  addToFilter(filterParam) {
    const filterList = this.state.currentFilters;
    const indexType = filterList.findIndex((element) =>
      this.isSameFilterType(element, filterParam),
    );
    const index = filterList.findIndex((element) => this.isSameFilter(element, filterParam));
    // should add
    if (indexType === -1) {
      this.setState(
        {
          currentFilters: filterList.concat(filterParam),
        },
        () => {
          this.currentOffset = 0;
          this.getInitialData();
        },
      );
    } else {
      // should replace/remove
      if (index > -1) {
        filterList.splice(index, 1);
        this.setState(
          {
            currentFilters: filterList,
          },
          () => {
            this.currentOffset = 0;
            this.getInitialData();
          },
        );
      } else {
        filterList.splice(indexType, 1);
        this.setState(
          {
            currentFilters: filterList.concat(filterParam),
          },
          () => {
            this.currentOffset = 0;
            this.getInitialData();
          },
        );
      }
    }
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
      .get(`${process.env.PUBLIC_URL}/api/admin/resources`, {
        params: this.createParams({ limit: this.PAGE_SIZE, offset: this.currentOffset }),
      })
      .then((res) => {
        const metadatas = res.data;
        this.setState({ metadatas });
      });
    Promise.all(
      this.countByConf.map((count) =>
        axios.get(`${process.env.PUBLIC_URL}/api/admin/resources`, {
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
        .get(`${process.env.PUBLIC_URL}/api/admin/resources`, {
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
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(e) => this.addToFilter({ sort_by: `-updatedAt` })}
                    >
                      Modifié
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(e) => this.addToFilter({ sort_by: `resource_title` })}
                    >
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
                        <a
                          className="dropdown-item"
                          onClick={(e) => this.addToFilter({ sort_by: `resource_title` })}
                        >
                          Alphabétique
                        </a>
                        <a
                          className="dropdown-item"
                          onClick={(e) => this.addToFilter({ sort_by: `-resource_title` })}
                        >
                          Anti alphabétique
                        </a>
                        <a
                          className="dropdown-item"
                          onClick={(e) => this.addToFilter({ sort_by: `-updatedAt` })}
                        >
                          Récemment modifiés
                        </a>
                        <a
                          className="dropdown-item"
                          onClick={(e) => this.addToFilter({ sort_by: `updatedAt` })}
                        >
                          Anciennement modifiés
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-12 border rounded tempMargin  hideWIP">
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
              {this.props.display && this.props.display.editJDD && this.state.formUrl && (
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
