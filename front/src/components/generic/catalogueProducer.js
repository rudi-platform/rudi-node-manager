import React from 'react'
import PropTypes from 'prop-types'
import ObjCatalogue from './objCatalogue'

CatalogueProducer.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
}

/**
 * Composant : CatalogueProducer
 * @return {void}
 */
export default function CatalogueProducer({ display, specialSearch, editMode }) {
  return (
    <ObjCatalogue
      display={display}
      specialSearch={specialSearch}
      editMode={editMode}
      formUrlObj="organizations"
      propId="organization_id"
      propName="organization_name"
      propNamesToDisplay={{
        organization_id: 'organization_id',
      }}
      btnTextAdd="Ajouter un producteur"
      btnTextChg="Modifier un producteur :"
      deleteConfirmMsg={(id) => `Confirmez vous la suppression du producteur ${id}?`}
      deleteMsg={(id) => `Le producteur ${id} a été supprimé`}
    />
  )
}
