/**
 * Compila catalogo waza Rin'gai/Janjae sul database locale (DATABASE_URL).
 * NON usare --neon senza esplicita richiesta.
 */
import { config } from "dotenv";
import { resolve } from "path";
import postgres from "postgres";
import { validateEffettiSchema } from "../src/modules/waza/effetti-validator";
import {
  computeAtomiUsati,
  computeStatoCodifica,
} from "../src/modules/waza/waza-admin-derive";
import {
  RINGAI_CATALOG,
  allRingaiImplementazioneNotes,
  ringaiDescrizione,
} from "./ringai-catalog-data";

config({ path: resolve(import.meta.dir, "../../../.env") });

const useNeon = process.argv.includes("--neon");
const GENITORE = "Rin'gai/Janjae";

async function main() {
  const raw = useNeon ? process.env.NEON_DATABASE_URL : process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(useNeon ? "NEON_DATABASE_URL mancante" : "DATABASE_URL mancante");
  }
  if (useNeon) {
    console.error("⚠ Abort: usa solo locale. Rimuovi --neon.");
    process.exit(1);
  }
  const u = new URL(raw);
  u.searchParams.delete("options");
  const sql = postgres(u.toString());

  try {
    for (const entry of RINGAI_CATALOG) {
      const validation = validateEffettiSchema(entry.effetti);
      if (!validation.valid) {
        console.error(`INVALID ${entry.slug}`, validation.errors);
        process.exit(1);
      }

      const atomiUsati = computeAtomiUsati(entry.effetti);
      const statoCodifica = computeStatoCodifica(entry.effetti);
      const descrizione = ringaiDescrizione(entry);

      const [row] = await sql`
        SELECT w.id AS waza_id, w.tier AS tier_db, v.numero
        FROM waza w
        JOIN waza_versioni v ON v.waza_id = w.id
        WHERE w.slug = ${entry.slug} AND w.genitore = ${GENITORE}
        ORDER BY v.numero DESC
        LIMIT 1
      `;
      if (!row) {
        console.error(`MISSING ${entry.slug}`);
        process.exit(1);
      }

      const cs = entry.cs ?? 0;
      const tempoQuarti = entry.tempoQuarti ?? null;
      const tags = entry.tags ?? [];
      const skiruIr = [...(entry.skiruIr ?? [])].sort((a, b) => a.localeCompare(b));

      if (entry.tier !== undefined) {
        await sql`
          UPDATE waza SET tier = ${entry.tier}
          WHERE id = ${row.waza_id}
        `;
      }

      await sql`
        UPDATE waza_versioni
        SET
          nome_romaji = ${entry.nomeRomaji},
          nome_italiano = ${entry.nomeItaliano},
          kanji = ${entry.kanji},
          kanji_verificato = TRUE,
          descrizione = ${descrizione},
          effetti = ${sql.json(entry.effetti as never)},
          atomi_usati = ${atomiUsati},
          stato_codifica = ${statoCodifica},
          cs = ${cs},
          tempo_quarti = ${tempoQuarti},
          tags = ${sql.json(tags as never)},
          skiru_ir = ${sql.json(skiruIr as never)},
          salvata_il = NOW()
        WHERE waza_id = ${row.waza_id} AND numero = ${row.numero}
      `;

      const skiruTxt = skiruIr.length > 0 ? ` · IR: ${skiruIr.join(", ")}` : "";
      console.log(
        `${entry.nomeRomaji} (${entry.kanji}) — ${entry.nomeItaliano}: ${statoCodifica} [${atomiUsati.join(", ")}]${skiruTxt}`,
      );
    }

    console.log(`\nOK ${RINGAI_CATALOG.length} waza Rin'gai → DB locale`);
    const notes = allRingaiImplementazioneNotes();
    if (notes.length) {
      console.log("\nNote implementazione:");
      for (const x of notes) console.log(`  · ${x}`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
