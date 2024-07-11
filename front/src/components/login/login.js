import './login.css'

import axios from 'axios'

import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Eye, EyeSlash } from 'react-bootstrap-icons'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Button from 'react-bootstrap/esm/Button'

import { BackConfContext } from '../../context/backConfContext.js'
import GenericModal, { useGenericModal, useGenericModalOptions } from '../modals/genericModal'

export const btnColor = 'success'
export const btnText = 'Accéder à l‘application'

export const showPill = (condition, showState) =>
  condition && (
    <div className={'login-pill text-bg-' + btnColor} onClick={showState}>
      {btnText}
    </div>
  )

const ACCOUNT_VALIDATION_MSG = [
  'Ce compte utilisateur requiert une validation : ',
  'veuillez contacter l‘administrateur de votre nœud Rudi pour qu‘il assigne un rôle à votre compte utilisateur.',
]

Login.propTypes = { updateToken: PropTypes.func.isRequired }

/**
 * Login component
 * @param {*} param0 (token hooks)
 * @return {ReactNode} Login html component
 */
export default function Login({ updateToken }) {
  const { backConf } = useContext(BackConfContext)

  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  // const { defaultErrorHandler } = useDefaultErrorHandler()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const togglePwdVisibility = () => setIsPasswordShown(!isPasswordShown)
  const stateType = () => (isPasswordShown ? 'text' : 'password')

  const { toggle, visible } = useGenericModal()
  const { options, changeOptions } = useGenericModalOptions()

  /**
   * is form valid?
   * @return {Boolean} return true is the form is valid
   */
  const isFormValid = () => username.length > 0 && password.length > 0

  /**
   * call server to log user
   * @param {*} credentials
   * @return {Promise} login promise
   */
  const loginUser = async (credentials) =>
    back?.isLoaded &&
    axios.post(back.getBackFront('login'), JSON.stringify(credentials), {
      headers: { 'Content-Type': 'application/json' },
    })

  /**
   * handle submit login form
   * @param {*} event
   */
  const handleSubmit = (event) => {
    event.preventDefault()
    loginUser({ username: username, password })
      .then(() => updateToken())
      .catch((error) => {
        const errMsg = error.response?.data?.startsWith('Admin validation required for user')
          ? ACCOUNT_VALIDATION_MSG
          : ['Utilisateur ou mot de passe incorrect']

        changeOptions({
          text: errMsg,
          title: 'Une erreur est survenue',
          type: 'error',
          buttons: [{ text: 'Ok', action: () => {} }],
        })
        toggle()
      })
  }

  const inputPassword = () => {
    return (
      <div className="login-form">
        <Form.Group size="lg" controlId="pwd">
          <Form.Label>Mot de passe</Form.Label>
          <InputGroup className="login-pwd">
            <Form.Control
              type={stateType()}
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="warning" id="button-addon2" onClick={togglePwdVisibility}>
              {isPasswordShown ? <Eye></Eye> : <EyeSlash></EyeSlash>}
            </Button>
          </InputGroup>
        </Form.Group>
      </div>
    )
  }

  return (
    <div className="Login">
      <GenericModal visible={visible} toggle={toggle} options={options} animation={false}></GenericModal>
      <Form onSubmit={handleSubmit}>
        <div className="login-form">
          <Form.Group size="lg" controlId="usr">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              autoFocus={true}
              type="text"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </Form.Group>
        </div>
        {inputPassword()}
        <div className="login-button">
          <Button type="submit" variant={btnColor} disabled={!isFormValid()}>
            {btnText}
          </Button>
        </div>
      </Form>
    </div>
  )
}
