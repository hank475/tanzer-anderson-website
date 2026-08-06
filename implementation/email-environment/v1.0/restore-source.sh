#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${ROOT}/email-environment-source-v1.0.tar.gz"
EXPECTED="ccda5eeb260417a0396fea788f97b9387c2b554f12b5a5a236b7ccd94c243352"

cat "${ROOT}"/source/email-environment-source-v1.0.tar.gz.b64.part-* \
  | base64 --decode \
  > "${OUT}"

ACTUAL="$(sha256sum "${OUT}" | awk '{print $1}')"
if [[ "${ACTUAL}" != "${EXPECTED}" ]]; then
  echo "Checksum mismatch: expected ${EXPECTED}, received ${ACTUAL}" >&2
  exit 1
fi

tar -xzf "${OUT}" -C "${ROOT}"
(
  cd "${ROOT}/renderer"
  npm test
)

echo "Tanzer Anderson Universal Email Environment v1.0 restored and validated."
