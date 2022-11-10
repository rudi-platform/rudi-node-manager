import React, { useState } from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import './login.css';
import PropTypes from 'prop-types';
import axios from 'axios';
import GenericModal, { useGenericModal, useGenericModalOptions } from '../modals/genericModal';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import Button from 'react-bootstrap/esm/Button';

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

  const [isPwdShown, setPasswordShown] = useState(false);
  const togglePwdVisibility = () => setPasswordShown(!isPwdShown);
  const stateType = () => (isPwdShown ? 'text' : 'password');

  const { toggle, visible } = useGenericModal();
  const { options, changeOptions } = useGenericModalOptions();

  /**
   * is form valid?
   * @return {Boolean} return true is the form is valid
   */
  // const isFormValid = () => username.length > 0 && password.length > 0;

  /**
   * call server to log user
   * @param {*} credentials
   * @return {Promise} login promise
   */
  const loginUser = (credentials) =>
    axios
      .post(`api/front/login`, JSON.stringify(credentials), {
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

  const inputPassword = () => {
    return (
      <div className="login-form">
        <Form.Group size="lg" controlId="pwd">
          <Form.Label>Mot de passe</Form.Label>
          <InputGroup className="mt-3">
            <Form.Control
              type={stateType()}
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="warning" id="button-addon2" onClick={togglePwdVisibility}>
              {isPwdShown ? <Eye></Eye> : <EyeSlash></EyeSlash>}
            </Button>
          </InputGroup>
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
        <div className="login-form">
          <Form.Group size="lg" controlId="usr">
            <Form.Label>Nom</Form.Label>
            <Form.Control
              autoFocus={true}
              type="text"
              value={username}
              autoComplete="username"
              onChange={(e) => setUserName(e.target.value)}
            />
          </Form.Group>
        </div>
        {inputPassword()}
      </Form>
    </div>
  );
}
Login.propTypes = {
  setToken: PropTypes.func.isRequired,
};
