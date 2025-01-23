import axios from 'axios'

import PropTypes from 'prop-types'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Check } from 'react-bootstrap-icons'
import { useParams } from 'react-router-dom'

import { JsonViewer } from '@textea/json-viewer'
import jspreadsheet from 'jspreadsheet-ce'
import 'jspreadsheet-ce/dist/jspreadsheet.css'

import { BackConfContext } from '../../context/backConfContext.js'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'

Visualisation.propTypes = {
  logout: PropTypes.func,
}
/**
 * Composant : Visualisation
 * @return {ReactNode}
 */
function Visualisation({ logout }) {
  const { backConf } = useContext(BackConfContext)

  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const { defaultErrorHandler } = useDefaultErrorHandler()

  const { id } = useParams()
  const [mediaId, setMediaId] = useState(id ?? '')
  const [visuOption, setVisuOption] = useState({ displayType: 'TXT', data: '- Aucune donnée -' })

  const wrapper = useRef()
  const [el, setEl] = useState(null)

  useEffect(() => {
    if (visuOption.displayType === 'CSV') setEl(jspreadsheet(wrapper.current, { data: [[]], minDimensions: [10, 10] }))
    if (mediaId?.length) handleOnClick()
  }, [])

  useEffect(() => {
    el?.destroy(wrapper.current, false)
    if (visuOption.displayType === 'CSV') setJSpreadsheet()
  }, [visuOption])

  /**
   * met a jour le state lors de la modification de l'input du mediaId
   * @param {*} event event
   */
  const handleChange = (event) => setMediaId(event.target.value)

  /**
   * convert CSV string to array
   * @param {String} str CSV string
   * @param {String} delimiter delemiter of the cell
   * @return {*} array of the CSV
   */
  function csvToArray(str, delimiter = ',') {
    const csvStr = `${str}`
    // TODO : better option => https://www.papaparse.com/ ? https://www.npmjs.com/package/csv-string ?
    const titles = csvStr.slice(0, csvStr.indexOf('\n')).split(delimiter)
    const rows = csvStr.slice(csvStr.indexOf('\n') + 1).split('\n')
    return rows.map((row) => {
      const values = row.split(delimiter)
      return titles.reduce((object, curr, i) => ((object[curr] = values[i]), object), {})
    })
  }
  /**
   * setup the jspreadsheet element
   * @param {*} res response of the request
   * @param {*} data array of the CSV
   */
  function setJSpreadsheet() {
    if (visuOption.data) {
      const options = {
        data: visuOption.data,
        csvHeaders: true,
        csvDelimiter: ';',
        editable: false,
        tableOverflow: true,
        lazyLoading: true,
        loadingSpin: true,
        // includeHeadersOnDownload: true,
        parseTableAutoCellType: true,
        parseTableFirstRowAsHeader: true,
        minSpareRows: 10,
        minSpareCols: 10,
      }
      setEl(jspreadsheet(wrapper.current, options))
    }
  }

  const getContent = async (mediaUrl, displayContent) => {
    // console.trace('T (visu.getContent) fetching image at:', mediaUrl)
    const response = await fetch(mediaUrl)
    if (!response || response.status == 404)
      return defaultErrorHandler({
        statusCode: 404,
        message: `Aucun media n'a été trouvé à l'adresse ${mediaUrl}`,
      })
    // console.trace('T (visu.getContent) fetched:', response)
    const imageBlob = await response.blob()
    const reader = new FileReader()
    reader.readAsDataURL(imageBlob)
    reader.onloadend = () => {
      setHtmlSrc(displayContent(reader.result))
    }
  }

  const getMediaInfo = async (mediaId) => {
    if (!back?.isLoaded) return
    const resApi = await axios.get(back.getBackStorage(mediaId))
    const mediaInfo = resApi?.data
    // console.debug('T (visu) getMediaInfo', mediaInfo)
    if (!mediaInfo)
      return defaultErrorHandler({
        statusCode: 404,
        message: `Info introuvable pour le media ${id}`,
      })
    const mediaUrl = mediaInfo.connector.url
    const mediaMimeStr = mediaInfo.file_type
    const mediaMimeElements = mediaMimeStr.split(';')
    const mediaMime = mediaMimeElements[0].trim().toLowerCase()
    let mediaCharset
    if (mediaMimeElements.length > 1) {
      mediaCharset = mediaMimeElements[1].trim().toLowerCase() ?? 'charset=utf-8'
      switch (mediaCharset) {
        case 'charset=utf-8':
        case 'charset=us-ascii':
        case 'charset=iso-8859-1':
        case 'charset=iso-8859-15':
          break
        default:
          return defaultErrorHandler({ message: `l'encodage ${mediaCharset} n'est pas supporté` })
      }
    }
    mediaCharset = mediaMimeStr
    return { mediaUrl, mediaMime, mediaCharset }
  }
  const [htmlSrc, setHtmlSrc] = useState()

  const displayForEncryptedFile = () =>
    setHtmlSrc(
      <div className="body text-visu">
        <pre>***[ Encrypted file ]***</pre>
      </div>
    )

  const showContent = async (mediaUrl, mediaMime) => {
    // console.trace('T mediaMime:', mediaMime)
    if (mediaMime.endsWith('crypt')) return displayForEncryptedFile()

    if (mediaMime.startsWith('image')) {
      await getContent(mediaUrl, (srcContent) => <img src={srcContent} className="image90" alt="retrieving media..." />)
      // setVisuOption({ displayType: 'IMG', data: imgUrl })
    } else if (mediaMime.startsWith('video')) {
      await getContent(mediaUrl, (srcContent) => (
        <video className="image90" controls loop autoPlay>
          <source src={srcContent} type={mediaMime} />
        </video>
      ))
    } else {
      const res = await axios.get(mediaUrl)
      if (!res?.data)
        return defaultErrorHandler({
          statusCode: 404,
          message: `Aucun media n'a été trouvé à l'adresse ${mediaUrl}`,
        })
      const media = res.data
      console.log(media)
      switch (mediaMime) {
        case 'application/geo+json':
        case 'application/json':
        case 'text/json':
          return setHtmlSrc(<JsonViewer value={media} collapsed={2} />)

        case 'text/csv':
        case 'application/vnd.oasis.opendocument.spreadsheet':
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          setVisuOption({ displayType: 'CSV', data: csvToArray(media), opts: { url: mediaUrl } })
          return setHtmlSrc(<div ref={wrapper} />)

        case 'text/plain':
        case 'text/css':
        case 'text/markdown':
        case 'text/x-markdown':
          if (!media)
            return defaultErrorHandler({
              statusCode: 404,
              message: `Le media n'a pu être récupéré à l'adresse ${mediaUrl}`,
            })
          return setHtmlSrc(
            <div className="body text-visu">
              <pre>{media}</pre>
            </div>
          )
        default:
          defaultErrorHandler({ message: `la visualisation des fichiers de type ${mediaMime} n'est pas supportée` })
      }
    }
  }
  /**
   * get the doc
   */
  async function handleOnClick() {
    // First: let's get the media metadata from the "RUDI Catalog" module
    if (!mediaId) {
      return defaultErrorHandler({ message: 'Un ID de media doit être renseigné avant de cliquer sur le bouton' })
    }
    const mediaInfo = await getMediaInfo(mediaId)
    if (!mediaInfo)
      return defaultErrorHandler({ message: `Aucun media n'a été trouvé pour l'id ${mediaId}`, statusCode: 404 })

    const { mediaUrl, mediaMime, mediaCharset } = mediaInfo
    try {
      // Let's then get the media data from the "RUDI Storage" module
      await showContent(mediaUrl, mediaMime, mediaCharset)
    } catch (err) {
      if (err.msg === 'media uuid not found') {
        err.message = `Aucun media n'a été trouvé pour l'id ${mediaId}`
        err.statusCode = 404
      } else if (!err.statusCode) err.statusCode = 500
      if (err.response?.status == 401) logout()
      else defaultErrorHandler(err)
    }
  }

  return (
    <div className="tempPaddingTop">
      Afficher une donnée (image, CSV ou JSON) :
      <div className="btn-group" role="group">
        <input type="text" className="form-control" placeholder="media_id" value={mediaId} onChange={handleChange} />
        <button type="button" className="btn btn-success" onClick={handleOnClick}>
          <Check />
        </button>
      </div>
      <br></br>
      {htmlSrc}
    </div>
  )
}

export default Visualisation
