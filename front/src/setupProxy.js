const here = '[proxy]'

const { createProxyMiddleware } = require('http-proxy-middleware')
const { pathJoin } = require('./utils/utils.js')

const BACK_PREFIX = 'api'
const CONSOLE_PREFIX = 'form'
const MANAGER_URL = 'http://localhost:5005'

const getPublicUrl = (suffix) => pathJoin('', process.env.PUBLIC_URL, suffix)
const getTargetUrl = (suffix) => pathJoin(MANAGER_URL, suffix)

const BACK_URL_CALL = getPublicUrl(BACK_PREFIX)
const BACK_URL_TARGET = getTargetUrl(BACK_PREFIX)
const FORM_URL_CALL = getPublicUrl(CONSOLE_PREFIX)
const FORM_URL_TARGET = getTargetUrl(CONSOLE_PREFIX)

const pathRewrite = (path, req) => {
  const pathReplaced = path.replace(new RegExp(`^${BACK_URL_CALL}`), BACK_URL_TARGET)
  console.log(here, req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
  console.log('path:', path, ' =>', `(^${BACK_URL_CALL})`, pathReplaced)
  return pathReplaced
}

module.exports = (app) => {
  app.use(
    BACK_URL_CALL,
    createProxyMiddleware({
      target: BACK_URL_TARGET,
      changeOrigin: true,
      // pathRewrite,
    })
  )
  app.use(
    FORM_URL_CALL,
    createProxyMiddleware({
      target: FORM_URL_TARGET,
      changeOrigin: true,
      // pathRewrite: (path, req) => {
      //   const pathReplaced = path.replace(new RegExp(rewriteBackPathKey), '/${BACK_PREFIX}')
      //   console.log(here, req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
      //   // console.log('path:', path, ' =>', `(${rewriteBackPathKey})`, pathReplaced);
      //   return pathReplaced
      // },
    })
  )
}
console.log('')
