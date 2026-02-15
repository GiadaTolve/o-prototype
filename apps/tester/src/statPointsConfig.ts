/**
 * Configurazione Livello, Grado e Punti Stat Distribuibili
 *
 * Modifica questo file per cambiare la formula o i valori.
 * Il grado è scelto liberamente (non vincolato al livello).
 * I moltiplicatori Vel/Dmg sono da WAZA_CALCOLI.md.
 */

/** Gradi carriera. velMult e dmgMult applicati a Velocità e Danno Waza (vedi WAZA_CALCOLI.md). */
export const GRADES = [
  { id: 'g1', name: 'G1 — Nemuribito', definition: 'Sognatore. Ha appena aperto il terzo occhio.', velMult: 1.05, dmgMult: 1.1 },
  { id: 'g2', name: 'G2 — Hakyō', definition: 'Lo specchio infranto. Cadetto.', velMult: 1.1, dmgMult: 1.2 },
  { id: 'g3', name: 'G3 — Bunsekikan', definition: 'Analista. Affermato.', velMult: 1.15, dmgMult: 1.3 },
  { id: 'g4', name: 'G4 — Sentatsu Bunsekikan', definition: 'Analista Superiore.', velMult: 1.2, dmgMult: 1.4 },
  { id: 'g5', name: 'G5 — Kanteikan', definition: 'Analista Esecutivo.', velMult: 1.25, dmgMult: 1.5 },
  { id: 'g6', name: "G6 — Shin'enkan", definition: "Guardiano dell'Abisso.", velMult: 1.3, dmgMult: 1.6 },
  { id: 'g7', name: 'G7 — Akumu Zankyō', definition: "L'eco dell'Incubo.", velMult: 1.35, dmgMult: 1.7 },
] as const

/** Punti base a livello 1. */
const BASE_STAT_POINTS = 25

/** Punti aggiunti per ogni livello (es. livello 16 → 25 + 15×5 = 100). */
const POINTS_PER_LEVEL = 5

/**
 * Calcola i punti stat totali distribuibili in base al livello.
 * Formula: 25 + (level - 1) × 5 → es. livello 16 = 100 pt
 */
export function getTotalStatPoints(level: number, _gradeId?: string): number {
  return BASE_STAT_POINTS + Math.max(0, (level - 1)) * POINTS_PER_LEVEL
}

