import './form-input-text.scss'
import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { Search } from 'react-bootstrap-icons'

FormInputText.propTypes = {
  value: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  helper: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  readonly: PropTypes.bool,
  slim: PropTypes.bool,
  onChange: PropTypes.func,
  hasSearchButton: PropTypes.bool,
}

export function FormInputText({
  value = '',
  name,
  label,
  helper,
  required = false,
  error,
  disabled = false,
  readonly = false,
  slim = false,
  onChange,
  hasSearchButton = false,
  onSearch,
  validators = [],
}) {
  const [validationError, setValidationError] = useState('')

  const validate = () => {
    for (const validator of validators) {
      const result = validator(value)
      if (result) {
        setValidationError(result)
        return false // Invalid
      }
    }
    setValidationError('')
    return true // Valid
  }

  const handleChange = (e) => {
    // Erase the error message when the user changes the input field
    if (validationError) setValidationError('')
    if (onChange) {
      onChange(e)
    }
  }

  const handleBlur = () => {
    // Validate when user leaves the input field
    validate()
  }

  const handleSearchClick = () => {
    // On valide avant de lancer la recherche
    if (validate() && onSearch) {
      onSearch(value)
    }
  }

  // Construire les classes CSS conditionnelles
  const wrapperClasses = [
    'form-input-text',
    label && 'has-label',
    required && 'is-required',
    (error || validationError) && 'has-error', // On combine les erreurs
    disabled && 'is-disabled',
    readonly && 'is-readonly',
    slim && 'is-slim',
    hasSearchButton && 'has-search',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClasses}>
      <div className="wrapper">
        <input
          className="content"
          type="text"
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="   "
          disabled={disabled}
          readOnly={readonly}
        />
        {(label || required) && (
          <span className="label_wrapper">
            <label>{label}</label>
            {required && <span className="required_star"> ✱</span>}
          </span>
        )}
        <div className="helper_wrapper">
          <span>{error || validationError || helper}</span>
        </div>
      </div>
      {hasSearchButton && (
        <button
          type="button"
          className="search-button btn btn-primary"
        onClick={handleSearchClick}>
          <Search />
        </button>
      )}
    </div>
  )
}
