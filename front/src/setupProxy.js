const { createProxyMiddleware } = require('http-proxy-middleware')

const backPath = `${process.env.PUBLIC_URL}/api`
// const rewriteBackPathKey = `^${backPath}`
const mod = '[proxy]'
module.exports = (app) => {
  app.use(
    backPath,
    createProxyMiddleware({
      target: 'http://localhost:5005/api',
      changeOrigin: true,
    })
  )
}
console.log('')
