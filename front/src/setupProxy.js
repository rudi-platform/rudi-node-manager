const { createProxyMiddleware } = require('http-proxy-middleware')

const BACK_PREFIX = 'api'

// const backPath = `${process.env.PUBLIC_URL}/${BACK_PREFIX}`
// const rewriteBackPathKey = `^${backPath}`
const mod = '[proxy]'
module.exports = (app) => {
  app.use(
    `${process.env.PUBLIC_URL}/${BACK_PREFIX}`,
    createProxyMiddleware({
      target: `http://localhost:5005/${BACK_PREFIX}`,
      changeOrigin: true,
      // pathRewrite: (path, req) => {
      //   const pathReplaced = path.replace(new RegExp(rewriteBackPathKey), '/${BACK_PREFIX}')
      //   console.log(here, req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
      //   // console.log('path:', path, ' =>', `(${rewriteBackPathKey})`, pathReplaced);
      //   return pathReplaced
      // },
    })
  )
  app.use(
    `${process.env.PUBLIC_URL}/form`,
    createProxyMiddleware({
      target: 'http://localhost:5005/form',
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
