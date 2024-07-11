import axios from 'axios'

import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { BoxArrowUpRight, CloudDownload, CloudSlash, Eye, Pencil, Share, Trash } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom'

import { BackConfContext } from '../../context/backConfContext.js'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import { getLocaleFormatted } from '../../utils/utils'
import { DefaultConfirmOption, DefaultOkOption, useModalContext } from '../modals/genericModalContext'
import FileSizeDisplay from '../other/fileSizeDisplay'
import ThemeDisplay from '../other/themeDisplay'

const getDownloadButton = (url) => (
  <button type="button" className="btn btn-green button-margin">
    <a id="downloadMedia" title="Télécharger" href={url}>
      <CloudDownload />
    </a>
  </button>
)
const getShareButton = (url) => (
  <a className="btn btn-success" title="Partager la métadonnée" href={url} target="_blank" rel="noopener noreferrer">
    <Share />
  </a>
)
const getExternalUrlButton = (url) => (
  <button type="button" className="btn btn-green margin-right">
    <a id="downloadMedia" title="Site externe" href={url}>
      <BoxArrowUpRight />
    </a>
  </button>
)

const getEyeButton = (id) => (
  <Link to={`/show/${id}`}>
    <span className="btn btn-green" title="Aperçu">
      <Eye />
    </span>
  </Link>
)
const getEditButton = (url) => (
  <a className="btn btn-warning" href={url} title="Editer" target="_blank" rel="noopener noreferrer">
    <Pencil />
  </a>
)
const getDeleteButton = (triggerDelete) => (
  <button type="button" className="btn btn-danger" title="Supprimer" onClick={() => triggerDelete()}>
    <Trash />
  </button>
)
const missButton = (
  <button type="button" className="btn btn-missing" title="Fichier manquant, à retransmettre">
    <CloudSlash />
    {/* <CloudSlashFill /> */}
    {/* <FileEarmarkExcel /> */}
    {/* <XLg /> */}
  </button>
)
MetadataCard.propTypes = {
  editMode: PropTypes.bool,
  metadata: PropTypes.object,
  refresh: PropTypes.func,
  logout: PropTypes.func,
}

export const displaySpan = (level, text) => (
  <span className={'status-pill text-bg-' + level} id="status-pill">
    {text}
  </span>
)

/**
 * Display a metadata status
 * @param {string} metadataStatus a metadata status
 * @return {html} A round pill that shows the status
 */
export const displayStatus = (metadataStatus) => {
  switch (metadataStatus) {
    case 'incomplete':
      return displaySpan('danger', 'Incomplet')
    case 'refused':
      return displaySpan('danger', 'Refus portail')
    case 'deleted':
      return displaySpan('muted', 'Supprimé')
    case 'local':
      return displaySpan('success', 'Publié (local)')
    case 'published':
      return displaySpan('success', 'Publié (portail)')
    case 'sent':
      return displaySpan('warning', 'Envoyé')
    default:
      return displaySpan('dark', 'Local')
  }
}
/**
 * Display the status for the metadata
 * @param {JSON} metadata a RUDI metadata
 * @return {html} A round pill that shows the status
 */
export const displayMetadataStatus = (metadata) =>
  metadata.metadata_status == 'local' && metadata.collection_tag
    ? displaySpan('dark', metadata.collection_tag)
    : displayStatus(metadata.metadata_status)

/**
 * Composant : metadataCard
 * @return {ReactNode}
 */
export default function MetadataCard({ editMode, metadata, refresh, logout }) {
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const [shareButton, setShareButton] = useState(getShareButton())
  useEffect(
    () =>
      setShareButton(
        getShareButton((back?.isLoaded && back.getCatalogPub('v1/resources', metadata.global_id)) || getShareButton())
      ),
    [back]
  )

  const { changeOptions, toggle } = useModalContext()
  const [isEdit, setIsEdit] = useState(!!editMode)
  useEffect(() => setIsEdit(!!editMode), [editMode])

  const getFormMeta = (query) => back?.isLoaded && back?.getConsole('metadata', query)

  /**
   * call for metadata deletion
   */
  const deleteRessource = () =>
    back?.isLoaded &&
    axios
      .delete(back.getBackCatalog('resources', metadata.global_id))
      .then((res) => {
        const options = DefaultOkOption
        options.text = [`La métadonnée ${res.data.resource_title} a été supprimée`]
        options.buttons = [{ text: 'Ok', action: () => refresh() }]
        changeOptions(options)
        toggle()
      })
      .catch((err) => (err.response?.status == 401 ? logout() : defaultErrorHandler(err)))

  /**
   * call for confirmation before metadata deletion
   * @param {*} metadata metadata a suppr
   */
  const triggerDeleteRessource = () => {
    const options = DefaultConfirmOption
    options.text = [`Confirmez vous la suppression de la métadonnée ${metadata.resource_title}?`]
    options.buttons = [
      { text: 'Oui', action: () => deleteRessource() },
      { text: 'Non', action: () => {} },
    ]
    changeOptions(options)
    toggle()
  }

  /**
   * affiche le text en fonction de la langue choisi
   * @param {*} langObjectArray Array d'objet au format {lang:'', text:''}
   * @param {String} userLang langue selectionnée
   * @return {String} text dans la langue appropriée
   */
  const getLangText = (langObjectArray, userLang) => {
    langObjectArray.map((textObj) => {
      const { lang, text } = textObj
      if (lang === userLang) return text
    })
    return langObjectArray[0].text
  }

  /**
   * calcule la taille total des fichiers
   * @return {Number} taille totale
   */
  const getTotalFileSize = () => metadata.available_formats.reduce((acc, cur) => acc + cur.file_size, 0)

  /**
   * Check if the metadata has restricted access
   * @param {*} metadata
   * @return {boolean} True if letadata has restricted access
   */
  const isRestricted = (metadata) => !!metadata?.access_condition?.confidentiality?.restricted_access
  // console.log(metadata)
  const metaDates = metadata.metadata_info?.metadata_dates

  const displayMediaFile = (mediaFile) => (
    <div key={`${mediaFile.media_id}`}>
      {button.visualize(mediaFile.media_id)}
      {button.download(mediaFile.connector.url)}
      <FileSizeDisplay number={mediaFile.file_size}></FileSizeDisplay>
      <span className="">
        <a href={mediaFile.connector.url}>{mediaFile.media_name}</a>
      </span>
    </div>
  )

  const displayMediaService = (mediaService) => (
    <div key={`${mediaService.media_id}`}>
      {button.external(mediaService.connector.url)}
      <span className="">
        <a href={mediaService.connector.url}>{mediaService.connector.url}</a>
      </span>
    </div>
  )
  const displayMissingMedia = (media) => (
    <div key={`${media.media_id}`}>
      {missButton}
      <span className="text-muted"> {media.media_name} </span>
    </div>
  )
  const displayAvailableMedia = (media) => (media.file_size ? displayMediaFile(media) : displayMediaService(media))

  const displayMedia = (media) =>
    media.file_storage_status === 'missing' ? displayMissingMedia(media) : displayAvailableMedia(media)

  const button = {
    edit: getEditButton(getFormMeta(`update=${metadata.global_id}`)),
    delete: getDeleteButton(triggerDeleteRessource),
    download: (url) => getDownloadButton(url),
    external: (url) => getExternalUrlButton(url),
    visualize: (id) => getEyeButton(id),
  }
  return (
    <div className="col-12" key={metadata.global_id}>
      <div className="card card-margin">
        <h5 className={isRestricted(metadata) ? 'card-header restricted' : 'card-header'}>
          <div className="d-flex justify-content-between align-items-center">
            <a href={getFormMeta(`read-only=${metadata.global_id}`)} target="_blank" rel="noopener noreferrer">
              <span className={metadata.storage_status === 'pending' ? 'danger' : ''}>{metadata.resource_title}</span>
            </a>
            <span className="align-pill-right">{displayMetadataStatus(metadata)}</span>
            {isEdit ? (
              <div className="btn-group" role="group">
                {shareButton}
                {button.edit}
                {button.delete}
              </div>
            ) : (
              <div className="btn-group" role="group">
                {shareButton}
              </div>
            )}
          </div>

          <div>
            {metaDates?.updated && (
              <small className="text-muted">Modifié le : {getLocaleFormatted(metaDates.updated)}</small>
            )}
            <FileSizeDisplay number={getTotalFileSize()}></FileSizeDisplay>
          </div>

          {metaDates?.published && (
            <div>
              <small className="text-muted">Publié le : {getLocaleFormatted(metaDates.published)}</small>
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
          <span className="card-text">{metadata.available_formats.map((media) => displayMedia(media))}</span>
        </div>
      </div>
    </div>
  )
}
