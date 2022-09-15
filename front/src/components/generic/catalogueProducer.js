import React from 'react';
import PropTypes from 'prop-types';
import ObjCatalogue from './objCatalogue';

/**
 * Composant : CatalogueProducer
 * @return {void}
 */
export const CatalogueProducer = ({ display, specialSearch, editMode }) => (
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
);

CatalogueProducer.propTypes = {
  display: PropTypes.object,
  specialSearch: PropTypes.object,
  editMode: PropTypes.object,
};
