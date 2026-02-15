// apps/server/src/modules/characters/formulas.ts

// Tipi per TypeScript
export interface BaseStats {
    f: number // Forza
    c: number // Costituzione
    d: number // Destrezza
    m: number // Mente
    e: number // Empatia
  }
  
  export interface DerivedStats {
    hp: number      // Body
    mana: number    // Kotodama
    reflex: number  // Riflessi
    speed: number   // Velocità
  }
  
  // TABELLA LIVELLI (Leveling Design)
  // ⚠️ TODO: Sostituisci questi numeri con quelli della tua tabella reale nel PDF
  export const LEVEL_THRESHOLDS: Record<number, number> = {
    1: 0,
    2: 100,
    3: 300,
    4: 600,
    5: 1000,
    6: 1500,
    7: 2100,
    8: 2800,
    9: 3600,
    10: 4500
    // ... aggiungi fino al cap massimo
  }
  
  /**
   * Calcola il livello basandosi sull'EXP Totale
   */
  export function getLevelFromExp(expTotal: number): number {
    let level = 1
    for (const [lvl, threshold] of Object.entries(LEVEL_THRESHOLDS)) {
      if (expTotal >= threshold) {
        level = Number(lvl)
      }
    }
    return level
  }
  
  /**
   * Calcola le Statistiche Derivate usando le formule del Context 2.2
   * @param stats Le 5 statistiche base
   * @param tierY Moltiplicatore di Rango (Default 1)
   */
  export function calculateDerivedStats(stats: BaseStats, tierY: number = 1): DerivedStats {
    const { f, c, d, m, e } = stats
  
    return {
      // Body (HP): [20% F + 80% C] * Y
      hp: Math.floor(((f * 0.20) + (c * 0.80)) * tierY),
  
      // Kotodama (Mana): [30% M + 70% E] * Y
      mana: Math.floor(((m * 0.30) + (e * 0.70)) * tierY),
  
      // Reflexes: [40% M + 60% D] * Y
      reflex: Math.floor(((m * 0.40) + (d * 0.60)) * tierY),
  
      // Velocità: [30% F + 70% D] * Y
      speed: Math.floor(((f * 0.30) + (d * 0.70)) * tierY)
    }
  }