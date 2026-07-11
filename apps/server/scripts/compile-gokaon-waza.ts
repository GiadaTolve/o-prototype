/**
 * Compila catalogo waza Gōkaon sul database locale (DATABASE_URL).
 * Per Neon: bun run scripts/compile-gokaon-waza.ts --neon
 */
import { config } from "dotenv";
import { resolve } from "path";
import postgres from "postgres";
import { validateEffettiSchema } from "../src/modules/waza/effetti-validator";
import {
  computeAtomiUsati,
  computeStatoCodifica,
} from "../src/modules/waza/waza-admin-derive";
import { GOKAON_CATALOG, gokaonDescrizione } from "./gokaon-catalog-data";

config({ path: resolve(import.meta.dir, "../../../.env") });

const useNeon = process.argv.includes("--neon");

async function main() {
  const raw = useNeon ? process.env.NEON_DATABASE_URL : process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(useNeon ? "NEON_DATABASE_URL mancante" : "DATABASE_URL mancante");
  }
  const u = new URL(raw);
  u.searchParams.delete("options");
  const sql = postgres(u.toString());
  const target = useNeon ? "Neon" : "locale";

  try {
    for (const entry of GOKAON_CATALOG) {
      const validation = validateEffettiSchema(entry.effetti);
      if (!validation.valid) {
        console.error(`INVALID ${entry.slug}`, validation.errors);
        process.exit(1);
      }

      const atomiUsati = computeAtomiUsati(entry.effetti);
      const statoCodifica = computeStatoCodifica(entry.effetti);
      const descrizione = gokaonDescrizione(entry);

      const [row] = await sql`
        SELECT w.id AS waza_id, v.numero
        FROM waza w
        JOIN waza_versioni v ON v.waza_id = w.id
        WHERE w.slug = ${entry.slug} AND w.genitore = 'Gōkaon'
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
      const scelteAlLancio = entry.scelteAlLancio ?? [];
      const skiruIr = [...(entry.skiruIr ?? [])].sort((a, b) => a.localeCompare(b));

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
          scelte_al_lancio = ${sql.json(scelteAlLancio as never)},
          skiru_ir = ${sql.json(skiruIr as never)},
          salvata_il = NOW()
        WHERE waza_id = ${row.waza_id} AND numero = ${row.numero}
      `;

      const skiruTxt = skiruIr.length > 0 ? ` · IR: ${skiruIr.join(", ")}` : "";
      console.log(
        `${entry.nomeRomaji} (${entry.kanji}) — ${entry.nomeItaliano}: ${statoCodifica} [${atomiUsati.join(", ")}]${skiruTxt}`,
      );
    }
    console.log(`OK ${GOKAON_CATALOG.length} waza Gōkaon → DB ${target}`);
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
