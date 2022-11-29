import React from 'react'
import { ArrowCounterclockwise, Pencil, Trash } from 'react-bootstrap-icons'
import PropTypes from 'prop-types'
import axios from 'axios'

import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import { ModalContext, getOptOk, getOptConfirm } from '../modals/modalContext'
import EditUserModal, {
  useEditUserInfoModal,
  useEditUserInfoModalOptions,
} from '../modals/editUserModal'

const resetPwdConfirmMsg = (id) =>
  `Confirmez vous la réinitialisation du mot de passe de l'utilisateur ${id}?`
const resetPwdCaption =
  `L'utilisateur devra utiliser l'invite "Modifier le mot de passe" pour changer son mot de passe. ` +
  `Le champ "mot de passe actuel" pourra être un simple espace`

const resetPwdMsg = (id) => `Le mot de passe de l'utilisateur ${id} a été réinitialisé.\n\nplou`

const resetPasswordUrl = (id) => `api/front/users/${id}/reset-password`

const deleteConfirmMsg = (id) => `Confirmez vous la suppression de l'utilisateur ${id}?`
const deleteMsg = (id) => `L'utilisateur ${id} a été supprimé`
const deleteUrl = (id) => `api/secu/users/${id}`
// put('/users/:id/reset-password'
/**
 * Composant : UserCard
 * @return {ReactNode}
 */
export default function UserCard({ user, display, refresh }) {
  const { changeOptions, toggle } = React.useContext(ModalContext)
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const { isVisibleEditModal, toggleEditModal } = useEditUserInfoModal()
  const { editModalOptions, changeEditModalOptions } = useEditUserInfoModalOptions()

  /**
   * call for user deletion
   * @param {*} user utilisateur
   */
  const deleteUser = (user) =>
    axios
      .delete(deleteUrl(user.id))
      .then((res) => {
        changeOptions(getOptOk(deleteMsg(user.username), () => refresh()))
        toggle()
      })
      .catch((err) => defaultErrorHandler(err))

  /**
   * call for confirmation before user deletion
   * @param {*} user user a suppr
   */
  const triggerDeleteUser = (user) => {
    changeOptions(getOptConfirm(deleteConfirmMsg(user.username), () => deleteUser(user)))
    toggle()
  }

  /**
   * Call for reseting a user's password
   * @param {*} user The user info
   * @returns
   */
  const resetPassword = (user) =>
    axios
      .put(resetPasswordUrl(user.id))
      .then((res) => {
        changeOptions(getOptOk(resetPwdMsg(user.username), () => refresh(), resetPwdCaption))
        toggle()
      })
      .catch((err) => defaultErrorHandler(err))

  /**
   * call for confirmation before resetting user password
   * @param {*} user user a suppr
   */
  const triggerResetPwd = (user) => {
    changeOptions(getOptConfirm(resetPwdConfirmMsg(user.username), () => resetPassword(user)))
    toggle()
  }

  /**
   * call for user update
   * @param {*} user utilisateur
   */
  const updateUser = (user) => {
    axios
      .get(`api/secu/roles`)
      .then((res) => {
        changeEditModalOptions({ user, roles: res.data })
        toggleEditModal()
        refresh()
      })
      .catch((err) => defaultErrorHandler(err))
  }

  return (
    <div className="col-12" key={user.id}>
      <div className="card card-margin">
        <h5 className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            {user.username}
            <div className="btn-group" role="group">
              <button type="button" className="btn btn-warning" onClick={() => updateUser(user)}>
                <Pencil />
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => triggerResetPwd(user)}
              >
                <ArrowCounterclockwise />
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => triggerDeleteUser(user)}
              >
                <Trash />
              </button>
            </div>
            <EditUserModal
              visible={isVisibleEditModal}
              toggleEdit={toggleEditModal}
              options={editModalOptions}
              user={user}
              roles={editModalOptions.roles}
              refresh={refresh}
            ></EditUserModal>
          </div>
        </h5>
        <div className="card-body">
          <p className="card-text">
            id&nbsp;: <small className="text-muted">{user.id}</small>
          </p>{' '}
          <p className="card-text">
            e-mail&nbsp;: <small className="text-muted">{user.email}</small>
          </p>
          {user.roles && (
            <p className="card-text">
              {user.roles.map((role, i) => (
                <span key={`${i}`} className="badge rounded-pill text-bg-success">
                  {role}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
UserCard.propTypes = {
  user: PropTypes.object,
  display: PropTypes.object,
  refresh: PropTypes.func,
}
