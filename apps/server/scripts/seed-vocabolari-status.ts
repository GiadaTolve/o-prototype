/**
 * Popola vocabolari (categoria `status`) per APPLICA_STATUS e condizioni stack(status).
 *
 * Usa solo STATUS_DEFINITIONS dal dominio (nessun status extra).
 * I valori sono gli **slug** StatusId usati in `stack(macchiato) >= N`, non le etichette UI.
 *
 * Esegui da apps/server (idempotente, solo DATABASE_URL locale):
 *   bun run seed-vocabolari-status
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";
import { STATUS_DEFINITIONS } from "@domain/combat/status/catalog";

config({ path: resolve(import.meta.dir, "../../../.env") });

const raw = process.env.DATABASE_URL;
if (!raw) {
  throw new Error("DATABASE_URL mancante");
}
const neon = process.env.NEON_DATABASE_URL;
if (neon && raw === neon) {
  throw new Error("Abort: DATABASE_URL coincide con NEON_DATABASE_URL");
}

const sql = postgres(raw);

try {
  let count = 0;
  await sql.begin(async (tx) => {
    for (const def of Object.values(STATUS_DEFINITIONS)) {
      await tx`
        INSERT INTO vocabolari (categoria, valore, extra, attivo)
        VALUES (
          'status',
          ${def.id},
          ${tx.json({ label: def.label, tag: def.tag, kind: def.kind })},
          TRUE
        )
        ON CONFLICT (categoria, valore) DO UPDATE
        SET extra = COALESCE(vocabolari.extra, '{}'::jsonb) || EXCLUDED.extra,
            attivo = TRUE
      `;
      count += 1;
    }
  });
  console.log(`✓ Vocabolario status: ${count} voci da STATUS_DEFINITIONS (dominio).`);
  for (const def of Object.values(STATUS_DEFINITIONS).sort((a, b) => a.id.localeCompare(b.id))) {
    console.log(`  · ${def.id} — ${def.label} [${def.kind}]`);
  }
} finally {
  await sql.end();
}
