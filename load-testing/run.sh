#!/usr/bin/env bash
# ==============================================================================
# SEWA 2026 k6 Load Testing Runner
#
# Usage:
#   ./run.sh <smoke|baseline|load|stress|spike|soak> [extra k6 options]
#
# Examples:
#   BASE_URL=http://10.50.0.80 ./run.sh smoke
#   BASE_URL=http://10.50.0.80 ./run.sh baseline
#   BASE_URL=http://10.50.0.80 ./run.sh load
#   BASE_URL=http://10.50.0.80 MAX_VUS=1000 ./run.sh stress
#   BASE_URL=http://10.50.0.80 ./run.sh spike
#   BASE_URL=http://10.50.0.80 SOAK_DURATION=30m ./run.sh soak
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ensure target URL is set (defaulting to live private IP)
export BASE_URL="${BASE_URL:-http://10.50.0.80}"
RESULTS_DIR="$SCRIPT_DIR/results"

# 1. Verify k6 is installed
if ! command -v k6 >/dev/null 2>&1; then
  echo "================================================================================"
  echo "[ERROR] 'k6' is not installed or not in PATH."
  echo "Please install k6 before running this suite."
  echo "Installation instructions (Debian/Ubuntu):"
  echo "  sudo gpg -k"
  echo "  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69"
  echo "  echo \"deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main\" | sudo tee /etc/apt/sources.list.d/k6.list"
  echo "  sudo apt-get update && sudo apt-get install -y k6"
  echo "================================================================================"
  exit 1
fi

# 2. Validate input argument
SCENARIO="${1:-}"

if [[ -z "$SCENARIO" ]]; then
  echo "================================================================================"
  echo "SEWA 2026 Load Testing Suite Runner"
  echo "================================================================================"
  echo "Usage: $0 <scenario> [k6-options]"
  echo ""
  echo "Available Scenarios:"
  echo "  smoke     - Quick 1-2 VU check to verify connectivity and API health (1 min)"
  echo "  baseline  - Low-load benchmark (10 VUs for 5 min) capturing p50/p90/p95/p99"
  echo "  load      - Gradual stepped ramp-up (10 -> 50 -> 100 -> 250 -> 500 VUs)"
  echo "  stress    - Progressive capacity test to breaking point (configurable MAX_VUS)"
  echo "  spike     - Rapid surge to 500+ VUs and fast recovery observation"
  echo "  scale10k  - 10,000 Virtual Users progressive stepped scale test (1k -> 10k VUs)"
  echo "  arrival10k- 10,000 Concurrent Visitors open-model arrival rate (~2,000 journeys/sec)"
  echo ""
  echo "Environment Variables:"
  echo "  BASE_URL       Target base URL (default: http://10.50.0.80)"
  echo "  MAX_VUS        Maximum VUs for stress/scale tests (default: 500 / 10000)"
  echo "  SCALE_RATE     Peak arrival rate for arrival10k (default: 2000/sec)"
  echo "  SOAK_DURATION  Duration for soak test (default: 30m)"
  echo "  K6_TOKEN       Session token for 'sewa_session' cookie (optional)"
  echo "  K6_USERNAME    User email for automated login in setup() (optional)"
  echo "  K6_PASSWORD    User password for automated login in setup() (optional)"
  echo "================================================================================"
  exit 1
fi

# Normalize alias names
if [[ "$SCENARIO" == "scale10k" ]]; then
  SCENARIO="scale-10k"
elif [[ "$SCENARIO" == "arrival10k" ]]; then
  SCENARIO="arrival-10k"
fi

TARGET_FILE="$SCRIPT_DIR/scenarios/${SCENARIO}.js"

if [[ ! -f "$TARGET_FILE" ]]; then
  echo "[ERROR] Unknown scenario '$SCENARIO'. File not found: $TARGET_FILE"
  echo "Valid choices: smoke, baseline, load, stress, spike, soak, scale10k, arrival10k"
  exit 1
fi

# Check open file descriptor limits for high concurrency runs
CURRENT_ULIMIT=$(ulimit -n || echo "1024")
if [[ ("$SCENARIO" == "scale-10k" || "$SCENARIO" == "arrival-10k") && $CURRENT_ULIMIT -lt 65535 ]]; then
  echo "--------------------------------------------------------------------------------"
  echo "[NOTICE] Current open file descriptor limit (ulimit -n) is $CURRENT_ULIMIT."
  echo "For 10,000 concurrent user tests, it is strongly recommended to set:"
  echo "  ulimit -n 65535"
  echo "--------------------------------------------------------------------------------"
fi

# 3. Create results directory if needed
mkdir -p "$RESULTS_DIR"

# 4. Verify connectivity to BASE_URL before launching load test
echo "--------------------------------------------------------------------------------"
echo "[CHECK] Verifying reachability of target BASE_URL: $BASE_URL ..."

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$BASE_URL/api/health" || echo "FAILED")

if [[ "$HTTP_STATUS" == "FAILED" || "$HTTP_STATUS" == "000" ]]; then
  echo "[ERROR] Cannot connect to $BASE_URL/api/health."
  echo "Please verify that the target host is reachable from this machine and that"
  echo "network routing / VPN access to 10.50.0.80 is active."
  exit 1
fi

echo "[OK] Target is reachable! /api/health returned HTTP $HTTP_STATUS"
echo "--------------------------------------------------------------------------------"

# 5. Print execution banner
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo "================================================================================"
echo "  SEWA 2026 LOAD TEST RUNNER"
echo "================================================================================"
echo "  Timestamp   : $TIMESTAMP"
echo "  Scenario    : $SCENARIO ($TARGET_FILE)"
echo "  Target Host : $BASE_URL"
if [[ -n "${K6_TOKEN:-}" ]]; then
  echo "  Auth Mode   : Direct K6_TOKEN provided"
elif [[ -n "${K6_USERNAME:-}" ]]; then
  echo "  Auth Mode   : Setup single login (${K6_USERNAME})"
else
  echo "  Auth Mode   : Public anonymous visitor"
fi
echo "================================================================================"

# 6. Execute k6 scenario
# Extra parameters passed to the script are forwarded directly to k6
shift || true
exec k6 run \
  --insecure-skip-tls-verify \
  -e BASE_URL="$BASE_URL" \
  -e RESULTS_DIR="$RESULTS_DIR" \
  ${K6_TOKEN:+-e K6_TOKEN="$K6_TOKEN"} \
  ${K6_USERNAME:+-e K6_USERNAME="$K6_USERNAME"} \
  ${K6_PASSWORD:+-e K6_PASSWORD="$K6_PASSWORD"} \
  ${MAX_VUS:+-e MAX_VUS="$MAX_VUS"} \
  ${SCALE_RATE:+-e SCALE_RATE="$SCALE_RATE"} \
  ${SOAK_DURATION:+-e SOAK_DURATION="$SOAK_DURATION"} \
  ${LOAD_MAX_VUS:+-e LOAD_MAX_VUS="$LOAD_MAX_VUS"} \
  "$TARGET_FILE" \
  "$@"
