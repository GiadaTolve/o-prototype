#!/usr/bin/env bash
# Scarica lo snapshot completo da Neon (o da DATABASE_URL remoto) e lo ripristina
# sul Postgres locale, così il team non rifà migrazioni/dati a mano.
#
# Prerequisiti: pg_dump, pg_restore, Postgres locale in ascolto.
#
# Configurazione in .env (root del repo):
#   NEON_DATABASE_URL=postgres://...   # sorgente team (Neon)
#   LOCAL_DATABASE_URL=postgres://localhost:5432/oyasumi_2   # destinazione (default)
#
# Se NEON_DATABASE_URL non è impostato, usa DATABASE_URL come sorgente
# (solo se l'host non è localhost).
#
# Uso:
#   bash scripts/pull-db-from-neon.sh
#   bash scripts/pull-db-from-neon.sh --dry-run   # solo dump, niente restore
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DRY_RUN=false
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY_RUN=true
  fi
done

load_env_from_dotenv() {
  (
    cd "$ROOT/apps/server" && bun -e "
      import { config } from 'dotenv';
      import { resolve } from 'path';
      config({ path: resolve(import.meta.dir, '../../.env'), quiet: true });
      for (const k of ['NEON_DATABASE_URL', 'DATABASE_URL', 'LOCAL_DATABASE_URL']) {
        const v = process.env[k];
        if (v) process.stdout.write(k + '=' + v + '\n');
      }
    " 2>/dev/null
  )
}

if [[ -f .env ]]; then
  while IFS= read -r line; do
    [[ -n "$line" ]] && export "$line"
  done < <(load_env_from_dotenv)
fi

SOURCE_URL="${NEON_DATABASE_URL:-${DATABASE_URL:-}}"
LOCAL_URL="${LOCAL_DATABASE_URL:-postgres://localhost:5432/oyasumi_2}"

# Neon pooler rifiuta `options=search_path` in pg_dump — usa endpoint diretto e togli options.
normalize_neon_source_url() {
  local url="$1"
  url="${url//-pooler.c-/.c-}"
  url="$(printf '%s' "$url" | sed -E 's/[?&]options=[^&]*//g; s/[?&]$//')"
  printf '%s' "$url"
}
SOURCE_URL="$(normalize_neon_source_url "$SOURCE_URL")"

if [[ -z "$SOURCE_URL" ]]; then
  echo "Errore: imposta NEON_DATABASE_URL o DATABASE_URL in .env"
  exit 1
fi

if [[ "$SOURCE_URL" == *"@localhost"* ]] || [[ "$SOURCE_URL" == *"127.0.0.1"* ]]; then
  echo "Errore: la sorgente sembra essere già locale. Imposta NEON_DATABASE_URL con la connection string Neon."
  exit 1
fi

if [[ "$SOURCE_URL" == "$LOCAL_URL" ]]; then
  echo "Errore: sorgente e destinazione sono identiche."
  exit 1
fi

for cmd in pg_dump pg_restore; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Errore: $cmd non trovato. Installa PostgreSQL client (brew install postgresql@18)."
    exit 1
  fi
done

# Neon usa Postgres 17+; preferisci client recente se installato via Homebrew
for ver in 18 17 16 15; do
  PG_BIN="/opt/homebrew/opt/postgresql@${ver}/bin"
  if [[ -x "$PG_BIN/pg_dump" ]]; then
    export PATH="$PG_BIN:$PATH"
    break
  fi
done

CACHE_DIR="$ROOT/.cache/db-snapshots"
mkdir -p "$CACHE_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP_FILE="$CACHE_DIR/oyasumi-neon-$STAMP.dump"
LATEST_LINK="$CACHE_DIR/oyasumi-neon-latest.dump"

echo "── Pull database Neon → locale ──"
echo "  Sorgente:  (Neon / remoto)"
echo "  Destinazione: $LOCAL_URL"
echo "  Dump: $DUMP_FILE"
echo ""

echo "1/2 pg_dump (schema + dati)…"
pg_dump "$SOURCE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --verbose \
  --file="$DUMP_FILE"

ln -sf "$(basename "$DUMP_FILE")" "$LATEST_LINK"

if $DRY_RUN; then
  echo ""
  echo "Dry-run: dump salvato, restore saltato."
  echo "Per ripristinare: pg_restore --clean --if-exists --no-owner --no-acl -d \"\$LOCAL_DATABASE_URL\" \"$DUMP_FILE\""
  exit 0
fi

echo ""
echo "2/2 pg_restore su database locale…"
# Termina connessioni attive al DB locale (es. server dev)
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();" 2>/dev/null || true

# pg_restore può uscire con warning non fatali (--clean su oggetti mancanti)
set +e
pg_restore \
  --dbname="$LOCAL_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --verbose \
  "$DUMP_FILE"
RESTORE_EXIT=$?
set -e

if [[ $RESTORE_EXIT -gt 1 ]]; then
  echo "Errore pg_restore (exit $RESTORE_EXIT)"
  exit "$RESTORE_EXIT"
fi

if [[ $RESTORE_EXIT -eq 1 ]]; then
  echo ""
  echo "⚠ pg_restore ha segnalato warning (es. FK su record orfani). Verifica i conteggi tabelle critiche."
fi

echo ""
echo "3/3 Allineamento schema locale (patch post-pull)…"
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 -f "$ROOT/scripts/align-schema-after-pull.sql" >/dev/null
echo "   Patch schema applicata."

echo ""
echo "✓ Database locale allineato a Neon."
echo ""
echo "Per sviluppare in locale, in .env:"
echo "  DATABASE_URL=$LOCAL_URL"
echo ""
echo "I collaboratori possono:"
echo "  1) Condividere NEON_DATABASE_URL nel password manager e lanciare questo script, oppure"
echo "  2) Usare direttamente Neon in DATABASE_URL (nessun pull necessario)."
