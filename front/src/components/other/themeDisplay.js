import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { BackConfContext } from '../../context/backConfContext.js'

ThemeDisplay.propTypes = { value: PropTypes.string }

/**
 * Composant : ThemeDisplay
 * @return {ReactNode}
 */
export default function ThemeDisplay({ value }) {
  const { backConf } = useContext(BackConfContext)
  const [back, setBack] = useState(backConf)
  useEffect(() => setBack(backConf), [backConf])

  const [themeLabel, setThemeLabel] = useState(value)
  useEffect(() => setThemeLabel(back.themeLabels?.[value] || value), [backConf])

  return <span>{themeLabel}</span>
}
