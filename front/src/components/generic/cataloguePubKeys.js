import React from 'react'
import PropTypes from 'prop-types'
import ObjCatalogue from './objCatalogue'

CataloguePubKeys.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
}

/**
 * Composant : CataloguePubKeys
 * @return {void}
 */
export default function CataloguePubKeys({ display, specialSearch, editMode }) {
  return (
    <ObjCatalogue
      display={display}
      specialSearch={specialSearch}
      editMode={editMode}
      formUrlObj="pub_keys"
      propId="name"
      propName="name"
      propNamesToDisplay={{
        url: 'url',
        prop: 'prop',
        pem: 'pem',
        key: 'key',
        type: 'type',
      }}
      btnTextAdd="Ajouter une clé publique"
      btnTextChg="Modifier une clé publique :"
      deleteConfirmMsg={(id) => `Confirmez vous la suppression de la clé publique ${id}?`}
      deleteMsg={(id) => `La clé publique ${id} a été supprimé`}
    />
  )
}
