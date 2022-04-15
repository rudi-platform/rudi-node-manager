const { createProxyMiddleware } = require('http-proxy-middleware');
// const { getFrontPath } = require('./utils/frontOptions');

module.exports = function(app) {
  app.use(
    `/api`,
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );
};