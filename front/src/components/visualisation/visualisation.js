import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import { Check } from 'react-bootstrap-icons';
import axios from 'axios';
import PropTypes from 'prop-types';

/**
 * Composant : Visualisation
 * @return {void}
 */
class Visualisation extends Component {
  /**
   * Constructeur
   * @param {*} props props passés par le parent
   */
  constructor(props) {
    super(props);
    this.state = {
      media_id: props.match.params.id ? props.match.params.id : '',
      options: {
        data: [[]],
        minDimensions: [10, 10],
      },
    };
    this.wrapper = React.createRef();

    this.handleChange = this.handleChange.bind(this);
    this.handleOnClick = this.handleOnClick.bind(this);
  }
  /**
   * met a jour le state lors de la modification de l'input du media_id
   * @param {*} event event
   */
  handleChange(event) {
    this.setState({ media_id: event.target.value });
  }

  /**
   * get the doc
   */
  handleOnClick() {
    axios
      .get(`${process.env.PUBLIC_URL}/api/media/${this.state.media_id}`, {
        headers: { Authorization: `Bearer ${JSON.parse(sessionStorage.getItem('token')).token}` },
      })
      .then((res) => {
        console.log(res.data);
        // TODO : check fileRes.headers.content-type de axios.get(url) ?
        if (res.data.url) {
          const options = {
            csv: res.data.url,
            csvHeaders: true,
            csvDelimiter: ';',
            editable: false,
            tableOverflow: true,
            lazyLoading: true,
            loadingSpin: true,
          };
          this.setState({ options });
          this.el.destroy(this.wrapper.current, false);
          this.el = jspreadsheet(this.wrapper.current, this.state.options);
        }
      });
  }

  /**
   * trigger a la création du composant
   */
  componentDidMount() {
    this.el = jspreadsheet(this.wrapper.current, this.state.options);
    if (this.state.media_id.length) {
      this.handleOnClick();
    }
  }

  /**
   * render le composant
   * @return {ReactNode} html du composant
   */
  render() {
    return (
      <div className="tempPaddingTop">
        Afficher une donnée (csv) :
        <div className="btn-group" role="group">
          <input
            type="text"
            className="form-control"
            placeholder="media_id"
            value={this.state.media_id}
            onChange={this.handleChange}
          />
          <button type="button" className="btn btn-success" onClick={this.handleOnClick}>
            <Check />
          </button>
        </div>
        <br></br>
        <div ref={this.wrapper} />
      </div>
    );
  }
}
Visualisation.propTypes = { match: PropTypes.object };

export default withRouter(Visualisation);
