'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/server');

function withServer(opts, fn) {
  return new Promise((resolve, reject) => {
    const srv = createServer(opts).listen(0, async () => {
      try {
        await fn(`http://127.0.0.1:${srv.address().port}`);
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        srv.close();
      }
    });
  });
}

test('GET /health returns ok', () =>
  withServer({}, async (base) => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  }));

test('failRate=1 makes /health fail (chaos mode)', () =>
  withServer({ failRate: 1 }, async (base) => {
    assert.equal((await fetch(`${base}/health`)).status, 500);
  }));

test('GET /version returns a version string', () =>
  withServer({}, async (base) => {
    const body = await (await fetch(`${base}/version`)).json();
    assert.match(body.version, /^\d+\.\d+\.\d+/);
  }));

test('POST /score returns a score', () =>
  withServer({}, async (base) => {
    const res = await fetch(`${base}/score`, {
      method: 'POST',
      body: JSON.stringify({ linesChanged: 400, touchesMigrations: true }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.level, 'medium');
  }));

test('POST /score rejects bad input with 400', () =>
  withServer({}, async (base) => {
    const res = await fetch(`${base}/score`, { method: 'POST', body: '{"filesChanged":-5}' });
    assert.equal(res.status, 400);
  }));

test('POST /score rejects invalid JSON with 400', () =>
  withServer({}, async (base) => {
    assert.equal((await fetch(`${base}/score`, { method: 'POST', body: '{nope' })).status, 400);
  }));

test('unknown route returns 404', () =>
  withServer({}, async (base) => {
    assert.equal((await fetch(`${base}/nope`)).status, 404);
  }));
