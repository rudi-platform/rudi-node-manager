import axios from 'axios'

import React, { useContext, useEffect, useState } from 'react'

import PropTypes from 'prop-types'

import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'

import { BackConfContext } from '../../context/backConfContext.js'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler.js'
import { VALID_EMAIL, VALID_NOT_EMPTY_USERNAME } from './validation.js'

export const useEditUserModal = () => {
  const [isVisibleEditModal, setIsVisibleEditModal] = useState(false)
  /**
   * toggle l'affichage de la modal
   * @return {void}
   */
  const toggleIsVisibleEditModal = () => setIsVisibleEditModal(!isVisibleEditModal)
  return { isVisibleEditModal, toggleEditModal: toggleIsVisibleEditModal }
}

export const useEditUserModalOptions = () => {
  const [editModalOptions, setEditModalOptions] = useState({})
  /**
   * change la valeur des options
   * @param {*} param nouvelles options
   * @return {void}
   */
  const changeEditModalOptions = (param) => setEditModalOptions(param)
  return { editModalOptions, changeEditModalOptions }
}

EditUserModal.propTypes = {
  user: PropTypes.object.isRequired,
  roleList: PropTypes.array.isRequired,
  visible: PropTypes.bool.isRequired,
  toggleEdit: PropTypes.func.isRequired,
  refresh: PropTypes.func.isRequired,
}

/**
 * EditUserModal component
 * @param {*} props Modal properties
 * @return {ReactNode} EditUserModal html component
 */
export default function EditUserModal({ user, roleList, visible, toggleEdit, refresh }) {
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const [userInfo, setUserInfo] = useState(user)

  const modalTitle = 'Modifier l‘utilisateur'
  const modalSubmitBtnTxt = 'Sauver'

  const validation = {
    username: [VALID_NOT_EMPTY_USERNAME],
    email: [VALID_EMAIL],
  }

  const hasErrors = (prop, val) => {
    if (!userInfo) return true
    if (!val) val = userInfo[prop]
    if (prop === 'roles') return !(Array.isArray(val) && val.length > 0) ? 'Au moins un rôle doit être défini' : false

    if (!val) {
      // console.error('T (hasErrors)', prop, user[prop])
      return 'Ce champ est requis'
    }
    let isInvalid
    validation[prop]?.map((valid) => {
      if (!RegExp(valid[0]).exec(`${val}`)) isInvalid = valid[1].replace('{VALUE}', val)
    })
    return isInvalid
  }

  const [errors, setErrors] = useState({
    username: hasErrors('username'),
    email: hasErrors('email'),
    roles: hasErrors('roles'),
  })
  const isValid = (prop) => (prop ? !errors[prop] : !errors.username && !errors.email && !errors.roles)

  const editUserInfo = (prop, val) => {
    setErrors((errors) => ({ ...errors, [prop]: hasErrors(prop, val) }))
    setUserInfo((userInfo) => ({ ...userInfo, [prop]: val }))
  }

  const isInUserRole = (userRoles, role) => userRoles?.findIndex((element) => element === role.role) >= 0

  const handleChange = (event) => {
    const prop = event.target.id
    const val = event.target.value
    editUserInfo(prop, val)
  }

  const handleRoleChange = (event) => {
    const toggledRole = event.target.id
    const userRoles = userInfo?.roles
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    // console.log('(handleSubmit)', 'username:', event.target.username.value)
    // console.log('(handleSubmit)', 'email:', event.target.email.value)
    // console.log('(handleSubmit)', 'userInfo:', userInfo)
    // if (!event.target.checkValidity()) event.stopPropagation()
    if (isValid()) {
      await sendUserInfo()
      toggleEdit()
      refresh()
    } else {
      console.warn('(handleSubmit)', 'userInfo:', userInfo)
      console.warn('(handleSubmit)', 'errors:', errors)
    }
  }

  /**
   * Update user information
   */

  const sendUserInfo = () =>
    (!userInfo && console.error('T (sendUserInfo) No user info!')) ||
    (back?.isLoaded && axios.put(back.getBackSecu('users'), userInfo).catch((err) => defaultErrorHandler(err)))

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
                  defaultValue={userInfo?.username}
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
                {roleList.map((role) => (
                  <Form.Check
                    key={role.role}
                    label={`${role.role} (${role.desc})`}
                    id={role.role}
                    defaultChecked={isInUserRole(userInfo?.roles, role)}
                    value={isInUserRole(userInfo?.roles, role)}
                    onChange={handleRoleChange}
                    isInvalid={hasErrors('roles')}
                  />
                ))}
                <Form.Control.Feedback type="invalid" tooltip>
                  {errors.roles}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          </Row>
          <Row>
            <Form.Group as={Col}>
              <p className="card-text on-right">
                id : <small className="text-muted">{userInfo?.id}</small>
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
