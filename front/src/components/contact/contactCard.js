import React, { Component } from 'react';
import { Pencil, Trash } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Composant : ContactCard
 * @return {void}
 */
class ContactCard extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      formUrl: props.formUrl,
      contact: props.contact,
    };
  }
  /**
   * call for contact deletion
   * @param {*} contact contact a suppr
   */
  deleteContact(contact) {
    axios
      .delete(`${process.env.PUBLIC_URL}/api/admin/contacts/${contact.contact_id}`)
      .then((res) => {
        // TODO
      })
      .catch((e) => {
        console.log(e);
        // TODO
      });
  }

  /**
   * trigger a la création du composant :
   */
  componentDidMount() {}

  /**
   * render le composant
   * @return {ReactNode} html du composant
   */
  render() {
    return (
      <div className="col-12" key={this.state.contact.contact_id}>
        <div className="card tempMargin">
          <h5 className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <a>{this.state.contact.contact_name}</a>
              <div className="btn-group" role="group">
                <a
                  href={`${this.state.formUrl}?update=${this.state.contact.contact_id}`}
                  className="btn btn-warning"
                >
                  <Pencil />
                </a>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={(e) => this.deleteContact(this.state.contact)}
                >
                  <Trash />
                </button>
              </div>
            </div>
          </h5>
          <div className="card-body">
            <p className="card-text">
              email :<small className="text-muted">{this.state.contact.email}</small>
            </p>
          </div>
        </div>
      </div>
    );
  }
}
ContactCard.propTypes = {
  contact: PropTypes.object,
  formUrl: PropTypes.string,
};

export default ContactCard;
