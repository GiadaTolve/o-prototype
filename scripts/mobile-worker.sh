#!/usr/bin/env bash
# Avvia il worker Cursor sul Mac così l'app iOS può usare questa macchina (My Machines).
# Uso: bash scripts/mobile-worker.sh
# Tieni il terminale aperto (o usa launchd — vedi AGENTS.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CURSOR_BIN="${CURSOR_BIN:-/Applications/Cursor.app/Contents/Resources/app/bin/cursor}"

if [[ ! -x "$CURSOR_BIN" ]]; then
  echo "Cursor CLI non trovato in $CURSOR_BIN"
  echo "Imposta CURSOR_BIN al percorso di cursor sul tuo Mac."
  exit 1
fi

if ! "$CURSOR_BIN" agent status 2>/dev/null | grep -qi "logged in"; then
  echo "→ Login Cursor Agent sul Mac (stesso account dell'app iPhone)…"
  echo "  Si aprirà il browser; completa l'accesso."
  "$CURSOR_BIN" agent login
fi

echo "→ Avvio worker per: $ROOT"
echo "  Su iPhone: nuovo agente → scegli questa macchina come worker."
echo "  Nome macchina: ${CURSOR_WORKER_NAME:-$(hostname -s)}"
echo ""

exec "$CURSOR_BIN" agent worker start \
  --worker-dir "$ROOT" \
  --name "${CURSOR_WORKER_NAME:-Giada-Mac-o-prototype}" \
  --verbose
