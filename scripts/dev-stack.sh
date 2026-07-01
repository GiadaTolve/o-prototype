#!/usr/bin/env bash
# Avvia API (4000) e client Next (3000). Ctrl+C termina entrambi.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bun run kill:4000 2>/dev/null || true

bun run dev:server &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Attendo che l'API sia pronta…"
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/health" 2>/dev/null | grep -q "^20"; then
    break
  fi
  sleep 1
done

bun run dev:client
