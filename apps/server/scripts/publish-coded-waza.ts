/**
 * Pubblica in blocco le waza già codificate (stato_codifica automatica/ibrida/manuale).
 * Solo locale: usa DATABASE_URL (rifiuta se coincide con NEON_DATABASE_URL).
 *
 *   cd apps/server && bun run scripts/publish-coded-waza.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
import postgres from "postgres";

config({ path: resolve(import.meta.dir, "../../../.env") });

const CODED_STATES = ["automatica", "ibrida", "manuale"] as const;

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL mancante in .env");

  const neon = process.env.NEON_DATABASE_URL;
  if (neon && raw === neon) {
    console.error("⚠ Abort: DATABASE_URL coincide con NEON. Script solo per DB locale.");
    process.exit(1);
  }

  const u = new URL(raw);
  u.searchParams.delete("options");
  const sql = postgres(u.toString());

  try {
    const before = await sql`
      SELECT stato, COUNT(*)::int AS n
      FROM waza_versioni
      WHERE stato_codifica = ANY(${CODED_STATES})
      GROUP BY stato
      ORDER BY stato
    `;

    const result = await sql.begin(async (tx) => {
      const published = await tx`
        UPDATE waza_versioni
        SET stato = 'pubblicata', salvata_il = NOW()
        WHERE stato_codifica = ANY(${CODED_STATES})
          AND stato IN ('bozza', 'validata')
        RETURNING id, waza_id
      `;

      for (const row of published) {
        await tx`
          UPDATE waza
          SET versione_pubblicata_id = ${row.id}
          WHERE id = ${row.waza_id}
        `;
      }

      return published.length;
    });

    const after = await sql`
      SELECT
        COUNT(*) FILTER (WHERE wv.stato = 'pubblicata')::int AS pubblicate,
        COUNT(*) FILTER (WHERE wv.stato_codifica = 'da_codificare')::int AS ancora_da_codificare
      FROM waza_versioni wv
    `;

    console.log("── Pubblicazione waza codificate (locale) ──");
    console.log("Prima:", before);
    console.log(`Pubblicate ora: ${result}`);
    console.log("Dopo:", after[0]);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
