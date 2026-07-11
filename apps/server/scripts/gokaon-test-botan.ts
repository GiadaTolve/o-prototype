/**
 * Simulazione Gōkaon con scheda reale di Botan (DB locale).
 * bun run scripts/gokaon-test-botan.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
import postgres from "postgres";
import { runWazaSandbox } from "@domain/combat/waza-sandbox";
import { computeLaunchDamagePreview } from "@domain/combat/waza-skiru-riders";
import { resolveDamageToHp } from "@domain/combat/damage-pipeline";
import { calculateConstructResistance } from "@domain/combat/constructs";
import {
  calculateHpMaxFromSkiru,
  calculateMitigationPercentFromSkiru,
  calculateMovementMetersPerQuarterFromSkiru,
} from "@domain/skiru/derived-stats";
import { getSkiruPoints } from "@domain/skiru/progression";
import {
  calculateKongenDamageFloor,
  computeSokaijuCombatSummary,
  formatSokaijuAnchorLiveValue,
  getSokaijuRank,
} from "@domain/skiru/sokaiju-combat";
import { getSkiruDef } from "@domain/skiru/catalog";
import type { SkiruSheet } from "@domain/skiru/types";

config({ path: resolve(import.meta.dir, "../../../.env") });

type GokaonSentiero = "cuore_affamato" | "natura_ferina";

type RisveglioSnapshot = {
  soglieAttive: string[];
  metamorfosiStack: number;
  buffsAttivi: Array<{ skiru: string; delta: number; nota: string }>;
  sheetEffettivo: SkiruSheet;
  malusFineTurno?: string;
  extra: string[];
};

/** Applica buff Risveglio dell'Oni sulla scheda (simulazione Pressione + sentiero). */
function snapshotRisveglio(
  base: SkiruSheet,
  pressione: number,
  sentiero: GokaonSentiero,
): RisveglioSnapshot {
  const sheet: SkiruSheet = { ...base };
  const buffsAttivi: RisveglioSnapshot["buffsAttivi"] = [];
  const soglieAttive: string[] = [];
  const extra: string[] = [];
  let metamorfosiStack = 0;

  const addBuff = (skiru: string, delta: number, nota: string) => {
    sheet[skiru] = (sheet[skiru] ?? 0) + delta;
    buffsAttivi.push({ skiru, delta, nota });
  };

  if (pressione >= 2) {
    soglieAttive.push("Soglia 1 Comunione (2+)");
    metamorfosiStack += 1;
    addBuff("nintai", 2, "tutti i sentieri");
    if (sentiero === "cuore_affamato") addBuff("kairyoku", 1, "Cuore Affamato");
    else addBuff("binsho", 1, "Natura Ferina");
    extra.push("Jigo-Ka alterata · segni visivi soglia 1");
  }

  if (pressione >= 5) {
    soglieAttive.push("Soglia 2 Simbiosi (5+)");
    metamorfosiStack += 1;
    addBuff("nintai", 3, "cumulativo");
    if (sentiero === "cuore_affamato") {
      addBuff("kairyoku", 2, "Cuore Affamato");
      addBuff("binsho", 1, "Cuore Affamato");
    } else {
      addBuff("binsho", 2, "Natura Ferina");
      addBuff("kairyoku", 1, "Natura Ferina");
    }
    extra.push("Gittata waza a Contatto → 3 m");
  }

  if (pressione >= 9) {
    soglieAttive.push("Soglia 3 Rovina (9+)");
    metamorfosiStack += 1;
    if (sentiero === "cuore_affamato") {
      addBuff("kairyoku", 3, "Cuore Affamato");
      addBuff("binsho", 2, "Cuore Affamato");
      extra.push("Taglia Grande (anche armi)");
    } else {
      addBuff("binsho", 3, "Natura Ferina");
      addBuff("kairyoku", 2, "Natura Ferina");
      extra.push("3 occhi (cosmetico)");
    }
    extra.push("Bonus danno prossimo Contatto per metro di movimento (decade dopo colpo)");
  }

  const malusFineTurno =
    pressione >= 9 ? "Metamorfosi −2 stack/turno (invece di −1)" : undefined;

  return {
    soglieAttive,
    metamorfosiStack,
    buffsAttivi,
    sheetEffettivo: sheet,
    malusFineTurno,
    extra,
  };
}

function skiruLabel(id: string): string {
  const d = getSkiruDef(id);
  return d ? `${d.name} (${d.nameRomaji})` : id;
}

function scalingPressioneNote(pressione: number, slug: string): string[] {
  const notes: string[] = [];
  if (pressione >= 3) {
    if (slug === "oni-no-ago") notes.push("Ignora 25% solidità costrutto (Kongen)");
    if (slug === "oni-no-hoko") notes.push("Spinta indietro 3 m su colpiti");
    if (slug === "kotsudan") notes.push("Proiettile da qualunque parte del corpo");
  }
  if (pressione >= 5) {
    if (slug === "oni-no-ago") notes.push("Morso → CONO 4 m [Propagazione Conica][Solido]");
    if (slug === "moshin") notes.push("[Energetica] · gittata carica 15 m");
    if (slug === "jiware") notes.push("Onda sismica anche in altezza (area piena 6 m)");
  }
  return notes;
}

function printRisveglioSnapshot(
  pressione: number,
  snap: RisveglioSnapshot,
  sentiero: GokaonSentiero,
  baseSheet: SkiruSheet,
) {
  console.log(
    `\n  Pressione: **${pressione}** · sentiero: ${sentiero === "cuore_affamato" ? "Cuore Affamato" : "Natura Ferina"}`,
  );
  if (snap.soglieAttive.length === 0) {
    console.log("  Nessuna soglia attiva — aspetto normale, Metamorfosi 0");
    return;
  }
  console.log(`  Soglie: ${snap.soglieAttive.join(" → ")}`);
  console.log(`  Metamorfosi: **${snap.metamorfosiStack}** stack`);
  console.log("  Buff Skiru attivi (sulla scheda effettiva):");
  const merged = new Map<string, number>();
  for (const b of snap.buffsAttivi) {
    merged.set(b.skiru, (merged.get(b.skiru) ?? 0) + b.delta);
  }
  for (const [skiru, total] of merged) {
    const now = getSkiruPoints(snap.sheetEffettivo, skiru);
    const base = now - total;
    console.log(`    · ${skiruLabel(skiru)}: ${base} → **${now}** (+${total})`);
  }
  for (const e of snap.extra) console.log(`    · ${e}`);
  if (snap.malusFineTurno) console.log(`    · Malus: ${snap.malusFineTurno}`);
  console.log(`  Fiuto: raggio ${pressione >= 1 ? 20 : 15} m`);
}

type WazaRow = {
  slug: string;
  nome_italiano: string;
  tier: number | null;
  cs: number;
  skiru_ir: string[];
  tags: string[];
  effetti: unknown[];
  descrizione: string | null;
};

function bestSkiruFromIr(skiruIr: string[], sheet: SkiruSheet): string | null {
  let best: string | null = null;
  let bestPts = -1;
  for (const id of skiruIr) {
    const pts = getSkiruPoints(sheet, id);
    if (pts > bestPts) {
      bestPts = pts;
      best = id;
    }
  }
  return best;
}

function line(title: string) {
  console.log(`\n${"─".repeat(60)}\n${title}\n${"─".repeat(60)}`);
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL mancante");
  const u = new URL(raw);
  u.searchParams.delete("options");
  const sql = postgres(u.toString());

  try {
    const [botan] = await sql`
      SELECT name, surname, madosho_id, skiru_sheet, grade, experience_total
      FROM characters WHERE name ILIKE 'botan' LIMIT 1
    `;
    if (!botan) throw new Error("Personaggio Botan non trovato");

    const sheet = (botan.skiru_sheet ?? {}) as SkiruSheet;
    const wazaRows = (await sql`
      SELECT w.slug, w.tier, v.nome_italiano, v.cs, v.skiru_ir, v.tags, v.effetti, v.descrizione
      FROM waza w
      JOIN waza_versioni v ON v.waza_id = w.id
      WHERE w.genitore = 'Gōkaon'
      ORDER BY w.tier NULLS FIRST, w.slug
    `) as WazaRow[];

    const hpMax = calculateHpMaxFromSkiru(sheet);
    const mitig = calculateMitigationPercentFromSkiru(sheet);
    const mov = calculateMovementMetersPerQuarterFromSkiru(sheet);
    const kongenRank = getSokaijuRank(sheet, "kongen");
    const kongenFloor = calculateKongenDamageFloor(sheet);
    const sokaijuSummary = computeSokaijuCombatSummary(sheet);

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  TEST GŌKAON — Botan (scheda reale, DB locale)           ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    console.log(`\nPG: ${botan.name} ${botan.surname ?? ""} · ${botan.grade}`);
    console.log(`Madoshō in scheda: ${botan.madosho_id ?? "—"} (test con waza Gōkaon)`);
    console.log(`EXP totale: ${botan.experience_total}`);

    console.log("\n▸ Derivati da Skiru");
    console.log(`  HP max: ${hpMax} · Itami: ${getSkiruPoints(sheet, "itami")} (${mitig}% mitig.) · Undō: ${getSkiruPoints(sheet, "undo")} (${mov} m/quarto)`);
    console.log(`  Kensei: ${getSkiruPoints(sheet, "kensei")} · Seimitsu: ${getSkiruPoints(sheet, "seimitsu")} · Shintai Kōkan: ${getSkiruPoints(sheet, "shintai-kokan")}`);

    console.log("\n▸ Sōkaiju rilevanti");
    console.log(`  Kongen rank ${kongenRank} → floor danno +${kongenFloor} · solidità costrutto = (Kongen + tier) × taglia`);
    console.log(`  Gōjin rank ${getSokaijuRank(sheet, "gojin")} · Chōkaku ${getSkiruPoints(sheet, "chokaku")} (sinergia Fiuto)`);
    for (const id of ["kongen", "gojin", "chiko", "tenkan"] as const) {
      console.log(`  · ${formatSokaijuAnchorLiveValue(id, sheet, sokaijuSummary)}`);
    }

    console.log("\n▸ Non automatizzato (Master / lignaggio)");
    console.log("  Pressione (圧), sentiero Yasei/Gashin, soglie Risveglio, scaling 3+/5+ Pressione");

    const nemico: SkiruSheet = { itami: 2, kensei: 2 };
    const bersaglioHp = 35;
    const bersaglioScudo = 0;

    const attive = wazaRows.filter((w) => w.tier != null && w.tier >= 1);

    for (const w of attive) {
      const skiruScelta = bestSkiruFromIr(w.skiru_ir ?? [], sheet);
      const tags = (w.tags ?? []).join("][");

      line(`${w.nome_italiano} (${w.slug}) · T${w.tier} · CS ${w.cs}`);

      if (!skiruScelta) {
        console.log("  ⚠ Botan non ha punti nelle Skiru papabili:", (w.skiru_ir ?? []).join(", "));
        console.log("  (IR basso / non investito nel ramo Gōkaon)");
        continue;
      }

      const preview = computeLaunchDamagePreview({
        tier: w.tier,
        attackerSheet: sheet,
        declaredSkiruId: skiruScelta,
        wazaEffectText: `[${tags}]`,
      });

      if (preview) {
        console.log(`  Skiru dichiarata: ${skiruScelta}`);
        console.log(`  Anteprima danno: ${preview.summary} → **${preview.totalBeforeMitigation}** (pre-mitigazione)`);
      }

      const result = runWazaSandbox({
        effetti: w.effetti,
        tier: w.tier,
        skiruIr: w.skiru_ir,
        contesto: {
          lanciatore: {
            skiru: sheet as Record<string, number>,
            skiruIrFisica: skiruScelta,
            skiruIrIncanalamento: "sochu-kokan",
            cs: 6,
          },
          bersaglio: {
            hp: bersaglioHp,
            scudo: bersaglioScudo,
            skiru: nemico as Record<string, number>,
          },
          opzioni: { vinciConfrontoIndice: true },
        },
      });

      if (result.ir) {
        console.log(
          `  IR: ${result.ir.fisicaId}(${result.ir.fisicaPunti}) + sochu-kokan → media ${result.ir.media} → indice **${result.ir.indice}**`,
        );
      }

      for (const r of result.righe) {
        const prefix = r.kind === "master" ? "  📋" : r.kind === "warn" ? "  ⚠" : "  ";
        console.log(`${prefix} ${r.text}`);
      }

      if (result.dannoFinaleHp != null) {
        const fullPipe = resolveDamageToHp({
          tier: w.tier as 1 | 2 | 3 | 4 | 5,
          attackerSheet: sheet,
          targetSheet: nemico,
          shieldResistance: bersaglioScudo,
        });
        const rider = (preview?.riderBonus ?? 0);
        const withRider = resolveDamageToHp({
          tier: w.tier as 1 | 2 | 3 | 4 | 5,
          attackerSheet: sheet,
          targetSheet: nemico,
          bonuses: { flatBonus: rider },
          shieldResistance: bersaglioScudo,
        });
        console.log(
          `  Pipeline completa (Kongen incluso): base ${withRider.baseDamage} → dopo Itami nemico (${withRider.mitigationPercent}%): **${withRider.hpDamage} HP**`,
        );
        if (rider > 0) {
          console.log(`  (di cui +${rider} rider ${skiruScelta})`);
        }
      }

      if (w.slug === "kotsudan") {
        const hornRes = calculateConstructResistance(kongenRank, w.tier ?? 1, "piccola");
        console.log(`  Corno a terra (Piccola): solidità Kongen = **${hornRes}** (Botan Kongen ${kongenRank})`);
      }

      if (w.slug === "oni-no-ago") {
        console.log("  Nota: costo 2 CS + 2 stack Pressione — non simulato qui");
      }
    }

    line("Risveglio dell'Oni — scenari Pressione simulata");
    const sentiero: GokaonSentiero = "cuore_affamato";
    const pressioni = [0, 2, 5, 9] as const;

    for (const p of pressioni) {
      console.log(`\n══ Pressione ${p} ══`);
      const snap = snapshotRisveglio(sheet, p, sentiero);
      printRisveglioSnapshot(p, snap, sentiero, sheet);
    }

    line("Waza chiave con scheda buffata (Pressione 5 · Cuore Affamato)");
    const p5 = snapshotRisveglio(sheet, 5, sentiero);
    const effSheet = p5.sheetEffettivo;

    const chiave = ["kotsudan", "oni-no-ago", "oni-no-hoko", "moshin"] as const;
    for (const slug of chiave) {
      const w = wazaRows.find((r) => r.slug === slug);
      if (!w || w.tier == null) continue;

      const skiruScelta = bestSkiruFromIr(w.skiru_ir ?? [], effSheet);
      const tags = (w.tags ?? []).join("][");
      const preview = computeLaunchDamagePreview({
        tier: w.tier,
        attackerSheet: effSheet,
        declaredSkiruId: skiruScelta ?? undefined,
        wazaEffectText: `[${tags}]`,
      });
      const rider = preview?.riderBonus ?? 0;
      const pipe = resolveDamageToHp({
        tier: w.tier as 1 | 2 | 3 | 4 | 5,
        attackerSheet: effSheet,
        targetSheet: nemico,
        bonuses: { flatBonus: rider },
        shieldResistance: 0,
      });

      console.log(`\n  ${w.nome_italiano} (T${w.tier})`);
      if (slug === "kotsudan") {
        console.log(
          p5.metamorfosiStack >= 1
            ? "  ✓ Lanciabile (Metamorfosi ≥ 1)"
            : "  ✗ Bloccata (serve Metamorfosi)",
        );
      }
      if (slug === "oni-no-ago") {
        console.log("  Costo: CS 2 + 2 Pressione (consumati) — dopo il lancio Pressione → 3");
      }
      if (skiruScelta && preview) {
        console.log(`  Skiru: ${skiruScelta} · IR stimato con buff: **${Math.round((getSkiruPoints(effSheet, skiruScelta) + getSkiruPoints(effSheet, "sochu-kokan")) / 2)}**`);
        console.log(`  Danno: ${preview.summary} → **${pipe.hpDamage} HP** al nemico (Itami 2)`);
      }
      const scale = scalingPressioneNote(5, slug);
      if (scale.length) console.log(`  Scaling attivo (5+): ${scale.join(" · ")}`);
    }

    line("Waza chiave con scheda buffata (Pressione 9 · Cuore Affamato · Soglia 3)");
    const p9 = snapshotRisveglio(sheet, 9, sentiero);
    const effSheet9 = p9.sheetEffettivo;
    for (const slug of chiave) {
      const w = wazaRows.find((r) => r.slug === slug);
      if (!w || w.tier == null) continue;
      const skiruScelta = bestSkiruFromIr(w.skiru_ir ?? [], effSheet9);
      const preview = computeLaunchDamagePreview({
        tier: w.tier,
        attackerSheet: effSheet9,
        declaredSkiruId: skiruScelta ?? undefined,
        wazaEffectText: `[${(w.tags ?? []).join("][")}]`,
      });
      const rider = preview?.riderBonus ?? 0;
      const pipe = resolveDamageToHp({
        tier: w.tier as 1 | 2 | 3 | 4 | 5,
        attackerSheet: effSheet9,
        targetSheet: nemico,
        bonuses: { flatBonus: rider },
        shieldResistance: 0,
      });
      console.log(
        `\n  ${w.nome_italiano}: ${skiruScelta ?? "—"} · **${pipe.hpDamage} HP** · scaling: ${scalingPressioneNote(9, slug).join(" · ") || "—"}`,
      );
    }
    console.log(`\n  Malus Soglia 3: ${p9.malusFineTurno}`);

    line("Confronto rapido Mascella (Cuore Affamato)");
    for (const p of [0, 2, 5, 9] as const) {
      const snap = snapshotRisveglio(sheet, p, sentiero);
      const ago = wazaRows.find((r) => r.slug === "oni-no-ago");
      if (!ago?.tier) continue;
      const sk = bestSkiruFromIr(ago.skiru_ir ?? [], snap.sheetEffettivo) ?? "shintai-kokan";
      const prev = computeLaunchDamagePreview({
        tier: ago.tier,
        attackerSheet: snap.sheetEffettivo,
        declaredSkiruId: sk,
        wazaEffectText: "[Contatto][Solido]",
      });
      const rider = prev?.riderBonus ?? 0;
      const hp = resolveDamageToHp({
        tier: ago.tier as 2,
        attackerSheet: snap.sheetEffettivo,
        targetSheet: nemico,
        bonuses: { flatBonus: rider },
      }).hpDamage;
      const ir = Math.round(
        (getSkiruPoints(snap.sheetEffettivo, sk) + getSkiruPoints(snap.sheetEffettivo, "sochu-kokan")) / 2,
      );
      console.log(
        `  P${p}: IR ~${ir} · danno **${hp} HP** · Meta ${snap.metamorfosiStack} · ${scalingPressioneNote(p, "oni-no-ago").join(", ") || "no scaling"}`,
      );
    }

    line("Risveglio dell'Oni (passiva) — soglie Pressione");
    const mezame = wazaRows.find((w) => w.slug === "oni-no-mezame");
    if (mezame) {
      const buffs = (mezame.effetti as Array<{ tipo?: string; skiru?: string; valore?: { n?: number }; nota_master?: string }>).filter(
        (e) => e.tipo === "BUFF_SKIRU",
      );
      console.log(`  ${buffs.length} BUFF_SKIRU codificati (attivi alle soglie 2+/5+/9+ Pressione):`);
      for (const b of buffs.slice(0, 4)) {
        console.log(`    · ${b.skiru} +${b.valore?.n ?? "?"} — ${b.nota_master}`);
      }
      if (buffs.length > 4) {
        console.log(`    … +${buffs.length - 4} altri blocchi`);
      }
      console.log("  Con Pressione 0 (inizio combattimento): nessun buff attivo, solo flavor.");
      console.log("  Con Pressione 5+ (Soglia 2): +3 Nintai cumulativo + bonus sentiero (Master applica).");
    }

    line("Fiuto dell'Ogre (passiva)");
    console.log(`  Botan Chōkaku ${getSkiruPoints(sheet, "chokaku")}: utile per percezione; Minaccia 1/4 → fascia Preda/Rivale/Minaccia (Master).`);
    console.log("  Raggio 15 m (20 m con ≥1 Pressione) — non in sandbox numerica.");

    console.log("\n✓ Test completato.\n");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
