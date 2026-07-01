#!/usr/bin/env bash
# Verifica rapida che l'ambiente cloud sia pronto (senza DB locale).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${BUN_INSTALL:-$HOME/.bun}/bin:$PATH"
command -v bun >/dev/null || { echo "bun missing"; exit 1; }

bunx vitest run \
  packages/domain/src/combat/waza-launch.test.ts \
  packages/domain/src/combat/waza-tag-preview.test.ts

echo "cloud-agent-verify OK"
