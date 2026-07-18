/**
 * Simula combattimento chat tra due PG con build diverse e verifica tutte le waza attive (Neon).
 * Pipeline: catalogo → sandbox → riga lancio → validate CS → processChatWazaAutomation.
 *
 * Solo DB locale (dopo pull Neon):
 *   cd apps/server && bun run scripts/combat-sim-waza-chat.ts
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
  type WazaTagCatalogEntry,
} from "@domain/combat/waza-tag-preview";
import {
  buildFullWazaLaunchLine,
  resolveRelevantLaunchSkiruCandidates,
  validateWazaChatPrerequisites,
} from "@domain/combat/waza-launch";
import { runWazaSandbox } from "@domain/combat/waza-sandbox";
import { WAZA_LAUNCH_PROFILE_DATA } from "@domain/combat/waza-launch-profile-data";
import { validateEffettiSchema } from "../src/modules/waza/effetti-validator";
import { db } from "../src/plugins/db";
import * as schema from "../src/db/schema";
import { characterService } from "../src/modules/characters/characters.service";

const LOCAL_HINTS = ["localhost", "127.0.0.1"];

const SKIRU_ALPHA: Record<string, number> = {
  fudoshin: 9,
  chokaku: 7,
  seimitsu: 8,
  kensei: 9,
  jusei: 7,
  konjou: 8,
  kairiki: 6,
  kansatsu: 7,
  "itten-kokan": 6,
  itami: 5,
  nintai: 7,
};

const SKIRU_BETA: Record<string, number> = {
  fudoshin: 6,
  chokaku: 8,
  hansha: 7,
  reikiryoku: 8,
  byakugan: 6,
  heion: 7,
  kansha: 6,
  kizuato: 5,
  kensei: 7,
  jusei: 8,
  "itten-kokan": 7,
  seimitsu: 6,
};

type Issue = { waza: string; phase: string; detail: string };

function assertLocalDb() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL mancante");
  if (process.env.NEON_DATABASE_URL && raw === process.env.NEON_DATABASE_URL) {
    throw new Error("Usa DB locale (pull Neon prima)");
  }
  if (!LOCAL_HINTS.some((h) => raw.includes(h))) {
    throw new Error("DATABASE_URL non sembra locale");
  }
}

function dbName(r: { nome_romaji: string; nome_italiano: string; kanji: string | null }) {
  const k = r.kanji ? ` (${r.kanji})` : "";
  return `${r.nome_romaji}${k} — ${r.nome_italiano}`;
}

function launchExtras(poolId: string) {
  const f = WAZA_LAUNCH_PROFILE_DATA[poolId];
  if (!f) return {};
  return {
    giurisdizioneCategory: f.needsGiurisdizioneCategory ? ("proiettile" as const) : null,
    suturaKind: f.needsSuturaKind ? ("offensiva" as const) : null,
    decretoText: f.needsDecreto ? "Decreto di prova" : null,
    nagoriShift: f.needsNagoriShift
      ? { from: "liquido" as const, to: "solido" as const }
      : null,
    meisakuLabel: f.needsMeisakuLabel ? "Opera di prova" : null,
    quartoSelected: f.needsQuarto ? (1 as const) : null,
    delayedEffect: f.needsDelayedEffect ?? false,
    trasformaTag:
      f.needsTrasformaTag && f.trasformaFromOptions?.[0] && f.trasformaToOptions?.[0]
        ? {
            dimensione: f.trasformaDimensione ?? "consistenza",
            from: f.trasformaFromOptions[0],
            to: f.trasformaToOptions[0],
          }
        : null,
    seniGakeChoice: f.needsSeniGake
      ? { fibra: "bianche" as const, settore: "gambe" as const }
      : null,
  };
}

function isLaunchable(entry: WazaTagCatalogEntry, preview: ReturnType<typeof resolveWazaTagPreview>) {
  const flags = entry.poolId ? WAZA_LAUNCH_PROFILE_DATA[entry.poolId] : undefined;
  if (entry.isPassive && flags?.needsTrasformaTag) return true;
  if (entry.isPassive) return false;
  if (flags?.masterOnlyCard) return true;
  return preview.tier != null && preview.csCost != null;
}

function pickSkiru(sheet: Record<string, number>, entry: WazaTagCatalogEntry) {
  const cands = resolveRelevantLaunchSkiruCandidates(sheet, entry);
  const a = cands[0] ?? "kensei";
  const b = cands.find((x) => x !== a) ?? "itten-kokan";
  return { a, b: b === a ? "seimitsu" : b };
}

async function ensureDuelist(
  email: string,
  charName: string,
  skiruSheet: Record<string, number>,
  uiMetadata: Record<string, unknown>,
) {
  let user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash: await Bun.password.hash("duel123"),
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
        name: charName,
        surname: "DUEL",
        grade: "Akumu Zankyō",
        currentHp: 45,
        skiruSheet,
        chronoStackState: {
          current: 20,
          accumulating: false,
          skipNextTurn: false,
          overheatTurns: 0,
        },
        uiMetadata,
        baseSlots: 20,
        isRaw: false,
      })
      .returning();
  }
  return { charId: char.id, charName: `${char.name} ${char.surname}`.trim() };
}

async function resetCombatState(charId: string, skiruSheet: Record<string, number>) {
  await db.delete(schema.fieldConstructs).where(eq(schema.fieldConstructs.creatorCharacterId, charId));
  await db
    .update(schema.characters)
    .set({
      currentHp: 45,
      skiruSheet,
      chronoStackState: {
        current: 20,
        accumulating: false,
        skipNextTurn: false,
        overheatTurns: 0,
      },
      uiMetadata: {},
    })
    .where(eq(schema.characters.id, charId));
}

async function grantAllPoolIds(charId: string, poolIds: string[]) {
  if (poolIds.length === 0) return;
  const skills = await db.query.skills.findMany({
    where: inArray(schema.skills.poolId, poolIds),
    columns: { id: true, poolId: true },
  });
  for (const s of skills) {
    const ex = await db.query.characterSkills.findFirst({
      where: and(
        eq(schema.characterSkills.characterId, charId),
        eq(schema.characterSkills.skillId, s.id),
      ),
    });
    if (!ex) {
      await db.insert(schema.characterSkills).values({
        characterId: charId,
        skillId: s.id,
        level: 1,
      });
    }
  }
}

async function main() {
  assertLocalDb();
  const sql = postgres(process.env.DATABASE_URL!);
  const issues: Issue[] = [];

  const rows = await sql<
    Array<{
      slug: string;
      genitore: string | null;
      tipo: string;
      tier: number | null;
      nome_romaji: string;
      nome_italiano: string;
      kanji: string | null;
      effetti: unknown;
      skiru_ir: string[];
      stato_codifica: string;
      skill_name: string | null;
      pool_id: string | null;
    }>
  >`
    SELECT w.slug, w.genitore, w.tipo, w.tier,
           wv.nome_romaji, wv.nome_italiano, wv.kanji, wv.effetti, wv.skiru_ir, wv.stato_codifica,
           s.name AS skill_name, s.pool_id
    FROM waza w
    JOIN waza_versioni wv ON wv.waza_id = w.id
      AND wv.numero = (SELECT MAX(numero) FROM waza_versioni wv2 WHERE wv2.waza_id = w.id)
    LEFT JOIN skills s ON s.id = w.legacy_id
    WHERE w.archiviata = false
      AND wv.stato_codifica IN ('automatica', 'ibrida', 'manuale')
    ORDER BY w.genitore NULLS LAST, wv.nome_romaji
  `;

  let staticOk = 0;
  let launchOk = 0;
  let chatOk = 0;
  let passiveOk = 0;
  const catalogPoolIds = new Set<string>();

  type LaunchCase = {
    label: string;
    chatName: string;
    entry: WazaTagCatalogEntry;
    preview: ReturnType<typeof resolveWazaTagPreview>;
    poolId: string;
  };
  const launchCases: LaunchCase[] = [];

  for (const r of rows) {
    const label = dbName(r);
    const chatName = r.skill_name ?? label;
    const preview = resolveWazaTagPreview(chatName, WAZA_TAG_INDEX);
    const entry = WAZA_TAG_INDEX.get(normalizeWazaLookupKey(chatName));

    if (!preview.found || !entry?.poolId) {
      issues.push({
        waza: label,
        phase: "CATALOG",
        detail: `nome chat «${chatName}» non in catalogo tag`,
      });
      continue;
    }
    catalogPoolIds.add(entry.poolId);

    const schemaVal = validateEffettiSchema(r.effetti ?? []);
    if (!schemaVal.valid) {
      issues.push({
        waza: label,
        phase: "SCHEMA",
        detail: schemaVal.errors?.join("; ") ?? "invalid",
      });
      continue;
    }

    try {
      runWazaSandbox({
        effetti: Array.isArray(r.effetti) ? r.effetti : [],
        tier: r.tier ?? 2,
        skiruIr: Array.isArray(r.skiru_ir) ? r.skiru_ir : ["kensei", "seimitsu"],
        contesto: {
          lanciatore: { skiru: { kensei: 8, seimitsu: 7 }, cs: 15, hp: 40 },
          bersaglio: { hp: 35, scudo: 0, itami: 0 },
          opzioni: { vinciConfrontoIndice: true },
        },
      });
    } catch (e) {
      issues.push({
        waza: label,
        phase: "SANDBOX",
        detail: e instanceof Error ? e.message : String(e),
      });
      continue;
    }

    staticOk++;

    if (entry.isPassive && !WAZA_LAUNCH_PROFILE_DATA[entry.poolId]?.needsTrasformaTag) {
      passiveOk++;
      continue;
    }

    if (!isLaunchable(entry, preview)) {
      issues.push({ waza: label, phase: "LAUNCH_SKIP", detail: "attiva senza tier/cs in catalogo" });
      continue;
    }

    launchCases.push({
      label,
      chatName: entry.name,
      entry,
      preview,
      poolId: entry.poolId,
    });
  }

  const alpha = await ensureDuelist(
    "test_duel_alpha@local.oyasumi",
    "TEST_Duel_Alpha",
    SKIRU_ALPHA,
    { unlockedStyleIds: ["hensei", "naikan", "hado", "ito", "toka", "genzai"] },
  );
  const beta = await ensureDuelist(
    "test_duel_beta@local.oyasumi",
    "TEST_Duel_Beta",
    SKIRU_BETA,
    { unlockedStyleIds: ["hensei", "naikan", "hado", "ito", "toka", "genzai"] },
  );

  const pools = [...catalogPoolIds];
  await grantAllPoolIds(alpha.charId, pools);
  await grantAllPoolIds(beta.charId, pools);

  const participants = [
    { characterId: alpha.charId, name: alpha.charName },
    { characterId: beta.charId, name: beta.charName },
  ];

  let turn = 0;
  for (const c of launchCases) {
    const actor = turn % 2 === 0 ? alpha : beta;
    const target = turn % 2 === 0 ? beta : alpha;
    const sheet = turn % 2 === 0 ? SKIRU_ALPHA : SKIRU_BETA;
    turn++;

    await resetCombatState(actor.charId, sheet);
    await resetCombatState(target.charId, turn % 2 === 0 ? SKIRU_BETA : SKIRU_ALPHA);

    const flags = WAZA_LAUNCH_PROFILE_DATA[c.poolId];
    const { a: skiruA } = pickSkiru(sheet, c.entry);
    const masterOnly = flags?.masterOnlyCard ?? false;

    let line: string;
    try {
      line = buildFullWazaLaunchLine(c.chatName, WAZA_TAG_INDEX, {
        skiruSheet: sheet,
        declaredSkiruId: masterOnly ? null : skiruA,
        poolId: c.poolId,
        currentCs: 18,
        launchExtras: launchExtras(c.poolId),
        target: flags?.needsTarget || !masterOnly ? { characterId: target.charId } : null,
        declareHit: !masterOnly && !flags?.needsDecreto,
        irOverride: 8,
      });
      launchOk++;
    } catch (e) {
      issues.push({
        waza: c.label,
        phase: "LAUNCH",
        detail: e instanceof Error ? e.message : String(e),
      });
      continue;
    }

    const prereq = validateWazaChatPrerequisites({
      content: line,
      wazaIndex: WAZA_TAG_INDEX,
      chronoCsAvailable: 18,
      ownedWazaPoolIds: pools,
    });
    if (!prereq.ok) {
      issues.push({
        waza: c.label,
        phase: "PREREQ",
        detail: prereq.errors.join("; "),
      });
      continue;
    }

    const csCheck = await characterService.validateChatWazaCsOnly(actor.charId, line, {
      roomParticipants: participants,
    });
    if (!csCheck.ok) {
      issues.push({ waza: c.label, phase: "CS_GATE", detail: csCheck.message });
      continue;
    }

    try {
      await characterService.processChatChronoOnMessage(actor.charId, line, line.length, {});
      const result = await characterService.processChatWazaAutomation(actor.charId, line, {
        roomParticipants: participants,
      });
      if (result?.log?.some((l) => /errore|insufficient|Non possiedi/i.test(l))) {
        issues.push({
          waza: c.label,
          phase: "CHAT",
          detail: result.log.filter((l) => /errore|insufficient|Non possiedi/i.test(l)).join(" | "),
        });
        continue;
      }
      await characterService.tickCharacterStatusAfterChatAction(actor.charId, 18);
      chatOk++;
    } catch (e) {
      issues.push({
        waza: c.label,
        phase: "CHAT",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  console.log("═══════════════════════════════════════════════════");
  console.log("  RAPPORTO SIMULAZIONE CHAT WAZA (Neon → locale)");
  console.log("═══════════════════════════════════════════════════\n");
  console.log(`Waza attive codificate:     ${rows.length}`);
  console.log(`Statiche OK (cat+sandbox):  ${staticOk}`);
  console.log(`Passive (solo possesso):    ${passiveOk}`);
  console.log(`Lanciabili in chat:         ${launchCases.length}`);
  console.log(`Riga lancio OK:             ${launchOk}`);
  console.log(`Automazione chat OK:        ${chatOk}`);
  console.log(`Problemi totali:            ${issues.length}\n`);

  console.log("Duelisti:");
  console.log(`  Alpha (Hensei/Naikan): ${alpha.charName} · test_duel_alpha@local.oyasumi / duel123`);
  console.log(`  Beta  (Hadō/Ito mix):  ${beta.charName} · test_duel_beta@local.oyasumi / duel123`);
  console.log(`  Turni simulati: ${turn} (alternati A↔B)\n`);

  if (issues.length) {
    const byPhase = new Map<string, Issue[]>();
    for (const i of issues) {
      const list = byPhase.get(i.phase) ?? [];
      list.push(i);
      byPhase.set(i.phase, list);
    }
    console.log("── PROBLEMI ──");
    for (const [phase, list] of [...byPhase.entries()].sort()) {
      console.log(`\n[${phase}] (${list.length})`);
      for (const i of list.slice(0, 15)) console.log(`  • ${i.waza}: ${i.detail}`);
      if (list.length > 15) console.log(`  … +${list.length - 15} altre`);
    }
  } else {
    console.log("✓ Nessun problema rilevato su tutte le waza lanciabili.");
  }

  await sql.end();
  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
