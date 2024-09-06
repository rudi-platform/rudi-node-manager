import PropTypes from 'prop-types'
import React from 'react'
import ObjCatalogue from './objCatalogue'

CataloguePubKeys.propTypes = {
  editMode: PropTypes.bool,
  logout: PropTypes.func,
}

/**
 * Composant : CataloguePubKeys
 * @return {void}
 */
export default function CataloguePubKeys({ editMode, logout }) {
  return (
    <ObjCatalogue
      editMode={editMode}
      objType="pub_keys"
      propId="name"
      propName="name"
      logout={logout}
      propNamesToDisplay={{
        url: 'url',
        prop: 'prop',
        pem: 'pem',
        key: 'key',
        type: 'type',
      }}
      propSortBy="-updatedAt"
      btnTextAdd="Ajouter une clé publique"
      btnTextChg="Modifier une clé publique :"
      deleteConfirmMsg={(id) => `Confirmez-vous la suppression de la clé publique ${id}?`}
      deleteMsg={(id) => `La clé publique ${id} a été supprimée`}
    />
  )
}
