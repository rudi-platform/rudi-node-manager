const here = '[proxy]'

const { createProxyMiddleware } = require('http-proxy-middleware')
const { pathJoin } = require('./utils/utils.js')

const PUBLIC_URL = process.env.PUBLIC_URL

const HOST_URL = `http://localhost:5005`
const BACK_CALL = `/${PUBLIC_URL}/api`
const getBackUrl = (...url) => pathJoin(HOST_URL, BACK_CALL, ...url)
const CONF_URL = getBackUrl('conf')

const REGEX_LOCAL_CONF = new RegExp(`^(?!${HOST_URL}).*/conf$`)

const FORM_CALL = `/${PUBLIC_URL}/form`
const getFormUrl = (...url) => pathJoin(HOST_URL, FORM_CALL, ...url)

const pathRewrite = (path, req) => {
  const pathReplaced = path.replace(new RegExp(`^${BACK_URL_CALL}`), BACK_URL_TARGET)
  console.log(here, req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
  console.log('path:', path, ' =>', `(^${BACK_URL_CALL})`, pathReplaced)
  return pathReplaced
}
// pathRewrite: (path, req) => {
//   const pathReplaced = path.replace(new RegExp(rewriteBackPathKey), '/${BACK_PREFIX}')
//   console.log(here, req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
//   // console.log('path:', path, ' =>', `(${rewriteBackPathKey})`, pathReplaced);
//   return pathReplaced
// },

module.exports = (app) => {
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
  app.use(
    BACK_CALL,
    createProxyMiddleware({
      target: getBackUrl(),
      changeOrigin: true,
      pathRewrite: (path, req) => {
        const pathReplaced = path.replace(new RegExp(`$${BACK_CALL}`), `${BACK_CALL}`)
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
        const pathReplaced = path.replace(new RegExp(`$${FORM_CALL}`), `${FORM_CALL}`)
        console.log(here, req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
        return pathReplaced
      },
    })
  )
}
console.log('')
