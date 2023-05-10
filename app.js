const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/', createProxyMiddleware({
  target: 'https://www.worldometers.info',
  changeOrigin: true,
  secure: false,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
  },
  logger: console
}));

app.listen(4220, () => {
  console.log('Proxy server listening on port 4220');
});
