import React from 'react'
import PropTypes from 'prop-types'
import ObjCatalogue from './objCatalogue'

CatalogueReports.propTypes = {
  editMode: PropTypes.bool,
}

/**
 * Composant : CatalogueReports
 * @return {void}
 */
export default function CatalogueReports({ editMode }) {
  return (
    <ObjCatalogue
      editMode={editMode}
      hideEdit={true}
      objType="reports"
      propId="report_id"
      propName="resource_title"
      propNamesToDisplay={{
        id: 'report_id',
        resource_id: 'resource_id',
        submission_date: 'soumission',
        treatment_date: 'traitement',
        integration_status: 'statut',
        comment: 'commentaire',
        integration_errors: 'erreurs',
      }}
      propSortBy="-submission_date"
      deleteConfirmMsg={(id) => `Confirmez vous la suppression du rapport ${id}?`}
      deleteMsg={(id) => `Le rapport ${id} a été supprimé`}
    />
  )
}
