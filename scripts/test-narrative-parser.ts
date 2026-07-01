/**
 * Test per formatNarrativeText - verifica conversione «span» e highlight nome
 */
import { formatNarrativeText } from "../apps/client/src/lib/narrative-parser";

// Usa \u00AB e \u00BB espliciti per garantire i caratteri corretti
const L = "\u00AB";
const R = "\u00BB";
const testInput = `Persa. ${L}span class="my-name-highlight"${R}Botan${L}/span${R} si voltò lentamente. Il vento sollevava un alone di polvere sulla strada deserta, e lei sentiva ancora il rumore della manata ricevuta. ${L}span class="parlato"${R}${L} Non è nulla. ${R}${L}/span${R} Si passò una mano sul collo, dove il dolore pulsava ancora. [Ginza o' Clock] Camminò verso il bancone. ${L}span class="my-name-highlight"${R}Botan${L}/span${R} sapeva che stava barando.`;

console.log("=== Input ===\n");
console.log(testInput);

console.log("\n=== Output (con highlight per Botan) ===\n");

const result = formatNarrativeText(testInput, ["Botan"]);

console.log(result);
console.log("\n=== Verifiche ===\n");

const v3Sample = formatNarrativeText(
  "Turno [2/4] [Scudo] [IR:14] [waza:Colpo] [cs:3] [dado:1d20+M] azione.",
);

const taxonomySample = formatNarrativeText(
  "[Energetiche][Propagazione Conica] colpo ad area.",
);

const statusSample = formatNarrativeText("[Ira][Incendiato] attacco.");

const checks = [
  [!result.includes("«span"), "Nessun «span» visibile"],
  [!result.includes("«/span»"), "Nessun «/span» visibile"],
  [result.includes('<span class="my-name-highlight">'), "Contiene <span class=\"my-name-highlight\">"],
  [result.includes("Botan"), "Contiene il nome Botan"],
  [!result.includes("«span class=\"parlato\"»"), "Nessun «span class=\"parlato\"»"],
  [result.includes('<span class="parlato">'), "Parlati formattati correttamente"],
  [result.includes("tag-narrativo") || result.includes("Ginza"), "Tag narrativi gestiti"],
  [v3Sample.includes("quarter-tag"), "Tag [N/4] → quarter-tag"],
  [v3Sample.includes("shield-tag"), "Tag [Scudo] → shield-tag"],
  [v3Sample.includes("ir-tag"), "Tag [IR:N] → ir-tag"],
  [v3Sample.includes("waza-tag"), "Tag [waza:…] → waza-tag"],
  [v3Sample.includes("dice-tag-deprecated"), "Tag [dado:…] → deprecato"],
  [taxonomySample.includes("consistency-tag"), "Tag [Energetiche] → consistency-tag"],
  [taxonomySample.includes("category-tag"), "Tag [Propagazione Conica] → category-tag"],
  [statusSample.includes("status-emotional-tag"), "Tag [Ira] → status-emotional-tag"],
  [statusSample.includes("status-elemental-tag"), "Tag [Incendiato] → status-elemental-tag"],
];

let passed = 0;
for (const [ok, desc] of checks) {
  const status = ok ? "✓" : "✗";
  console.log(`${status} ${desc}`);
  if (ok) passed++;
}

console.log(`\n${passed}/${checks.length} verifiche passate`);
process.exit(passed === checks.length ? 0 : 1);
