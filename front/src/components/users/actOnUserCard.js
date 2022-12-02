import axios from 'axios'

import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Plus } from 'react-bootstrap-icons'
// import { Plus, Pencil, Trash } from 'react-bootstrap-icons'

import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import { ModalContext, getOptOk, getOptConfirm } from '../modals/genericModalContext'
import AddUserModal, { useAddUserModal } from '../modals/addUserModal'
import EditUserModal, { useEditUserModal, useEditUserModalOptions } from '../modals/editUserModal'

const urlUser = (username) => `api/secu/users/${username}`
const deleteConfirmMsg = (id) => `Confirmez vous la suppression de l'utilisateur '${id}'?`
const deleteMsg = (id) => `L'utilisateur '${id}' a été supprimé`

ActOnUserCard.propTypes = {
  roleList: PropTypes.array.isRequired,
  refresh: PropTypes.func.isRequired,
}

/**
 * Composant : EditCard
 * @return {ReactNode}
 */
export default function ActOnUserCard({ roleList, refresh }) {
  const { changeOptions, toggle } = useContext(ModalContext)
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const [username, setUsername] = useState('')
  const { editModalOptions, changeEditModalOptions } = useEditUserModalOptions()

  const { isVisibleAddModal, toggleAddModal } = useAddUserModal()
  const { isVisibleEditModal, toggleEditModal } = useEditUserModal()

  /**
   * met a jour le state lors de la modification de l'input de modification de JDD
   * @param {*} event event
   * @return {void}
   */
  const handleChange = (event) => setUsername(event.target.value)

  /**
   * call for user deletion
   */
  const deleteUser = () => {
    if (!username) return
    axios
      .get(urlUser(username))
      .catch((err) => defaultErrorHandler(err))
      .then((res) => {
        const user = res?.data
        const userId = user?.id
        if (!userId) return defaultErrorHandler(`L'utilisateur n'a pas été trouvé: '${username}'`)
        axios
          .delete(urlUser(userId))
          .catch((err) => defaultErrorHandler(err))
          .then((res) => {
            const options = getOptOk(deleteMsg(username), () => refresh())
            changeOptions(options)
            toggle()
          })
      })
  }

  const createNewUser = () => {
    toggleAddModal()
    refresh()
  }

  // eslint-disable-next-line
  const editUser = () => {
    if (!username) return
    axios
      .get(urlUser(username))
      .then((res) => {
        const user = res?.data
        changeEditModalOptions(user)
        // console.log('T (editUser) opts', editModalOptions)
        toggleEditModal()
        refresh()
      })
      .catch((err) => defaultErrorHandler(err))
  }

  /**
   * call for confirmation before organization deletion
   */
  // eslint-disable-next-line
  function triggerDeleteUser() {
    const options = getOptConfirm(deleteConfirmMsg(username), () => deleteUser())
    changeOptions(options)
    toggle()
  }
  return (
    <div className="col-12">
      <div className="card edit-card-margin">
        <div className="card-body">
          <div className="inline">
            <a className="btn btn-secondary" onClick={() => createNewUser()}>
              Ajouter un utilisateur <Plus />
            </a>
          </div>

          <div className="inline card-text on-right">
            Modifier un utilisateur&nbsp;:&nbsp;
            <div className="btn-group" role="group">
              <input
                type="text"
                className="form-control"
                placeholder="nom"
                value={username}
                onChange={handleChange}
              />
              {/*
              <button type="button" className="btn btn-warning" onClick={() => editUser()}>
                <Pencil />
              </button>
              <button type="button" className="btn btn-danger" onClick={() => triggerDeleteUser()}>
                <Trash />
              </button>
              */}
            </div>
            <AddUserModal
              roleList={roleList}
              visible={isVisibleAddModal}
              toggleEdit={toggleAddModal}
              refresh={refresh}
            ></AddUserModal>
            <EditUserModal
              user={editModalOptions}
              roleList={roleList}
              visible={isVisibleEditModal}
              toggleEdit={toggleEditModal}
              refresh={refresh}
            ></EditUserModal>
          </div>
        </div>
      </div>
    </div>
  )
}
