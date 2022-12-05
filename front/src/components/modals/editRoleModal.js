import axios from 'axios'

import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'

import { Plus, Trash } from 'react-bootstrap-icons'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

import { ModalContext, DefaultOkOption } from './genericModalContext'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'

const urlUserRoles = 'api/secu/user-roles'

EditRoleModal.propTypes = {
  visible: PropTypes.bool,
  toggleEdit: PropTypes.func,
  options: PropTypes.object,
}

/**
 * EditRoleModal component
 * param {*} param0 (token hooks)
 * @return {ReactNode} EditRoleModal html component
 */
export default function EditRoleModal({ visible, toggleEdit, options }) {
  const { changeOptions, toggle } = useContext(ModalContext)
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const isInUserRole = (role, user) =>
    user.roles ? user.roles.findIndex((element) => element === role.role) : -1

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
          1
        )
        const options = DefaultOkOption
        options.text = [`Le role ${role.role} a été supprimé pour l'utilisateur ${user.username}`]
        changeOptions(options)
        toggle()
      })
      .catch((err) => defaultErrorHandler(err))
  }

  /**
   * call for user_role addition
   * @param {*} role role
   * @param {*} user utilisateur
   */
  function assignUserRole(role, user) {
    axios
      .post(
        urlUserRoles,
        JSON.stringify({ userId: user.id, role: role.role, username: user.username }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
      .then((res) => {
        if (!user.roles) user.roles = []
        user.roles.push(role.role)
        const options = DefaultOkOption
        options.text = [`Le role ${role.role} a été ajouté à l'utilisateur ${user.username}`]
        changeOptions(options)
        toggle()
      })
      .catch((err) => defaultErrorHandler(err))
  }

  return (
    <Modal show={visible} onHide={toggleEdit} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>Edition des rôles pour {options.user?.username}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {options.roles &&
          options.roles.map((role, i) => {
            return (
              <span key={i}>
                {isInUserRole(role, options.user) < 0 && (
                  <Button variant="light" onClick={() => assignUserRole(role, options.user)}>
                    {role.role}
                    <Plus color="green" />
                  </Button>
                )}
                {isInUserRole(role, options.user) >= 0 && (
                  <Button variant="light" onClick={() => removeUserRole(role, options.user)}>
                    {role.role} <Trash color="red" />
                  </Button>
                )}
              </span>
            )
          })}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => toggleEdit()}>
          Terminer
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
export const useEditRoleModal = () => {
  const [visible, setVisible] = useState(false)
  /**
   * toggle l'affichage de la modal
   * @return {void}
   */
  const toggleEdit = () => setVisible(!visible)
  return { toggleEdit, visible }
}

export const useEditRoleModalOptions = () => {
  const [options, setOptions] = useState({})
  /**
   * change la valeur des options
   * @param {*} param nouvelles options
   * @return {void}
   */
  const changeOptionsEdit = (param) => setOptions(param)
  return { changeOptionsEdit, options }
}
