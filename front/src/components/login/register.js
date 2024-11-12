import axios from 'axios'

import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { Eye, EyeSlash } from 'react-bootstrap-icons'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'

import GenericModal, { useGenericModal, useGenericModalOptions } from '../modals/genericModal'
import './login.css'

export const btnColor = 'warning'
export const btnText = 'Créer un compte'

export const showPill = (condition, showState) =>
  condition ? (
    <div className={'login-pill text-bg-' + btnColor} onClick={showState}>
      {btnText}
    </div>
  ) : (
    ''
  )

Register.propTypes = {
  backToLogin: PropTypes.func.isRequired,
}

/**
 * Register component
 * @param {*} param0 (token hooks)
 * @return {ReactNode} Register html component
 */
export default function Register({ backToLogin }) {
  // const { defaultErrorHandler } = useDefaultErrorHandler()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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
   * call server to Register user
   * @param {*} credentials
   * @return {Promise} Register promise
   */
  const registerUser = (credentials) =>
    axios.post(`api/front/register`, JSON.stringify(credentials), {
      headers: { 'Content-Type': 'application/json' },
    })

  const displayMsgForAccountCreated = () => {
    changeOptions({
      text: ['Contactez l‘administrateur pour la validation de votre compte'],
      title: 'Action Validée',
      type: 'success',
      buttons: [{ text: 'Connexion', action: () => backToLogin() }],
    })
    toggle()
  }
  /**
   * handle submit Register form
   * @param {*} event
   */
  const handleSubmit = (event) => {
    event.preventDefault()
    registerUser({ username, email, password, confirmPassword })
      .then(displayMsgForAccountCreated)
      .catch(displayMsgForAccountCreated)
  }

  const formGroup = (id, label, val, type, onChangeMethod, autoCompl, hasFocus) => {
    return (
      <div className="login-form">
        <Form.Group size="lg" controlId={id}>
          <Form.Label>{label}</Form.Label>
          <Form.Control
            autoFocus={hasFocus}
            type={type}
            value={val}
            autoComplete={autoCompl}
            onChange={(e) => onChangeMethod(e.target.value)}
          />
        </Form.Group>
      </div>
    )
  }

  const inputPassword = (id, label, password, setPassword) => {
    return (
      <div className="login-form">
        <Form.Group size="lg" controlId={id}>
          <Form.Label>{label}</Form.Label>
          <InputGroup className="login-pwd">
            <Form.Control
              type={stateType()}
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="warning" id={`button-${id}`} onClick={togglePwdVisibility}>
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
        {formGroup('username', 'Nom', username, 'text', setUsername, 'username', true)}
        {formGroup('email', 'E-mail', email, 'text', setEmail, 'email')}
        {inputPassword('pwd', 'Mot de passe', password, setPassword)}
        {inputPassword('pwd2', 'Confirmation du mot de passe', confirmPassword, setConfirmPassword)}
        <div className="login-button">
          <Button type="submit" variant={btnColor} disabled={!isFormValid()}>
            {btnText}
          </Button>
        </div>
      </Form>
    </div>
  )
}
