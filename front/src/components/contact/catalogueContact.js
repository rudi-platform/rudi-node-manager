import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import EditContactCard from './editContactCard';
import ContactCard from './contactCard';

/**
 * Composant : CatalogueContact
 * @return {void}
 */
class CatalogueContact extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      contacts: [],
      formUrl: '',
      hasMore: true,
    };
    this.currentOffset = 0;
    this.PAGE_SIZE = 20;
  }

  /**
   * trigger a la création du composant : get la 1er page du CatalogueContact
   */
  componentDidMount() {
    axios.get(`${process.env.PUBLIC_URL}/api/v1/formUrl`).then((res) => {
      const formUrl = `${res.data}contacts`;
      this.setState({ formUrl });
    });

    this.getInitialData();
  }

  /**
   * recup la 1er page des metadonnées et les countBy
   */
  getInitialData() {
    axios
      .get(`${process.env.PUBLIC_URL}/api/admin/contacts`, {
        params: { limit: this.PAGE_SIZE, offset: this.currentOffset },
      })
      .then((res) => {
        const contacts = res.data;
        this.setState({ contacts });
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
        .get(`${process.env.PUBLIC_URL}/api/admin/contacts`, {
          params: { limit: this.PAGE_SIZE, offset: this.currentOffset },
        })
        .then((res) => {
          const contacts = res.data;
          if (contacts.length === 0) {
            this.setState({ hasMore: false });
          }
          this.setState({
            contacts: this.state.contacts.concat(contacts),
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
                <EditContactCard formUrl={this.state.formUrl}></EditContactCard>
              )}
              <InfiniteScroll
                dataLength={this.state.contacts.length}
                next={this.fetchMoreData()}
                hasMore={this.state.hasMore}
                loader={<h4>Loading...</h4>}
              >
                {this.state.contacts.map((contact, i) => {
                  return (
                    <ContactCard
                      contact={contact}
                      formUrl={this.state.formUrl}
                      key={contact.contact_id}
                    ></ContactCard>
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
CatalogueContact.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
};

export default withRouter(CatalogueContact);
