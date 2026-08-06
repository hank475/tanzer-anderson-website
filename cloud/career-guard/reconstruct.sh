#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUNDLE_DIR="$REPO_ROOT/cloud/career-guard/_bundle"
ARCHIVE="${RUNNER_TEMP:-/tmp}/career-guard-source.tar.gz"
EXPECTED="bcafa616f56ebbd62edb183ff3ba1892306b8239769777508f26de3dedcbc8fc"

parts=("$BUNDLE_DIR"/source.part-*.b64)
if [ ! -e "${parts[0]}" ]; then
  echo "Career Guard source bundle parts are missing." >&2
  exit 1
fi

cat "${parts[@]}" | base64 --decode > "$ARCHIVE"
printf '%s  %s\n' "$EXPECTED" "$ARCHIVE" | sha256sum --check --strict

tar -xzf "$ARCHIVE" -C "$REPO_ROOT"
cd "$REPO_ROOT/cloud/career-guard"
sha256sum --check --strict SHA256SUMS.txt

test -s src/index.js
test -s src/lib.js
test -s public/dashboard.html
test -s wrangler.jsonc
! grep -R -n -E '(972[- )]214|joyvanderson@yahoo\.com|destiny\.anderson972214@gmail\.com)' src/*.js src/generated/*.js --exclude='destiny-profile-core.js' --exclude='henry-profile-core.js' || {
  echo "Unexpected plaintext candidate data found outside encrypted profile records." >&2
  exit 1
}

echo "Career Guard source reconstruction: PASS"
