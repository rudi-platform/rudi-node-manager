import React, { useContext, useEffect, useState } from 'react'
import { BackConfContext } from '../../context/backConfContext'
import { Plus } from 'react-bootstrap-icons'
import { Link } from 'react-router-dom'

ProducerManagmentCard.propTypes = {}

export function ProducerManagmentCard() {
  const objType = 'organizations'
  const { backConf } = useContext(BackConfContext)

  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const portalConnected = back?.isLoaded && back.portalConnected

  const getFormObj = (obj, query) => back?.isLoaded && back.getConsole(obj, query)

  return (
    <div className="row">
      <div className="col-12">
        <div className="card edit-card-margin">
          <div className="card-body">
            <div className="inline">
              <a href={getFormObj(objType)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary m-2">
                Ajouter un producteur <Plus />
              </a>
              {portalConnected && (
                <Link to="/producer-attach">
                  <button className="btn btn-secondary m-2">
                    Attacher un producteur <Plus />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
