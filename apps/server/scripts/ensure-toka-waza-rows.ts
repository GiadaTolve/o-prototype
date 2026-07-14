/**
 * Inserisce righe waza + waza_versioni mancanti per il catalogo Tōka-dō.
 * Usato da compile-toka-waza prima degli UPDATE.
 */
import type postgres from "postgres";
import {
  TOKA_CATALOG,
  type TokaCatalogEntry,
  tokaDescrizione,
} from "./toka-catalog-data";

const GENITORE = "Tōka-dō";

function rowTipo(entry: TokaCatalogEntry): "passiva" | "attiva" {
  return entry.cs != null && entry.cs > 0 ? "attiva" : "passiva";
}

async function resolveSalvataDa(sql: postgres.Sql): Promise<string> {
  const [row] = await sql`SELECT salvata_da FROM waza_versioni LIMIT 1`;
  if (!row?.salvata_da) {
    throw new Error("Nessun utente salvata_da trovato in waza_versioni.");
  }
  return row.salvata_da as string;
}

export async function ensureTokaWazaRows(sql: postgres.Sql): Promise<number> {
  let inserted = 0;
  const salvataDa = await resolveSalvataDa(sql);

  for (const entry of TOKA_CATALOG) {
    const [existing] = await sql`
      SELECT w.id AS waza_id, v.numero
      FROM waza w
      LEFT JOIN waza_versioni v ON v.waza_id = w.id AND v.numero = 1
      WHERE w.slug = ${entry.slug} AND w.genitore = ${GENITORE}
    `;
    if (existing?.numero != null) continue;

    const tipo = rowTipo(entry);
    const descrizione = tokaDescrizione(entry);
    const cs = entry.cs ?? 0;
    const tempoQuarti = entry.tempoQuarti ?? null;
    const tags = entry.tags ?? [];
    const skiruIr = [...(entry.skiruIr ?? [])].sort((a, b) => a.localeCompare(b));

    let wazaId = existing?.waza_id as string | undefined;
    if (!wazaId) {
      const [created] = await sql`
        INSERT INTO waza (slug, categoria, genitore, tipo, tier)
        VALUES (${entry.slug}, 'do', ${GENITORE}, ${tipo}, ${entry.tier ?? null})
        RETURNING id
      `;
      wazaId = created.id as string;
    }

    await sql`
      INSERT INTO waza_versioni (
        waza_id, numero, stato, nome_romaji, nome_italiano, kanji, kanji_verificato,
        descrizione, cs, tempo_quarti, tags, scelte_al_lancio, effetti, skiru_ir,
        atomi_usati, stato_codifica, salvata_da
      )
      VALUES (
        ${wazaId}, 1, 'bozza', ${entry.nomeRomaji}, ${entry.nomeItaliano}, ${entry.kanji}, TRUE,
        ${descrizione}, ${cs}, ${tempoQuarti}, ${sql.json(tags as never)}, '[]'::jsonb,
        ${sql.json(entry.effetti as never)}, ${sql.json(skiruIr as never)},
        '[]'::jsonb, 'da_codificare', ${salvataDa}
      )
    `;

    inserted += 1;
    console.log(`+ INSERT ${entry.slug}`);
  }

  return inserted;
}
