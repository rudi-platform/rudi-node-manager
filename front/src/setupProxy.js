const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    `${getFrontPath()}/api`,
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: { [`^/${getFrontPath()}api`]: '/api' },
    }),
  );
};
