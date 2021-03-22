import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from "react-router";

import {
  Link
} from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";


class Catalogue extends Component {
    constructor(props) {
        super(props);
        this.state = {
          metadatas: [],
          hasMore: true
        };
        this.temp = {
          filter: [
            {
              name: "producer.organization_name",
              text: "Producteur",
              values: [
                {
                  count: 100,
                  name: "Kéolis"
                },
                {
                  count: 75,
                  name: "IRISA"
                },
                {
                  count: 66,
                  name: "Rennes Metropole"
                },
                {
                  count: 11,
                  name: "Micropole"
                },
                {
                  count: 2,
                  name: "Startup 1"
                }
              ]
            },
            {
              name: "dataset_dates.updated",
              text: "Date de mise à jours",
              values: [
                {
                  count: 125,
                  name: "2021"
                },
                {
                  count: 90,
                  name: "2020"
                },
                {
                  count: 79,
                  name: "2019"
                },
                {
                  count: 5,
                  name: "2018"
                },
                {
                  count: 1,
                  name: "2017"
                }
              ]
            },
            {
              name: "theme",
              text: "Theme",
              values: [
                {
                  count: 84,
                  name: "Transport"
                },
                {
                  count: 80,
                  name: "Economie"
                },
                {
                  count: 79,
                  name: "Culture"
                }
              ]
            }
      
          ]
        };
        this.currentOffset = 0;
    }
    
      componentDidMount() {
        axios.get('/api/v1/resources', { params: { limite: 10, offset: this.currentOffset } }).then((res) => {
          const metadatas = res.data.body;
          this.setState({ metadatas });
        });
      }

      fetchData = () => {
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
      fetchMoreData = () => {
        this.currentOffset++;
        if ('TODO : Stop condition' === false) {
          this.setState({ hasMore: false });
          return;
        }
        axios.get('/api/v1/resources', { params: { limite: 10, offset: this.currentOffset } }).then((res) => {
          const metadatas = res.data.body;
          this.setState({
            metadatas: this.state.metadatas.concat(metadatas)
          });
        });
      };

    render = () => <div class="tempPaddingTop" >
    <div class="row">
      <div class="col-3 border rounded sticky-top  tempAlign">
        <div class="row">
          <div class="col-12 border rounded tempMargin" ><h5>Trier</h5>
            <div class="btn-group" role="group" aria-label="sort">
              <button type="button" class="btn btn-secondary">Modifié</button>
              <button type="button" class="btn btn-secondary">A à Z</button>

              <div class="btn-group" role="group">
                <button id="sortDrop" type="button" class="btn btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                  ...
            </button>
                <div class="dropdown-menu" aria-labelledby="sortDrop">
                  <a class="dropdown-item" href="#">Alphabétique</a>
                  <a class="dropdown-item" href="#">Anti alphabétique</a>
                  <a class="dropdown-item" href="#">Récemment modifiés</a>
                  <a class="dropdown-item" href="#">Anciennement modifiés</a>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 border rounded tempMargin" ><h5>Rechercher</h5>
            <div class="input-group flex-nowrap">
              <input type="text" class="form-control" placeholder="Recherche" aria-label="Recherche" aria-describedby="addon-wrapping" />
            </div>
          </div>
          <div class="col-12 border rounded tempMargin" >
            <h5>Filtrer</h5>
            <div class="row">
              {this.temp.filter.map((filter, i) => {
                return (<div class="col border rounded" key={filter.name}>

                  <span>{filter.text}</span>
                  <ul class="list-group">
                    {filter.values.map((filterValue, i) => {
                      return (<li class="list-group-item d-flex justify-content-between align-items-center" key={filterValue.name + i}>
                        {filterValue.name}
                        <span class="badge badge-primary badge-pill">{filterValue.count}</span>
                      </li>)
                    })}
                  </ul>
                </div>
                )
              })}

            </div>

          </div>
        </div>
      </div>
      <div class="col-9 row ">
        <InfiniteScroll
          dataLength={this.state.metadatas.length}
          next={this.fetchMoreData}
          hasMore={this.state.hasMore}
          loader={<h4>Loading...</h4>}
        >
          {this.state.metadatas.map((metadata, i) => {
            return (<div class="col-12" key={metadata.global_id + i}>

              <div class="card tempMargin">
                <Link to={`/metadata/${metadata.global_id}`}><h5 class="card-header">{metadata.resource_title}</h5></Link>
                <div class="card-body">
                  <p class="card-text">{metadata.summary[0].text}</p>
                  <p class="card-text">Producteur : <small class="text-muted">{metadata.producer.organization_name}</small></p>
                  <a href="#" class="btn btn-secondary">{metadata.theme}</a>
                </div>
              </div>
            </div>
            )
          })}
        </InfiniteScroll>

      </div>
    </div>
  </div>;


    
}



export default withRouter(Catalogue);