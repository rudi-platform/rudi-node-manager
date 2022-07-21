import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash, Check, CloudDownload, Eye } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import Moment from 'react-moment';
import axios from 'axios';
import { ModalContext, DefaultOkOption, DefaultConfirmOption } from '../modals/ModalContext';
import ThemeDisplay from '../other/themeDisplay';
import FileSizeDisplay from '../other/fileSizeDisplay';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';
import { getBackUrl } from '../../utils/frontOptions';
// import { getFrontPath } from '../../utils/frontOptions';

/**
 * Composant : metadataCard
 * @return {ReactNode}
 */
export default function MetadataCard({ formUrl, metadata, display, refresh }) {
  const { changeOptions, toggle } = React.useContext(ModalContext);
  const { defaultErrorHandler } = useDefaultErrorHandler();

  /**
   * download le fichier via media_id
   * @param {*} ressource connector du fichier
   */
  /* 
  function downloadFile(ressource) {
    axios
      .get(`${ressource.connector.url}`, {
        responseType: 'blob',
        headers: { 'media-access-method': 'Direct' },
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${ressource.media_name}`);
        document.body.appendChild(link);
        link.click();
      })
      .catch((e) => {
        defaultErrorHandler(e);
      });
  }
   */

  /**
   * call for metadata deletion
   * @param {*} metadata metadata a suppr
   */
  function deleteRessource(metadata) {
    axios
      .delete(`api/admin/resources/${metadata.global_id}`)
      .then((res) => {
        const options = DefaultOkOption;
        options.text = [`La métadonnée ${res.data.resource_title} a été supprimée`];
        options.buttons = [
          {
            text: 'Ok',
            action: () => {
              refresh();
            },
          },
        ];
        changeOptions(options);
        toggle();
      })
      .catch((e) => {
        defaultErrorHandler(e);
      });
  }
  /**
   * call for confirmation before metadata deletion
   * @param {*} metadata metadata a suppr
   */
  function triggerDeleteRessource(metadata) {
    const options = DefaultConfirmOption;
    options.text = [`Confirmez vous la suppression de la métadonnée ${metadata.resource_title}?`];
    options.buttons = [
      {
        text: 'Oui',
        action: () => {
          deleteRessource(metadata);
        },
      },
      {
        text: 'Non',
        action: () => {},
      },
    ];
    changeOptions(options);
    toggle();
  }

  /**
   * affiche le text en fonction de la langue choisi
   * @param {*} langObjectArray Array d'objet au format {lang:'', text:''}
   * @param {String} lang langue selectionnée
   * @return {String} text dans la langue appropriée
   */
  function getLangText(langObjectArray, lang) {
    // TODO
    return langObjectArray[0].text;
  }
  /**
   * calcule la taille total des fichiers
   * @return {Number} taille totale
   */
  function getTotalFileSize() {
    return metadata.available_formats.reduce((acc, cur) => acc + cur.file_size, 0);
  }

  return (
    <div className="col-12" key={metadata.global_id}>
      <div className="card temp-margin">
        <h5 className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <a
              href={`${formUrl}?read-only=${metadata.global_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {metadata.resource_title}
            </a>
            {!metadata.metadata_info.metadata_dates?.published &&
              !metadata.metadata_info.metadata_dates?.deleted && (
                <span className="badge badge-warning badge-pill">En attente</span>
              )}
            {metadata.metadata_info.metadata_dates?.published &&
              !metadata.metadata_info.metadata_dates?.deleted && (
                <span className="badge badge-success badge-pill">Publié</span>
              )}
            {metadata.metadata_info.metadata_dates?.deleted && (
              <span className="badge badge-danger badge-pill">Supprimé</span>
            )}
            {display && display.editJDD && (
              <div className="btn-group" role="group">
                <button type="button" className="btn btn-success">
                  <Check />
                </button>
                <a
                  className="btn btn-warning"
                  href={`${formUrl}?update=${metadata.global_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Pencil />
                </a>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={(e) => triggerDeleteRessource(metadata)}
                >
                  <Trash />
                </button>
              </div>
            )}
          </div>

          <div>
            {metadata.metadata_info.metadata_dates?.updated && (
              <small className="text-muted">
                Modifié le :
                <Moment format=" DD/MM/YYYY HH:mm:ss">
                  {metadata.metadata_info.metadata_dates.updated}
                </Moment>
              </small>
            )}
            <FileSizeDisplay number={getTotalFileSize()}></FileSizeDisplay>
          </div>

          {metadata.metadata_info.metadata_dates?.published && (
            <div>
              <small className="text-muted">
                Publié le :
                <Moment format=" DD/MM/YYYY HH:mm:ss">
                  {metadata.metadata_info.metadata_dates.published}
                </Moment>
              </small>
            </div>
          )}
        </h5>
        <div className="card-body">
          <p className="card-text">{getLangText(metadata.summary)}</p>
          <p className="card-text">
            Producteur : <span className="text-muted">{metadata.producer?.organization_name}</span>
          </p>
          <a href="#" className="btn btn-secondary temp-margin">
            <ThemeDisplay value={metadata.theme}></ThemeDisplay>
          </a>
          <span className="card-text">
            {metadata.available_formats.map((ressource, i) => {
              return (
                <div key={`${ressource.media_id}`}>
                  <Link to={getBackUrl(`/show/${ressource.media_id}`)}>
                    <span className="btn btn-success" title="Aperçu">
                      <Eye />
                    </span>
                  </Link>
                  <button type="button" className="btn btn-success button-margin">
                    <a id="downloadMedia" title="Télécharger" href={ressource.connector.url}>
                      <CloudDownload />
                    </a>
                  </button>
                  <FileSizeDisplay number={ressource.file_size}></FileSizeDisplay>
                  <span className=""><a href={ressource.connector.url}>{ressource.media_name}</a></span>
                </div>
              );
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
MetadataCard.propTypes = {
  metadata: PropTypes.object,
  formUrl: PropTypes.string,
  display: PropTypes.object,
  refresh: PropTypes.func,
};
