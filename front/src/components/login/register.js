import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './login.css';
import PropTypes from 'prop-types';
import axios from 'axios';
import GenericModal, { useGenericModal, useGenericModalOptions } from '../modals/genericModal';

export const btnColor = 'warning';
export const btnText = 'Créer un compte';

export const showPill = (condition, showState) =>
  condition ? (
    <div className={'login-pill text-bg-' + btnColor} onClick={showState}>
      {btnText}
    </div>
  ) : (
    ''
  );

/**
 * Register component
 * @param {*} param0 (token hooks)
 * @return {ReactNode} Register html component
 */
export default function Register({ backToLogin }) {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { toggle, visible } = useGenericModal();
  const { options, changeOptions } = useGenericModalOptions();

  /**
   * is form valid?
   * @return {Boolean} return true is the form is valid
   */
  const isFormValid = () => username.length > 0 && password.length > 0;

  /**
   * call server to Register user
   * @param {*} credentials
   * @return {Promise} Register promise
   */
  const registerUser = (credentials) =>
    axios.post(`api/v1/register`, JSON.stringify(credentials), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  /**
   * handle submit Register form
   * @param {*} event
   */
  function handleSubmit(event) {
    event.preventDefault();
    registerUser({
      username,
      email,
      password,
      confirmPassword,
    })
      .then((res) => {
        changeOptions({
          text: [`L'utilisateur '${res.data.username}' a bien été créé.`],
          title: 'Action Validée',
          type: 'success',
          buttons: [
            {
              text: 'Connexion',
              action: () => {
                backToLogin();
              },
            },
          ],
        });
        toggle();
      })
      .catch((error) => {
        changeOptions({
          text: ['' + error.response.data],
          title: 'Une erreur est survenue',
          type: 'error',
          buttons: [
            {
              text: 'Ok',
              action: () => {},
            },
          ],
        });
        toggle();
      });
  }

  const formGroup = (id, label, val, type, onChangeMethod, hasFocus) => {
    return (
      <div className="login-form">
        <Form.Group size="lg" controlId={id}>
          <Form.Label>{label}</Form.Label>
          <Form.Control
            autoFocus={hasFocus}
            type={type}
            value={val}
            onChange={(e) => onChangeMethod(e.target.value)}
          />
        </Form.Group>
      </div>
    );
  };

  return (
    <div className="Login">
      <GenericModal
        visible={visible}
        toggle={toggle}
        options={options}
        animation={false}
      ></GenericModal>
      <Form onSubmit={handleSubmit}>
        {formGroup('username', 'Nom', username, 'text', setUserName, true)}
        {formGroup('email', 'E-mail', email, 'text', setEmail)}
        {formGroup('password', 'Mot de passe', password, 'password', setPassword)}
        {formGroup(
          'confirmPassword',
          'Confirmation du mot de passe',
          confirmPassword,
          'password',
          setConfirmPassword,
        )}
        <div className="login-button">
          <Button type="submit" variant={btnColor} disabled={!isFormValid()}>
            {btnText}
          </Button>
        </div>
      </Form>
    </div>
  );
}
Register.propTypes = {
  backToLogin: PropTypes.func.isRequired,
};
