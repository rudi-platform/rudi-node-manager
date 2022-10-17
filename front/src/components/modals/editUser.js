/* eslint-disable no-unused-vars */
import axios from 'axios';
import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

import { ModalContext, getOptOk } from './ModalContext';
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler';
import { VALID_EMAIL, VALID_NOT_EMPTY_WORD } from './validation';

const urlUserRoles = 'api/v1/user-roles';
const modalTitle = 'Modifier l‘utilisateur';
const modalSubmitBtnTxt = 'Terminer';

const validation = {
  username: [VALID_NOT_EMPTY_WORD],
  email: [VALID_EMAIL],
};

const defaultState = {
  name: '',
  email: '',
  password: '',
  nameError: '',
  emailError: '',
  passwordError: '',
};

const hasErrors = (prop, val) => {
  let isInvalid;
  validation[prop]?.map((valid) => {
    if (!`${val}`.match(valid[0])) isInvalid = valid[1].replace('{VALUE}', val);
  });
  return isInvalid;
};
const show = (obj, option = 2) => {
  try {
    return `${JSON.stringify(obj, null, option).replace(/\\"/g, '"')}${option != null ? '\n' : ''}`;
  } catch (err) {
    return `${obj}`;
  }
};

EditUserModal.propTypes = {
  visible: PropTypes.bool,
  toggleEdit: PropTypes.func,
  user: PropTypes.object,
  roles: PropTypes.array,
};

/**
 * EditRoleModal component
 * @param {*} props Modal properties
 * @return {ReactNode} EditRoleModal html component
 */
export default function EditUserModal({ visible, toggleEdit, user, roles }) {
  const { changeOptions, toggle } = useContext(ModalContext);
  const { defaultErrorHandler } = useDefaultErrorHandler();

  const [validated, setValidated] = useState(false);
  const [userInfo, setUserInfo] = useState(user);
  const [userRoles, setUserRoles] = useState(user.roles);

  const editUserInfo = (prop, val) => {
    // console.log('(avant)', userInfo);
    // console.log('(avant)', prop, val);
    setUserInfo((state) => {
      return { ...state, [prop]: val };
    });
  };

  // const [errors, setErrors] = useState({});
  // const editErrors = (prop, val) =>
  //   val && setErrors((errors) => ({ ...errors, ...{ [prop]: val } }));

  const isInUserRole = (role, rolesList) =>
    !!(rolesList && rolesList.findIndex((element) => element === role.role) >= 0);

  // const handleClick = (event) => {
  //   const form = event.currentTarget;
  //   console.log('handleClick', event);
  //   if (form.checkValidity() === false) {
  //     event.preventDefault();
  //     event.stopPropagation();
  //   }

  //   setValidated(true);
  //   // toggleEdit()
  // };

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    console.log('(handleSubmit)', 'username:', event.target.username.value);
    console.log('(handleSubmit)', 'email:', event.target.email.value);
    console.log('(handleSubmit)', 'userInfo:', userInfo);
    if (form.checkValidity() === false) {
      event.stopPropagation();
    }

    // setValidated(true);
    // toggleEdit()
  };

  const handleChange = (event) => {
    const prop = event.target.id;
    const val = event.target.value;
    console.log('(handleChange)', prop, '=>', val);
    console.log('(handleChange)', hasErrors(prop, val));

    editUserInfo(prop, val);
    // editErrors(prop, validateProp(prop, val));
    // console.log('(handleChange)', errors[prop]);

    // setValidated(!errors?.length);
    // console.log('(user)', show(user));
    console.log('(user)', show(userInfo));

    // userInfo[prop] = val;
    // editUserInfo(prop, val);
    // changeOptions();
  };

  const handleRoleChange = (e) => {
    const prop = event.target.id;
    const val = event.target.value;
    console.log('(handleRoleChange)', name, ': ', prop, '=>', val);
    console.log('(handleRoleChange)', e);
    setUserRoles((userRoles) => {
      if (!userRoles) return [prop];
      const i = userRoles.indexOf(prop);
      if (i > -1) userRoles.splice(i, 1);
      else userRoles.push(prop);
      return userRoles;
    });
    console.log('(handleRoleChange)', userRoles);
  };
  // const hasError = (prop) => validateProp(prop, userInfo[prop]);

  /**
   * call for user_role deletion
   * @param {*} role role
   * @param {*} user utilisateur
   */
  function removeUserRole(role, user) {
    axios
      .delete(`${urlUserRoles}/${user.id}/${role.role}`)
      .then((res) => {
        user.roles.splice(
          user.roles.findIndex((element) => element === role.role),
          1,
        );
        const options = getOptOk(
          `Le role ${role.role} a été supprimé pour l'utilisateur ${user.username}`,
        );
        changeOptions(options);
        toggle();
      })
      .catch((e) => defaultErrorHandler(e));
  }

  /**
   * call for user_role addition
   * @param {*} role role
   * @param {*} user utilisateur
   */
  function assignUserRole(role, user) {
    axios
      .post(urlUserRoles, JSON.stringify({ userId: user.id, role: role.role }), {
        headers: { 'Content-Type': 'application/json' },
      })
      .then((res) => {
        if (!user.roles) user.roles = [];
        user.roles.push(role.role);
        const options = getOptOk(
          `Le role ${role.role} a été ajouté à l'utilisateur ${user.username}`,
        );
        changeOptions(options);
        toggle();
      })
      .catch((e) => defaultErrorHandler(e));
  }

  return (
    <Modal show={visible} onHide={toggleEdit} animation={false}>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Form.Group as={Col} id="formName" controlId="username">
              <Form.Label>Nom</Form.Label>
              <Form.Control
                required={true}
                type="text"
                placeholder="Nom"
                defaultValue={user?.username}
                onChange={handleChange}
                // isValid={hasErrors('username', username)}
                pattern={VALID_NOT_EMPTY_WORD[0]}
              />
              {/* <Form.Control.Feedback type="invalid">{errors?.username}</Form.Control.Feedback> */}
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} id="formEmail" controlId="email">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                required
                type="text"
                placeholder="e-mail"
                defaultValue={user?.email}
                onChange={handleChange}
                // isValid={!errors?.email}
              />
            </Form.Group>
            {/* <Form.Control.Feedback type="invalid">{errors?.email}</Form.Control.Feedback> */}
          </Row>
          <Row className="mb-3">
            <Form.Group className="mb-1" id="formRoles" controlId="roles">
              <Form.Label>Rôles</Form.Label>
              {roles &&
                roles.map((role, i) => (
                  <Form.Check
                    key={role.role}
                    label={`${role.role} (${role.desc})`}
                    id={role.role}
                    defaultChecked={isInUserRole(role, user.roles)}
                    value={isInUserRole(role, userRoles)}
                    onChange={handleRoleChange}
                  />
                ))}
            </Form.Group>{' '}
          </Row>
          <Row>
            <Form.Group as={Col}>
              <p className="card-text on-right">
                id : <small className="text-muted">{user?.id}</small>
              </p>
            </Form.Group>
            <pre>{JSON.stringify(user, null, 2)}</pre>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            type="submit"
            className="on-right"
            // onClick={handleClick}
            // onClick={() => toggleEdit()}
          >
            {modalSubmitBtnTxt}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export const useEditRoleModal = () => {
  const [visible, setVisible] = useState(false);
  /**
   * toggle l'affichage de la modal
   * @return {void}
   */
  const toggleEdit = () => setVisible(!visible);
  return { toggleEdit, visible };
};

export const useEditRoleModalOptions = () => {
  const [options, setOptions] = useState({});
  /**
   * change la valeur des options
   * @param {*} param nouvelles options
   * @return {void}
   */
  const changeOptionsEdit = (param) => setOptions(param);
  return { options, changeOptionsEdit };
};
