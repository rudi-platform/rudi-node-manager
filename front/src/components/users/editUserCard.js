import React, { useContext, useState } from 'react'
import { Plus, Pencil, Trash } from 'react-bootstrap-icons'
import PropTypes from 'prop-types'
import axios from 'axios'
import { ModalContext, getOptOk, getOptConfirm } from '../modals/modalContext'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import AddUserModal, { useAddUserInfoModal, useAddUserInfoModalOptions } from '../modals/addUserModal'

const urlUser = 'api/secu/users'
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

  const [editID, setEditID] = useState('')
  const { visible, toggleEdit } = useAddUserInfoModal()
  const { options, changeOptionsEdit } = useAddUserInfoModalOptions()

  /**
   * met a jour le state lors de la modification de l'input de modification de JDD
   * @param {*} event event
   * @return {void}
   */
  const handleChange = (event) => setEditID(event.target.value)

  /**
   * call for user deletion
   */
  const deleteUser = () => {
    if (!editID) return
    axios
      .delete(`${urlUser}/${editID}`)
      .then((res) => {
        const options = getOptOk(deleteMsg(editID), () => refresh())
        changeOptions(options)
        toggle()
      })
      .catch((err) => defaultErrorHandler(err))
  }

  const createNewUser = () => {
    axios
      .get(`api/secu/roles`)
      .then((res) => {
        changeOptionsEdit({ roles: res.data })
        toggleEdit()
        refresh()
      })
      .catch((err) => defaultErrorHandler(err))
  }

  /**
   * call for confirmation before organization deletion
   */
  function triggerDeleteUser() {
    const options = getOptConfirm(deleteConfirmMsg(editID), () => deleteUser())
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
                value={editID}
                onChange={handleChange}
              />
              <a className="btn btn-warning">
                <Pencil />
              </a>
              <button type="button" className="btn btn-danger" onClick={() => triggerDeleteUser()}>
                <Trash />
              </button>
            </div>
            <AddUserModal
              visible={visible}
              toggleEdit={toggleEdit}
              options={options}
              roles={options.roles}
              refresh={refresh}
            ></AddUserModal>
          </div>
        </div>
      </div>
    </div>
  )
}
