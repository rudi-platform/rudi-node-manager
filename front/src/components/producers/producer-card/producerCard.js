import axios from 'axios'
import PropTypes from 'prop-types'
import { useContext, useEffect, useState } from 'react'
import { ArrowRepeat, DashLg, Pencil, Plus, Trash } from 'react-bootstrap-icons'
import { BackConfContext } from '../../../context/backConfContext'
import useDefaultErrorHandler from '../../../utils/useDefaultErrorHandler'
import DetachProducerModal, { useDetachProducerModal } from '../../modals/detachProducerModal'
import GenericModal, { useGenericModal, useGenericModalOptions } from '../../modals/genericModal'
import { getOptConfirm, getOptOk } from '../../modals/genericModalContext'
import { Loader } from '../../other/loader/loader'
import { useNotification } from '../../toasts/toastContext'
import './producerCard.scss'

//  Validation + attachment statuses
export const UNSET = 'UNSET'
export const DRAFT = 'DRAFT'
export const IN_PROGRESS = 'IN_PROGRESS'
export const CANCELLED = 'CANCELLED'
export const VALIDATED = 'VALIDATED'
export const DISENGAGED = 'DISENGAGED'
export const DETACH_IN_PROGRESS = 'DETACH_IN_PROGRESS'

ProducerCard.prototype = {
  editMode: PropTypes.bool,
  producer: PropTypes.object,
  deleteUrl: PropTypes.func,
  refresh: PropTypes.func,
  attachUrl: PropTypes.func,
}

export function ProducerCard({ editMode, producer, deleteUrl, refresh, attachUrl }) {
  // ----- Error handler
  const { defaultErrorHandler } = useDefaultErrorHandler()

  // ----- Back conf
  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  const [isEdit, setIsEdit] = useState(!!editMode)

  // ----- Portal-related elements
  const [portalConnected, setPortalConnected] = useState(true)

  const [hideEdit, setHideEdit] = useState(true)

  // ----- Automatic updates
  useEffect(() => {
    setBack(backConf)
    setPortalConnected(backConf?.isLoaded && backConf.portalConnected)
  }, [backConf])

  useEffect(() => setIsEdit(!!editMode), [editMode])

  useEffect(
    () =>
      setHideEdit(
        backConf?.isLoaded &&
          backConf.portalConnected &&
          ![DRAFT, VALIDATED, undefined].includes(producer?.organization_status)
      ),
    [backConf, producer]
  )

  // ----- Modals / UI
  const { options, changeOptions } = useGenericModalOptions()
  const { toggle, visible } = useGenericModal()
  const { isVisibleDetachModal, toggleDetachModal } = useDetachProducerModal()
  const { notify, notifySuccess, notifyWarning, notifyError } = useNotification()

  const getFormProducer = (producer, query) => back?.isLoaded && back.getConsole(producer, query)

  // ----- Buttons
  const [showAttachButton, setShowAttachButton] = useState(!!attachUrl)
  const [attachLoading, setAttachLoading] = useState(false)
  const [hasPendingTask, setHasPendingTask] = useState(producer?.linked_producer_status === DETACH_IN_PROGRESS)
  useEffect(() => setHasPendingTask(producer?.linked_producer_status === DETACH_IN_PROGRESS), [producer])

  const producerId = producer?.organization_id
  const producerName = producer?.organization_name
  const displayFields = {
    organization_id: "Identifiant de l'organisation",
    organization_caption: 'Nom complet',
    organization_summary: 'Description',
    organization_address: 'Adresse',
  }
  const deleteConfirmMsg = (name, id) => `Confirmez vous la suppression du producteur\n'${name}'\n(${id})?`
  const deleteMsg = (name, id) => `Le producteur '${name}' (${id}) a été supprimé`

  const getPortalOrgsUrl = (...args) => back?.isLoaded && back.getBackCatalog('portal/organizations', ...args)
  const detachOrgUrl = (id) => getPortalOrgsUrl(id, 'detach')
  const hasTaskOrgUrl = (id) => getPortalOrgsUrl(id, 'has_task')

  const updateOrgFromPortal = (id) => {
    axios
      .get(getPortalOrgsUrl(id))
      .then(() => refresh())
      .catch((err) => defaultErrorHandler(err))
  }

  /**
   * Call for organization deletion
   * @param {*} id Identifier of the object to delete
   */
  const deleteProducer = (name, id) => {
    axios
      .delete(deleteUrl(id))
      .then(() => {
        changeOptions(getOptOk(deleteMsg(name, id), () => refresh()))
        toggle()
      })
      .catch((err) => defaultErrorHandler(err))
  }

  const attachProducer = (id) => {
    setAttachLoading(true)
    setShowAttachButton(false)
    axios
      .get(attachUrl(id))
      .then(() => {
        setAttachLoading(false)
        notifySuccess('Tâche effectuée avec succès. Votre demande de rattachement est soumise à modération auprès des équipes Rudi.')
      })
      .catch(() => {
        notify(
          <span>
            Une erreur est survenue. Veuillez relancer la procédure. Si l&apos;erreur persiste, merci de contacter l&apos;équipe technique{' '}
            <a href="https://rudi.fr/?contact" target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>
              en cliquant ici
            </a>
          </span>,
          'danger'
        )

        // An error occurred, hide the attach button
        // The page must be reloaded to display the current status of the organization
        setShowAttachButton(false)
        setAttachLoading(false)
      })
  }

  const detachProducer = (id) => {
    axios
      .get(detachOrgUrl(id))
      .then(() => {
        setHasPendingTask(true)
        notifySuccess("Votre demande a bien été soumise à l'équipe administrative du portail.")
        refresh()
      })
      .catch((err) => {
        // On error, display a generic error message unless it's a 409 meaning a request is already pending
        if (err?.response?.status === 409) {
          notifyWarning('Une demande est déjà en cours pour cette organisation.')
        } else {
          defaultErrorHandler(
            'Une erreur est survenue. Veuillez consulter le rapport au sein de votre espace "Rapport portail" disponible depuis votre onglet "Admin".'
          )
        }
      })
  }

  const checkOrgHasTaskThenDetach = (id) => {
    axios
      .get(hasTaskOrgUrl(id))
      .then((res) => {
        if (res.data) {
          notifyWarning('Une demande est déjà en cours pour cette organisation.')
        } else {
          toggleDetachModal()
        }
      })
      .catch(() => toggleDetachModal())
  }

  /**
   * call for confirmation before organization deletion
   * @param {*} id Identifier of the organization to delete
   */
  const triggerDeleteProducer = (name, id) => {
    changeOptions(getOptConfirm(deleteConfirmMsg(producerName, producerId), () => deleteProducer(name, id)))
    toggle()
  }

  const displayEditButton = (hideEdit) =>
    hideEdit ? (
      <button type={'button'} className={'btn primary-btn btn-rudi'} disabled={hideEdit}>
        <Pencil />
      </button>
    ) : (
      <a
        href={getFormProducer('organizations', `update=${producerId}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-warning btn-rudi "
      >
        <Pencil />
      </a>
    )

  const displayDeleteButton = (hideEdit) =>
    hideEdit ? (
      <button type={'button'} className={'btn primary-btn btn-rudi'} disabled={hideEdit}>
        <Trash />
      </button>
    ) : (
      <button
        type={'button'}
        className="btn btn-danger btn-rudi "
        onClick={() => triggerDeleteProducer(producerName, producerId)}
        disabled={hideEdit}
      >
        <Trash />
      </button>
    )

  const displayValidationStatus = (organizationStatus) => {
    switch (organizationStatus) {
      case DRAFT:
        if (!portalConnected) return ''
        return displaySpan('rudi', 'En attente de validation')
      case IN_PROGRESS:
        return displaySpan('rudi', 'En attente de validation')
      case CANCELLED:
        return displaySpan('danger', 'Refusé')
      case VALIDATED:
        return displaySpan('rudi', 'Validé')
      case DISENGAGED:
        if (!portalConnected) return ''
        return displaySpan('muted', 'Archivé')
      default:
        return ''
    }
  }
  const displayAttachmentStatus = (attachmentStatus) => {
    switch (attachmentStatus) {
      case DRAFT:
        if (!portalConnected) return ''
        return displaySpan('rudi', 'Rattachement en attente')
      case IN_PROGRESS:
        return displaySpan('rudi', 'Rattachement en attente')
      case CANCELLED:
        return displaySpan('danger', 'Rattachement refusé')
      case VALIDATED:
        return displaySpan('rudi', 'Rattaché')
      case DETACH_IN_PROGRESS:
        return displaySpan('rudi', 'Détachement en attente de validation')
      case DISENGAGED:
        if (!portalConnected) return ''
        return displaySpan('rudi', 'Détaché')
      default:
        return ''
    }
  }

  const displaySpan = (level, text) => (
    <span className={'status-pill text-bg-' + level} id="status-pill">
      {text}
    </span>
  )

  const displayAttachButton = () => {
    return (
      <button type={'button'} className={'btn primary-btn'} onClick={() => attachProducer(producerId)}>
        Demander le rattachement <Plus />
      </button>
    )
  }

  return (
    <div className="col-12" key={producerId}>
      <GenericModal visible={visible} toggle={toggle} options={options} animation={false}></GenericModal>
      <DetachProducerModal
        visible={isVisibleDetachModal}
        toggle={toggleDetachModal}
        onConfirm={() => detachProducer(producerId)}
      />
      <div className="card card-margin">
        <h5 className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <a>{producerName}</a>
            <span className={'align-pill-right '}>
              {producer?.organization_status &&
                producer?.linked_producer_status !== DISENGAGED &&
                displayValidationStatus(producer.organization_status)}
              {producer?.linked_producer_status && displayAttachmentStatus(producer.linked_producer_status)}
            </span>
            {isEdit && (
              <div>
                {portalConnected && (
                  <div className="btn-group" role="group">
                    <button
                      type={'button'}
                      className={'btn primary-btn btn-rudi'}
                      onClick={() => updateOrgFromPortal(producerId)}
                    >
                      <ArrowRepeat />
                    </button>
                    <button
                      type={'button'}
                      className={'btn btn-detach'}
                      onClick={() => checkOrgHasTaskThenDetach(producerId)}
                      disabled={hasPendingTask || producer?.linked_producer_status !== VALIDATED}
                    >
                      <DashLg />
                    </button>
                  </div>
                )}
                <div className="btn-group margin-left " role="group">
                  {displayEditButton(hideEdit)}
                  {displayDeleteButton(hideEdit)}
                </div>
              </div>
            )}
            {portalConnected && showAttachButton && !producer?.linked_producer_status && displayAttachButton()}
            {attachLoading && (
              <div className="outer-loader-container" role="status">
                <Loader size={'sm'} fullScreen={false}></Loader>
              </div>
            )}
          </div>
        </h5>
        <div className="card-body">
          {Object.keys(displayFields).map(
            (key) =>
              producer[key] && (
                <p className="card-text" key={`${producerId}.${key}`}>
                  {displayFields[key]}&nbsp;:&nbsp;
                  <small className="text-muted">
                    {!Array.isArray(producer[key]) ? producer[key] : JSON.stringify(producer[key])}
                  </small>
                </p>
              )
          )}
        </div>
      </div>
    </div>
  )
}
