#!/bin/bash
set -e

pnpm install --frozen-lockfile
pnpm --filter db push

BACKUP_LOG_FILE="${BACKUP_LOG_FILE:-/home/runner/workspace/.local/backup-history.json}"

append_backup_entry() {
  local status="$1"
  local message="$2"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local new_entry
  new_entry=$(printf '{"timestamp":"%s","status":"%s","message":"%s"}' "$timestamp" "$status" "$message")
  local existing="[]"
  if [ -f "$BACKUP_LOG_FILE" ]; then
    existing=$(cat "$BACKUP_LOG_FILE")
  fi
  mkdir -p "$(dirname "$BACKUP_LOG_FILE")" 2>/dev/null || true
  node -e "
    const fs = require('fs');
    const existing = JSON.parse(process.argv[1]);
    const entry = JSON.parse(process.argv[2]);
    const updated = [entry, ...existing].slice(0, 50);
    fs.writeFileSync(process.argv[3], JSON.stringify(updated, null, 2));
  " "$existing" "$new_entry" "$BACKUP_LOG_FILE" 2>/dev/null || true
}

# ---------------------------------------------------------------------------
# send_failure_notification <message>
# Sends a Slack (or generic webhook) notification when the GitHub backup fails.
# Requires SLACK_WEBHOOK_URL to be set; silently skips if it is not.
# ---------------------------------------------------------------------------
send_failure_notification() {
  local message="$1"
  if [ -z "$SLACK_WEBHOOK_URL" ]; then
    return 0
  fi
  local repo_label="${GITHUB_REPOSITORY:-unknown repo}"
  local payload
  payload=$(printf '{"text":":warning: *GitHub backup failed* for `%s`\\n%s"}' "$repo_label" "$message")
  curl -s -o /dev/null -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$payload" || true
}

if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_REPOSITORY" ]; then
  echo "WARNING: GITHUB_TOKEN or GITHUB_REPOSITORY is not set — skipping GitHub sync"
  append_backup_entry "skipped" "GITHUB_TOKEN or GITHUB_REPOSITORY not set — GitHub sync skipped"
  exit 0
fi

echo "Verifying GitHub token before push..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${GITHUB_REPOSITORY}" 2>/dev/null) || HTTP_STATUS="network_error"

if [ "$HTTP_STATUS" = "network_error" ]; then
  echo "WARNING: GitHub API check failed (network/DNS error). Attempting push anyway..." >&2
elif [ "$HTTP_STATUS" = "401" ]; then
  msg="The GitHub token is invalid or expired (HTTP 401). Please rotate the GITHUB_TOKEN secret and retry."
  echo "ERROR: $msg" >&2
  send_failure_notification "$msg"
  append_backup_entry "failure" "$msg"
  exit 0
elif [ "$HTTP_STATUS" = "403" ]; then
  msg="The GitHub API returned 403 — the token may lack repo access or push permission, or the rate limit has been hit. Check that GITHUB_TOKEN has 'repo' scope."
  echo "ERROR: $msg" >&2
  send_failure_notification "$msg"
  append_backup_entry "failure" "$msg"
  exit 0
elif [ "$HTTP_STATUS" != "200" ]; then
  echo "WARNING: GitHub API returned unexpected status ${HTTP_STATUS}. Attempting push anyway..." >&2
fi

echo "Pushing to GitHub (${GITHUB_REPOSITORY})..."
if ! git -c "http.extraHeader=Authorization: Basic $(echo -n "x-access-token:${GITHUB_TOKEN}" | base64 -w 0)" \
  push --force "https://github.com/${GITHUB_REPOSITORY}.git" HEAD:main; then
  msg="The git push to ${GITHUB_REPOSITORY} failed. The repository may be unreachable or the token may lack push access. No code was lost — the push simply did not happen."
  echo "ERROR: $msg" >&2
  send_failure_notification "$msg"
  append_backup_entry "failure" "$msg"
  exit 0
fi

echo "GitHub sync complete — pushed to ${GITHUB_REPOSITORY}."
append_backup_entry "success" "Pushed to ${GITHUB_REPOSITORY} successfully"
