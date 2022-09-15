import React from 'react';
import PropTypes from 'prop-types';
import ObjCatalogue from './objCatalogue';

/**
 * Composant : CataloguePubKeys
 * @return {void}
 */
export const CataloguePubKeys=({ display, specialSearch, editMode }) => (
    <ObjCatalogue
      display={{ searchbar: true, editJDD: true }}
      specialSearch={{}}
      editMode={{}}
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
  );

CataloguePubKeys.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
};
