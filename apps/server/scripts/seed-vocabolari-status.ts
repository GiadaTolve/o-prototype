/**
 * Popola vocabolari (categoria `status`) per APPLICA_STATUS e condizioni stack(status).
 *
 * Usa solo STATUS_DEFINITIONS dal dominio (nessun status extra).
 * I valori sono gli **slug** StatusId usati in `stack(macchiato) >= N`, non le etichette UI.
 *
 * Esegui da apps/server (idempotente):
 *   bun run seed-vocabolari-status
 *   bun run seed-vocabolari-status -- --neon
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";
import { STATUS_DEFINITIONS } from "@domain/combat/status/catalog";

config({ path: resolve(import.meta.dir, "../../../.env") });

const useNeon = process.argv.includes("--neon");
const raw = useNeon ? process.env.NEON_DATABASE_URL : process.env.DATABASE_URL;
if (!raw) {
  throw new Error(useNeon ? "NEON_DATABASE_URL mancante" : "DATABASE_URL mancante");
}
if (!useNeon) {
  const neon = process.env.NEON_DATABASE_URL;
  if (neon && raw === neon) {
    throw new Error("Abort: DATABASE_URL coincide con NEON_DATABASE_URL. Usa --neon.");
  }
}

const u = new URL(raw);
u.searchParams.delete("options");
const sql = postgres(u.toString());
const target = useNeon ? "Neon" : "locale";

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
  console.log(`✓ Vocabolario status (${target}): ${count} voci da STATUS_DEFINITIONS (dominio).`);
  for (const def of Object.values(STATUS_DEFINITIONS).sort((a, b) => a.id.localeCompare(b.id))) {
    console.log(`  · ${def.id} — ${def.label} [${def.kind}]`);
  }
} finally {
  await sql.end();
}
