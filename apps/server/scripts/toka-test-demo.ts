/**
 * Demo Tōka-dō — build ipotetica ~1200 EXP + sandbox waza.
 *   bun run scripts/toka-test-demo.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
import postgres from "postgres";
import { runWazaSandbox, evaluateSandboxCondizione } from "@domain/combat/waza-sandbox";
import { resolveDamageToHp } from "@domain/combat/damage-pipeline";
import {
  calculateHpMaxFromSkiru,
  calculateMitigationPercentFromSkiru,
  calculateMovementMetersPerQuarterFromSkiru,
} from "@domain/skiru/derived-stats";
import {
  expCostForNextSkiruPoint,
  getSkiruPoints,
  totalExpForSkiruPoints,
} from "@domain/skiru/progression";
import { getGradeForLevel, getLevelFromExp } from "@domain/progression/levels";
import { getSkiruDef } from "@domain/skiru/catalog";
import type { SkiruSheet } from "@domain/skiru/types";
import { TOKA_CATALOG } from "./toka-catalog-data";

config({ path: resolve(import.meta.dir, "../../../.env") });

const EXP_BUDGET = 1200;

/** Build «Lanterna di lama» — Kensei + Seimitsu, mobilità per Kyōmei. */
const BUILD: SkiruSheet = {
  kensei: 8,
  seimitsu: 5,
  undo: 4,
  bakuryoku: 4,
  dokusei: 3,
  konjou: 3,
  itami: 4,
  hansha: 2,
  goatsu: 2,
};

const TORO_ON = { "toro.lanciata": true };
const TORO_BATTERY = { "toro.lanciata": true, "toro.batteria": true };

function skiruLabel(id: string): string {
  const d = getSkiruDef(id);
  return d ? `${d.nameRomaji} (${d.name})` : id;
}

function expSpentOnSheet(sheet: SkiruSheet): number {
  let total = 0;
  for (const [id, pts] of Object.entries(sheet)) {
    total += totalExpForSkiruPoints(pts);
  }
  return total;
}

function line(title: string) {
  console.log(`\n${"═".repeat(64)}\n  ${title}\n${"═".repeat(64)}`);
}

function subsection(title: string) {
  console.log(`\n── ${title}`);
}

function printBuild(sheet: SkiruSheet) {
  const spent = expSpentOnSheet(sheet);
  const level = getLevelFromExp(EXP_BUDGET);
  const grado = getGradeForLevel(level);

  line("PG ipotetico · Tōka-dō (Via della Lanterna)");
  console.log(`  EXP totale personaggio: **${EXP_BUDGET}** → Livello **${level}** · Grado **${grado}**`);
  console.log(`  Tōrō designato: **katana** (papabile-arma → Kensei)`);
  console.log(`  EXP investita in Skiru: **${spent}** / ${EXP_BUDGET} (restano ${EXP_BUDGET - spent} per altri rami o riserva)`);
  console.log("\n  Scheda Skiru (focus combattimento Tōka):");
  for (const [id, pts] of Object.entries(sheet).sort((a, b) => b[1] - a[1])) {
    const cost = totalExpForSkiruPoints(pts);
    const next = expCostForNextSkiruPoint(pts);
    console.log(
      `    · ${skiruLabel(id)}: **${pts}** pt (costo cumulativo ${cost} EXP` +
        (next != null ? ` · prossimo punto ${next} EXP` : "") +
        ")",
    );
  }
  console.log("\n  Stat derivate:");
  console.log(`    · HP max: **${calculateHpMaxFromSkiru(sheet)}** (Dokusei+Konjō)`);
  console.log(`    · Mitigazione: **${calculateMitigationPercentFromSkiru(sheet)}%** (Itami)`);
  console.log(
    `    · Movimento: **${calculateMovementMetersPerQuarterFromSkiru(sheet)} m**/quarto (Undō)`,
  );
  console.log(
    `    · Omocha [SB] / Gangushi [K]: **non sbloccate** a questo grado (demo Hakyō)`,
  );
}

function printSandboxLog(
  label: string,
  result: ReturnType<typeof runWazaSandbox>,
  extra?: string[],
) {
  subsection(label);
  for (const r of result.righe) {
    const prefix =
      r.kind === "calc" ? "  ⚙" : r.kind === "warn" ? "  ⚠" : r.kind === "master" ? "  📜" : "  ·";
    console.log(`${prefix} ${r.text}`);
  }
  if (result.ir) {
    console.log(`  → IR effettivo: **${result.ir.indice}**`);
  }
  if (result.gittataM != null) {
    console.log(`  → Gittata: **${result.gittataM} m**`);
  }
  if (result.dannoBase != null) {
    console.log(`  → Danno base (tier): **${result.dannoBase}**`);
  }
  if (result.dannoFinaleHp != null && result.hpBersaglioDopo != null) {
    const prima = result.hpBersaglioDopo + result.dannoFinaleHp;
    console.log(
      `  → Danno finale HP: **${result.dannoFinaleHp}** (bersaglio ${prima} → ${result.hpBersaglioDopo})`,
    );
  }
  if (extra?.length) {
    for (const e of extra) console.log(`  → ${e}`);
  }
}

function catalogEntry(slug: string) {
  const e = TOKA_CATALOG.find((w) => w.slug === slug);
  if (!e) throw new Error(`Waza ${slug} non in catalogo`);
  return e;
}

function demoPassiveStack(sheet: SkiruSheet) {
  line("1 · Passive Tōrō in sinergia");

  const seimitsu = getSkiruPoints(sheet, "seimitsu");
  const gittataMichishirube = 8 + seimitsu;

  subsection("Michishirube — Contatto → Proiettile dal Tōrō");
  console.log(`  Condizione: toro.lanciata == true → ${evaluateSandboxCondizione("toro.lanciata == true", { skiru: sheet, stato: TORO_ON }, { hp: 30 })}`);
  console.log(
    `  Gittata proiettile: 8 + 1×Seimitsu (${seimitsu}) = **${gittataMichishirube} m**`,
  );
  console.log("  Effetto: le tue [Energetica][Contatto] partono dal Tōrō come [Proiettile].");

  subsection("Shōka — sconto CS");
  const hoshutsuCs = catalogEntry("hoshutsu-rilascio-della-fiamma").cs ?? 2;
  const csConShoka = Math.max(1, hoshutsuCs - 1);
  console.log(
    `  Hōshutsu (CS ${hoshutsuCs}) lanciata dal Tōrō: CS effettivo **${csConShoka}** (−1, minimo 1).`,
  );
  console.log("  In un turno con CS 6: puoi Shōka-stack → Hōshutsu (1) + Kakuchō (1) + margine 4 CS.");
}

function demoHoshutsu(sheet: SkiruSheet) {
  line("2 · Hōshutsu (放出) — Rilascio della Fiamma");
  const entry = catalogEntry("hoshutsu-rilascio-della-fiamma");
  const bersaglio = { hp: 40, scudo: 0, itami: 2 };

  const senzaBatteria = runWazaSandbox({
    effetti: entry.effetti,
    tier: entry.tier ?? 2,
    skiruIr: entry.skiruIr,
    contesto: {
      lanciatore: { skiru: sheet, skiruIrFisica: "kensei", skiruIrIncanalamento: "seimitsu", stato: TORO_ON },
      bersaglio,
    },
  });
  printSandboxLog("Senza carica Tōrō (tier 2, cono 6 m)", senzaBatteria, [
    "Ogni bersaglio nel cono subisce questo danno (Master posiziona).",
  ]);

  const conBatteria = runWazaSandbox({
    effetti: entry.effetti,
    tier: entry.tier ?? 2,
    skiruIr: entry.skiruIr,
    contesto: {
      lanciatore: {
        skiru: sheet,
        skiruIrFisica: "kensei",
        skiruIrIncanalamento: "seimitsu",
        stato: TORO_BATTERY,
      },
      bersaglio,
    },
  });
  printSandboxLog("Con toro.batteria == true (+1 tier, arma si disintegra)", conBatteria, [
    "Master: disintegrazione Tōrō salvo grado Sentatsu Bunsekikan+.",
  ]);
}

function demoKakucho(sheet: SkiruSheet) {
  line("3 · Kakuchō (拡張) — potenziamento Contatto");
  const entry = catalogEntry("kakucho-espansione-della-luce");
  const targetSheet: SkiruSheet = { itami: 2 };
  const dannoSenza = resolveDamageToHp({ tier: 2, targetSheet }).hpDamage;
  const dannoCon = resolveDamageToHp({ tier: 3, targetSheet }).hpDamage;
  console.log("  MOD_DANNO +1 tier su colpi [Contatto] col Tōrō per 1 turno.");
  console.log(
    `  Esempio colpo tier 2 vs Itami 2: danno grezzo 8 → **${dannoSenza}** HP`,
  );
  console.log(
    `  Con Kakuchō attivo (tier 3): danno grezzo 12 → **${dannoCon}** HP`,
  );
  console.log("  Master: Tōrō sale di una taglia; se già Tōrō, buff dura tutto il turno.");
  void entry;
  void sheet;
}

function demoKyomei(sheet: SkiruSheet) {
  line("4 · Kyōmei (共鳴) — danno sul movimento");
  const mov = calculateMovementMetersPerQuarterFromSkiru(sheet);
  const colpiPerTurno = Math.floor(mov / 2);
  const entry = catalogEntry("kyomei-risonanza-della-fiamma");
  const tier = entry.tier ?? 2;
  const dannoPerColpo = tier * 4;

  console.log(`  Movimento build: **${mov} m**/quarto → ~**${colpiPerTurno}** colpi Kyōmei (1 ogni 2 m).`);
  console.log(`  Danno per colpo (tier ${tier}): **${dannoPerColpo}** HP grezzo.`);
  console.log(`  In un turno da ${mov} m: fino a **${dannoPerColpo * colpiPerTurno}** HP grezzi se tutti i colpi colpiscono.`);

  const sandbox = runWazaSandbox({
    effetti: entry.effetti.filter((e) => (e as { tipo?: string }).tipo === "DANNO"),
    tier,
    skiruIr: entry.skiruIr,
    contesto: {
      lanciatore: { skiru: sheet, skiruIrFisica: "undo", skiruIrIncanalamento: "kensei", stato: TORO_ON },
      bersaglio: { hp: 50, itami: 0 },
    },
  });
  printSandboxLog("Sandbox — singolo colpo Kyōmei", sandbox, [
    "Non si mirano punti vitali · Master traccia il percorso.",
  ]);
}

function demoTurnoTipo(sheet: SkiruSheet) {
  line("5 · Turno tipo (Master + automazione parziale)");

  const cs = 6;
  const hoshutsuCs = 1;
  const kakuchoCs = 1;
  const rest = cs - hoshutsuCs - kakuchoCs;

  console.log("  Setup: Tōrō (katana) impugnato · toro.lanciata attivo · CS 6 a inizio turno");
  console.log("  1/4 — Kakuchō (CS 1 con Shōka): buff Contatto +1 tier / +1 m gittata");
  console.log("  2/4 — Hōshutsu (CS 1 con Shōka): cono 6 m; IR da Kensei 8 + Seimitsu 5 → alto");
  console.log(`  CS residui: **${rest}** (carica Tōrō / Ukabu / difesa narrativa)`);
  console.log("\n  Passive sempre attive sullo stesso turno:");
  console.log("    · Tōrō: origine lanci · immune Manipolazione altrui");
  console.log("    · Michishirube: eventuale proiettile Energetico a 13 m");
  console.log("    · Shōka: −1 CS su ogni waza dal Tōrō");
  console.log("    · Nokuribi / Kintsugi: tracciati dal Master se applicabili");
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL mancante");
  const neon = process.env.NEON_DATABASE_URL;
  if (neon && raw === neon) {
    console.error("Abort: usa DATABASE_URL locale");
    process.exit(1);
  }

  const u = new URL(raw);
  u.searchParams.delete("options");
  const sql = postgres(u.toString());

  try {
    const [count] = await sql`
      SELECT COUNT(*)::int AS n FROM waza w
      JOIN waza_versioni v ON v.waza_id = w.id
      WHERE w.genitore = 'Tōka-dō' AND jsonb_array_length(v.effetti) > 0
    `;
    if ((count?.n ?? 0) < 12) {
      console.warn("⚠ Catalogo Tōka-dō incompleto in DB — demo usa toka-catalog-data.ts");
    }

    printBuild(BUILD);
    demoPassiveStack(BUILD);
    demoHoshutsu(BUILD);
    demoKakucho(BUILD);
    demoKyomei(BUILD);
    demoTurnoTipo(BUILD);

    line("Fine demo");
    console.log("  Apri EditorWaza / PannelloSandbox con la stessa scheda per ripetere i test.");
    console.log("  Stato sandbox Tōrō: lanciatore.stato.toro.lanciata = true · toro.batteria per carica.");
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
