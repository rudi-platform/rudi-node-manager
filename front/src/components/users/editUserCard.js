import React, { useContext, useState } from 'react'
import { Plus, Pencil, Trash } from 'react-bootstrap-icons'
import PropTypes from 'prop-types'
import axios from 'axios'
import { ModalContext, getOptOk, getOptConfirm } from '../modals/modalContext'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import AddUserModal, {
  useAddUserInfoModal,
  useAddUserInfoModalOptions,
} from '../modals/addUserModal'
import EditUserModal, {
  useEditUserInfoModal,
  useEditUserInfoModalOptions,
} from '../modals/editUserModal'

const urlUser = 'api/secu/users'
const urlRoles = 'api/secu/roles'
const deleteConfirmMsg = (id) => `Confirmez vous la suppression de l'utilisateur ${id}?`
const deleteMsg = (id) => `L'utilisateur ${id} a été supprimé`

EditUserCard.propTypes = {
  formUrl: PropTypes.string,
  refresh: PropTypes.func,
}

/**
 * Composant : EditCard
 * @return {ReactNode}
 */
export default function EditUserCard({ refresh }) {
  const { changeOptions, toggle } = useContext(ModalContext)
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const [editId, setUser] = useState('')
  const { isVisibleAddModal, toggleAddModal } = useAddUserInfoModal()
  const { addModalOptions, changeAddModalOptions } = useAddUserInfoModalOptions()

  const { isVisibleEditModal, toggleEditModal } = useEditUserInfoModal()
  const { editModalOptions, changeEditModalOptions } = useEditUserInfoModalOptions()

  /**
   * met a jour le state lors de la modification de l'input de modification de JDD
   * @param {*} event event
   * @return {void}
   */
  const handleChange = (event) => setUser(event.target.value)

  /**
   * call for user deletion
   */
  const deleteUser = () => {
    if (!editId) return
    axios
      .delete(`${urlUser}/${editId}`)
      .then((res) => {
        const options = getOptOk(deleteMsg(editId), () => refresh())
        changeOptions(options)
        toggle()
      })
      .catch((err) => defaultErrorHandler(err))
  }

  const createNewUser = () => {
    axios
      .get(urlRoles)
      .then((res) => {
        changeAddModalOptions({ roles: res.data })
        toggleAddModal()
        refresh()
      })
      .catch((err) => defaultErrorHandler(err))
  }

  const editUser = () => {
    if (!editId) return
    axios
      .get(urlUser(id))
      .then((user) => {
        console.info('T (editUser)',user)
        axios
          .get(urlRoles)
          .then((res) => {
            changeEditModalOptions({ user, roles: res.data })
            toggleEditModal()
            refresh()
          })
          .catch((err) => defaultErrorHandler(err))
      })
      .catch((err) => defaultErrorHandler(err))
  }

  /**
   * call for confirmation before organization deletion
   */
  function triggerDeleteUser() {
    const options = getOptConfirm(deleteConfirmMsg(editId), () => deleteUser())
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
                value={editId}
                onChange={handleChange}
              />
              <button type="button" className="btn btn-warning" onClick={() => editUser()}>
                <Pencil />
              </button>
              <button type="button" className="btn btn-danger" onClick={() => triggerDeleteUser()}>
                <Trash />
              </button>
            </div>
            <AddUserModal
              visible={isVisibleAddModal}
              toggleEdit={toggleAddModal}
              options={addModalOptions}
              roles={addModalOptions.roles}
              refresh={refresh}
            ></AddUserModal>
            <EditUserModal
              visible={isVisibleEditModal}
              toggleEdit={toggleEditModal}
              options={editModalOptions}
              user={editId}
              roles={editModalOptions.roles}
              refresh={refresh}
            ></EditUserModal>
          </div>
        </div>
      </div>
    </div>
  )
}
