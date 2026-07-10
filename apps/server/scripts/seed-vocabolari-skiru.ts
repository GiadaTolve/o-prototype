/**
 * Popola vocabolari (categoria `skiru`) con tutti i nodi dell'albero Skiru.
 *
 * Su conflitto, `extra` viene unito campo per campo (jsonb `||`): le chiavi dal
 * catalogo aggiornano ramo/label/categoria_waza ecc., senza cancellare chiavi
 * custom già presenti nel DB (es. effetti meccanici futuri).
 *
 * Esegui da apps/server dopo add-waza-versioni-skiru-ir:
 *   bun run seed-vocabolari-skiru
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";
import { SKIRU_CATALOG } from "@domain/skiru/catalog";

config({ path: resolve(import.meta.dir, "../../../.env") });

const sql = postgres(process.env.DATABASE_URL!);

try {
  let count = 0;
  await sql.begin(async (tx) => {
    for (const skiru of SKIRU_CATALOG) {
      const extra = {
        ramo: skiru.branchId,
        dominio: skiru.domain,
        label: skiru.name,
        ...(skiru.nameRomaji ? { labelRomaji: skiru.nameRomaji } : {}),
        ...(skiru.parentSkiruId ? { parent: skiru.parentSkiruId } : {}),
        ...(skiru.wazaCategoriaPapabile
          ? { categoria_waza: skiru.wazaCategoriaPapabile }
          : {}),
      };
      await tx`
        INSERT INTO vocabolari (categoria, valore, extra, attivo)
        VALUES ('skiru', ${skiru.id}, ${tx.json(extra)}, TRUE)
        ON CONFLICT (categoria, valore) DO UPDATE
        SET extra = COALESCE(vocabolari.extra, '{}'::jsonb) || EXCLUDED.extra,
            attivo = TRUE
      `;
      count += 1;
    }
  });
  console.log(`✓ Vocabolario skiru: ${count} voci sincronizzate dall'albero Skiru.`);
} finally {
  await sql.end();
}
