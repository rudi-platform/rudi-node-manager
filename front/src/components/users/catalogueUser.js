import React, { Component } from 'react';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import PropTypes from 'prop-types';
import UserCard from './userCard';
import EditUserCard from './editUserCard';

/**
 * Composant : CatalogueUser
 * @return {void}
 */
class CatalogueUser extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      hasMore: false,
    };
  }

  /**
   * trigger a la création du composant : get la 1er page du CatalogueUser
   */
  componentDidMount() {
    this.getInitialData();
  }

  /**
   * recup la 1er page des metadonnées et les countBy
   */
  getInitialData() {
    axios.get(`${process.env.PUBLIC_URL}/api/v1/users`).then((res) => {
      const users = res.data;
      this.setState({ users });
    });
  }

  /**
   * récupere la page suivante
   * @return {Function} fonction utilisée par InfiniteScroll
   */
  fetchMoreData() {
    return () => {
      this.currentOffset += this.PAGE_SIZE;
      axios.get(`${process.env.PUBLIC_URL}/api/v1/users`).then((res) => {
        const users = res.data;
        if (users.length === 0) {
          this.setState({ hasMore: false });
        }
        this.setState({
          users: this.state.users.concat(users),
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
              {this.props.display && this.props.display.editJDD && <EditUserCard></EditUserCard>}
              <InfiniteScroll
                dataLength={this.state.users.length}
                next={this.fetchMoreData()}
                hasMore={this.state.hasMore}
                loader={<h4>Loading...</h4>}
              >
                {this.state.users.map((user, i) => {
                  return (
                    <UserCard user={user} display={this.props.display} key={user.id}></UserCard>
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
CatalogueUser.propTypes = {
  display: PropTypes.object,
  editMode: PropTypes.object,
};

export default withRouter(CatalogueUser);
