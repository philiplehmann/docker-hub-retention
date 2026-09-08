#!/usr/bin/env bash
set -euo pipefail

VERSION_TYPE="${VERSION_TYPE:-patch}"

# Last release tag (empty if this is the first release)
PREVIOUS_TAG="$(git describe --tags --abbrev=0 2>/dev/null || true)"

# Bump the version in package.json and get the new tag name (e.g. v1.2.3)
VERSION="$(npm version "$VERSION_TYPE" --git-tag-version=false)"

NOTES_FILE="$(mktemp)"
trap 'rm -f "$NOTES_FILE"' EXIT

if [ -n "$PREVIOUS_TAG" ]; then
  COMMIT_RANGE="$PREVIOUS_TAG..HEAD"
else
  COMMIT_RANGE="HEAD"
fi

{
  echo "## What's Changed"
  echo
  git log "$COMMIT_RANGE" --no-merges --pretty=format:'- %s (%h)'
  echo
  echo
  echo "## Contributors"
  echo
  git log "$COMMIT_RANGE" --no-merges --pretty=format:'%an' | sort -u | sed 's/^/- /'
  echo

  if [ -n "$PREVIOUS_TAG" ]; then
    echo
    echo "**Full Changelog**: https://github.com/${GITHUB_REPOSITORY:-philiplehmann/docker-hub-retention}/compare/${PREVIOUS_TAG}...${VERSION}"
  fi
} > "$NOTES_FILE"

gh release create "$VERSION" -t "$VERSION" -d=false -p=false -F "$NOTES_FILE"
