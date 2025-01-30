const here = (where) => `[proxy${where && '.' + where}]`

const { createProxyMiddleware } = require('http-proxy-middleware')
const { pathJoin } = require('./utils/utils.js')

const PUBLIC_URL = process.env.PUBLIC_URL ?? '/electricite/manager'
console.log('PUBLIC_URL:', PUBLIC_URL)

const BACK_PREFIX = 'api'
const FORM_PREFIX = 'form'

const HOST_URL = process.env.HOST_URL ?? `http://localhost:5005`
const BACK_CALL = pathJoin('', PUBLIC_URL, BACK_PREFIX)
const getBackUrl = (...url) => pathJoin(HOST_URL, BACK_CALL, ...url)
const CONF_URL = getBackUrl('conf')

const FORM_CALL = pathJoin('', PUBLIC_URL, FORM_PREFIX)
const getFormUrl = (...url) => pathJoin(HOST_URL, FORM_CALL, ...url)

const REGEX_LOCAL_CONF = new RegExp(`.*/conf$`)
const BACK_CALL_REGEX = new RegExp(`$${BACK_CALL}`)
const FORM_CALL_REGEX = new RegExp(`$${FORM_CALL}`)

module.exports = (app) => {
  app.use(
    REGEX_LOCAL_CONF,
    createProxyMiddleware({
      target: CONF_URL,
      changeOrigin: true,
      pathRewrite: (path, req) => {
        const pathReplaced = path.replace(REGEX_LOCAL_CONF, CONF_URL)
        console.log(here('conf'), path, ' =>', pathReplaced, CONF_URL)
        console.log()
        return getBackUrl('conf')
      },
    })
  )
  app.use(
    BACK_CALL,
    createProxyMiddleware({
      target: getBackUrl(),
      changeOrigin: true,
      pathRewrite: (path, req) => {
        const pathReplaced = path.replace(BACK_CALL_REGEX, getBackUrl(BACK_CALL))
        console.log(here('back'), req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
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
        const pathReplaced = path.replace(FORM_CALL_REGEX, getFormUrl(FORM_CALL))
        console.log(here('form'), req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
        return pathReplaced
      },
    })
  )
}
console.log('')
