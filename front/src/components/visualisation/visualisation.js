import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import jspreadsheet from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import { Check } from 'react-bootstrap-icons';
import axios from 'axios';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';

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
      data: null,
      displayType: 'CSV',
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
   * convert CSV string to array
   * @param {String} str CSV string
   * @param {String} delimiter delemiter of the cell
   * @return {*} array of the CSV
   */
  csvToArray(str, delimiter = ',') {
    // TODO : better option => https://www.papaparse.com/ ? https://www.npmjs.com/package/csv-string ?
    const titles = str.slice(0, str.indexOf('\n')).split(delimiter);
    const rows = str.slice(str.indexOf('\n') + 1).split('\n');
    return rows.map((row) => {
      const values = row.split(delimiter);
      return titles.reduce((object, curr, i) => ((object[curr] = values[i]), object), {});
    });
  }
  /**
   * setup the jspreadsheet element
   * @param {*} res response of the request
   * @param {*} data array of the CSV
   */
  setJSpreadsheet(res, data) {
    if (data) {
      const options = {
        data: data,
        csvHeaders: true,
        csvDelimiter: ';',
        editable: false,
        tableOverflow: true,
        lazyLoading: true,
        loadingSpin: true,
      };
      this.setState({ options }, () => {
        this.el.destroy(this.wrapper.current, false);
        this.el = jspreadsheet(this.wrapper.current, this.state.options);
      });
    }
  }

  /**
   * get the doc
   */
  handleOnClick() {
    axios
      .get(`${process.env.PUBLIC_URL}/api/media/${this.state.media_id}`)
      .then((res) => {
        axios.get(`${res.data.url}`).then((res2) => {
          // TODO : "better" type detection
          switch (res2.headers['content-type']) {
            case 'application/json; charset=utf-8':
              this.setState({ displayType: 'JSON', data: res2.data });
              break;

            default:
              try {
                const array = this.csvToArray(res2.data);
                this.setState({ displayType: 'CSV', data: null });
                this.setJSpreadsheet(res, array);
              } catch (error) {
                // TODO : error modal
                console.error(error);
              }

              break;
          }
        });
      })
      .catch((err) => {
        // TODO : error modal
        console.error(err);
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
        {
          {
            CSV: <div ref={this.wrapper} />,
            JSON: <ReactJson src={this.state.data} collapsed={2} />,
          }[this.state.displayType]
        }
      </div>
    );
  }
}
Visualisation.propTypes = { match: PropTypes.object };

export default withRouter(Visualisation);
