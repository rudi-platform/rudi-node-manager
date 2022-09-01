// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
export const OPT_FRONT_PATH = 'PUBLIC_URL';
// export const OPT_BACK_URL = 'REACT_APP_BACK_URL';
export const OPT_TAG = 'REACT_APP_TAG';

// ------------------------------------------------------------------------------------------------
// App options
// 'text': description
// 'cli': option given through command line interface
// 'env': option given through environment variable
// 'file': option given through the configuration file
// If found, 'cli' has priority over 'env' that has priority over 'file'
// ------------------------------------------------------------------------------------------------
const OPTIONS = [OPT_FRONT_PATH, OPT_TAG];

const frontOptions = {};

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
export const getFrontOptions = (opt, altValue) => {
  if (!opt) return OPTIONS;
  if (frontOptions[opt]) return frontOptions[opt];
  const optVal = process.env[opt];
  if (optVal) {
    frontOptions[opt] = optVal;
    console.log('\t- ' + opt + '=' + optVal);
  }
  return optVal || '';
};

export const getBackUrl = (suffix) => `${getFrontOptions(OPT_FRONT_PATH)}${suffix ? suffix : ''}`;

if (!getBackUrl().endsWith('/')) OPTIONS[OPT_FRONT_PATH] += '/';

// const ensureIsFound = (varName) => {
//   if (!getFrontOptions(varName))
//     throw new Error(`This environment variable should be defined: ${varName}`);
// };
