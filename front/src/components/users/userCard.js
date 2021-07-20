import React, { Component } from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Composant : UserCard
 * @return {void}
 */
class UserCard extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      user: props.user,
    };
  }

  /**
   * trigger a la création du composant :
   */
  componentDidMount() {}

  /**
   * call for user deletion
   * @param {*} user connector du fichier
   */
  deleteUser(user) {
    axios
      .delete(`${process.env.PUBLIC_URL}/api/v1/users/${user.username}`)
      .then((res) => {
        // TODO
      })
      .catch((e) => {
        console.log(e);
        // TODO
      });
  }

  /**
   * render le composant
   * @return {ReactNode} html du composant
   */
  render() {
    return (
      <div className="col-12" key={this.state.user.id}>
        <div className="card tempMargin">
          <h5 className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              {this.state.user.username}
              <div className="btn-group" role="group">
                <a className="btn btn-warning">
                  <Pencil />
                </a>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={(e) => this.deleteUser(this.state.user)}
                >
                  <Trash />
                </button>
              </div>
            </div>
          </h5>
          <div className="card-body">
            <p className="card-text">
              email :<small className="text-muted">{this.state.user.email}</small>
            </p>
            {this.state.user.roles && (
              <p className="card-text">
                roles :
                {this.state.user.roles.map((role, i) => {
                  return (
                    <span key={`${i}`} className="badge badge-success badge-pill">
                      {role}
                    </span>
                  );
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
}
UserCard.propTypes = {
  user: PropTypes.object,
  display: PropTypes.object,
};

export default UserCard;
