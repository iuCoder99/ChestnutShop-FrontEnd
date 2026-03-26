const http = require('http');
const url = require('url');

const TARGET_HOST = 'localhost';
const TARGET_PORT = 8080;
const LISTEN_PORT = 3000;

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: parsed.path,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(LISTEN_PORT, () => {
  console.log(`Local proxy listening on http://localhost:${LISTEN_PORT} -> http://${TARGET_HOST}:${TARGET_PORT}`);
});
