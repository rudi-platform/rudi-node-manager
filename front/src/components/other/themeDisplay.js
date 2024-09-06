import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { BackDataContext } from '../../context/backDataContext'

ThemeDisplay.propTypes = { value: PropTypes.string }

/**
 * Composant : ThemeDisplay
 * @return {ReactNode}
 */
export default function ThemeDisplay({ value }) {
  const { appInfo } = useContext(BackDataContext)
  const [themeLabel, setThemeLabel] = useState(value)

  useEffect(() => setThemeLabel(appInfo.themeLabels?.[value] || value), [appInfo])
  // console.trace('T ThemeDisplay.value:', value)
  // console.trace('T ThemeDisplay.themeLabel:', themeLabel)
  // console.trace('T themeLabels:', value, appInfo.themeLabels)
  // console.trace('T themeLabels:', appInfo.themeLabels?.[value])

  return <span>{themeLabel}</span>
}
