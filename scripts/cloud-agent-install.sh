#!/usr/bin/env bash
# Idempotent setup for Cursor Cloud Agents (Ubuntu). Runs from repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

bun install 2>/dev/null || true
(cd apps/server && bun install)
(cd apps/client && bun install)

echo "Cloud agent install OK ($(bun --version 2>/dev/null || echo no-bun))"
