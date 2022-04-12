// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
export const OPT_PUBLIC_URL = 'REACT_APP_URL';
export const OPT_DEFAULT_PUBLIC_URL = 'PUBLIC_URL';
export const OPT_TAG = 'REACT_APP_TAG';
// export const OPT_USER_CONF = 'REACT_APP_USER_CONF';

// ------------------------------------------------------------------------------------------------
// App options
// 'text': description
// 'cli': option given through command line interface
// 'env': option given through environment variable
// 'file': option given through the configuration file
// If found, 'cli' has priority over 'env' that has priority over 'file'
// ------------------------------------------------------------------------------------------------
const OPTIONS = [OPT_DEFAULT_PUBLIC_URL, OPT_PUBLIC_URL, OPT_TAG];

const frontOptions = {};

// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
/* 
console.log('= Extract command line arguments =');
console.log('REACT_APP_URL: ' + process.env.REACT_APP_URL);
console.log('PUBLIC_URL: ' + process.env.PUBLIC_URL);
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
  return optVal;
};

export const getPublicUrl = () =>
  getFrontOptions(OPT_PUBLIC_URL) || getFrontOptions(OPT_DEFAULT_PUBLIC_URL);
