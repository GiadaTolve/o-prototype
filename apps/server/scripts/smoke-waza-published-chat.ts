/**
 * Smoke test waza pubblicate: audit dominio + personaggi con build diverse + automazione chat.
 *
 * Solo DB locale (rifiuta NEON).
 *   cd apps/server && bun run scripts/smoke-waza-published-chat.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dir, "../../../.env") });

import { and, eq, inArray } from "drizzle-orm";
import postgres from "postgres";
import { WAZA_TAG_INDEX } from "@domain/combat/waza-tag-index";
import {
  normalizeWazaLookupKey,
  resolveWazaTagPreview,
} from "@domain/combat/waza-tag-preview";
import {
  buildFullWazaLaunchLine,
  validateWazaChatPrerequisites,
} from "@domain/combat/waza-launch";
import { runWazaSandbox } from "@domain/combat/waza-sandbox";
import { WAZA_LAUNCH_PROFILE_DATA } from "@domain/combat/waza-launch-profile-data";
import { createStatusContainer } from "@domain/combat/status/engine";
import { processWazaChatAutomation } from "@domain/combat/waza-chat-automation";
import { validateEffettiSchema } from "../src/modules/waza/effetti-validator";
import { db } from "../src/plugins/db";
import * as schema from "../src/db/schema";
import { CharacterService } from "../src/modules/characters/characters.service";

const LOCAL_HINTS = ["localhost", "127.0.0.1"];
const SKIRU_SHEET: Record<string, number> = {
  fudoshin: 8,
  chokaku: 6,
  hansha: 5,
  seimitsu: 7,
  itami: 4,
  konjou: 6,
  kairiki: 5,
  tenshin: 6,
  kakusei: 5,
  nintai: 7,
  kensei: 8,
  jusei: 6,
  "itten-kokan": 5,
  kansatsu: 6,
  byakugan: 4,
  reikiryoku: 5,
};

type BuildSpec = {
  email: string;
  password: string;
  charName: string;
  genitori: string[];
  uiMetadata?: Record<string, unknown>;
};

const BUILDS: BuildSpec[] = [
  {
    email: "test_waza_hensei@local.oyasumi",
    password: "waza123",
    charName: "TEST_Waza_Hensei",
    genitori: ["Hensei-dō", "Hensei-Do"],
    uiMetadata: { unlockedStyleIds: ["hensei"] },
  },
  {
    email: "test_waza_naikan@local.oyasumi",
    password: "waza123",
    charName: "TEST_Waza_Naikan",
    genitori: ["Naikan-dō", "Naikan-Do"],
    uiMetadata: { unlockedStyleIds: ["naikan"] },
  },
  {
    email: "test_waza_hado_ito@local.oyasumi",
    password: "waza123",
    charName: "TEST_Waza_HadoIto",
    genitori: ["Hadō-dō", "Itō-dō"],
    uiMetadata: { unlockedStyleIds: ["hado", "ito"] },
  },
  {
    email: "test_waza_toka_genzai@local.oyasumi",
    password: "waza123",
    charName: "TEST_Waza_TokaGenzai",
    genitori: ["Tōka-dō", "Genzai-Do"],
    uiMetadata: { unlockedStyleIds: ["toka", "genzai"] },
  },
  {
    email: "test_waza_catalog@local.oyasumi",
    password: "waza123",
    charName: "TEST_Waza_Catalog",
    genitori: ["__all_catalog__"],
    uiMetadata: { unlockedStyleIds: ["hado", "ito", "hensei", "naikan", "toka", "genzai"] },
  },
];

function assertLocalDb() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL mancante");
  if (process.env.NEON_DATABASE_URL && raw === process.env.NEON_DATABASE_URL) {
    throw new Error("Abort: DATABASE_URL coincide con NEON");
  }
  if (!LOCAL_HINTS.some((h) => raw.includes(h))) {
    throw new Error("Abort: usa il Postgres locale per questo smoke test");
  }
}

function dbDisplayName(row: {
  nome_romaji: string;
  nome_italiano: string;
  kanji: string | null;
}) {
  const kanji = row.kanji ? ` (${row.kanji})` : "";
  return `${row.nome_romaji}${kanji} — ${row.nome_italiano}`;
}

function launchExtrasForPool(poolId: string) {
  const flags = WAZA_LAUNCH_PROFILE_DATA[poolId];
  if (!flags) return {};
  return {
    giurisdizioneCategory: flags.needsGiurisdizioneCategory ? ("proiettile" as const) : null,
    suturaKind: flags.needsSuturaKind ? ("offensiva" as const) : null,
    decretoText: flags.needsDecreto ? "Test decreto" : null,
    nagoriShift: flags.needsNagoriShift
      ? { from: "liquido" as const, to: "solido" as const }
      : null,
    meisakuLabel: flags.needsMeisakuLabel ? "Opera test" : null,
    quartoSelected: flags.needsQuarto ? (1 as const) : null,
    delayedEffect: flags.needsDelayedEffect ?? false,
    trasformaTag:
      flags.needsTrasformaTag && flags.trasformaFromOptions?.[0] && flags.trasformaToOptions?.[0]
        ? {
            dimensione: flags.trasformaDimensione ?? "consistenza",
            from: flags.trasformaFromOptions[0],
            to: flags.trasformaToOptions[0],
          }
        : null,
    seniGakeChoice: flags.needsSeniGake
      ? { fibra: "bianche" as const, settore: "gambe" as const }
      : null,
  };
}

async function ensureBuildUser(spec: BuildSpec) {
  let user = await db.query.users.findFirst({ where: eq(schema.users.email, spec.email) });
  if (!user) {
    const passwordHash = await Bun.password.hash(spec.password);
    [user] = await db
      .insert(schema.users)
      .values({
        email: spec.email,
        passwordHash,
        role: "PLAYER",
        banState: "NONE",
      })
      .returning();
  }

  let char = await db.query.characters.findFirst({ where: eq(schema.characters.userId, user.id) });
  if (!char) {
    [char] = await db
      .insert(schema.characters)
      .values({
        userId: user.id,
        name: spec.charName,
        surname: "SMOKE",
        grade: "Akumu Zankyō",
        currentHp: 40,
        skiruSheet: SKIRU_SHEET,
        chronoStackState: {
          current: 20,
          accumulating: false,
          skipNextTurn: false,
          overheatTurns: 0,
        },
        uiMetadata: spec.uiMetadata ?? {},
        baseSlots: 20,
        isRaw: false,
      })
      .returning();
  } else {
    await db
      .update(schema.characters)
      .set({
        skiruSheet: SKIRU_SHEET,
        chronoStackState: {
          current: 20,
          accumulating: false,
          skipNextTurn: false,
          overheatTurns: 0,
        },
        uiMetadata: spec.uiMetadata ?? {},
      })
      .where(eq(schema.characters.id, char.id));
  }

  return { userId: user.id, charId: char.id };
}

async function grantWazaForBuild(charId: string, poolIds: string[]) {
  if (poolIds.length === 0) return 0;
  const skillRows = await db.query.skills.findMany({
    where: inArray(schema.skills.poolId, poolIds),
    columns: { id: true, poolId: true, name: true },
  });
  let added = 0;
  for (const skill of skillRows) {
    const existing = await db.query.characterSkills.findFirst({
      where: and(
        eq(schema.characterSkills.characterId, charId),
        eq(schema.characterSkills.skillId, skill.id),
      ),
    });
    if (!existing) {
      await db.insert(schema.characterSkills).values({
        characterId: charId,
        skillId: skill.id,
        level: 1,
      });
      added++;
    }
  }
  return added;
}

async function main() {
  assertLocalDb();
  const sql = postgres(process.env.DATABASE_URL!);
  const characterService = new CharacterService();

  const rows = await sql<
    Array<{
      slug: string;
      tipo: string;
      tier: number | null;
      genitore: string | null;
      nome_romaji: string;
      nome_italiano: string;
      kanji: string | null;
      effetti: unknown;
      skiru_ir: string[];
      skill_name: string | null;
      pool_id: string | null;
    }>
  >`
    SELECT w.slug, w.tipo, w.tier, w.genitore,
           wv.nome_romaji, wv.nome_italiano, wv.kanji, wv.effetti, wv.skiru_ir,
           s.name AS skill_name, s.pool_id
    FROM waza w
    JOIN waza_versioni wv ON wv.waza_id = w.id AND wv.stato = 'pubblicata'
    LEFT JOIN skills s ON s.id = w.legacy_id
    ORDER BY w.genitore NULLS LAST, wv.nome_romaji
  `;

  const issues: string[] = [];
  let catalogOk = 0;
  let schemaOk = 0;
  let sandboxOk = 0;
  let launchOk = 0;
  let autoOk = 0;
  let serviceOk = 0;

  const catalogPoolIds = new Set<string>();
  const byGenitore = new Map<string, string[]>();

  for (const r of rows) {
    const label = dbDisplayName(r);
    const chatName = r.skill_name ?? label;
    const preview = resolveWazaTagPreview(chatName, WAZA_TAG_INDEX);
    const entry = WAZA_TAG_INDEX.get(normalizeWazaLookupKey(chatName));

    if (!preview.found || !entry) {
      issues.push(`CATALOG ${label} → chat «${chatName}»`);
      continue;
    }
    catalogOk++;
    if (entry.poolId) catalogPoolIds.add(entry.poolId);

    const gen = r.genitore ?? "generica";
    const list = byGenitore.get(gen) ?? [];
    if (entry.poolId) list.push(entry.poolId);
    byGenitore.set(gen, list);

    const val = validateEffettiSchema(r.effetti ?? []);
    if (!val.valid) issues.push(`SCHEMA ${label}: ${val.errors?.join("; ")}`);
    else schemaOk++;

    try {
      runWazaSandbox({
        effetti: Array.isArray(r.effetti) ? r.effetti : [],
        tier: r.tier ?? 2,
        skiruIr: Array.isArray(r.skiru_ir) ? r.skiru_ir : ["kensei", "seimitsu"],
        contesto: {
          lanciatore: { skiru: { kensei: 8, seimitsu: 7 }, cs: 15, hp: 35 },
          bersaglio: { hp: 30, scudo: 0, itami: 0 },
          opzioni: { vinciConfrontoIndice: true },
        },
      });
      sandboxOk++;
    } catch (e) {
      issues.push(`SANDBOX ${label}: ${e instanceof Error ? e.message : e}`);
    }

    if (r.tipo === "attiva" && preview.tier) {
      try {
        const line = buildFullWazaLaunchLine(chatName, WAZA_TAG_INDEX, {
          skiruSheet: SKIRU_SHEET,
          declaredSkiruId: "kensei",
          poolId: entry.poolId,
          currentCs: 18,
          launchExtras: launchExtrasForPool(entry.poolId),
          target: { characterId: "smoke-target" },
        });
        launchOk++;

        const prereq = validateWazaChatPrerequisites({
          content: line,
          wazaIndex: WAZA_TAG_INDEX,
          chronoCsAvailable: 18,
          ownedWazaPoolIds: catalogPoolIds,
        });
        if (!prereq.ok) {
          issues.push(`PREREQ ${label}: ${prereq.errors.join("; ")}`);
        }

        if (WAZA_LAUNCH_PROFILE_DATA[entry.poolId]) {
          const auto = processWazaChatAutomation({
            content: line,
            meta: {},
            statusContainer: createStatusContainer(),
            wazaIndex: WAZA_TAG_INDEX,
            chronoCsAvailable: 18,
            actorCharacterId: "smoke-actor",
          });
          if (auto.errors?.length) issues.push(`AUTO ${label}: ${auto.errors.join("; ")}`);
          else autoOk++;
        }
      } catch (e) {
        issues.push(`LAUNCH ${label}: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  console.log("=== Smoke waza pubblicate ===\n");
  console.log(`Pubblicate: ${rows.length}`);
  console.log(`Catalog OK: ${catalogOk}`);
  console.log(`Schema OK: ${schemaOk}`);
  console.log(`Sandbox OK: ${sandboxOk}`);
  console.log(`Launch line OK: ${launchOk}`);
  console.log(`Automazione avanzata OK: ${autoOk}`);

  console.log("\n--- Personaggi test (build diverse) ---");
  for (const spec of BUILDS) {
    const { charId } = await ensureBuildUser(spec);
    let poolIds: string[] = [];
    if (spec.genitori[0] === "__all_catalog__") {
      poolIds = [...catalogPoolIds];
    } else {
      for (const g of spec.genitori) {
        poolIds.push(...(byGenitore.get(g) ?? []));
      }
      poolIds = [...new Set(poolIds)];
    }
    const added = await grantWazaForBuild(charId, poolIds);
    console.log(`  ${spec.charName}: ${poolIds.length} pool, +${added} skill assegnate`);

    const samplePools = poolIds
      .filter((p) => WAZA_LAUNCH_PROFILE_DATA[p])
      .filter((p) => p !== "meisaku-opera-prima" && p !== "shinryaku-invasione")
      .slice(0, 3);
    for (const poolId of samplePools) {
      const entry = [...WAZA_TAG_INDEX.values()].find((e) => e.poolId === poolId);
      if (!entry) continue;
      const line = buildFullWazaLaunchLine(entry.name, WAZA_TAG_INDEX, {
        skiruSheet: SKIRU_SHEET,
        declaredSkiruId: "kensei",
        poolId,
        currentCs: 18,
        launchExtras: launchExtrasForPool(poolId),
        target: { characterId: "smoke-target" },
      });
      try {
        const result = await characterService.processChatWazaAutomation(charId, line, {
          roomParticipants: [{ characterId: "smoke-target", displayName: "Bersaglio" }],
        });
        if (result?.log?.some((l) => l.includes("insufficient") || l.includes("Non possiedi"))) {
          issues.push(`SERVICE ${spec.charName}/${entry.name}: ${result.log.join(" | ")}`);
        } else if (result) {
          serviceOk++;
        }
      } catch (e) {
        issues.push(
          `SERVICE ${spec.charName}/${entry.name}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }
  }

  console.log(`\nIntegrazione CharacterService (campione launch-profile): ${serviceOk} OK`);

  if (issues.length) {
    console.log(`\n❌ Problemi (${issues.length}):`);
    for (const i of issues.slice(0, 40)) console.log(`  - ${i}`);
    if (issues.length > 40) console.log(`  ... +${issues.length - 40} altri`);
    await sql.end();
    process.exit(1);
  }

  console.log("\n✓ Tutte le waza pubblicate passano smoke dominio + chat (catalogo allineato).");
  console.log("\nLogin test:");
  for (const b of BUILDS) {
    console.log(`  ${b.email} / ${b.password} → ${b.charName}`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
