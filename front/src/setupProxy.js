const { createProxyMiddleware } = require('http-proxy-middleware');

const backPath = `${process.env.PUBLIC_URL}/api`;
const rewriteBackPathKey = `^${backPath}`;

module.exports = function (app) {
  app.use(
    backPath,
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: { [rewriteBackPathKey]: '/api' },
    }),
  );
};
