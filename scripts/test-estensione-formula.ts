/**
 * Test formula Estensione: X = min(4, floor((1 + floor(M/7) + LVL) / 2))
 * Tetto massimo 4 m. Verifica che X non superi mai 4.
 */

const floor = Math.floor

function estensioneX(M: number, LVL: number): number {
  return Math.min(4, floor((1 + floor(M / 7) + LVL) / 2))
}

// Punti totali per livello: 25 + (livello - 1) × 5
function puntiTotali(livello: number): number {
  return 25 + (livello - 1) * 5
}

// Livelli rappresentativi: early, mid, core + soglie
const LIVELLI_TEST = [1, 5, 10, 15, 20, 25, 30, 35, 40, 50]
const LVL_SKILL = [1, 2, 3] as const

console.log('=== TEST FORMULA ESTENSIONE ===')
console.log('Formula: X = min(4, floor((1 + floor(M/7) + LVL) / 2)) — max 4 m')
console.log('')

// Scenario 1: Mente minima (1) — build che ignora Mente
console.log('--- Scenario MIN-MENTE (M=1) ---')
for (const LVL of LVL_SKILL) {
  const x = estensioneX(1, LVL)
  console.log(`  LVL ${LVL}: X = ${x} m`)
}
console.log('')

// Scenario 2: Mente bassa (5) — build fisica
console.log('--- Scenario MENTE BASSA (M=5) ---')
for (const LVL of LVL_SKILL) {
  const x = estensioneX(5, LVL)
  console.log(`  LVL ${LVL}: X = ${x} m`)
}
console.log('')

// Scenario 3: Mente bilanciata (~20% del totale) per livello
console.log('--- Scenario MENTE BILANCIATA (M ≈ 20% pts totali) ---')
for (const livello of LIVELLI_TEST) {
  const pts = puntiTotali(livello)
  const M = Math.max(1, floor(pts * 0.2))
  const x1 = estensioneX(M, 1)
  const x2 = estensioneX(M, 2)
  const x3 = estensioneX(M, 3)
  console.log(`  Liv.${livello} (${pts} pts, M=${M}): LVL1=${x1}m, LVL2=${x2}m, LVL3=${x3}m`)
}
console.log('')

// Scenario 4: Mente alta (~40% del totale) — build caster
console.log('--- Scenario MENTE ALTA (M ≈ 40% pts totali) ---')
for (const livello of LIVELLI_TEST) {
  const pts = puntiTotali(livello)
  const M = Math.max(1, floor(pts * 0.4))
  const x1 = estensioneX(M, 1)
  const x2 = estensioneX(M, 2)
  const x3 = estensioneX(M, 3)
  console.log(`  Liv.${livello} (${pts} pts, M=${M}): LVL1=${x1}m, LVL2=${x2}m, LVL3=${x3}m`)
}
console.log('')

// Scenario 5: Mente massima (tutto in M, altri a 1) — edge case
console.log('--- Scenario MENTE MASSIMA (M = pts_totali - 4) ---')
for (const livello of LIVELLI_TEST) {
  const pts = puntiTotali(livello)
  const M = Math.max(1, pts - 4) // altri 4 stat a 1
  const x1 = estensioneX(M, 1)
  const x2 = estensioneX(M, 2)
  const x3 = estensioneX(M, 3)
  console.log(`  Liv.${livello} (M=${M}): LVL1=${x1}m, LVL2=${x2}m, LVL3=${x3}m`)
}
console.log('')

// Riepilogo criticità
console.log('--- ANALISI CRITICITÀ ---')
let maxX = 0
let minX = 999
const casi: { M: number; LVL: number; X: number }[] = []

for (let M = 1; M <= 120; M += 5) {
  for (const LVL of [1, 2, 3]) {
    const x = estensioneX(M, LVL)
    if (x > maxX) maxX = x
    if (x < minX) minX = x
    if (x >= 10 || (M <= 15 && x >= 5)) {
      casi.push({ M, LVL, X: x })
    }
  }
}

console.log(`  X minimo: ${minX} m`)
console.log(`  X massimo: ${maxX} m (M=120, LVL=3)`)

// X massimo teorico con M=270 (liv 50 full Mente)
const xMaxTeorico = estensioneX(270, 3)
console.log(`  X teorico max (M=270, LVL=3): ${xMaxTeorico} m (cappato a 4)`)

if (maxX > 4) {
  console.log('  ⚠️ ERRORE: X supera 4 m!')
} else {
  console.log('  ✓ Tetto 4 m rispettato')
}
if (minX === 0) {
  console.log('  ⚠️ ATTENZIONE: X = 0 con M e LVL bassi — tecnica inutile?')
}
console.log('')
console.log('OK — Test completato.')
