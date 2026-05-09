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
#
# The mock curl logs every POST request body to $WORK_DIR/webhook_calls_<label>.log
# so tests can assert whether the Slack webhook was invoked.
# ---------------------------------------------------------------------------
make_mock_bin() {
  local dir="$WORK_DIR/bin_$1"
  local call_log="$WORK_DIR/webhook_calls_$1.log"
  mkdir -p "$dir"
  touch "$call_log"

  # pnpm: always succeed silently (we're not testing the install/db steps)
  cat > "$dir/pnpm" << 'EOF'
#!/bin/bash
exit 0
EOF

  # curl: echo MOCK_CURL_STATUS when called with "-w %{http_code}" (GitHub API check);
  # for POST requests (webhook calls), log the URL and body to the call log file.
  cat > "$dir/curl" << EOF
#!/bin/bash
call_log="$call_log"
is_post=0
url=""
body=""
prev=""
for arg in "\$@"; do
  if [ "\$prev" = "-w" ] && [[ "\$arg" == *"http_code"* ]]; then
    printf '%s' "\${MOCK_CURL_STATUS:-200}"
    exit 0
  fi
  if [ "\$arg" = "-X" ]; then
    :
  elif [ "\$prev" = "-X" ] && [ "\$arg" = "POST" ]; then
    is_post=1
  elif [ "\$prev" = "-d" ]; then
    body="\$arg"
  elif [[ "\$arg" == http* ]]; then
    url="\$arg"
  fi
  prev="\$arg"
done
if [ "\$is_post" = "1" ]; then
  echo "WEBHOOK_CALLED url=\$url body=\$body" >> "\$call_log"
fi
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
# assert_webhook_called <test_name> <label> <expected_body_substring>
# Checks that a webhook was invoked and the log line contains the substring.
# ---------------------------------------------------------------------------
assert_webhook_called() {
  local name="$1"
  local label="$2"
  local expected="$3"
  local call_log="$WORK_DIR/webhook_calls_$label.log"
  if grep -qF "WEBHOOK_CALLED" "$call_log" && grep -qF "$expected" "$call_log"; then
    echo "  PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name"
    echo "    Expected webhook to be called with body containing: $expected"
    echo "    Webhook call log:"
    cat "$call_log" | sed 's/^/      /' || echo "      (empty)"
    FAIL=$((FAIL + 1))
  fi
}

# ---------------------------------------------------------------------------
# assert_webhook_not_called <test_name> <label>
# Checks that no webhook was invoked at all.
# ---------------------------------------------------------------------------
assert_webhook_not_called() {
  local name="$1"
  local label="$2"
  local call_log="$WORK_DIR/webhook_calls_$label.log"
  if ! grep -qF "WEBHOOK_CALLED" "$call_log"; then
    echo "  PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name"
    echo "    Expected webhook NOT to be called, but it was:"
    cat "$call_log" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
}

# ---------------------------------------------------------------------------
# assert_slack_called <test_name> <label> <expected_body_substring>
# Checks that the Slack webhook was invoked and body contains the substring.
# Slack calls are identified by "slack" appearing in the logged URL.
# ---------------------------------------------------------------------------
assert_slack_called() {
  local name="$1"
  local label="$2"
  local expected="$3"
  local call_log="$WORK_DIR/webhook_calls_$label.log"
  if grep "WEBHOOK_CALLED" "$call_log" | grep "slack" | grep -qF "$expected"; then
    echo "  PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name"
    echo "    Expected Slack webhook to be called with body containing: $expected"
    echo "    Webhook call log:"
    cat "$call_log" | sed 's/^/      /' || echo "      (empty)"
    FAIL=$((FAIL + 1))
  fi
}

# ---------------------------------------------------------------------------
# assert_discord_called <test_name> <label> <expected_body_substring>
# Checks that the Discord webhook was invoked and body contains the substring.
# Discord calls are identified by "discord" appearing in the logged URL.
# ---------------------------------------------------------------------------
assert_discord_called() {
  local name="$1"
  local label="$2"
  local expected="$3"
  local call_log="$WORK_DIR/webhook_calls_$label.log"
  if grep "WEBHOOK_CALLED" "$call_log" | grep "discord" | grep -qF "$expected"; then
    echo "  PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name"
    echo "    Expected Discord webhook to be called with body containing: $expected"
    echo "    Webhook call log:"
    cat "$call_log" | sed 's/^/      /' || echo "      (empty)"
    FAIL=$((FAIL + 1))
  fi
}

# ---------------------------------------------------------------------------
# assert_discord_not_called <test_name> <label>
# Checks that the Discord webhook was NOT invoked.
# ---------------------------------------------------------------------------
assert_discord_not_called() {
  local name="$1"
  local label="$2"
  local call_log="$WORK_DIR/webhook_calls_$label.log"
  if ! grep "WEBHOOK_CALLED" "$call_log" | grep -q "discord"; then
    echo "  PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $name"
    echo "    Expected Discord webhook NOT to be called, but it was:"
    cat "$call_log" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
}

# ---------------------------------------------------------------------------
# Tests — script logic
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
# Tests — Slack notification behaviour
# ---------------------------------------------------------------------------
echo ""
echo "--- Notification: 401 sends Slack alert with repo name and reason ---"
mock_bin=$(make_mock_bin n1)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="bad_token" \
  GITHUB_REPOSITORY="owner/repo" \
  SLACK_WEBHOOK_URL="https://hooks.slack.example/test" \
  MOCK_CURL_STATUS="401")
assert_webhook_called \
  "Slack alert sent on 401 with repo name" \
  "n1" \
  "owner/repo"
assert_webhook_called \
  "Slack alert sent on 401 with failure reason" \
  "n1" \
  "invalid or expired"
assert_webhook_called \
  "Slack alert sent on 401 contains standard alert title" \
  "n1" \
  "GitHub backup failed"

# ------------------------------------------------------------------
echo ""
echo "--- Notification: 403 sends Slack alert with repo name and reason ---"
mock_bin=$(make_mock_bin n2)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="bad_token" \
  GITHUB_REPOSITORY="owner/repo" \
  SLACK_WEBHOOK_URL="https://hooks.slack.example/test" \
  MOCK_CURL_STATUS="403")
assert_webhook_called \
  "Slack alert sent on 403 with repo name" \
  "n2" \
  "owner/repo"
assert_webhook_called \
  "Slack alert sent on 403 with failure reason" \
  "n2" \
  "403"

# ------------------------------------------------------------------
echo ""
echo "--- Notification: failed git push sends Slack alert ---"
mock_bin=$(make_mock_bin n3)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="valid_token" \
  GITHUB_REPOSITORY="owner/repo" \
  SLACK_WEBHOOK_URL="https://hooks.slack.example/test" \
  MOCK_CURL_STATUS="200" \
  MOCK_GIT_EXIT="1")
assert_webhook_called \
  "Slack alert sent on git push failure with repo name" \
  "n3" \
  "owner/repo"

# ------------------------------------------------------------------
echo ""
echo "--- Notification: no alert when SLACK_WEBHOOK_URL is unset ---"
mock_bin=$(make_mock_bin n4)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="bad_token" \
  GITHUB_REPOSITORY="owner/repo" \
  MOCK_CURL_STATUS="401")
assert_webhook_not_called \
  "no Slack alert when SLACK_WEBHOOK_URL is absent" \
  "n4"

# ------------------------------------------------------------------
echo ""
echo "--- Notification: no alert on successful push ---"
mock_bin=$(make_mock_bin n5)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="valid_token" \
  GITHUB_REPOSITORY="owner/repo" \
  SLACK_WEBHOOK_URL="https://hooks.slack.example/test" \
  MOCK_CURL_STATUS="200")
assert_webhook_not_called \
  "no Slack alert on successful push" \
  "n5"

# ---------------------------------------------------------------------------
# Tests — Discord notification behaviour
# ---------------------------------------------------------------------------
echo ""
echo "--- Discord notification: 401 sends Discord alert with repo name and reason ---"
mock_bin=$(make_mock_bin d1)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="bad_token" \
  GITHUB_REPOSITORY="owner/repo" \
  DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/test" \
  MOCK_CURL_STATUS="401")
assert_discord_called \
  "Discord alert sent on 401 with repo name" \
  "d1" \
  "owner/repo"
assert_discord_called \
  "Discord alert sent on 401 with failure reason" \
  "d1" \
  "invalid or expired"
assert_discord_called \
  "Discord alert sent on 401 uses Discord content format" \
  "d1" \
  '"content"'

# ------------------------------------------------------------------
echo ""
echo "--- Discord notification: 403 sends Discord alert ---"
mock_bin=$(make_mock_bin d2)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="bad_token" \
  GITHUB_REPOSITORY="owner/repo" \
  DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/test" \
  MOCK_CURL_STATUS="403")
assert_discord_called \
  "Discord alert sent on 403 with repo name" \
  "d2" \
  "owner/repo"
assert_discord_called \
  "Discord alert sent on 403 with failure reason" \
  "d2" \
  "403"

# ------------------------------------------------------------------
echo ""
echo "--- Discord notification: failed git push sends Discord alert ---"
mock_bin=$(make_mock_bin d3)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="valid_token" \
  GITHUB_REPOSITORY="owner/repo" \
  DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/test" \
  MOCK_CURL_STATUS="200" \
  MOCK_GIT_EXIT="1")
assert_discord_called \
  "Discord alert sent on git push failure with repo name" \
  "d3" \
  "owner/repo"

# ------------------------------------------------------------------
echo ""
echo "--- Discord notification: no alert when DISCORD_WEBHOOK_URL is unset ---"
mock_bin=$(make_mock_bin d4)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="bad_token" \
  GITHUB_REPOSITORY="owner/repo" \
  MOCK_CURL_STATUS="401")
assert_discord_not_called \
  "no Discord alert when DISCORD_WEBHOOK_URL is absent" \
  "d4"

# ------------------------------------------------------------------
echo ""
echo "--- Discord notification: no alert on successful push ---"
mock_bin=$(make_mock_bin d5)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="valid_token" \
  GITHUB_REPOSITORY="owner/repo" \
  DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/test" \
  MOCK_CURL_STATUS="200")
assert_discord_not_called \
  "no Discord alert on successful push" \
  "d5"

# ------------------------------------------------------------------
echo ""
echo "--- Both channels: Slack AND Discord fire when both are configured ---"
mock_bin=$(make_mock_bin d6)
out=$(run_script "$mock_bin" \
  GITHUB_TOKEN="bad_token" \
  GITHUB_REPOSITORY="owner/repo" \
  SLACK_WEBHOOK_URL="https://hooks.slack.example/test" \
  DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/test" \
  MOCK_CURL_STATUS="401")
assert_slack_called \
  "Slack alert fires independently when both channels are configured" \
  "d6" \
  "GitHub backup failed"
assert_discord_called \
  "Discord alert fires independently when both channels are configured" \
  "d6" \
  "GitHub backup failed"

# ---------------------------------------------------------------------------
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
