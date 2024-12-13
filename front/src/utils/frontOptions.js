// -------------------------------------------------------------------------------------------------
// Extract command line arguments

import { pathJoin } from './utils.js'

// -------------------------------------------------------------------------------------------------
// This has been rendered obsolete: now the frontend will reach the backend to know its own URL.
export const PUBLIC_URL = 'PUBLIC_URL'
// export const OPT_BACK_URL = 'REACT_APP_BACK_URL';
// export const OPT_TAG = 'REACT_APP_TAG'

// -------------------------------------------------------------------------------------------------
// App options
// 'text': description
// 'cli': option given through command line interface
// 'env': option given through environment variable
// 'file': option given through the configuration file
// If found, 'cli' has priority over 'env' that has priority over 'file'
// -------------------------------------------------------------------------------------------------
const OPTIONS = [PUBLIC_URL]

const frontOptions = {}

// -------------------------------------------------------------------------------------------------
// Extract command line arguments
// -------------------------------------------------------------------------------------------------
/*
console.log('= Extract command line arguments =');
console.log('REACT_APP_URL: ' + process.env.REACT_APP_URL);
console.log('FRONT_PATH: ' + process.env.FRONT_PATH);
 */
// -------------------------------------------------------------------------------------------------
// Extracted conf values
// -------------------------------------------------------------------------------------------------

/**
 * Retrieve app option values
 * @param {String} opt Value given through command line option or environment variable
 * @param {String} altValue Value to be used if both CLI option and ENV option are not defined
 * @return {String} Value for the option
 */
export const getFrontOptions = (opt, altValue = '') => {
  if (!opt) return OPTIONS
  if (frontOptions[opt] === undefined) {
    frontOptions[opt] = process.env[opt] !== undefined ? process.env[opt] : altValue
    console.log(`\t- ${opt}=${frontOptions[opt]}`)
  }
  return frontOptions[opt]
}

// export const getPublicUrl = (...url) => pathJoin(getFrontOptions(PUBLIC_URL), ...url)
const FRONT_PREFIX = 'f7689a5a-0ed6-4f4b-97da-df690903ef4f'
export const getPublicUrl = () => pathJoin(FRONT_PREFIX)
