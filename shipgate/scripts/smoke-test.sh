#!/usr/bin/env bash
# Usage: ./scripts/smoke-test.sh http://localhost:3000
set -euo pipefail
BASE="${1:-http://localhost:3000}"

for i in {1..15}; do
  if curl -fsS "$BASE/health" >/dev/null 2>&1; then break; fi
  echo "Waiting for $BASE ($i/15)..."; sleep 1
done

curl -fsS "$BASE/health" | grep -q '"ok"'
curl -fsS "$BASE/version" | grep -q 'version'
curl -fsS -X POST "$BASE/score" -d '{"linesChanged":10}' | grep -q '"deployable":true'
echo "Smoke test passed against $BASE"
