const { createProxyMiddleware } = require('http-proxy-middleware')

// const backPath = `${process.env.PUBLIC_URL}/api`
// const rewriteBackPathKey = `^${backPath}`
const mod = '[proxy]'
module.exports = (app) => {
  app.use(
    `${process.env.PUBLIC_URL}/api`,
    createProxyMiddleware({
      target: 'http://localhost:5005/api',
      changeOrigin: true,
      // pathRewrite: (path, req) => {
      //   const pathReplaced = path.replace(new RegExp(rewriteBackPathKey), '/api')
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
      //   const pathReplaced = path.replace(new RegExp(rewriteBackPathKey), '/api')
      //   console.log(here, req.url, '=>', pathReplaced, ' | ', req.params, ' | ', req.query)
      //   // console.log('path:', path, ' =>', `(${rewriteBackPathKey})`, pathReplaced);
      //   return pathReplaced
      // },
    })
  )
}
console.log('')
