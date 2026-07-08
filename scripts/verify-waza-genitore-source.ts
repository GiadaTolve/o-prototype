/**
 * Verifica anti-invenzione: per ogni waza mappata su categoria `do`,
 * distingue se il genitore (Via) proviene da:
 *   - colonna `style_id` legacy (corrispondenza CERTA), oppure
 *   - parsing del prefisso `[Ramo · ...]` nella descrizione (INFERENZA).
 * Non scrive nulla.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { eq } from "drizzle-orm";

config({ path: resolve(import.meta.dir, "../.env") });

import {
  mapLegacyWazaTaxonomy,
  type LegacyWazaSource,
} from "../packages/domain/src/progression/waza-legacy-sync-map";
import { isStyleId, styleIdFromSkillDescription } from "../packages/domain/src/progression/style-hexagon";
import { db } from "../apps/server/src/plugins/db";
import { skills } from "../apps/server/src/db/schema";
import { listAdminWaza } from "../apps/server/src/modules/waza/waza-catalog.service";

async function main() {
  const legacyRows = await listAdminWaza();
  const dbSkills = await db.query.skills.findMany({
    where: eq(skills.type, "WAZA"),
    columns: { id: true, poolId: true, madoshoId: true },
  });
  const madoshoByPool = new Map(
    dbSkills.filter((s) => s.poolId?.trim()).map((s) => [s.poolId!.trim(), s.madoshoId]),
  );

  const byColumn: string[] = [];
  const byInference: { pool: string; name: string; via: string }[] = [];

  for (const row of legacyRows) {
    const poolId = row.poolId?.trim();
    if (!poolId) continue;
    const source: LegacyWazaSource = {
      skillId: row.skillId,
      poolId,
      name: row.name,
      description: row.description,
      effect: row.effect,
      rank: row.rank,
      isPassive: row.isPassive,
      styleId: row.styleId,
      madoshoId: madoshoByPool.get(poolId) ?? null,
    };
    const tax = mapLegacyWazaTaxonomy(source);
    if (!tax.mappable || tax.categoria !== "do") continue;

    const fromColumn = source.styleId && isStyleId(source.styleId);
    if (fromColumn) {
      byColumn.push(poolId);
    } else {
      const inferred = styleIdFromSkillDescription(source.description);
      byInference.push({ pool: poolId, name: row.name, via: inferred ?? "?" });
    }
  }

  console.log(`\nWaza Dō totali mappate: ${byColumn.length + byInference.length}`);
  console.log(`  Genitore da colonna style_id (CERTO): ${byColumn.length}`);
  console.log(`  Genitore da inferenza descrizione:    ${byInference.length}`);
  if (byInference.length > 0) {
    console.log("\n── Genitori INFERITI (non da corrispondenza certa) ──");
    for (const r of byInference) {
      console.log(`  • [${r.via}] ${r.pool} — ${r.name}`);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
