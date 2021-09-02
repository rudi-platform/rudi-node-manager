import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import EditProducerCard from './editProducerCard';
import ProducerCard from './producerCard';

/**
 * Composant : CatalogueProducer
 * @return {void}
 */
class CatalogueProducer extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      organizations: [],
      formUrl: '',
      hasMore: true,
    };
    this.currentOffset = 0;
    this.PAGE_SIZE = 20;
  }

  /**
   * trigger a la création du composant : get la 1er page du CatalogueProducer
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
      .get(`${process.env.PUBLIC_URL}/api/admin/organizations`, {
        params: { limit: this.PAGE_SIZE, offset: this.currentOffset },
      })
      .then((res) => {
        const organizations = res.data;
        this.setState({ organizations });
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
        .get(`${process.env.PUBLIC_URL}/api/admin/organizations`, {
          params: { limit: this.PAGE_SIZE, offset: this.currentOffset },
        })
        .then((res) => {
          const organizations = res.data;
          if (organizations.length === 0) {
            this.setState({ hasMore: false });
          }
          this.setState({
            organizations: this.state.organizations.concat(organizations),
          });
        });
    };
  }

  /**
   * render le composant
   * @return {ReactNode} html du composant
   */
  render() {
    return (
      <div className="tempPaddingTop">
        <div className="row">
          <div className="col-9">
            <div className="row">
              {this.props.display && this.props.display.editJDD && this.state.formUrl && (
                <EditProducerCard formUrl={this.state.formUrl}></EditProducerCard>
              )}
              <InfiniteScroll
                dataLength={this.state.organizations.length}
                next={this.fetchMoreData()}
                hasMore={this.state.hasMore}
                loader={<h4>Loading...</h4>}
              >
                {this.state.organizations.map((organization, i) => {
                  return (
                    <ProducerCard
                      organization={organization}
                      formUrl={this.state.formUrl}
                      key={organization.organization_id}
                    ></ProducerCard>
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
CatalogueProducer.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
};

export default withRouter(CatalogueProducer);
