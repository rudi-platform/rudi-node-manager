import axios from 'axios'

import React from 'react'
import PropTypes from 'prop-types'
import { Trash } from 'react-bootstrap-icons'

import { getApiData } from '../../utils/frontOptions'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import ObjCatalogue from './objCatalogue'

CatalogueReports.propTypes = {
  editMode: PropTypes.bool,
}

const getApiUrlReports = (suffix) => getApiData(`reports${suffix ? `/${suffix}` : ''}`)

/**
 * Composant : CatalogueReports
 * @return {void}
 */
export default function CatalogueReports({ editMode }) {
  const { defaultErrorHandler } = useDefaultErrorHandler()
  /**
   * call for confirmation before object deletion
   */
  const deleteOldReports = () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString()
    axios
      .delete(getApiUrlReports(`?updatedBefore=${lastMonth}`))
      .catch((err) => defaultErrorHandler(err))
  }

  return (
    <div className="col-12">
      <div className="card-body">
        <div className="inline">
          <a className="btn btn-danger" onClick={() => deleteOldReports()}>
            Supprimer les rapports des mois précédents <Trash />
          </a>
        </div>
      </div>
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
    </div>
  )
}
