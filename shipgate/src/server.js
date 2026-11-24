'use strict';
const http = require('node:http');
const { scoreRelease } = require('./risk');

const VERSION = process.env.APP_VERSION || require('../package.json').version;

/** FAIL_RATE (0-1) injects /health failures: used to rehearse canary rollbacks. */
function createServer({ failRate = Number(process.env.FAIL_RATE || 0) } = {}) {
  return http.createServer((req, res) => {
    const send = (code, body) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    if (req.method === 'GET' && req.url === '/health') {
      if (Math.random() < failRate) return send(500, { status: 'degraded' });
      return send(200, { status: 'ok' });
    }
    if (req.method === 'GET' && req.url === '/version') {
      return send(200, { version: VERSION });
    }
    if (req.method === 'POST' && req.url === '/score') {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        try {
          send(200, scoreRelease(JSON.parse(raw || '{}')));
        } catch (err) {
          send(400, { error: err.message });
        }
      });
      return;
    }
    send(404, { error: 'Not found' });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  createServer().listen(port, () => process.stdout.write(`ShipGate v${VERSION} on :${port}\n`));
}

module.exports = { createServer };
