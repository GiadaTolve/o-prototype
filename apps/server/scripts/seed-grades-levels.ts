/**
 * Seed tabelle Grades e Levels da QUEST_AND_FETCH_SPEC §7.
 *
 * Esegui:  cd apps/server && bun run seed-grades-levels
 * (Dopo `bun run db:push`. Postgres avviato, DATABASE_URL in .env.)
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../../.env") });

const GRADES = [
  { name: "Nemuribito", definition: "Sognatore. Ha appena aperto il terzo occhio e non ha idea di come si manipoli l'ego con successo. Ha ottenuto la vista onirica; deve ancora destreggiarsi fra ordini e potenzialità.", levelMin: 1, levelMax: 3 },
  { name: "Hakyō", definition: "Lo specchio infranto. Cadetto: ha superato la soglia del sognatore, ha scelto l'ordine e si è iniziato allo studio accademico della manipolazione dell'Ego.", levelMin: 3, levelMax: 10 },
  { name: "Bunsekikan", definition: "Analista. Affermato, riconosciuto come abile nella manipolazione. Corrispettivo del soldato.", levelMin: 11, levelMax: 18 },
  { name: "Sentatsu Bunsekikan", definition: "Analista Superiore. Specializzato in almeno un ramo, spicca per talento o intelletto. In grado di grandi cose nel proprio settore.", levelMin: 18, levelMax: 28 },
  { name: "Kanteikan", definition: "Analista Esecutivo. Alle vette della carriera; conoscono quel che possono offrire (esperienza e maestria nell'ego). Spesso a capo di settori o battaglioni.", levelMin: 28, levelMax: 38 },
  { name: "Shin'enkan", definition: "Guardiano dell'Abisso. Ufficiali per cui il mondo onirico non ha più segreti. Comandano legioni, capitanano guerre e manovre vincenti; molteplici assi nella manica oltre il potenziale d'ego.", levelMin: 38, levelMax: 48 },
  { name: "Akumu Zankyō", definition: "L'eco dell'Incubo. Non più considerato Analista né persona; parte del cosmo onirico. Chi si salva dal delirio diventa one-man-army, arma senziente; il grado militare decade a favore di un titolo unico, riconoscibile con il nome di una psicopatologia.", levelMin: 48, levelMax: 999 },
] as const;

const LEVELS: { level: number; expDelta: number | null; expTotal: number; phase: "EARLY-GAME" | "MID-GAME" | "CORE" | null }[] = [
  { level: 1, expDelta: null, expTotal: 0, phase: "EARLY-GAME" },
  { level: 2, expDelta: 50, expTotal: 50, phase: null },
  { level: 3, expDelta: 89, expTotal: 139, phase: null },
  { level: 4, expDelta: 128, expTotal: 267, phase: null },
  { level: 5, expDelta: 167, expTotal: 434, phase: null },
  { level: 6, expDelta: 206, expTotal: 640, phase: null },
  { level: 7, expDelta: 245, expTotal: 885, phase: "MID-GAME" },
  { level: 8, expDelta: 284, expTotal: 1169, phase: null },
  { level: 9, expDelta: 323, expTotal: 1492, phase: null },
  { level: 10, expDelta: 362, expTotal: 1854, phase: null },
  { level: 11, expDelta: 401, expTotal: 2255, phase: null },
  { level: 12, expDelta: 440, expTotal: 2695, phase: null },
  { level: 13, expDelta: 479, expTotal: 3174, phase: null },
  { level: 14, expDelta: 518, expTotal: 3692, phase: null },
  { level: 15, expDelta: 557, expTotal: 4249, phase: null },
  { level: 16, expDelta: 596, expTotal: 4845, phase: null },
  { level: 17, expDelta: 635, expTotal: 5480, phase: null },
  { level: 18, expDelta: 674, expTotal: 6154, phase: null },
  { level: 19, expDelta: 713, expTotal: 6867, phase: null },
  { level: 20, expDelta: 752, expTotal: 7619, phase: null },
  { level: 21, expDelta: 791, expTotal: 8410, phase: null },
  { level: 22, expDelta: 830, expTotal: 9240, phase: null },
  { level: 23, expDelta: 869, expTotal: 10109, phase: null },
  { level: 24, expDelta: 908, expTotal: 11017, phase: null },
  { level: 25, expDelta: 947, expTotal: 11964, phase: null },
  { level: 26, expDelta: 986, expTotal: 12950, phase: "CORE" },
  { level: 27, expDelta: 1025, expTotal: 13975, phase: null },
  { level: 28, expDelta: 1064, expTotal: 15039, phase: null },
  { level: 29, expDelta: 1103, expTotal: 16142, phase: null },
  { level: 30, expDelta: 1142, expTotal: 17284, phase: null },
  { level: 31, expDelta: 1181, expTotal: 18465, phase: null },
  { level: 32, expDelta: 1220, expTotal: 19685, phase: null },
  { level: 33, expDelta: 1259, expTotal: 20944, phase: null },
  { level: 34, expDelta: 1298, expTotal: 22242, phase: null },
  { level: 35, expDelta: 1337, expTotal: 23579, phase: null },
  { level: 36, expDelta: 1376, expTotal: 24955, phase: null },
  { level: 37, expDelta: 1415, expTotal: 26370, phase: null },
  { level: 38, expDelta: 1454, expTotal: 27824, phase: null },
  { level: 39, expDelta: 1493, expTotal: 29317, phase: null },
  { level: 40, expDelta: 1532, expTotal: 30849, phase: null },
  { level: 41, expDelta: 1571, expTotal: 32420, phase: null },
  { level: 42, expDelta: 1610, expTotal: 34030, phase: null },
  { level: 43, expDelta: 1649, expTotal: 35679, phase: null },
  { level: 44, expDelta: 1688, expTotal: 37367, phase: null },
  { level: 45, expDelta: 1727, expTotal: 39094, phase: null },
  { level: 46, expDelta: 1766, expTotal: 40860, phase: null },
  { level: 47, expDelta: 1805, expTotal: 42665, phase: null },
  { level: 48, expDelta: 1844, expTotal: 44509, phase: null },
  { level: 49, expDelta: 1883, expTotal: 46392, phase: null },
  { level: 50, expDelta: 1922, expTotal: 48314, phase: null },
];

async function main() {
  const { db } = await import("../src/plugins/db");
  const { grades, levels } = await import("../src/db/schema");

  const levelCount = await db.select().from(levels).limit(1);
  const gradeCount = await db.select().from(grades).limit(1);

  if (levelCount.length > 0 || gradeCount.length > 0) {
    console.log("⚠️  Tabelle levels/grades già popolate. Vuoi fare truncate e re-seed? (skip per ora)");
    process.exit(0);
  }

  await db.insert(grades).values(GRADES.map((g) => ({ name: g.name, definition: g.definition, levelMin: g.levelMin, levelMax: g.levelMax })));
  await db.insert(levels).values(LEVELS.map((l) => ({ level: l.level, expDelta: l.expDelta, expTotal: l.expTotal, phase: l.phase })));

  console.log("✅ Seed completato: " + GRADES.length + " grades, " + LEVELS.length + " levels.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Errore seed:", e);
  process.exit(1);
});
