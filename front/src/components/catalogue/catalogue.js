import React, {Component} from 'react';
import axios from 'axios';
import {withRouter} from 'react-router';

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
      hasMore: true,
    };
    this.temp = {
      filter: [
        {
          name: 'producer.organization_name',
          text: 'Producteur',
          values: [
            {
              count: 100,
              name: 'Kéolis',
            },
            {
              count: 75,
              name: 'IRISA',
            },
            {
              count: 66,
              name: 'Rennes Metropole',
            },
            {
              count: 11,
              name: 'Micropole',
            },
            {
              count: 2,
              name: 'Startup 1',
            },
          ],
        },
        {
          name: 'dataset_dates.updated',
          text: 'Date de mise à jours',
          values: [
            {
              count: 125,
              name: '2021',
            },
            {
              count: 90,
              name: '2020',
            },
            {
              count: 79,
              name: '2019',
            },
            {
              count: 5,
              name: '2018',
            },
            {
              count: 1,
              name: '2017',
            },
          ],
        },
        {
          name: 'theme',
          text: 'Theme',
          values: [
            {
              count: 84,
              name: 'Transport',
            },
            {
              count: 80,
              name: 'Economie',
            },
            {
              count: 79,
              name: 'Culture',
            },
          ],
        },

      ],
    };
    this.currentOffset = 0;
  }

  /**
   * trigger a la création du composant : get la 1er page du catalogue
   */
  componentDidMount() {
    axios.get('/api/v1/resources', {params: {limite: 10, offset: this.currentOffset}}).then((res) => {
      const metadatas = res.data.body;
      this.setState({metadatas});
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
      axios.get('/api/v1/resources', {params: {limite: 10, offset: this.currentOffset}}).then((res) => {
        const metadatas = res.data.body;
        this.setState({
          metadatas: this.state.metadatas.concat(metadatas),
        });
      });
    };
  };

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
                {this.temp.filter.map((filter, i) => {
                  return (<div className="col border rounded" key={filter.name}>

                    <span>{filter.text}</span>
                    <ul className="list-group">
                      {filter.values.map((filterValue, i) => {
                        return (<li className="list-group-item d-flex justify-content-between align-items-center"
                          key={filterValue.name + i}>
                          {filterValue.name}
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
