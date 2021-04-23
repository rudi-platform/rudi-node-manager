import React, {Component} from 'react';
import axios from 'axios';
import {withRouter} from 'react-router-dom';

import {
  Link,
} from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';

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
      groupBy: [],
      hasMore: true,
    };
    this.currentOffset = 0;
  }

  /**
   * trigger a la création du composant : get la 1er page du catalogue
   */
  componentDidMount() {
    axios.get(`${process.env.PUBLIC_URL}/api/v1/resources`, {params: {limit: 10, offset: this.currentOffset}})
        .then((res) => {
          const metadatas = res.data.body;
          this.setState({metadatas});
        });
    let groupBy = [{name: 'producer.organization_name',
      text: 'Producteur',
      values: [],
    },
    {
      name: 'theme',
      text: 'Theme',
      values: [],
    }];
    Promise.all(groupBy.map((group) => axios.get(`${process.env.PUBLIC_URL}/api/v1/resources?group_by=${group.name}`)),
    ).then((values) => {
      groupBy = groupBy.map((group, i) => {
        group.values=values[i].data.body;
        return group;
      });
      this.setState({groupBy});
      console.log(this.state.groupBy);
    });
  }
  /**
 * récupere la page suivante
 * @return {Function} fonction utilisée par InfiniteScroll
 */
  fetchMoreData() {
    return () => {
      this.currentOffset++;
      if ('TODO : Stop condition' === false) {
        this.setState({hasMore: false});
        return;
      }
      axios.get(`${process.env.PUBLIC_URL}/api/v1/resources`, {params: {limit: 10, offset: this.currentOffset}})
          .then((res) => {
            const metadatas = res.data.body;
            this.setState({
              metadatas: this.state.metadatas.concat(metadatas),
            });
          });
    };
  };

  /**
 * récupere le label pour un element d'un groupBy
  * @param {*} filterObject element d'un groupBy
  * @param {String} name string attribue
 * @return {String} label de l'élément
 */
  getFilterLabel(filterObject, name) {
    name = name.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    const a = name.split('.');
    for (let i = 0, n = a.length; i < n; ++i) {
      const k = a[i];
      if (k in filterObject) {
        filterObject = filterObject[k];
      } else {
        return;
      }
    }
    return filterObject;
  }

  /**
   * render le composant
   * @return {ReactNode} html du composant
   */
  render() {
    return ( <div className="tempPaddingTop" >
      <div className="row">
        <div className="col-3 border rounded sticky-top  tempAlign">
          <div className="row">
            <div className="col-12 border rounded tempMargin" ><h5>Trier</h5>
              <div className="btn-group" role="group" aria-label="sort">
                <button type="button" className="btn btn-secondary">Modifié</button>
                <button type="button" className="btn btn-secondary">A à Z</button>

                <div className="btn-group" role="group">
                  <button id="sortDrop" type="button" className="btn btn-secondary dropdown-toggle"
                    data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  ...
                  </button>
                  <div className="dropdown-menu" aria-labelledby="sortDrop">
                    <a className="dropdown-item" href="#">Alphabétique</a>
                    <a className="dropdown-item" href="#">Anti alphabétique</a>
                    <a className="dropdown-item" href="#">Récemment modifiés</a>
                    <a className="dropdown-item" href="#">Anciennement modifiés</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 border rounded tempMargin" ><h5>Rechercher</h5>
              <div className="input-group flex-nowrap">
                <input type="text" className="form-control" placeholder="Recherche"
                  aria-label="Recherche" aria-describedby="addon-wrapping" />
              </div>
            </div>
            <div className="col-12 border rounded tempMargin" >
              <h5>Filtrer</h5>
              <div className="row">
                {this.state.groupBy.map((filter, i) => {
                  return (<div className="col border rounded" key={filter.name}>

                    <span>{filter.text}</span>
                    <ul className="list-group">
                      {filter.values.map((filterValue, i) => {
                        return (<li className="list-group-item d-flex justify-content-between align-items-center"
                          key={this.getFilterLabel(filterValue, filter.name) + i}>
                          {this.getFilterLabel(filterValue, filter.name)}
                          <span className="badge badge-primary badge-pill">{filterValue.count}</span>
                        </li>);
                      })}
                    </ul>
                  </div>
                  );
                })}

              </div>

            </div>
          </div>
        </div>
        <div className="col-9 row ">
          <InfiniteScroll
            dataLength={this.state.metadatas.length}
            next={this.fetchMoreData()}
            hasMore={this.state.hasMore}
            loader={<h4>Loading...</h4>}
          >
            {this.state.metadatas.map((metadata, i) => {
              return (<div className="col-12" key={metadata.global_id + i}>

                <div className="card tempMargin">
                  <Link to={`/metadata/${metadata.global_id}`}>
                    <h5 className="card-header">{metadata.resource_title}</h5>
                  </Link>
                  <div className="card-body">
                    <p className="card-text">{metadata.summary[0].text}</p>
                    <p className="card-text">Producteur :
                      <small className="text-muted">{metadata.producer.organization_name}</small>
                    </p>
                    <a href="#" className="btn btn-secondary">{metadata.theme}</a>
                  </div>
                </div>
              </div>
              );
            })}
          </InfiniteScroll>

        </div>
      </div>
    </div>);
  };
}


export default withRouter(Catalogue);
