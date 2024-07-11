'use strict'

import { HttpRequest } from './Http.js'
import { STYLE_THN } from './Rudi.js'
import {
  generateRsaOaepKeyPair,
  privateCryptoKeyToPem,
  publicCryptoKeyToPem,
} from './RudiCrypto.js'
import { RudiObjForm } from './rudiObj.js'

/**
 * JS code for the organization form page
 * @author Olivier Martineau
 */

export class RudiKeyForm extends RudiObjForm {
  constructor(language) {
    super(language, 'pub_keys', 'name', this.getUrlLocal('templates/publicKey.json'))
  }

  /**
   * Update the form in function of its current state to hide and display
   * inputs and values
   */
  async updateKeyDisplay() {
    const here = 'updateKeyDisplay'
    if (
      this.customForm.hasAttribute('readonly') ||
      this.customForm.htmlController.switch.value != 'URL'
    )
      return

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

  async prefill() {
    const here = 'prefill'
    if (!this.template) return this.fail('fill_template')
    if (!this.customForm?.htmlController) return this.fail('fill_form')

    await this.getEditModeAndFillData(this.objType)
    this.ok(here, 'getEditModeAndFillData')

    // Enable dev paste
    this.devPaste()
    this.ok(here, 'devPaste')

    this.addMessage('Saisie', STYLE_THN)

    this.customForm.htmlController.switch.addEventListener('change', () => {
      this.customForm.htmlController.pem.value = ''
      this.updateKeyDisplay()
    })
    this.customForm.htmlController.url.addEventListener('change', () => this.updateKeyDisplay())
    this.customForm.htmlController.prop.addEventListener('change', () => this.updateKeyDisplay())

    // Set listener for submit event
    this.customForm.htmlController.submit_btn.addEventListener('click', this.submitListener)
  }

  treatOutputValue = async (outputValue) => {
    const here = 'treatOutputValue'
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
      return outputValue
    }
  }
  submitListener = () =>
    super.submitListener(async (outputvalue) => this.treatOutputValue(outputvalue))

  // Function to download data to a file
  download(data, filename, type) {
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
  publish = (data) => super.publish(data, true)

  static async loadForm() {
    const rudiObj = new RudiKeyForm('fr', 'pub_key')
    await rudiObj.init()
    await rudiObj.loadForm()
  }
}
RudiKeyForm.loadForm()
