#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
deno fmt --check
deno lint
deno check main.ts lib.ts
CI=true deno test -A

(
  cd site
  deno task check
  deno task build
)
