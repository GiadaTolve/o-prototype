// Le 5 Statistiche Primarie
export interface BaseStats {
    f: number // Forza
    c: number // Costituzione
    d: number // Destrezza
    m: number // Mente
    e: number // Empatia
  }
  
  // Le Statistiche Derivate (Calcolate)
  export interface DerivedStats {
    body: number      // HP
    reflexes: number  // Reattività
    speed: number     // Velocità movimento
    kotodama: number  // Mana / Jiko-ka
  }
  
  // Costanti di Gioco
  const RANK_MULTIPLIER_BASE = 1; // "Y" nelle formule. Per ora è 1 (Rango Base)
  
  /**
   * 🧮 CALCOLA STATISTICHE DERIVATE
   * Applica le formule del "Quadro Momentaneo" di Oyasumi.
   */
  export function calculateDerivedStats(base: BaseStats, rankMult: number = RANK_MULTIPLIER_BASE): DerivedStats {
    const { f, c, d, m, e } = base;
  
    // 1. Body (HP)
    // Formula: 1 * [(F * 0.5) + (C * 2)]
    const body = 1 * ((f * 0.5) + (c * 2));
  
    // 2. Reflexes
    // Formula: [(M * 0.4) + (D * 0.6)] * Y
    const reflexes = ((m * 0.4) + (d * 0.6)) * rankMult;
  
    // 3. Velocità
    // Formula: [(D * 0.7) + (F * 0.3)] * Y
    const speed = ((d * 0.7) + (f * 0.3)) * rankMult;
  
    // 4. Kotodama (Mana)
    // Formula: [(E * 0.7) + (M * 0.3)] * Y
    const kotodama = ((e * 0.7) + (m * 0.3)) * rankMult;
  
    return {
      // Arrotondiamo per evitare numeri brutti (es. 12.000001)
      body: Math.round(body),
      reflexes: Math.round(reflexes),
      speed: Math.round(speed),
      kotodama: Math.round(kotodama)
    };
  }
  
  /**
   * ⚖️ VALIDAZIONE PUNTI
   * Controlla che l'utente non stia barando (es. mettendosi 999 forza)
   * Per ora usiamo un cap generico, poi lo legheremo alla creazione.
   */
  export function validateBaseStats(stats: BaseStats, maxTotalPoints: number = 30): boolean {
    const total = stats.f + stats.c + stats.d + stats.m + stats.e;
    
    // Nessuna stat negativa
    if (Object.values(stats).some(v => v < 0)) return false;
    
    // Totale non deve superare il massimo consentito
    return total <= maxTotalPoints;
  }