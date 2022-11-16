// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
exports.OPT_USER_CONF = 'conf'
exports.OPT_GIT_HASH = 'hash'
exports.OPT_NODE_ENV = 'nodeEnv'
exports.OPT_BACK_PATH = 'backPath'

// ------------------------------------------------------------------------------------------------
// App options
// 'text': description
// 'cli': option given through command line interface
// 'env': option given through environment variable
// 'file': option given through the configuration file
// If found, 'cli' has priority over 'env' that has priority over 'file'
// ------------------------------------------------------------------------------------------------
exports.OPTIONS = {
  [this.OPT_NODE_ENV]: {
    text: 'Node environment: production | development',
    cli: '--node_env',
    env: 'NODE_ENV',
  },
  [this.OPT_USER_CONF]: {
    text: 'Path for user conf file',
    cli: '--conf',
    env: 'RUDI_PROD_MANAGER_USER_CONF',
  },
  [this.OPT_GIT_HASH]: {
    text: 'Git hash',
    cli: '--hash',
    env: 'RUDI_PROD_MANAGER_GIT_REV',
  },
  [this.OPT_BACK_PATH]: {
    text: 'Back-end path',
    cli: '--back_path',
    env: 'RUDI_PROD_MANAGER_BACK_PATH',
  },
}
// if (argv.indexOf('--opts') > -1) {
console.log('--------------------------------------------------------------')

console.log('Options to run this app: ')
Object.keys(this.OPTIONS).map((opt) =>
  console.log(
    '    cli: ' +
      this.OPTIONS[opt].cli +
      (this.OPTIONS[opt].cli.length < 8 ? '\t' : '') +
      '\t| env: ' +
      this.OPTIONS[opt].env
  )
)
console.log('--------------------------------------------------------------')
// }
// ------------------------------------------------------------------------------------------------
// Extract command line arguments
// ------------------------------------------------------------------------------------------------
// console.log('= Extract command line arguments =');
// console.log(process.argv);
const cliOptionsValues = {}
process.argv.map((cliArg) => {
  // console.log('• cliArg: ' + cliArg);
  Object.keys(this.OPTIONS).map((appOpt) => {
    if (this.OPTIONS[appOpt].cli) {
      const appOptForCli = this.OPTIONS[appOpt].cli + '='
      // console.log('• appOptForCli: ' + appOptForCli);
      if (cliArg.startsWith(appOptForCli)) {
        cliOptionsValues[appOpt] = cliArg.substring(appOptForCli.length)
        // console.log('    (cli) ' + appOpt + ': ' + cliOptionsValues[appOpt]);
      }
    }
  })
})
// console.log(cliOptionsValues);

// ------------------------------------------------------------------------------------------------
// Extracted conf values
// ------------------------------------------------------------------------------------------------
console.log('Extracted conf values:')
const backOptionsValues = {}
Object.keys(this.OPTIONS).map((opt) => {
  if (cliOptionsValues[opt]) {
    backOptionsValues[opt] = cliOptionsValues[opt]
    console.log('    (cli) ' + opt + ' => ' + backOptionsValues[opt])
  } else {
    const envVar = this.OPTIONS[opt].env
    if (process.env[envVar]) {
      backOptionsValues[opt] = process.env[envVar]
      console.log('    (env) ' + opt + ' => ' + backOptionsValues[opt])
    }
  }
})

console.log('--------------------------------------------------------------')

/**
 * Retrieve app option values
 * @param {String} opt Value given through command line option or environment variable
 * @param {String} altValue Value to be used if both CLI option and ENV option are not defined
 * @return {String} Value for the option
 */
exports.getBackOptions = (opt, altValue) =>
  opt ? backOptionsValues[opt] || altValue : backOptionsValues

exports.getHashFun = (req, res, next) => {
  try {
    const hashId = this.getBackOptions(this.OPT_GIT_HASH)
    res
      .status(200)
      .send(hashId ? hashId : require('child_process').execSync('git rev-parse --short HEAD'))
  } catch (err) {
    throw err
  }
}

exports.getNodeEnv = () => this.getBackOptions(this.OPT_NODE_ENV)
exports.isDevEnv = () => this.getNodeEnv() === 'development'
// exports.getBackPath=()=> this.getBackOptions(this.OPT_BACK_PATH);
