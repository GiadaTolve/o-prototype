/**
 * Configurazione Livello, Grado e Punti Stat Distribuibili
 *
 * Modifica questo file per cambiare la formula o i valori.
 * Il tester usa questi dati per limitare la distribuzione delle statistiche.
 */

/** Gradi carriera (da QUEST_AND_FETCH_SPEC §7). levelMin/levelMax = range livelli del grado. */
export const GRADES = [
  { id: 'nemuribito', name: 'Nemuribito', definition: 'Sognatore. Ha appena aperto il terzo occhio.', levelMin: 1, levelMax: 3, statBonus: 0 },
  { id: 'hakyo', name: 'Hakyō', definition: 'Lo specchio infranto. Cadetto.', levelMin: 3, levelMax: 10, statBonus: 2 },
  { id: 'bunsekikan', name: 'Bunsekikan', definition: 'Analista. Affermato.', levelMin: 11, levelMax: 18, statBonus: 4 },
  { id: 'sentatsu', name: 'Sentatsu Bunsekikan', definition: 'Analista Superiore.', levelMin: 18, levelMax: 28, statBonus: 6 },
  { id: 'kanteikan', name: 'Kanteikan', definition: 'Analista Esecutivo.', levelMin: 28, levelMax: 38, statBonus: 8 },
  { id: 'shinenkan', name: "Shin'enkan", definition: 'Guardiano dell\'Abisso.', levelMin: 38, levelMax: 48, statBonus: 10 },
  { id: 'akumu', name: 'Akumu Zankyō', definition: "L'eco dell'Incubo.", levelMin: 48, levelMax: 999, statBonus: 12 },
] as const

/** Punti base a livello 1. */
const BASE_STAT_POINTS = 15

/** Punti aggiunti per ogni livello (es. livello 10 → +9 punti). */
const POINTS_PER_LEVEL = 1

/**
 * Calcola i punti stat totali distribuibili in base a livello e grado.
 * Formula: BASE + (level - 1) * POINTS_PER_LEVEL + grade.statBonus
 */
export function getTotalStatPoints(level: number, gradeId: string): number {
  const grade = GRADES.find((g) => g.id === gradeId)
  const bonus = grade?.statBonus ?? 0
  const levelPoints = BASE_STAT_POINTS + Math.max(0, (level - 1)) * POINTS_PER_LEVEL
  return levelPoints + bonus
}

/** Gradi disponibili per un dato livello (levelMin <= level <= levelMax). */
export function getGradesForLevel(level: number) {
  return GRADES.filter((g) => level >= g.levelMin && level <= g.levelMax)
}
