'use strict'

/**
 * JS code for a generic RUDI object form page
 * @author Florian Desmortreux, Olivier Martineau
 */

// ---- IMPORT ----
import '../lib/HtmlFormTemplate.js'
import '../lib/MaterialInputs.js'

import { JsonHttpRequest } from './Http.js'
import { RudiForm, STYLE_NRM, STYLE_THN } from './Rudi.js'
import { generateRsaOaepKeyPair, privateCryptoKeyToPem, publicCryptoKeyToPem } from './RudiCrypto.js'
import { uuidv4 } from './utils.js'

export class RudiObjForm extends RudiForm {
  constructor(language, objType, idField, templatePath) {
    // const here = `[RudiObj.${objType}]`
    super(language)

    this.objType = objType
    this.idField = idField || `${this.objType.endsWith('s') ? this.objType.slice(0, -1) : this.objType}_id`
    this.templatePath = templatePath || `templates/${this.objType}.json`
  }

  async getTemplate() {
    const here = 'getTemplate'
    try {
      this.template = await this.getLocal(this.templatePath)
      this.ok(here, 'templatePath:', this.templatePath)
    } catch {
      this.ko(here)
      this.template = null
      this.fail('get_template')
    }
  }

  /**
   * Load a template in the form
   * @param {Promise} template the promise of the template
   * @param {String} language the language for the form
   * @returns the loaded template
   */
  async prefill() {
    const here = 'prefill'
    if (!this.template) return this.fail('fill_template')
    if (!this.customForm?.htmlController) return this.fail('fill_form')

    // Set defaults values
    this.customForm.htmlController[this.idField].value = uuidv4()
    this.ok(here, 'uuidv4')

    await this.getEditModeAndFillData(this.objType)
    this.ok(here, 'getEditModeAndFillData')

    // Enable dev paste
    this.devPaste()
    this.ok(here, 'devPaste')

    this.addMessage('Saisie', STYLE_THN)

    // Set listener for submit event
    this.customForm.htmlController.submit_btn.addEventListener('click', () => this.submitListener())
    this.ok(here, 'addEventListener')

    this.addMessage(this.lexR['form/start'], STYLE_THN)
    this.ok(here)
  }

  async submitListener(treatOutputValue) {
    const here = 'submitListener'
    try {
      if (this.isDev) console.log('Submiting...')
      this.addMessage('Envoi en cours', STYLE_NRM)
      let outputValue = this.getValue()
      if (!outputValue) {
        console.error('Submit Fail : incorrect value')
        this.addErrorMsg('Formulaire incorrect, l‘une des contraintes n‘est pas respectée.')

        return
      }

      if (treatOutputValue) await treatOutputValue(outputValue)
      if (this.isDev) console.log('outputValue:', outputValue)

      await this.publish(outputValue)
      this.ok(here)
    } catch (e) {
      this.ko(here)
      console.error(e)
      this.fail('critic')
    }
  }

  async publish(data, shouldUpdateFinalForm = false) {
    const here = 'publish'
    const isUpdate = this.state == 'edit'
    const submitFunction = isUpdate ? JsonHttpRequest.put : JsonHttpRequest.post
    try {
      const response = await submitFunction(this.getUrlBackCatalog(this.objType), this.pmHeaders).sendJson(data)
      console.log(this.objType, 'sent. Response:', response)

      this.end()
      if (shouldUpdateFinalForm) this.setValue(response, true)

      this.ok(here)
    } catch (e) {
      this.ko(here, e)
      try {
        const err = JSON.parse(e.responseText)
        console.error('SEND ERROR :\n', err.moreInfo.message)
        this.addErrorMsg(err.moreInfo.message)
      } catch (e) {
        if (this.isDev) console.error(e)
        console.error(e?.responseText)
        this.fail('critic')
      }
    }
  }

  async loadForm() {
    const here = 'loadForm'
    if (this.state == 'fail' || this.state == 'critic') return
    try {
      await this.init()
      this.ok(here, 'init')

      await this.getTemplate()
      this.ok(here, 'getTemplate')

      this.load()
      this.ok(here, 'load')

      await this.prefill()
      this.ok(here, 'prefill')

      window.rudi_form = this
      this.ok(here)
    } catch (e) {
      this.ko(here)
      if (this.isDev) console.error('ERF02 rudiForm', e)
      this.addErrorMsg(e)
      console.error(e)
    }
  }
}

export class RudiOrgForm extends RudiObjForm {
  constructor(language) {
    super(language, 'organizations')
  }

  static async loadForm() {
    const rudiObj = new RudiOrgForm('fr')
    await rudiObj.loadForm()
  }
}

export class RudiContactForm extends RudiObjForm {
  constructor(language) {
    super(language, 'contacts')
  }

  static async loadForm() {
    const rudiObj = new RudiContactForm('fr')
    await rudiObj.loadForm()
  }
}

export class RudiKeyForm extends RudiObjForm {
  constructor(language) {
    super(language, 'pub_keys', 'name')
  }

  /**
   * Update the form in function of its current state to hide and display
   * inputs and values
   */
  async updateKeyDisplay() {
    const here = 'updateKeyDisplay'
    if (this.customForm.hasAttribute('readonly') || this.customForm.htmlController.switch.value != 'URL') return

    // Clear display
    this.customForm.htmlController.pem.value = ''

    // Try get url
    let res
    let url = this.customForm.htmlController.url.value
    if (url) {
      try {
        res = await HttpRequest.get(url).send()
      } catch (e) {
        this.ko(here, e)
        this.customForm.htmlController.url.toggleAttribute('error', false)
        return
      }
    }

    // Try parse json
    try {
      const jsonRes = JSON.parse(res)
      this.ok(here, 'json:', jsonRes)
      let prop = this.customForm.htmlController.prop.value
      const key = prop ? jsonRes[prop] : JSON.stringify(jsonRes, null, 4)
      this.customForm.htmlController.pem.value = key
      this.customForm.htmlController.prop.toggleAttribute('hidden', false)
      this.ok(here)
    } catch {
      this.customForm.htmlController.prop.value = ''
      this.customForm.htmlController.pem.value = res
      this.customForm.htmlController.prop.toggleAttribute('hidden', true)
    }
  }

  treatOutputValue = async (outputValue) => {
    const here = 'treatOutputValue'
    // console.trace(here, 'outputValue:', outputValue)
    if (!outputValue.pem) {
      this.ok(here, 'Generating key pair...')
      let keyPair = await generateRsaOaepKeyPair(4096, 'SHA-256')
      let [publicPEM, privatePEM] = await Promise.all([
        publicCryptoKeyToPem(keyPair.publicKey),
        privateCryptoKeyToPem(keyPair.privateKey),
      ])
      this.download(privatePEM, `${outputValue.name}.prv`, 'application/x-pem-file')

      outputValue = {
        name: outputValue.name,
        pem: publicPEM,
      }
      // console.trace('T pubKey outputValue:', outputValue)
    }
    return outputValue
  }
  submitListener = () => super.submitListener(async (outputvalue) => this.treatOutputValue(outputvalue))

  // Function to download data to a file
  download(data, filename, type) {
    // console.trace('T pubKey download filename:', filename)
    const file = new Blob([data], { type: type })
    const a = document.createElement('a')
    const url = URL.createObjectURL(file)
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(function () {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 0)
  }

  publish = (data) => super.publish(data, false)

  static async loadForm() {
    const rudiObj = new RudiKeyForm('fr')
    await rudiObj.loadForm()
    await rudiObj.init()
    rudiObj.customForm.htmlController.switch.addEventListener('change', () => {
      rudiObj.customForm.htmlController.pem.value = ''
      rudiObj.updateKeyDisplay()
    })
    rudiObj.customForm.htmlController.url.addEventListener('change', () => rudiObj.updateKeyDisplay())
    rudiObj.customForm.htmlController.prop.addEventListener('change', () => rudiObj.updateKeyDisplay())
  }
}

switch (document.title) {
  case 'Rudi Contact':
    RudiContactForm.loadForm()
    break
  case 'Rudi Producer':
    RudiOrgForm.loadForm()
    break
  case 'Rudi Public Key':
    RudiKeyForm.loadForm()
    break
  default:
    console.log('document title should be "Rudi Contact", "Rudi Producer" or "Rudi Public Key", got:', document.title)
}
