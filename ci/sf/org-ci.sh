#!/usr/bin/env bash
# Scratch-org smoke for this docs repo. Not an Agentforce dress rehearsal.
# Scratch orgs do not provision Agentforce, Einstein, Prompt Builder, or Data 360.
# Dev Hub auth is one of:
#   * SF_DEVHUB_AUTH_URL                                    (sfdx auth url), or
#   * SF_JWT_KEY + SF_CONSUMER_KEY + SF_HUB_USERNAME        (JWT bearer flow),
#     optional SF_HUB_INSTANCE_URL (default https://login.salesforce.com).
# JWT is the headless path for Dev Hubs that never mint a refresh token.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SF_DIR="$ROOT/ci/sf"
PW_DIR="$ROOT/ci/playwright"
ALIAS="ci-${BUILDKITE_BUILD_ID:-${BUILD_ID:-${SHORT_SHA:-local}}}-$$"
WAIT_MINUTES="${WAIT_MINUTES:-15}"
HUB_ALIAS="${HUB_ALIAS:-devhub}"
display_json=""

if [[ -n "${SF_DEVHUB_AUTH_URL:-}" ]]; then
  AUTH_MODE="sfdxurl"
elif [[ -n "${SF_JWT_KEY:-}" && -n "${SF_CONSUMER_KEY:-}" && -n "${SF_HUB_USERNAME:-}" ]]; then
  AUTH_MODE="jwt"
else
  echo "ERROR need SF_DEVHUB_AUTH_URL, or SF_JWT_KEY + SF_CONSUMER_KEY + SF_HUB_USERNAME (JWT)" >&2
  exit 1
fi

if ! command -v sf >/dev/null 2>&1; then
  echo "ERROR sf CLI is not on PATH" >&2
  exit 1
fi

cleanup() {
  local status=$?
  rm -f "$display_json"
  if [[ "${SF_SKIP_ORG_DELETE:-}" == "1" ]]; then
    echo "SF_SKIP_ORG_DELETE=1; leaving scratch org $ALIAS"
    exit "$status"
  fi
  sf org delete scratch --target-org "$ALIAS" --no-prompt >/dev/null 2>&1 || true
  exit "$status"
}
trap cleanup EXIT

if [[ "$AUTH_MODE" == "sfdxurl" ]]; then
  authfile="$(mktemp)"
  chmod 600 "$authfile"
  printf '%s\n' "$SF_DEVHUB_AUTH_URL" >"$authfile"
  sf org login sfdx-url --sfdx-url-file "$authfile" --alias "$HUB_ALIAS" --set-default-dev-hub >/dev/null
  rm -f "$authfile"
else
  keyfile="$(mktemp)"
  chmod 600 "$keyfile"
  printf '%s' "$SF_JWT_KEY" >"$keyfile"
  sf org login jwt \
    --client-id "$SF_CONSUMER_KEY" \
    --jwt-key-file "$keyfile" \
    --username "$SF_HUB_USERNAME" \
    --instance-url "${SF_HUB_INSTANCE_URL:-https://login.salesforce.com}" \
    --alias "$HUB_ALIAS" \
    --set-default-dev-hub >/dev/null
  rm -f "$keyfile"
fi

cd "$SF_DIR"
echo "=== create scratch org $ALIAS ==="
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias "$ALIAS" \
  --duration-days 1 \
  --wait "$WAIT_MINUTES" \
  --set-default \
  --target-dev-hub "$HUB_ALIAS"

echo "=== dry-run deploy (RunLocalTests) ==="
sf project deploy start \
  --source-dir force-app \
  --dry-run \
  --test-level RunLocalTests \
  --wait "$WAIT_MINUTES" \
  --target-org "$ALIAS"

echo "=== deploy (RunLocalTests) ==="
sf project deploy start \
  --source-dir force-app \
  --test-level RunLocalTests \
  --wait "$WAIT_MINUTES" \
  --target-org "$ALIAS"

echo "=== apex tests + coverage ==="
test_json="$(mktemp)"
chmod 600 "$test_json"
sf apex run test \
  --test-level RunLocalTests \
  --code-coverage \
  --result-format json \
  --wait "$WAIT_MINUTES" \
  --target-org "$ALIAS" >"$test_json"
node "$SF_DIR/check-coverage.mjs" <"$test_json"
rm -f "$test_json"

echo "=== org display (tokens not printed) ==="
display_json="$(mktemp)"
chmod 600 "$display_json"
sf org display --target-org "$ALIAS" --json >"$display_json"
node -e '
const fs = require("fs");
const raw = fs.readFileSync(process.argv[1], "utf8");
const parsed = JSON.parse(raw.slice(raw.indexOf("{")));
const r = parsed.result || {};
if (!r.instanceUrl || !r.accessToken) {
  console.error("ERROR sf org display missing instanceUrl or accessToken");
  process.exit(1);
}
' "$display_json"
export SF_ORG_DISPLAY_JSON="$display_json"

echo "=== playwright lightning smoke ==="
cd "$PW_DIR"
if [[ ! -d node_modules ]]; then
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
fi
npx playwright test
rm -f "$display_json"

echo "=== org CI OK ==="
