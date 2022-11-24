/* eslint-disable no-unused-vars */
import axios from 'axios'
import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'

import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import InputGroup from 'react-bootstrap/InputGroup'

import { ModalContext, getOptOk } from './ModalContext'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import { VALID_EMAIL, VALID_NOT_EMPTY_WORD } from './validation'

const urlUserRoles = 'api/secu/user-roles'
const urlUser = 'api/secu/users'
const modalTitle = 'Modifier l‘utilisateur'
const modalSubmitBtnTxt = 'Sauver'

const validation = {
  username: [VALID_NOT_EMPTY_WORD],
  email: [VALID_EMAIL],
}

// const defaultState = {
//   name: '',
//   email: '',
//   password: '',
//   nameError: '',
//   emailError: '',
//   passwordError: '',
// };

EditUserModal.propTypes = {
  visible: PropTypes.bool,
  toggleEdit: PropTypes.func,
  user: PropTypes.object,
  roles: PropTypes.array,
}

/**
 * EditRoleModal component
 * @param {*} props Modal properties
 * @return {ReactNode} EditRoleModal html component
 */
export default function EditUserModal({ visible, toggleEdit, user, roles }) {
  const { changeOptions, toggle } = useContext(ModalContext)
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const originalUserInfo = { id: user.id, email: user.email, username: user.username }
  const [userInfo, setUserInfo] = useState(user)
  const [touched, setTouched] = useState({})
  const [validated, setValidated] = useState(false)

  const hasErrors = (prop, val) => {
    if (!val) val = userInfo[prop]
    if (prop === 'roles') {
      return !(Array.isArray(val) && val.length > 0) ? 'Au moins un rôle doit être défini' : false
    }
    if (!val) return 'Ce champ est requis'
    let isInvalid
    validation[prop]?.map((valid) => {
      if (!`${val}`.match(valid[0])) isInvalid = valid[1].replace('{VALUE}', val)
    })
    return isInvalid
  }

  const [errors, setErrors] = useState({
    username: hasErrors('username'),
    email: hasErrors('email'),
    roles: hasErrors('role'),
  })

  const editUserInfo = (prop, val) => {
    setErrors((errors) => {
      return { ...errors, [prop]: hasErrors(prop, val) }
    })
    setValidated(isValid())
    setTouched((touched) => {
      return { ...touched, [prop]: true }
    })
    setUserInfo((userInfo) => {
      return { ...userInfo, [prop]: val }
    })
  }
  const isValid = (prop) =>
    !prop ? !errors.username && !errors.email && !errors.roles : !errors[prop]

  const show = (obj, option = 2) => {
    try {
      return `${JSON.stringify(obj, null, option).replace(/\\"/g, '"')}${
        option != null ? '\n' : ''
      }`
    } catch (err) {
      return `${obj}`
    }
  }

  const isInUserRole = (role, rolesList) =>
    !!(rolesList && rolesList.findIndex((element) => element === role.role) >= 0)

  const handleChange = (event) => {
    const prop = event.target.id
    const val = event.target.value
    console.log('(handleChange)', prop, '=>', val)

    editUserInfo(prop, val)

    if (errors[prop]) console.error('(handleChange) errorDetected:', errors[prop])

    // editErrors(prop, validateProp(prop, val));
    // console.log('(handleChange)', errors[prop]);

    // setValidated(!errors?.length);
    // console.log('(user)', show(user));
    console.log('(handleChange) userInfo after:', show(userInfo))

    // userInfo[prop] = val;
    // editUserInfo(prop, val);
    // changeOptions();
  }

  const handleRoleChange = (event) => {
    const toggledRole = event.target.id
    const userRoles = userInfo.roles
    let nextUserRoles
    if (!userRoles || userRoles.length == 0) {
      nextUserRoles = [toggledRole]
    } else {
      nextUserRoles = []
      let wasFound = false
      userRoles.map((actualRole) => {
        // console.log(actualRole)
        if (actualRole !== toggledRole) nextUserRoles.push(actualRole)
        else wasFound = true // toggledRole is skipped
      })
      if (!wasFound) nextUserRoles.push(toggledRole)
    }
    // console.log('(handleRoleChange) usrRoles:', userRoles, '=>', nextUserRoles)
    editUserInfo('roles', nextUserRoles)
  }
  // const hasError = (prop) => validateProp(prop, userInfo[prop]);

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.target
    console.log('(handleSubmit)', 'username:', event.target.username.value)
    console.log('(handleSubmit)', 'email:', event.target.email.value)
    console.log('(handleSubmit)', 'userInfo:', userInfo)
    if (form.checkValidity() === false) {
      event.stopPropagation()
    }
    if (isValid()) {
      await updateUserInfo(userInfo)
      toggleEdit()
    }
  }

  /**
   * call for user_role deletion
   * @param {*} role role
   * @param {*} user utilisateur
   */
  const updateUserInfo = async () => {
    const res = await axios.put(`${urlUser}`, userInfo)
    console.log(res.data)
  }
  // function removeUserRole(role, user) {
  //   axios
  //     .delete(`${urlUserRoles}/${user.id}/${role.role}`)
  //     .then((res) => {
  //       user.roles.splice(
  //         user.roles.findIndex((element) => element === role.role),
  //         1
  //       )
  //       const options = getOptOk(
  //         `Le role ${role.role} a été supprimé pour l'utilisateur ${user.username}`
  //       )
  //       changeOptions(options)
  //       toggle()
  //     })
  //     .catch((e) => defaultErrorHandler(e))
  // }

  /**
   * call for user_role addition
   * @param {*} role role
   * @param {*} user utilisateur
   */
  // function assignUserRole(role, user) {
  //   axios
  //     .post(urlUserRoles, JSON.stringify({ userId: user.id, role: role.role }), {
  //       headers: { 'Content-Type': 'application/json' },
  //     })
  //     .then((res) => {
  //       if (!user.roles) user.roles = []
  //       user.roles.push(role.role)
  //       const options = getOptOk(
  //         `Le role ${role.role} a été ajouté à l'utilisateur ${user.username}`
  //       )
  //       changeOptions(options)
  //       toggle()
  //     })
  //     .catch((e) => defaultErrorHandler(e))
  // }

  return (
    <Modal show={visible} onHide={toggleEdit} animation={false}>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Form.Group as={Col} id="formName" controlId="username">
              <Form.Label>Nom</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  required
                  type="text"
                  placeholder="Nom"
                  defaultValue={user?.username}
                  onChange={handleChange}
                  isValid={isValid('username')}
                  isInvalid={hasErrors('username')}
                />
                <Form.Control.Feedback type="invalid" tooltip>
                  {errors.username}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group as={Col} id="formEmail" controlId="email">
              <Form.Label>E-mail</Form.Label>
              <InputGroup hasValidation>
                <Form.Control
                  required
                  type="text"
                  placeholder="e-mail"
                  defaultValue={userInfo?.email}
                  onChange={handleChange}
                  isValid={isValid('email')}
                  isInvalid={hasErrors('email')}
                />
                <Form.Control.Feedback type="invalid" tooltip>
                  {errors.email}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          </Row>
          <Row className="mb-3">
            <Form.Group className="mb-1" id="formRoles" controlId="roles">
              <Form.Label>Rôles</Form.Label>
              <InputGroup hasValidation>
                {roles &&
                  roles.map((role) => (
                    <Form.Check
                      key={role.role}
                      label={`${role.role} (${role.desc})`}
                      id={role.role}
                      defaultChecked={isInUserRole(role, user.roles)}
                      value={isInUserRole(role, userInfo.roles)}
                      onChange={handleRoleChange}
                      isInvalid={hasErrors('roles')}
                    />
                  ))}
                <Form.Control.Feedback type="invalid" tooltip>
                  {errors.roles}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>{' '}
          </Row>
          <Row>
            <Form.Group as={Col}>
              <p className="card-text on-right">
                id : <small className="text-muted">{user?.id}</small>
              </p>
            </Form.Group>
            {/* <pre>{JSON.stringify(userInfo, null, 2)}</pre>
            <pre>{!isValid() ? JSON.stringify(errors, null, 2) : ''}</pre> */}
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
  )
}

export const useEditUserInfoModal = () => {
  const [visible, setVisible] = useState(false)
  /**
   * toggle l'affichage de la modal
   * @return {void}
   */
  const toggleEdit = () => setVisible(!visible)
  return { visible, toggleEdit }
}

export const useEditUserInfoModalOptions = () => {
  const [options, setOptions] = useState({})
  /**
   * change la valeur des options
   * @param {*} param nouvelles options
   * @return {void}
   */
  const changeOptionsEdit = (param) => setOptions(param)
  return { options, changeOptionsEdit }
}
