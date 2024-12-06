const here = '[proxy]'

const { createProxyMiddleware } = require('http-proxy-middleware')
const { pathJoin } = require('./utils/utils.js')

// const BACK_PREFIX = 'api'
// const CONSOLE_PREFIX = 'form'
const MANAGER_URL = 'http://localhost:5005/manager'

// const getCallUrl = (suffix) => pathJoin('', process.env.PUBLIC_URL, suffix)
// const getTargetUrl = (suffix) => pathJoin(MANAGER_URL, suffix)

// const BACK_URL_CALL = getCallUrl(BACK_PREFIX)
// const BACK_URL_TARGET = getTargetUrl(BACK_PREFIX)
// const FORM_URL_CALL = getCallUrl(CONSOLE_PREFIX)
// const FORM_URL_TARGET = getTargetUrl(CONSOLE_PREFIX)

const addRedirectProxy = (app, call, target) =>
  app.use(
    call,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: (path, req) => {
        const pathReplaced = path.replace(new RegExp(`^${call}`), target)
        // console.log(
        //   here,
        //   req.url,
        //   '=>',
        //   pathReplaced,
        //   req.params && ` | params= ${JSON.stringify(req.params)}`,
        //   req.query && ` | query= ${JSON.stringify(req.query)}`
        // )
        // console.log('path:', path, ' =>', `(^${call})`, pathReplaced)
        return pathReplaced
      },
    })
  )

module.exports = (app) => {
  addRedirectProxy(app, process.env.PUBLIC_URL, MANAGER_URL)
  // addRedirectProxy(app, BACK_URL_CALL, BACK_URL_TARGET)
}
console.log('')
