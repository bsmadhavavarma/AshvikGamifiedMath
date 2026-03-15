const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 4200;
const DIST = path.join(__dirname, 'dist/frontend/browser');

app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader('Origin', 'http://localhost:4200');
    },
  },
}));

app.use(express.static(DIST));
app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend serving on http://localhost:${PORT}`);
});
