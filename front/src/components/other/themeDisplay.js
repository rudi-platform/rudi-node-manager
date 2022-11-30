import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { usePMFrontContext } from '../../generalContext'

/**
 * Composant : ThemeDisplay
 * @return {ReactNode}
 */
export default function ThemeDisplay({ value }) {
  const generalConf = usePMFrontContext()
  /**
   * get Theme Label
   * @return {String} text to display
   */
  const getLabel = () =>
    generalConf.themeLabels && generalConf.themeLabels[value]
      ? generalConf.themeLabels[value]
      : value

  return <span>{getLabel()}</span>
}
ThemeDisplay.propTypes = {
  value: PropTypes.string,
}
