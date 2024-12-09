import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
import ObjCatalogue from './objCatalogue'

CatalogueContact.propTypes = {
  editMode: PropTypes.bool,
}

/**
 * Composant : CatalogueContact
 * @return {void}
 */
export default function CatalogueContact({ editMode }) {
  const [isEdit, setIsEdit] = useState(!!editMode)
  useEffect(() => setIsEdit(!!editMode), [editMode])

  return (
    <ObjCatalogue
      editMode={isEdit}
      objType="contacts"
      propId="contact_id"
      propName="contact_name"
      propNamesToDisplay={{
        contact_id: 'contact_id',
        organisation: 'organization_name',
        role: 'rôle',
        email: 'e-mail',
      }}
      propSortBy="-updatedAt"
      btnTextAdd="Ajouter un contact"
      btnTextChg="Modifier un contact :"
      deleteConfirmMsg={(id) => `Confirmez vous la suppression du contact ${id}?`}
      deleteMsg={(id) => `Le contact ${id} a été supprimé`}
    />
  )
}
