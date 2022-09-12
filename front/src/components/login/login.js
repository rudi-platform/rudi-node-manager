import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import './login.css';
import PropTypes from 'prop-types';
import axios from 'axios';
import GenericModal, { useGenericModal, useGenericModalOptions } from '../modals/genericModal';

export const btnColor = 'success';
export const btnText = 'Accéder à l‘application';

export const showPill = (condition, showState) =>
  condition ? (
    <div className={'login-pill text-bg-' + btnColor} onClick={showState}>
      {btnText}
    </div>
  ) : (
    ''
  );

/**
 * Login component
 * @param {*} param0 (token hooks)
 * @return {ReactNode} Login html component
 */
export default function Login({ setToken }) {
  // console.log('-- Login');

  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');

  const { toggle, visible } = useGenericModal();
  const { options, changeOptions } = useGenericModalOptions();

  /**
   * is form valid?
   * @return {Boolean} return true is the form is valid
   */
  const isFormValid = () => username.length > 0 && password.length > 0;

  /**
   * call server to log user
   * @param {*} credentials
   * @return {Promise} login promise
   */
  const loginUser = (credentials) =>
    axios
      .post(`api/v1/login`, JSON.stringify(credentials), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .catch((error) => {
        const errMsg =
          error.response?.data == 'No user found'
            ? 'Utilisateur ou mot de passe incorrect'
            : `Echec de connexion`;
        changeOptions({
          text: [errMsg],
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

  /**
   * handle submit login form
   * @param {*} event
   */
  function handleSubmit(event) {
    // console.log('-- handleSubmit');
    event.preventDefault();
    loginUser({
      username,
      password,
    }).then((res) => {
      // console.log('-- handleSubmit res: ' + JSON.stringify(res));
      setToken();
    });
  }

  return (
    <div className="Login">
      <GenericModal
        visible={visible}
        toggle={toggle}
        options={options}
        animation={false}
      ></GenericModal>
      <Form onSubmit={handleSubmit}>
        <div className="login-form">
          <Form.Group size="lg" controlId="usr">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              autoFocus
              type="text"
              value={username}
              autoComplete="username"
              onChange={(e) => setUserName(e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="login-form">
          <Form.Group size="lg" controlId="pwd">
            <Form.Label>Mot de passe</Form.Label>
            <Form.Control
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
        </div>
        <div className="login-button">
          <Button type="submit" variant={btnColor} disabled={!isFormValid()}>
            {btnText}
          </Button>
        </div>
      </Form>
    </div>
  );
}
Login.propTypes = {
  setToken: PropTypes.func.isRequired,
};
