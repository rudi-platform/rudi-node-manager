'use strict'

/**
 * JS code for metadata form page
 * @author Florian Desmortreux, Olivier Martineau
 */

// ---- IMPORT ----
import '../lib/HtmlFormTemplate.js'
import { ForeignFile } from '../lib/MaterialInputs.js'

import { HttpRequest, JsonHttpRequest } from './Http.js'
import { RudiForm, STYLE_BLD, STYLE_ERR, STYLE_THN } from './Rudi.js'
import { encryptRsaOaepAesGcm, importPublicRsaKey } from './RudiCrypto.js'
import { getFileExtension, multiSplit, pathJoin, uuidv4 } from './utils.js'

// ---- Access conf values -----
const pubKeys = {}
const PROP_PUB_KEY_NAME = 'pub_key_name'
const MEDIA_COMMIT_OK = 'commit_ready'

export class MetadataForm extends RudiForm {
  apiFileTypes = undefined

  constructor(language) {
    super(language)
  }

  async getTemplate() {
    const here = 'getTemplate'
    try {
      if (!this.initialized) throw new Error('Init function should be called first')
      this.template = await this.getLocal('templates/metadata.json')
      if (!this.template) throw new Error('Could not load template')
      if (!this.template.fragmentSet) throw new Error('Could not load template.fragmentSet')

      // this.ok(here, JSON.stringify(this.template))
      // Fetch template and enums to create form
      let data
      try {
        data = await Promise.all([
          this.getPmJson('catalog/enum?lang=fr'),
          this.getPmJson('catalog/contacts'),
          this.getPmJson('catalog/organizations'),
          this.getPmJson('catalog/pub_keys?type=rsa'),
        ])
      } catch (err) {
        this.ko(here, err)
        return this.fail('get_api_data')
      }
      const [enums, contacts, organizations, publicKeys] = data
      // this.ok(here, 'retrieved org:', organizations[0])

      // Build final enum
      enums.contacts = contacts.map((c) => ({ name: c.contact_name, value: c }))
      enums.organizations = organizations.map((o) => ({ name: o.organization_name, value: o }))
      enums.publickeys = publicKeys.map((k) => {
        pubKeys[k.name] = k.pem
        return k.name
      })

      // Sort enums
      Object.values(enums.themes).sort(new Intl.Collator().compare)
      enums.keywords.sort(new Intl.Collator().compare)
      enums.publickeys.sort(new Intl.Collator().compare)

      if (!this.template?.fragmentSet?.enums) throw new Error('Template was not successfully loaded')
      if (!this.template.fragmentSet.enums.$) this.template.fragmentSet.enums.$ = {}
      Object.assign(this.template.fragmentSet.enums.$, enums)

      this.apiFileTypes = enums.fileextensions
      // this.ok(here)
    } catch (err) {
      this.ko(here, err)
      this.template = null
      this.fail('get_template')
    }
  }

  async prefill() {
    const here = 'prefill'
    try {
      if (!this.template) return this.fail('fill_template')
      if (!this.customForm?.htmlController) return this.fail('fill_form')
      const htmlCtrl = this.customForm?.htmlController

      this.addMessage(this.lexR['fill/start'])
      this.updateLayout = () => htmlCtrl.geography.invalidateSize()

      // Reduce form
      this.reduce()

      // Set defaults value
      // console.debug('T this.customForm) global_id'htmlCtrl.global_id)
      htmlCtrl.global_id.value = uuidv4()
      htmlCtrl.synopsis.value = [{ lang: 'fr', text: '' }]
      htmlCtrl.summary.value = [{ lang: 'fr', text: '' }]
      htmlCtrl.custom_licence_label.value = [{ lang: 'fr', text: '' }]
      htmlCtrl.resource_languages.value = ['fr']
      htmlCtrl.storage_status.value = 'pending'
      htmlCtrl.metadata_api_version.value = await this.getPmStr('catalog/version')
      htmlCtrl.created.value = new Date().toISOString() //.slice(0, 10)

      await this.getEditModeAndFillData('resources')

      htmlCtrl.updated.value = new Date().toISOString() //.slice(0, 10)

      // Enable dev paste
      this.devPaste()

      // Set listener for submit event
      htmlCtrl.submit_btn.addEventListener('click', () => this.submitListener())
      this.addMessage(this.lexR['form/start'], STYLE_THN)
      // this.ok(here)
    } catch (e) {
      this.ko(here, e)
      this.fail('fill')
    }
  }
  /**
   * Parse a form value to a rudi resource
   * @param {Object} formValue
   * @param {Object} originalValue
   * @returns the rudi resource
   */
  parseUserInputLocal(formValue, originalValue) {
    // NOSONAR
    const here = 'MetadataForm.parseUserInputLocal'
    const outputValue = { ...formValue }

    let hasLocalFile = false
    if (!formValue.available_formats) {
      this.ko(here, 'No available_formats found')
    } else {
      let mediaFiles = formValue.available_formats.files?.map((file) => {
        if (file instanceof MediaFile) {
          this.ok(here, 'file:', file)
          return file
        } else if (file instanceof File) {
          hasLocalFile = true
          return MediaFile.fromFile(file, this.storageUrl)
        } else throw new Error('Wrong type of file')
      })

      let mediaServices = formValue.available_formats.services?.map((service) => MediaService.fromService(service))

      let af = [].concat(mediaFiles ?? [], mediaServices ?? [])
      outputValue.available_formats = af.length ? af : undefined

      if (originalValue) {
        // Conserve other type of media from original value
        for (let media of originalValue.available_formats) {
          if (media.media_type != 'FILE' && media.media_type != 'SERVICE') {
            outputValue.available_formats.push(media)
          }
        }
      }
    }

    // Set restricted_access bool value
    if (!outputValue.access_condition.confidentiality) outputValue.access_condition.confidentiality = {}
    outputValue.access_condition.confidentiality.restricted_access = Boolean(
      (outputValue.restricted_access && hasLocalFile) ||
        originalValue?.access_condition?.confidentiality?.restricted_access
    )

    // REMOVE OR API FAIL WHEN PUBLISHING NEW RESTRICTED DATA
    outputValue.restricted_access = undefined
    outputValue.keywords = multiSplit(formValue.keywords, [',', ';'], true)

    return outputValue
  }

  /**
   * Parse a rudi resource to a form value
   * @param {Object} rudiRessource the ressource to parse
   * @returns the form value
   */
  parseInitialValueLocal(rudiRessource) {
    const formValue = { ...rudiRessource }
    const files = []
    const services = []

    if (rudiRessource.available_formats) {
      for (const media of rudiRessource.available_formats) {
        switch (media.media_type) {
          case 'FILE':
            files.push(MediaFile.fromLitteral(media))
            break
          case 'SERVICE':
            services.push(MediaService.fromLitteral(media))
            break
        }
      }
      formValue.available_formats = {}
      if (files.length) formValue.available_formats.files = files
      if (services.length) formValue.available_formats.services = services
    }
    const pubKeyName = files[0]?.connector?.connector_parameters?.filter((p) => p.key == PROP_PUB_KEY_NAME)[0]?.value
    formValue.restricted_access = pubKeyName
    formValue.keywords = `${formValue.keywords}`
    return formValue
  }

  mediaHeaders = null
  async getStorageHeaders(initialHeaders = {}) {
    try {
      if (!this.mediaHeaders) {
        const pmStorageJwtRes = await JsonHttpRequest.get(this.getUrlBackStorage('jwt'), this.pmHeaders).send()
        const mediaToken = pmStorageJwtRes.token
        this.mediaHeaders = Object.assign(initialHeaders, { Authorization: `Bearer ${mediaToken}` })
      }
      return this.mediaHeaders
    } catch (err) {
      if (err?.response?.data?.message) console.error(err.response.data)
      else if (!err?.response?.status) console.error(err)
      else
        console.error(
          `\x1b[31mFailed GET media token: ERR ${err.response?.status} ` +
            `(${err.response?.statusText}) ${err.response?.data?.message} \x1b[0m`
        )
      return this.fail('reach_storage_auth')
    }
  }

  /**
   * Send a file to RudiStorage.
   * The MediaFile should have a file attached
   *
   * @param {MediaFile} mediaFile the file to send
   * @returns a promise, resolve when all files are sent
   */
  async sendFile(mediaFile, metadataId) {
    try {
      const mediaInfo = JSON.parse(JSON.stringify(mediaFile))
      mediaInfo.media_name = encodeURI(mediaFile.media_name)
      const postMediaOpts = await this.getStorageHeaders({ file_metadata: JSON.stringify(mediaInfo) })
      if (!postMediaOpts) return

      const mediaId = mediaFile.media_id
      const req = HttpRequest.post(this.getUrlStorage('post'), postMediaOpts)

      req.upload.addEventListener('progress', (event) =>
        this.updateGlobalProgress(mediaId, mediaFile.media_name, event.total, event.loaded)
      )

      req.addEventListener('timeout', () => this.fail('upload/timeout'))
      req.addEventListener('abort', () => this.fail('upload/abort'))
      req.addEventListener('loadstart', () => this.addMessage(this.lexR['upload/start']))
      req.addEventListener('loadend', () => this.concludeSendingListener(req, mediaId, metadataId))

      const data = await mediaFile.file.arrayBuffer()
      return req.send(new Int8Array(data))
    } catch (e) {
      console.error(`E [sendFile] metaId=${metadataId} | cause:`, e)
    }
  }

  // eslint-disable-next-line complexity
  async publish(data) {
    // NOSONAR
    const here = 'publish'
    const keyName = this.customForm.htmlController.restricted_access.value
    let publicPEM, publicKey
    if (keyName) {
      publicPEM = pubKeys[keyName]
      publicKey = await importPublicRsaKey(publicPEM, 'SHA-256').catch((e) => {
        console.error(`Cannot import key from PEM:`, e)
        throw new Error(`Cannot import key from PEM: ${e.message}`)
      })
    }

    let mediaFiles
    if (data.available_formats) {
      const mediaFilesPromises = []
      for (const media of data.available_formats) {
        if (media instanceof MediaFile && media.hasFileAttached()) {
          mediaFilesPromises.push(openEncryptAndChecksum(media, publicKey, publicPEM, keyName, 'SHA-256'))
        }
      }
      mediaFiles = await Promise.all(mediaFilesPromises)
    }

    const submitFunction = this.isUpdate ? JsonHttpRequest.put : JsonHttpRequest.post

    // TODO: check si tous les fichiers sont bien uploadés, sinon supprimer la métadonnée ou mettre son état à WIP
    try {
      // Sending the metadata to PM => API
      const res = await submitFunction(this.getUrlBackCatalog('resources'), this.pmHeaders).sendJson(data)
      this.ok(here, 'metadata sent', res)
    } catch (e) {
      console.error(`ERR01 Couldn't send the metadata to the API, aborting. Cause:`, e)
      return this.fail('meta_send')
    }
    try {
      this.state = 'send_files'
      // Sending the files
      const storageResponse = await Promise.all(
        mediaFiles?.map((file) =>
          this.sendFile(file, data.global_id).catch((err) => {
            const errMsg = `Couldn't send file '${file.name}' to media storage`
            console.error(errMsg, err)
            throw new Error(errMsg)
          })
        )
      )
      let errMsgDetected = []
      for (const fileRes of storageResponse) {
        const fileResParsed = safeJsonParse(fileRes)
        if (fileResParsed?.length > 0 && fileResParsed[fileResParsed.length - 1]?.status == 'error') {
          const errMsg = `File not sent: ${fileResParsed[fileResParsed.length - 1]?.msg}`
          errMsgDetected.push(errMsg)
        }
      }
      if (errMsgDetected.length == 0) {
        if (this.isDev) this.ok(here, 'every media was sent', storageResponse)
        return this.end(this.isUpdate ? 'edit' : 'create')
      } else {
        console.error(errMsgDetected)
        return this.fail('media_send')
      }
    } catch (error) {
      if (error?.responseText) {
        console.error('ERR04 [publish]' + error?.responseText)
        const err = safeJsonParse(error?.responseText)
        console.error('ERR05 [publish] SEND ERROR :\n', err.moreInfo.message)
        console.error('ERR06 [publish]', err)
      } else {
        console.error('ERR07 [publish]', error)
      }
      this.fail('media_send')
    }
  }

  async submitListener() {
    const here = 'submitListener'
    try {
      console.log('Submiting...')
      this.state = 'submit'
      this.addMessage(this.lexR['submit/start'])

      let outputValue = this.getValue()
      if (!outputValue) {
        return this.fail('No output gathered')
      }

      this.customForm.htmlController.submit_btn.removeEventListener('click', () => this.submitListener())
      await this.publish(outputValue)
    } catch (e) {
      this.ko(here, e)
      this.fail('critic')
    }
  }

  async concludeSendingListener(req, mediaId, metadataId) {
    const here = 'concludeSendingListener'
    // Fetch commit UUID
    const data = req.responseText
    const commitInfo = { media_id: mediaId }
    try {
      const resultArray = safeJsonParse(data)
      this.ok(here, 'resultArray:', resultArray)
      if (!Array.isArray(resultArray)) {
        console.error(`Invalid response from media server for media ${mediaId}: status=`, resultArray)
        throw new Error(`Invalid response from media server for media ${mediaId}: status=${resultArray}`)
      }
      if (resultArray.length < 3) {
        const storageMessage = resultArray[resultArray.length - 1]?.msg
        throw new Error(
          storageMessage ||
            `Invalid response from media server for media ${mediaId}: status=${resultArray[resultArray.length - 1]}`
        )
      }
      for (const statusInfo of resultArray) {
        if (statusInfo.status == MEDIA_COMMIT_OK) {
          Object.assign(commitInfo, statusInfo)
          break
        }
      }
      if (!commitInfo.status || commitInfo.status !== MEDIA_COMMIT_OK) {
        console.error(`E [${here}.status] Media ${mediaId}: commit data=`, commitInfo)
        // this.addErrorMsg(`Commit message not found for media ${mediaId}`)
        return this.fail('media_commit_not_received')
      }
      if (metadataId) commitInfo.global_id = metadataId
      try {
        await JsonHttpRequest.post(this.getUrlBackStorage('commit'), this.pmHeaders).sendJson(commitInfo)
        this.ok(here, 'Commit succeeded for media', mediaId)
      } catch (error) {
        console.error(`E [${here}.post] Committing failed for media ${mediaId}`, error)
        // this.addErrorMsg(`Committing failed for media ${mediaId}`)
        return this.fail('media_commit_not_sent')
      }
    } catch (error) {
      console.error(`E [${here}.final] Sending failed for media ${mediaId}`, error)
      // this.addErrorMsg(`Sending failed for media ${mediaId}`)
      this.fail('media_commit', true)
    }
  }

  progressPercentMsg = (loaded, total) =>
    `Transmission en cours ${Math.floor((100 * loaded) / total)}%<br/>` +
    `<span class="${STYLE_ERR}" syle="font-weight:light">` +
    'Veuillez attendre que ce message disparaisse pour fermer cette page</span>'

  globalProgress = {}
  updateGlobalProgress(mediaId, mediaName, total, loaded) {
    this.globalProgress[mediaId] = { mediaName, total, loaded }
    let globalTotal = 0
    let globalLoaded = 0
    for (const fileProgress of Object.values(this.globalProgress)) {
      globalTotal += fileProgress.total
      globalLoaded += fileProgress.loaded
    }

    this.addMessage(this.progressPercentMsg(globalLoaded, globalTotal), STYLE_BLD)
  }

  static async loadForm() {
    const here = 'loadForm'
    const metadataForm = new MetadataForm('fr')
    await metadataForm.init()
    if (metadataForm.state == 'fail' || metadataForm.state == 'critic') return
    try {
      await metadataForm.getTemplate()
      metadataForm.ok(here, 'getTemplate')

      metadataForm.load()
      metadataForm.ok(here, 'load')

      await metadataForm.prefill()
      metadataForm.ok(here, 'prefill')

      window.rudiForm = metadataForm

      metadataForm.ok(here)
    } catch (e) {
      metadataForm.ko(here, 'ERF02 rudiForm', e)
      metadataForm.addErrorMsg(e)
      throw e
    }
  }
}

/* ---- Init Form ---- */
MetadataForm.loadForm()

/* ---- Files Function ---- */

/**
 * Async function to open, encrypt and compute the checksum of a MediaFile
 * @param {MediaFile} mediaFile to process
 * @param {CryptoKey} publicKey for encryption, if none file is not encrypted
 * @param {String} publicPEM the PEM encoded public key
 * @param {String} publicKeyName the public key name
 * @param {String} algo can be 'SHA-1' 'SHA-256' 'SHA-384' 'SHA-512'
 * @returns the media opened, enrypted with its checksum
 */
async function openEncryptAndChecksum(mediaFile, publicKey, publicPEM, publicKeyName, algo) {
  if (publicKey && publicPEM) await mediaFile.encrypt(publicKey, publicPEM, publicKeyName)

  await mediaFile.computeChecksum(algo)
  return mediaFile
}

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str)
  } catch {
    console.warn(`[safeJsonParse] could not parse\n${str}`)
    return str
  }
}

/* ---- FILES ---- */

/** The object representing files for rudi resources */
class MediaFile extends ForeignFile {
  constructor( // NOSONAR
    uuid,
    media_name,
    media_caption,
    media_visual,
    media_dates,
    connector,
    file_type,
    file_size,
    checksum,
    file_storage_status,
    file_status_update
  ) {
    super(media_name, file_size, file_type)
    this.media_id = uuid ?? uuidv4()
    this.media_caption = media_caption
    this.media_visual = media_visual
    this.media_dates = media_dates
    this.connector = connector
    this.checksum = checksum
    this.file_storage_status = file_storage_status
    this.file_status_update = file_status_update

    this.file = undefined
    this.encrypted = false
  }

  get media_name() {
    return this.name
  }
  get file_type() {
    return this.type
  }
  get file_size() {
    return this.size
  }

  /**
   * Create a new instance of AvailableFormat from a litteral object
   * @param {Object} media an AvailableFormat litteral object
   * @returns a new instance of AvailableFormat
   */
  static fromLitteral(media) {
    const mediaFile = new MediaFile(
      media.media_id || uuidv4(),
      media.media_name,
      media.media_caption,
      media.media_visual,
      media.media_dates,
      media.connector,
      media.file_type,
      media.file_size,
      media.checksum,
      media.file_storage_status,
      media.file_status_update
    )

    mediaFile.file_encoding = media.file_encoding
    mediaFile.file_structure = media.file_structure
    mediaFile.file_storage_status = media.file_storage_status
    mediaFile.file_status_update = media.file_status_update
    return mediaFile
  }

  /**
   * Create a new instance of AvailableFormat from a file
   * @param {File} file a file object
   * @returns a new instance of AvailableFormat
   */
  static fromFile(file, mediaUrl) {
    const date = new Date(file.lastModified).toISOString()
    let fileType = file.type // Value extractred in MaterialInput.js and is one of JS Blob.types
    if (MetadataForm.apiFileTypes) {
      if (!fileType || Object.values(MetadataForm.apiFileTypes).indexOf(fileType) === -1)
        fileType = MetadataForm.apiFileTypes[getFileExtension(file.name)]
    }
    if (!fileType) fileType = 'application/octet-stream'
    const uuid = uuidv4()
    const media = new MediaFile(
      uuid,
      file.name,
      undefined,
      undefined,
      {
        created: date,
        updated: date,
      },
      {
        url: pathJoin(mediaUrl, 'download', uuid),
        interface_contract: 'dwnl',
      },
      fileType,
      file.size,
      undefined
    )
    media.file = file
    return media
  }

  /** @return true if has a file attached, false otherwise */
  hasFileAttached = () => !!this.file?.size

  /**
   * Return a new File
   * @param {CryptoKey} publicKey used to encrypt
   * @param {String} publicPEM the PEM-encode public key
   * @param {String} publicKeyName the name of the key
   */
  async encrypt(publicKey, publicPEM, publicKeyName) {
    if (this.encrypted) return
    this.encrypted = true
    this.file = await encryptRsaOaepAesGcm(this.file, publicKey)
    const originalType = this.type
    this.type = originalType + '+crypt'
    this.size = this.file.size
    this.name = this.name + '+crypt'
    this.connector.interface_contract = 'dwnl'
    const pubPemFirstLine = publicPEM.match(/([\w/\\+]+\n)/g)[0].slice(0, 64)
    this.connector.connector_parameters = []
    this.connector.connector_parameters.push(
      { key: 'encrypted', value: true, type: 'BOOLEAN' },
      { key: 'pub_key_cut', value: pubPemFirstLine, type: 'STRING' },
      { key: PROP_PUB_KEY_NAME, value: publicKeyName, type: 'STRING' },
      { key: 'original_mime_type', value: originalType, type: 'STRING' },
      { key: 'encrypted_mime_type', value: this.type, type: 'STRING' }
    )
  }

  /**
   * Compute the checksum of this MediaFile
   * @param {String} algo can be 'SHA-1' 'SHA-256' 'SHA-384' 'SHA-512'
   */
  async computeChecksum(algo) {
    // Make a digest of the file and build the hexadecimal string
    if (!crypto?.subtle) {
      console.info('Crypto.subtle is available in https context only, filling with a dummy hash')
      this.checksum = { algo, hash: 'toBe2186bb13eabf0bc49eaa22ee08d52166' } // md5('NoHashFunctionAvailable')
      return this.checksum
    }
    try {
      const digest = await crypto.subtle.digest(algo, await this.file.arrayBuffer())
      const hash = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('')
      this.checksum = { algo, hash }
    } catch (e) {
      console.error('An error occurred while computing the hash:', e)
      this.checksum = { algo, hash: 'toBe2186bb13eabf0bc49eaa22ee08d52166' } // md5('NoHashFunctionAvailable')
    }
    return this.checksum
  }

  /** Override the JSON generated for this object */
  toJSON() {
    return {
      media_type: 'FILE',
      media_id: this.media_id,
      media_name: this.media_name,
      media_caption: this.media_caption,
      media_visual: this.media_visual,
      media_dates: this.media_dates,
      connector: this.connector,
      file_type: this.file_type,
      file_size: this.file_size,
      checksum: this.checksum,
      file_encoding: this.file_encoding,
      file_structure: this.file_structure,
      file_storage_status: this.file_storage_status,
      file_status_update: this.file_status_update,
    }
  }
}

/** The object representing services for rudi resources */
class MediaService {
  constructor(uuid, media_name, media_caption, media_visual, media_dates, connector) {
    this.media_id = uuid || uuidv4()
    this.media_name = media_name
    this.media_caption = media_caption
    this.media_visual = media_visual
    this.media_dates = media_dates
    this.connector = connector
    this.connector.interface_contract = 'dwnl'
  }

  static fromService(service) {
    return new MediaService(
      0,
      service.media_name,
      service.media_caption,
      service.media_visual,
      service.media_dates,
      service.connector
    )
  }

  /**
   * Create a new instance of AvailableFormat from a litteral object
   * @param {Object} media an AvailableFormat litteral object
   * @returns a new instance of AvailableFormat
   */
  static fromLitteral(media) {
    return new MediaService(
      media.media_id || uuidv4(),
      media.media_name,
      media.media_caption,
      media.media_visual,
      media.media_dates,
      media.connector
    )
  }

  /** Override the JSON generated for this object */
  toJSON() {
    return {
      media_type: 'SERVICE',
      media_id: this.media_id,
      media_name: this.media_name,
      media_caption: this.media_caption,
      media_visual: this.media_visual,
      media_dates: this.media_dates,
      connector: this.connector,
    }
  }
}

// window.testvalue = {
//   other_value: 'still there ?',
//   test_2: {
//     something: 'here',
//     array: ['whey', 'not', '?']
//   },
//   array: [1, 2, 3, 4, 5],
//   global_id: '783f2c4a-ed99-42ce-86e4-63956624242c',
//   local_id: 'Test de données',
//   resource_title: 'Test de donnée 1',
//   synopsis: [
//     {
//       lang: 'fr',
//       text: 'z^àife_zyf_zegf'
//     },
//     {
//       lang: 'cs',
//       text: 'feçzufeçzç'
//     }
//   ],
//   summary: [
//     {
//       lang: 'fr',
//       text: 'Test de donnée description',
//       autre: 'test'
//     }
//   ],
//   theme: 'society',
//   keywords: 'test',
//   producer: {
//     organization_id: '085da795-5551-4c1d-a924-51a56afc0ec4',
//     organization_name: 'Aucun contact'
//   },
//   contacts: [
//     {
//       contact_id: '8a6c1499-e5c1-4581-815a-bbd4d97c33d9',
//       contact_name: 'Aucun contact',
//       email: 'aucun_contact@rennes.fr'
//     }
//   ],
//   available_formats: [
//     {
//       media_type: 'SERVICE',
//       media_id: '0f86dfee-d774-4416-b5c0-7cd40ff0397a',
//       media_name: 'test1',
//       media_caption: 'cpaiton',
//       connector: {
//         url: 'url1'
//       }
//     }
//   ],
//   resource_languages: ['fr'],
//   dataset_dates: {
//     created: '2022-04-08',
//     updated: '2022-04-08'
//   },
//   storage_status: 'pending',
//   access_condition: {
//     licence: {
//       licence_type: 'STANDARD',
//       licence_label: 'mit'
//     }
//   },
//   metadata_info: {
//     api_version: '1.2.0'
//   }
// }

// window.geotest = {
//   global_id: '0a7ef526-5085-46cf-b6d2-526fe03b44b1',
//   resource_languages: ['fr'],
//   geography: {
//     bounding_box: {
//       west_longitude: -1.7045974731445315,
//       east_longitude: -1.6331863403320315,
//       north_latitude: 48.13035667153536,
//       south_latitude: 48.10420799710039
//     },
//     geographic_distribution: {
//       type: 'Feature',
//       properties: {},
//       geometry: {
//         type: 'Polygon',
//         coordinates: [
//           [
//             [-1.704597, 48.104208],
//             [-1.704597, 48.130357],
//             [-1.633186, 48.130357],
//             [-1.633186, 48.104208],
//             [-1.704597, 48.104208]
//           ]
//         ]
//       }
//     },
//     projection: 'WGS 84'
//   },
//   dataset_dates: {
//     created: '2022-07-01',
//     updated: '2022-07-01'
//   },
//   storage_status: 'pending',
//   metadata_info: { api_version: '1.3.0' }
// }
