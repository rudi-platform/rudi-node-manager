import axios from 'axios'

import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { Pencil, Plus, Trash } from 'react-bootstrap-icons'

import { BackConfContext } from '../../context/backConfContext.js'
import useDefaultErrorHandler from '../../utils/useDefaultErrorHandler'
import { ModalContext, getOptConfirm, getOptOk } from '../modals/genericModalContext'

ReportsCard.propTypes = {
  editMode: PropTypes.bool,
  report: PropTypes.object,
  propId: PropTypes.string,
  propName: PropTypes.string,
  displayFields: PropTypes.object,
  deleteUrl: PropTypes.func,
  deleteConfirmMsg: PropTypes.func,
  deleteMsg: PropTypes.func,
  refresh: PropTypes.func,
}

/**
 * Composant : ProducerCard
 * @return {ReactNode}
 */
export function ReportsCard({
  editMode,
  report,
  propId,
  propName,
  displayFields,
  deleteUrl,
  deleteConfirmMsg,
  deleteMsg,
  refresh,
}) {
  const { defaultErrorHandler } = useDefaultErrorHandler()

  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const { changeOptions, toggle } = useContext(ModalContext)

  const [isEdit, setIsEdit] = useState(!!editMode)
  useEffect(() => setIsEdit(!!editMode), [editMode])

  const reportId = report[propId]
  const reportTitle = report[propName]

  const mapObjectType = {
    DATASET: {
      PUT: ' Modification de jeu de donnée',
      POST: ' Publication de jeu de donnée',
      DELETE: ' Suppression de jeu de donnée',
      DEFAULT: ' Jeu de donnée',
    },
    ORGANIZATION: {
      PUT: " Modification d'organisation",
      POST: " Création d'organisation",
      DELETE: " Suppression d'organisation",
      DEFAULT: ' Organisation',
    },
    LINKED_PRODUCER: {
      ATTACH: " Rattachement d'une organisation",
      DETACH: " Détachement d'une organisation",
      DEFAULT: " Liaison d'une organisation",
    },
  }

  /**
   * Call for organization deletion
   * @param {*} id Identifier of the object to delete
   */
  const deleteObj = (id) => {
    axios
      .delete(deleteUrl(id))
      .then(() => {
        changeOptions(getOptOk(deleteMsg(id), () => refresh()))
        toggle()
      })
      .catch((err) => defaultErrorHandler(err))
  }
  /**
   * call for confirmation before organization deletion
   * @param {*} id Identifier of the organization to delete
   */
  const triggerDeleteObj = (id) => {
    changeOptions(getOptConfirm(deleteConfirmMsg(reportTitle), () => deleteObj(id)))
    toggle()
  }

  function getObjectType(objectType, method) {
    return mapObjectType[objectType]?.[method] || mapObjectType[objectType]?.DEFAULT || 'Rapport interne'
  }

  const displayObjectType = () => {
    console.table(report);
    if (report.object_type) {
      return (
        <p className="card-text">
          Objet :
          <small className="text-muted">{getObjectType(report.object_type, report.method)}</small>
        </p>
      )
    }
  }

  return (
    <div className="col-12" key={reportId}>
      <div className="card card-margin">
        <h5 className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <a>{reportTitle}</a>
            {isEdit && (
              <div className="btn-group" role="group">
                <button type={'button'} className="btn btn-danger" onClick={() => triggerDeleteObj(reportId)}>
                  <Trash />
                </button>
              </div>
            )}
          </div>
        </h5>
        <div className="card-body">
          {displayObjectType()}
          {Object.keys(displayFields).map(
            (key) =>
              report[key] && (
                <p className="card-text" key={`${reportId}.${key}`}>
                  {displayFields[key]}&nbsp;:&nbsp;
                  <small className="text-muted">
                    {!Array.isArray(report[key]) ? report[key] : JSON.stringify(report[key])}
                  </small>
                </p>
              )
          )}
        </div>
      </div>
    </div>
  )
}
