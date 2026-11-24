'use strict';
/**
 * Canary rehearsal: starts a "stable" and a "canary" server, sends traffic
 * to the canary, and decides PROMOTE or ROLLBACK from its error rate.
 *   node scripts/canary.js                    -> healthy canary, exits 0
 *   node scripts/canary.js --fail-rate=0.6    -> bad canary, exits 1 (rollback)
 */
const { createServer } = require('../src/server');

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : fallback;
};

const FAIL_RATE = arg('fail-rate', 0);
const REQUESTS = arg('requests', 100);
const MAX_ERROR_RATE = arg('max-error-rate', 0.05);

const listen = (srv) => new Promise((r) => srv.listen(0, () => r(srv)));

(async () => {
  const stable = await listen(createServer({ failRate: 0 }));
  const canary = await listen(createServer({ failRate: FAIL_RATE }));
  const out = (m) => process.stdout.write(`${m}\n`);

  out(`Stable on :${stable.address().port}, canary on :${canary.address().port}`);
  out(`Probing canary with ${REQUESTS} requests (threshold ${MAX_ERROR_RATE * 100}%)`);

  let errors = 0;
  for (let i = 0; i < REQUESTS; i++) {
    const res = await fetch(`http://127.0.0.1:${canary.address().port}/health`);
    if (!res.ok) errors++;
  }
  const rate = errors / REQUESTS;
  stable.close();
  canary.close();

  out(`Canary error rate: ${(rate * 100).toFixed(1)}%`);
  if (rate > MAX_ERROR_RATE) {
    out('DECISION: ROLLBACK, canary traffic shifted back to stable.');
    process.exit(1);
  }
  out('DECISION: PROMOTE, canary becomes the new stable.');
})();
