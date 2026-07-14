/**
 * Compila catalogo waza Hadō-dō sul database locale (DATABASE_URL).
 * Per Neon: bun run scripts/compile-hado-waza.ts --neon
 * Singola waza: bun run scripts/compile-hado-waza.ts -- --slug toshi-investimento-energetico
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
  HADO_CATALOG,
  allHadoImplementazioneNotes,
  hadoDescrizione,
  type HadoCatalogEntry,
} from "./hado-catalog-data";

config({ path: resolve(import.meta.dir, "../../../.env") });

const useNeon = process.argv.includes("--neon");
const GENITORE = "Hadō-dō";

function slugFilter(): string | null {
  const i = process.argv.indexOf("--slug");
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

async function main() {
  const onlySlug = slugFilter();
  const entries: HadoCatalogEntry[] = onlySlug
    ? HADO_CATALOG.filter((e) => e.slug === onlySlug)
    : HADO_CATALOG;

  if (onlySlug && entries.length === 0) {
    console.error(`Slug non in catalogo Hadō: ${onlySlug}`);
    process.exit(1);
  }

  const raw = useNeon ? process.env.NEON_DATABASE_URL : process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(useNeon ? "NEON_DATABASE_URL mancante" : "DATABASE_URL mancante");
  }
  if (!useNeon) {
    const neon = process.env.NEON_DATABASE_URL;
    if (neon && raw === neon) {
      console.error("⚠ Abort: DATABASE_URL coincide con NEON_DATABASE_URL. Usa --neon.");
      process.exit(1);
    }
  }
  const u = new URL(raw);
  u.searchParams.delete("options");
  const sql = postgres(u.toString());
  const target = useNeon ? "Neon" : "locale";

  try {
    for (const entry of entries) {
      const validation = validateEffettiSchema(entry.effetti);
      if (!validation.valid) {
        console.error(`INVALID ${entry.slug}`, validation.errors);
        process.exit(1);
      }

      const atomiUsati = computeAtomiUsati(entry.effetti);
      const statoCodifica = computeStatoCodifica(entry.effetti);
      const descrizione = hadoDescrizione(entry);

      const [row] = await sql`
        SELECT w.id AS waza_id, w.tier AS tier_db, w.categoria, w.genitore, v.numero
        FROM waza w
        JOIN waza_versioni v ON v.waza_id = w.id
        WHERE w.slug = ${entry.slug}
        ORDER BY v.numero DESC
        LIMIT 1
      `;
      if (!row) {
        console.error(`MISSING ${entry.slug}`);
        process.exit(1);
      }

      if (row.categoria !== "do" || row.genitore !== GENITORE) {
        await sql`
          UPDATE waza
          SET categoria = 'do', genitore = ${GENITORE}
          WHERE id = ${row.waza_id}
        `;
        console.log(`↻ Taxonomy ${entry.slug}: → do / ${GENITORE}`);
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

    console.log(`\nOK ${entries.length} waza Hadō-dō → DB ${target}`);
    const notes = allHadoImplementazioneNotes();
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
