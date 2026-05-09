#!/bin/bash
set -e

pnpm install --frozen-lockfile
pnpm --filter db push

if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_REPOSITORY" ]; then
  echo "WARNING: GITHUB_TOKEN or GITHUB_REPOSITORY is not set — skipping GitHub sync"
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
  echo "ERROR: GitHub token is invalid or expired (HTTP 401). GitHub sync skipped." >&2
  echo "ERROR: Please rotate the GITHUB_TOKEN secret and retry." >&2
  exit 0
elif [ "$HTTP_STATUS" = "403" ]; then
  echo "ERROR: GitHub API returned 403 — token may lack repo access or push permission, or the rate limit has been hit. GitHub sync skipped." >&2
  echo "ERROR: Check that GITHUB_TOKEN has 'repo' scope and is not rate-limited, then retry." >&2
  exit 0
elif [ "$HTTP_STATUS" != "200" ]; then
  echo "WARNING: GitHub API returned unexpected status ${HTTP_STATUS}. Attempting push anyway..." >&2
fi

echo "Pushing to GitHub (${GITHUB_REPOSITORY})..."
if ! git -c "http.extraHeader=Authorization: Basic $(echo -n "x-access-token:${GITHUB_TOKEN}" | base64 -w 0)" \
  push --force "https://github.com/${GITHUB_REPOSITORY}.git" HEAD:main; then
  echo "ERROR: GitHub push failed. The repository may be unreachable or the token may lack push access." >&2
  echo "ERROR: Sync to ${GITHUB_REPOSITORY} was not completed — no code was lost, the push simply did not happen." >&2
  exit 0
fi

echo "GitHub sync complete — pushed to ${GITHUB_REPOSITORY}."
