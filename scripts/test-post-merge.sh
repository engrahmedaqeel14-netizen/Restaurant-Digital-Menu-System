#!/usr/bin/env bash
# Test suite for the GitHub sync logic in post-merge.sh.
# Uses PATH-prepended mock binaries to stub curl and git — no real network calls.

set -euo pipefail

PASS=0
FAIL=0
SCRIPT="$(cd "$(dirname "$0")" && pwd)/post-merge.sh"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

# ---------------------------------------------------------------------------
# make_mock_bin <label>
# Creates a temp dir with stub pnpm, curl, and git binaries.
# Behaviour is controlled via env vars passed to run_script:
#   MOCK_CURL_STATUS  — HTTP status code curl's "-w %{http_code}" returns (default 200)
#   MOCK_GIT_EXIT     — exit code for git push (default 0)
# ---------------------------------------------------------------------------
make_mock_bin() {
  local dir="$WORK_DIR/bin_$1"
  mkdir -p "$dir"

  # pnpm: always succeed silently (we're not testing the install/db steps)
  cat > "$dir/pnpm" << 'EOF'
#!/bin/bash
exit 0
EOF

  # curl: echo MOCK_CURL_STATUS when called with "-w %{http_code}", else succeed
  cat > "$dir/curl" << 'EOF'
#!/bin/bash
prev=""
for arg in "$@"; do
  if [ "$prev" = "-w" ] && [[ "$arg" == *"http_code"* ]]; then
    printf '%s' "${MOCK_CURL_STATUS:-200}"
    exit 0
  fi
  prev="$arg"
done
exit 0
EOF

  # git: exit with MOCK_GIT_EXIT (default 0)
  cat > "$dir/git" << 'EOF'
#!/bin/bash
exit "${MOCK_GIT_EXIT:-0}"
EOF

  chmod +x "$dir/pnpm" "$dir/curl" "$dir/git"
  echo "$dir"
}

# ---------------------------------------------------------------------------
# run_script <mock_bin_dir> [KEY=VALUE ...]
# Runs post-merge.sh with the mock PATH and the given env overrides.
# Always exits 0 from the caller's perspective (|| true) so we can inspect output.
# ---------------------------------------------------------------------------
run_script() {
  local mock_dir="$1"
  shift
  env -i \
    PATH="$mock_dir:/usr/bin:/bin" \
    HOME="$HOME" \
    "$@" \
    bash "$SCRIPT" 2>&1 || true
}

# ---------------------------------------------------------------------------
# assert_output_contains <test_name> <actual_output> <expected_substring>
# ---------------------------------------------------------------------------
assert_output_contains() {
  local name="$1"
  local output="$2"
  local expected="$3"
  if echo "$output" | grep -qF "$expected"; then
    echo "  PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name"
    echo "    Expected output to contain: $expected"
    echo "    Actual output:"
    echo "$output" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
}

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
echo "=== post-merge.sh test suite ==="

# ------------------------------------------------------------------
echo ""
echo "--- Missing GITHUB_TOKEN ---"
mock_bin=$(make_mock_bin t1)
out=$(run_script "$mock_bin" GITHUB_REPOSITORY="owner/repo")
assert_output_contains \
  "prints warning and exits 0 when GITHUB_TOKEN is absent" \
  "$out" \
  "GITHUB_TOKEN or GITHUB_REPOSITORY is not set"

# ------------------------------------------------------------------
echo ""
echo "--- Missing GITHUB_REPOSITORY ---"
mock_bin=$(make_mock_bin t2)
out=$(run_script "$mock_bin" GITHUB_TOKEN="fake_token")
assert_output_contains \
  "prints warning and exits 0 when GITHUB_REPOSITORY is absent" \
  "$out" \
  "GITHUB_TOKEN or GITHUB_REPOSITORY is not set"

# ------------------------------------------------------------------
echo ""
echo "--- Invalid token (HTTP 401) ---"
mock_bin=$(make_mock_bin t3)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="bad_token" \
  GITHUB_REPOSITORY="owner/repo" \
  MOCK_CURL_STATUS="401")
assert_output_contains \
  "prints error message for 401" \
  "$out" \
  "invalid or expired"

# ------------------------------------------------------------------
echo ""
echo "--- Forbidden (HTTP 403) ---"
mock_bin=$(make_mock_bin t4)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="bad_token" \
  GITHUB_REPOSITORY="owner/repo" \
  MOCK_CURL_STATUS="403")
assert_output_contains \
  "prints error message for 403" \
  "$out" \
  "403"

# ------------------------------------------------------------------
echo ""
echo "--- Unexpected HTTP status (500) ---"
mock_bin=$(make_mock_bin t5)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="token" \
  GITHUB_REPOSITORY="owner/repo" \
  MOCK_CURL_STATUS="500")
assert_output_contains \
  "warns about unexpected status but continues" \
  "$out" \
  "unexpected status"

# ------------------------------------------------------------------
echo ""
echo "--- Successful push (HTTP 200) ---"
mock_bin=$(make_mock_bin t6)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="valid_token" \
  GITHUB_REPOSITORY="owner/repo" \
  MOCK_CURL_STATUS="200")
assert_output_contains \
  "reports success after clean push" \
  "$out" \
  "GitHub sync complete"

# ------------------------------------------------------------------
echo ""
echo "--- Failed git push ---"
mock_bin=$(make_mock_bin t7)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="valid_token" \
  GITHUB_REPOSITORY="owner/repo" \
  MOCK_CURL_STATUS="200" \
  MOCK_GIT_EXIT="1")
assert_output_contains \
  "reports push failure without crashing" \
  "$out" \
  "git push to"

# ---------------------------------------------------------------------------
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
