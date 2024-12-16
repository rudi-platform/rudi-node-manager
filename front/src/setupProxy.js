const here = '[proxy]'

const { createProxyMiddleware } = require('http-proxy-middleware')
const { pathJoin } = require('./utils/utils.js')

const PUBLIC_URL = process.env.PUBLIC_URL
const BACK_PREFIX = 'api'
const FORM_PREFIX = 'form'

const HOST_URL = `http://localhost:5005`
const BACK_CALL = pathJoin('', PUBLIC_URL, BACK_PREFIX)
const getBackUrl = (...url) => pathJoin(HOST_URL, BACK_CALL, ...url)
const CONF_URL = getBackUrl('conf')

const REGEX_LOCAL_CONF = new RegExp(`^(?!${HOST_URL}).*/conf$`)

const FORM_CALL = pathJoin(PUBLIC_URL, FORM_PREFIX)
const getFormUrl = (...url) => pathJoin(HOST_URL, FORM_CALL, ...url)

module.exports = (app) => {
  app.use(
    BACK_CALL,
    createProxyMiddleware({
      target: getBackUrl(),
      changeOrigin: true,
      pathRewrite: (path, req) => {
        const pathReplaced = path.replace(new RegExp(`$${BACK_CALL}`), getBackUrl(BACK_CALL))
        console.log(here, req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
        return pathReplaced
      },
    })
  )
  app.use(
    FORM_CALL,
    createProxyMiddleware({
      target: getFormUrl(),
      changeOrigin: true,
      pathRewrite: (path, req) => {
        const pathReplaced = path.replace(new RegExp(`$${FORM_CALL}`), getFormUrl(FORM_CALL))
        console.log(here, req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
        return pathReplaced
      },
    })
  )
  app.use(
    REGEX_LOCAL_CONF,
    createProxyMiddleware({
      target: CONF_URL,
      changeOrigin: true,
      pathRewrite: (path, req) => {
        console.log('path:', path, ' =>', REGEX_LOCAL_CONF, CONF_URL)
        return CONF_URL
      },
    })
  )
}
console.log('')
