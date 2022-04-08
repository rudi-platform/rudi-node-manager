// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
export const OPT_PUBLIC_URL = 'publicUrl';
export const OPT_GIT_HASH = 'hash';
export const OPT_NODE_ENV = 'nodeEnv';
export const OPT_TAG = 'tag';
export const OPT_USER_CONF = 'conf';

// ------------------------------------------------------------------------------------------------
// App options
// 'text': description
// 'cli': option given through command line interface
// 'env': option given through environment variable
// 'file': option given through the configuration file
// If found, 'cli' has priority over 'env' that has priority over 'file'
// ------------------------------------------------------------------------------------------------
export const OPTIONS = {
  [OPT_USER_CONF]: {
    text: 'User conf file',
    cli: '--conf',
    env: 'REACT_APP_USER_CONF',
  },
  [OPT_TAG]: {
    text: 'Tag of the RUDI Producer Node',
    cli: '--tag',
    env: 'REACT_APP_TAG',
  },
  [OPT_GIT_HASH]: {
    text: 'Git hash',
    cli: '--hash',
    env: 'REACT_APP_GIT_REV',
  },
  [OPT_NODE_ENV]: {
    text: 'Node environment: production | development',
    cli: '--node_env',
    env: 'NODE_ENV',
  },
  [OPT_PUBLIC_URL]: {
    text: 'Public URL for the front module',
    cli: '--url',
    env: 'REACT_APP_URL',
  },
};

export const displayOptions = () => {
  console.log('Options to run this app: ');
  Object.keys(OPTIONS).map((opt) =>
    console.log(
      '    cli: ' +
        OPTIONS[opt].cli +
        (OPTIONS[opt].cli.length < 8 ? '\t' : '') +
        '\t| env: ' +
        OPTIONS[opt].env,
    ),
  );
};

// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
console.log('= Extract command line arguments =');
// console.log('process.argv: ' + process.argv);
// console.log('process.env ' + JSON.stringify(process.env));
console.log('process.env.REACT_APP_URL: ' + process.env.REACT_APP_URL);
console.log('process.env.PUBLIC_URL: ' + process.env.PUBLIC_URL);

const cliOptionsValues = {};
process.argv.map((cliArg) => {
  console.log('cliArg: ' + cliArg);
  Object.keys(OPTIONS).map((appOpt) => {
    // console.log('appOpt: ' + appOpt);
    if (OPTIONS[appOpt].cli) {
      const appOptForCli = OPTIONS[appOpt].cli + '=';
      // console.log('• appOptForCli: ' + appOptForCli);
      console.log('appOptForCli: ' + appOptForCli);
      if (cliArg.startsWith(appOptForCli))
        cliOptionsValues[appOpt] = cliArg.substring(appOptForCli.length);
      // console.log('\t- ' + appOpt + ': ' + cliOptionsValues[appOpt]);
    }
  });
});

// ------------------------------------------------------------------------------------------------
// Extracted conf values
// ------------------------------------------------------------------------------------------------
const appOptionsValues = {};
Object.keys(OPTIONS).map((opt) => {
  appOptionsValues[opt] = cliOptionsValues[opt] || process.env[OPTIONS[opt].env];
  // console.log(JSON.stringify(cliOptionsValues));
  // console.log('OPTIONS[opt].env: ' + OPTIONS[opt].env);
  // console.log(JSON.stringify(process.env));
  if (appOptionsValues[opt] != undefined) console.log(opt + '=' + appOptionsValues[opt]);
});

/**
 * Retrieve app option values
 * @param {String} opt Value given through command line option or environment variable
 * @param {String} altValue Value to be used if both CLI option and ENV option are not defined
 * @return {String} Value for the option
 */
export const getFrontOptions = (opt, altValue) => {
  const frontOption = opt ? appOptionsValues[opt] || altValue : appOptionsValues;
  // console.log('\t- ' + opt + '=' + frontOption);
  return frontOption;
};
export const getHashFun = () => {
  try {
    return getFrontOptions(
      OPT_GIT_HASH,
      require('child_process').execSync('git rev-parse --short HEAD'),
    );
  } catch (err) {
    throw err;
  }
};
export const getPublicUrl = () => getFrontOptions(OPT_PUBLIC_URL);
