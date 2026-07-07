/**
 * Sync waza legacy (skills + catalogo dominio) → waza / waza_versioni (Sprint 1).
 *
 * Prerequisiti:
 *   cd apps/server && bun run add-waza-authoring-tables
 *   cd apps/server && bun run alter-waza-taxonomy
 *   cd apps/server && bun run add-waza-legacy-id
 *
 * Uso (dry-run di default — nessuna scrittura):
 *   bun scripts/sync-waza-from-legacy.ts
 *   bun scripts/sync-waza-from-legacy.ts --execute
 *
 * Variabili:
 *   DATABASE_URL — obbligatoria
 *   WAZA_SYNC_USER_ID — UUID utente per salvata_da (default: primo ADMIN)
 */
import { config } from "dotenv";
import { resolve } from "path";
import { eq } from "drizzle-orm";

config({ path: resolve(import.meta.dir, "../.env") });

import {
  buildLegacySyncPayload,
  hashLegacySyncPayload,
  mapLegacyWazaTaxonomy,
  type LegacyWazaSource,
} from "../packages/domain/src/progression/waza-legacy-sync-map";
import { db } from "../apps/server/src/plugins/db";
import { skills, users, waza, wazaVersioni } from "../apps/server/src/db/schema";
import { listAdminWaza } from "../apps/server/src/modules/waza/waza-catalog.service";

const execute = process.argv.includes("--execute");

type UnmappableRow = {
  poolId: string;
  skillId: string | null;
  name: string;
  family: string;
  reason: string;
};

async function resolveSyncUserId(): Promise<string> {
  const fromEnv = process.env.WAZA_SYNC_USER_ID?.trim();
  if (fromEnv) return fromEnv;

  const admin = await db.query.users.findFirst({
    where: eq(users.role, "ADMIN"),
    columns: { id: true },
  });
  if (!admin) throw new Error("Nessun utente ADMIN trovato. Imposta WAZA_SYNC_USER_ID.");
  return admin.id;
}

function isEmptyEffetti(effetti: unknown): boolean {
  return !Array.isArray(effetti) || effetti.length === 0;
}

async function main() {
  console.log(execute ? "▶ Modalità EXECUTE (scrittura DB)" : "◌ Dry-run (nessuna scrittura). Usa --execute per applicare.");

  const syncUserId = await resolveSyncUserId();
  const legacyRows = await listAdminWaza();
  const dbSkills = await db.query.skills.findMany({
    where: eq(skills.type, "WAZA"),
    columns: {
      id: true,
      poolId: true,
      madoshoId: true,
    },
  });
  const madoshoByPool = new Map(
    dbSkills.filter((s) => s.poolId?.trim()).map((s) => [s.poolId!.trim(), s.madoshoId]),
  );

  const existingWaza = await db.query.waza.findMany({
    columns: { id: true, slug: true, legacyId: true },
  });
  const byLegacyId = new Map(
    existingWaza.filter((w) => w.legacyId).map((w) => [w.legacyId!, w]),
  );
  const bySlug = new Map(existingWaza.map((w) => [w.slug, w]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const unmappable: UnmappableRow[] = [];

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

    const taxonomy = mapLegacyWazaTaxonomy(source);
    if (!taxonomy.mappable) {
      unmappable.push({
        poolId,
        skillId: row.skillId,
        name: row.name,
        family: taxonomy.family,
        reason: taxonomy.reason,
      });
      continue;
    }

    const payload = buildLegacySyncPayload(source);
    if (!payload) continue;

    const hit =
      (payload.legacyId ? byLegacyId.get(payload.legacyId) : undefined) ??
      bySlug.get(payload.slug);

    if (!hit) {
      if (execute) {
        await db.transaction(async (tx) => {
          const [createdWaza] = await tx
            .insert(waza)
            .values({
              slug: payload.slug,
              legacyId: payload.legacyId,
              categoria: payload.categoria,
              genitore: payload.genitore,
              tipo: payload.tipo,
              tier: payload.tier,
            })
            .returning();

          await tx.insert(wazaVersioni).values({
            wazaId: createdWaza.id,
            numero: 1,
            stato: "bozza",
            nomeRomaji: payload.nomeRomaji,
            nomeItaliano: payload.nomeItaliano,
            kanji: payload.kanji,
            kanjiVerificato: false,
            descrizione: payload.descrizione,
            cs: payload.cs,
            tempoQuarti: payload.tempoQuarti,
            tags: payload.tags,
            scelteAlLancio: [],
            effetti: payload.effetti,
            atomiUsati: [],
            statoCodifica: payload.statoCodifica,
            salvataDa: syncUserId,
          });

          bySlug.set(payload.slug, createdWaza);
          if (payload.legacyId) byLegacyId.set(payload.legacyId, createdWaza);
        });
      }
      created += 1;
      continue;
    }

    const versione = await db.query.wazaVersioni.findFirst({
      where: eq(wazaVersioni.wazaId, hit.id),
      orderBy: (v, { asc }) => [asc(v.numero)],
    });

    const editable =
      versione &&
      versione.numero === 1 &&
      versione.stato === "bozza" &&
      isEmptyEffetti(versione.effetti) &&
      versione.statoCodifica === "da_codificare";

    if (!editable) {
      skipped += 1;
      continue;
    }

    const existingWazaRow = await db.query.waza.findFirst({
      where: eq(waza.id, hit.id),
      columns: {
        categoria: true,
        genitore: true,
        tipo: true,
        tier: true,
      },
    });

    const existingHash = hashLegacySyncPayload({
      categoria: existingWazaRow!.categoria as "generica" | "do" | "madosho",
      genitore: existingWazaRow!.genitore,
      tipo: existingWazaRow!.tipo as "passiva" | "attiva",
      tier: existingWazaRow!.tier,
      nomeRomaji: versione!.nomeRomaji,
      nomeItaliano: versione!.nomeItaliano,
      kanji: versione!.kanji,
      descrizione: versione!.descrizione,
      cs: versione!.cs,
      tempoQuarti: versione!.tempoQuarti,
    });

    if (existingHash === payload.contentHash) {
      skipped += 1;
      continue;
    }

    if (execute) {
      await db.transaction(async (tx) => {
        await tx
          .update(waza)
          .set({
            legacyId: payload.legacyId ?? hit.legacyId,
            categoria: payload.categoria,
            genitore: payload.genitore,
            tipo: payload.tipo,
            tier: payload.tier,
          })
          .where(eq(waza.id, hit.id));

        await tx
          .update(wazaVersioni)
          .set({
            nomeRomaji: payload.nomeRomaji,
            nomeItaliano: payload.nomeItaliano,
            kanji: payload.kanji,
            descrizione: payload.descrizione,
            cs: payload.cs,
            tempoQuarti: payload.tempoQuarti,
            salvataIl: new Date(),
            salvataDa: syncUserId,
          })
          .where(eq(wazaVersioni.id, versione!.id));
      });
    }
    updated += 1;
  }

  console.log("\n── Riepilogo sync legacy → nuovo catalogo ──");
  console.log(`  Create:      ${created}`);
  console.log(`  Aggiornate:  ${updated}`);
  console.log(`  Saltate:     ${skipped} (già codificate/validate o invariate)`);
  console.log(`  Non mappabili: ${unmappable.length}`);

  if (unmappable.length > 0) {
    console.log("\n── Da assegnare a mano ──");
    for (const row of unmappable) {
      console.log(`  • [${row.family}] ${row.poolId} — ${row.name}`);
      console.log(`    ${row.reason}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
