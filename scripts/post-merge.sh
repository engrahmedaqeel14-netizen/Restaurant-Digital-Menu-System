#!/bin/bash
set -e

pnpm install --frozen-lockfile
pnpm --filter db push

if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_REPOSITORY" ]; then
  echo "WARNING: GITHUB_TOKEN or GITHUB_REPOSITORY is not set — skipping GitHub sync"
  exit 0
fi

git -c "http.extraHeader=Authorization: Basic $(echo -n "x-access-token:${GITHUB_TOKEN}" | base64 -w 0)" \
  push --force "https://github.com/${GITHUB_REPOSITORY}.git" HEAD:main
