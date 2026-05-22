import PropTypes from 'prop-types'
import React, { useState } from 'react'

import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

export const useDetachProducerModal = () => {
  const [isVisibleDetachModal, setIsVisibleDetachModal] = useState(false)
  const toggleDetachModal = () => setIsVisibleDetachModal(!isVisibleDetachModal)
  return { isVisibleDetachModal, toggleDetachModal }
}

DetachProducerModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  toggle: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
}

export default function DetachProducerModal({ visible, toggle, onConfirm }) {
  const handleConfirm = () => {
    onConfirm()
    toggle()
  }

  return (
    <Modal show={visible} onHide={toggle} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>Retirer l&apos;organisation</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Vous vous apprêtez à détacher l&apos;organisation de votre noeud producteur. Vous ne pourrez plus publier de
          jeux de données au nom de cette organisation.
        </p>
        <p>La demande sera soumise à modération auprès de l&apos;équipe administrative du portail.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-dark" onClick={toggle}>
          Annuler
        </Button>
        <Button variant="primary" style={{ border: 'none' }} onClick={handleConfirm}>
          Confirmer
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
