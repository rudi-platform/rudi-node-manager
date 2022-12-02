import React from 'react'
import PropTypes from 'prop-types'
import ObjCatalogue from './objCatalogue'

CatalogueContact.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
}

/**
 * Composant : CatalogueContact
 * @return {void}
 */
export default function CatalogueContact({ display, specialSearch, editMode }) {
  return (
    <ObjCatalogue
      display={display}
      specialSearch={specialSearch}
      editMode={editMode}
      formUrlObj="contacts"
      propId="contact_id"
      propName="contact_name"
      propNamesToDisplay={{
        contact_id: 'contact_id',
        organisation: 'organization_name',
        role: 'rôle',
        email: 'e-mail',
      }}
      btnTextAdd="Ajouter un contact"
      btnTextChg="Modifier un contact :"
      deleteConfirmMsg={(id) => `Confirmez vous la suppression du contact ${id}?`}
      deleteMsg={(id) => `Le contact ${id} a été supprimé`}
    />
  )
}
