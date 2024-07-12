import PropTypes from 'prop-types'
import React from 'react'
import ObjCatalogue from './objCatalogue'

CataloguePubKeys.propTypes = {
  editMode: PropTypes.bool,
}

/**
 * Composant : CataloguePubKeys
 * @return {void}
 */
export default function CataloguePubKeys({ editMode }) {
  return (
    <ObjCatalogue
      editMode={editMode}
      objType="pub_key"
      propId="name"
      propName="name"
      propNamesToDisplay={{
        url: 'url',
        prop: 'prop',
        pem: 'pem',
        key: 'key',
        type: 'type',
      }}
      propSortBy={'-updatedAt'}
      btnTextAdd="Ajouter une clé publique"
      btnTextChg="Modifier une clé publique :"
      deleteConfirmMsg={(id) => `Confirmez vous la suppression de la clé publique ${id}?`}
      deleteMsg={(id) => `La clé publique ${id} a été supprimé`}
    />
  )
}
