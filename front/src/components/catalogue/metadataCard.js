import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash, Check, CloudDownload, Eye } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ModalContext, DefaultOkOption, DefaultConfirmOption } from '../modals/ModalContext';
import ThemeDisplay from '../other/themeDisplay';
import FileSizeDisplay from '../other/fileSizeDisplay';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';
import { getBackUrl } from '../../utils/frontOptions';
import { nowLocaleFormatted } from '../../utils/utils';
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
   */
  function deleteRessource() {
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
      .catch((e) => defaultErrorHandler(e));
  }
  /**
   * call for confirmation before metadata deletion
   * @param {*} metadata metadata a suppr
   */
  const triggerDeleteRessource = () => {
    const options = DefaultConfirmOption;
    options.text = [`Confirmez vous la suppression de la métadonnée ${metadata.resource_title}?`];
    options.buttons = [
      {
        text: 'Oui',
        action: () => deleteRessource(),
      },
      {
        text: 'Non',
        action: () => {},
      },
    ];
    changeOptions(options);
    toggle();
  };

  /**
   * affiche le text en fonction de la langue choisi
   * @param {*} langObjectArray Array d'objet au format {lang:'', text:''}
   * @param {String} lang langue selectionnée
   * @return {String} text dans la langue appropriée
   */
  const getLangText = (langObjectArray, lang) => langObjectArray[0].text;

  /**
   * calcule la taille total des fichiers
   * @return {Number} taille totale
   */
  const getTotalFileSize = () =>
    metadata.available_formats.reduce((acc, cur) => acc + cur.file_size, 0);

  /**
   * Check if the metadata has restricted access
   * @param {*} metadata
   * @return {boolean} True if letadata has restricted access
   */
  const isRestricted = (metadata) =>
    !!metadata?.access_condition?.confidentiality?.restricted_access;

  const metaDates = metadata.metadata_info.metadata_dates;
  /**
   * Display the metadata status
   * @return {html} A round pill that shows the status
   */
  function displayStatus() {
    const displaySpan = (level, text) => (
      <span className={'status-pill text-bg-' + level} id="status-pill">
        {text}
      </span>
    );
    if (metadata.collection_tag) return displaySpan('dark', metadata.collection_tag);
    if (metadata.storage_status === 'pending') return displaySpan('danger', 'Incomplet');
    if (!metaDates?.published && !metaDates?.deleted) return displaySpan('warning', 'Envoyé');
    if (metaDates?.published && !metaDates?.deleted) return displaySpan('success', 'Publié');
    if (metaDates?.deleted) return displaySpan('danger', 'Supprimé');
  }

  return (
    <div className="col-12" key={metadata.global_id}>
      <div className="card card-margin">
        <h5 className={isRestricted(metadata) ? 'card-header restricted' : 'card-header'}>
          <div className="d-flex justify-content-between align-items-center">
            <a
              href={`${formUrl}?read-only=${metadata.global_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {metadata.resource_title}
            </a>
            {displayStatus()}
            {display && display.editJDD && (
              <div className="btn-group" role="group">
                <button type="button" className="btn btn-success">
                  <Check />
                </button>
                {isRestricted(metadata) ? (
                  ''
                ) : (
                  <a
                    className="btn btn-warning"
                    href={`${formUrl}?update=${metadata.global_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Pencil />
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={(e) => triggerDeleteRessource()}
                >
                  <Trash />
                </button>
              </div>
            )}
          </div>

          <div>
            {metaDates?.updated && (
              <small className="text-muted">
                Modifié le : {nowLocaleFormatted(metaDates.updated)}
              </small>
            )}
            <FileSizeDisplay number={getTotalFileSize()}></FileSizeDisplay>
          </div>

          {metaDates?.published && (
            <div>
              <small className="text-muted">
                Publié le : {nowLocaleFormatted(metaDates.published)}
              </small>
            </div>
          )}
        </h5>
        <div className="card-body">
          <p className="card-text">{getLangText(metadata.summary)}</p>
          <p className="card-text">
            Producteur : <span className="text-muted">{metadata.producer?.organization_name}</span>
          </p>
          <a href="#" className="btn btn-secondary card-margin">
            <ThemeDisplay value={metadata.theme}></ThemeDisplay>
          </a>
          <span className="card-text">
            {metadata.available_formats.map((ressource, i) => {
              return (
                <div key={`${ressource.media_id}`}>
                  <Link to={getBackUrl(`show/${ressource.media_id}`)}>
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
                  <span className="">
                    <a href={ressource.connector.url}>{ressource.media_name}</a>
                  </span>
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
