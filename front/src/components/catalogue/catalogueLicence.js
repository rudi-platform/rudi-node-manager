import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import LicenceCard from './licenceCard';
import EditCard from './editCard';

/**
 * Composant : CatalogueLicence
 * @return {void}
 */
class CatalogueLicence extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      metadatas: [],
      formUrl: '',
      hasMore: false,
    };
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
   * recup la 1er page des metadonnées
   */
  getInitialData() {
    axios.get(`${process.env.PUBLIC_URL}/api/admin/licences`).then((res) => {
      const metadatas = res.data;
      this.setState({ metadatas });
    });
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
                <EditCard formUrl={this.state.formUrl}></EditCard>
              )}
              <InfiniteScroll
                dataLength={this.state.metadatas.length}
                hasMore={this.state.hasMore}
                loader={<h4>Loading...</h4>}
              >
                {this.state.metadatas.map((metadata, i) => {
                  return (
                    <LicenceCard
                      metadata={metadata}
                      formUrl={this.state.formUrl}
                      display={this.props.display}
                      key={metadata.global_id}
                    ></LicenceCard>
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
CatalogueLicence.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
};

export default withRouter(CatalogueLicence);
