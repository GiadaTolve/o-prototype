/**
 * Allinea catalogo chat ↔ skills ↔ waza.legacy_id dopo aggiunte al wazaPool.
 * Solo locale. Dopo: bun run scripts/generate-waza-tag-catalog.ts && bun run scripts/sync-waza-manual.ts
 *
 *   cd apps/server && bun run scripts/fix-waza-chat-catalog-sync.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dir, "../../../.env") });

import postgres from "postgres";

const LOCAL_HINTS = ["localhost", "127.0.0.1"];

/** poolId → nome_romaji in waza_versioni (ultima versione). */
const LEGACY_LINK: Record<string, string> = {
  "hi-o-tsumugu-filatura-della-fiamma": "Hi o Tsumugu",
  "kaeribi-fiamma-del-ritorno": "Kaeribi",
  "tomoshibi-no-ato-traccia-della-luce": "Tomoshibi no Ato",
  "toro-nagashi-lanterna-alla-corrente": "Tōrō Nagashi",
  "toro-lanterna-incisa": "Tōrō",
  "generiche-rasui-trivella-psionica": "Rasui",
};

function assertTargetDb() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL mancante");
  const allowNeon = process.env.ALLOW_NEON_WAZA_ALIGN === "1";
  if (allowNeon) {
    if (LOCAL_HINTS.some((h) => raw.includes(h))) {
      throw new Error("ALLOW_NEON_WAZA_ALIGN: DATABASE_URL deve puntare a Neon");
    }
    return;
  }
  if (process.env.NEON_DATABASE_URL && raw === process.env.NEON_DATABASE_URL) {
    throw new Error("Script solo per DB locale — usa align-waza-chat-neon per Neon");
  }
  if (!LOCAL_HINTS.some((h) => raw.includes(h))) {
    throw new Error("DATABASE_URL non sembra locale");
  }
}

async function main() {
  assertTargetDb();
  const u = new URL(process.env.DATABASE_URL!.replace(/^postgres(ql)?:/, "http:"));
  u.searchParams.delete("options");
  const sql = postgres(u.toString().replace(/^http:/, "postgres:"));

  console.log("── Fix waza chat catalog sync ──\n");

  const rasui = await sql`
    UPDATE waza_versioni wv
    SET nome_italiano = 'Trivella Psionica'
    FROM waza w
    WHERE wv.waza_id = w.id AND w.slug = 'generiche-rasui-trivella-psionica'
      AND wv.numero = (SELECT MAX(numero) FROM waza_versioni wv2 WHERE wv2.waza_id = w.id)
      AND wv.nome_italiano <> 'Trivella Psionica'
    RETURNING wv.nome_romaji, wv.nome_italiano
  `;
  if (rasui.length) console.log(`✓ Rasui nome_italiano → Trivella Psionica`);

  let linked = 0;
  for (const [poolId, romaji] of Object.entries(LEGACY_LINK)) {
    const [skill] = await sql`
      SELECT id, name FROM skills WHERE pool_id = ${poolId} AND type = 'WAZA' LIMIT 1
    `;
    if (!skill) {
      console.warn(`⚠ skill mancante per pool ${poolId} — esegui sync-waza-manual`);
      continue;
    }

    const updated = await sql`
      UPDATE waza w
      SET legacy_id = ${skill.id}
      FROM waza_versioni wv
      WHERE wv.waza_id = w.id
        AND wv.nome_romaji = ${romaji}
        AND wv.numero = (SELECT MAX(numero) FROM waza_versioni wv2 WHERE wv2.waza_id = w.id)
        AND (w.legacy_id IS NULL OR w.legacy_id <> ${skill.id})
      RETURNING w.slug
    `;
    if (updated.length) {
      linked += updated.length;
      console.log(`✓ legacy_id ${poolId} ← ${romaji} (${updated[0].slug})`);
    }
  }

  console.log(`\nCollegamenti legacy_id aggiornati: ${linked}`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
