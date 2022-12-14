import React from 'react'
import ObjCatalogue from './objCatalogue'

/**
 * Composant : CatalogueReports
 * @return {void}
 */
export default function CatalogueReports() {
  return (
    <ObjCatalogue
      objType="reports"
      propId="report_id"
      propName="resource_title"
      propNamesToDisplay={{
        id: 'report_id',
        resource_id: 'resource_id',
        resource_title: 'resource_title',
        submission_date: 'soumission',
        treatment_date: 'traitement',
        integration_status: 'statut',
        comment: 'commentaire',
        integration_errors: 'erreurs',
      }}
      btnTextAdd="Ajouter un rapport"
      btnTextChg="Modifier un rapport :"
      deleteConfirmMsg={(id) => `Confirmez vous la suppression du rapport ${id}?`}
      deleteMsg={(id) => `Le rapport ${id} a été supprimé`}
    />
  )
}
