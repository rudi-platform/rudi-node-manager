// ------------------------------------------------------------------------------------------------
// Extract command line arguments

import { mergeStrings, pathJoin } from '../utils/utils'

// ------------------------------------------------------------------------------------------------
export const PUBLIC_URL = 'PUBLIC_URL'
// export const OPT_BACK_URL = 'REACT_APP_BACK_URL';
// export const OPT_TAG = 'REACT_APP_TAG'

// ------------------------------------------------------------------------------------------------
// App options
// 'text': description
// 'cli': option given through command line interface
// 'env': option given through environment variable
// 'file': option given through the configuration file
// If found, 'cli' has priority over 'env' that has priority over 'file'
// ------------------------------------------------------------------------------------------------
const OPTIONS = [PUBLIC_URL]

const frontOptions = {}

// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
/*
console.log('= Extract command line arguments =');
console.log('REACT_APP_URL: ' + process.env.REACT_APP_URL);
console.log('FRONT_PATH: ' + process.env.FRONT_PATH);
 */
// ------------------------------------------------------------------------------------------------
// Extracted conf values
// ------------------------------------------------------------------------------------------------

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
export const getPublicUrl = (...suffix) => pathJoin(getFrontOptions(PUBLIC_URL), ...suffix)

const getBackApi = (backPath, ...suffix) => (!suffix ? 'incorrect' : pathJoin('api', backPath, ...suffix))
export const getApiFront = (...suffix) => getBackApi('front', ...suffix)
export const getApiOpen = (...suffix) => getBackApi('open', ...suffix)
export const getApiData = (...suffix) => getBackApi('data', ...suffix)
export const getApiMedia = (...suffix) => getBackApi('media', ...suffix)
export const getForm = (formUrl, suffix, query) => mergeStrings('?', getPublicUrl(formUrl, suffix), query)
