import { useState } from 'react'
import { FormHeader } from '../../forms/form-header/form-header'
import { FormInputText } from '../../forms/form-input-text/form-input-text'

export const REGEX_UUID = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i

const uuidValidator = (value) => {
  if (!value) {
    return null
  }

  return REGEX_UUID.test(value) ? null : "L'identifiant est invalide ou incomplet"
}

export function SearchProducers({ handleCriteria }) {
  const [orgId, setOrgId] = useState('')
  const [orgName, setOrgName] = useState('')

  const updateSearchCriteria = async (value, type) => {
    if (!value) {
      return
    }

    if (type === 'id') {
      handleCriteria({ searchUuid: value })
    }
    if (type === 'name') {
      handleCriteria({ searchName: `*${value}*` })
    }
  }

  return (
    <div className="section">
      <div className="container">
        <div className="custom-form">
          <FormHeader title="Producteur De Données"></FormHeader>
          <FormInputText
            value={orgId}
            label="Identifiant de l'organisation à rattacher"
            helper="Identifiant de l'organisation publiée sur le portail Rudi et à rattacher. Veuillez renseigner un identifiant et sélectionner l'organisation à rattacher dans les résultats retournés."
            name="organizationId"
            hasSearchButton={true}
            validators={[uuidValidator]}
            onSearch={(val) => updateSearchCriteria(val, 'id')}
            onChange={(e) => {
              setOrgId(e.target.value)
            }}
          />

          <FormInputText
            value={orgName}
            name="organizationName"
            label="Nom de l'organisation à rattacher"
            helper="Nom de l'organisation publiée sur le portail Rudi et à rattacher. Veuillez renseigner un nom et sélectionner l'organisation à rattacher dans les résultats retournés."
            onChange={(e) => setOrgName(e.target.value)}
            hasSearchButton={true}
            onSearch={(val) => updateSearchCriteria(val, 'name')}
          />
        </div>
      </div>
    </div>
  )
}
