// packages/domain/src/stats/calculator.ts

/**
 * Le 5 Statistiche Primarie dell'Analista.
 */
export interface BaseStats {
    strength: number;     // Forza [F]
    constitution: number; // Costituzione [C]
    dexterity: number;    // Destrezza [D]
    mind: number;         // Mente [M]
    empathy: number;      // Empatia [E]
  }
  
  /**
   * Le Statistiche Derivate calcolate dal sistema.
   * Basate sul "Quadro Formule Momentaneo" (Body, Jigoka, Riflessi, ecc.).
   */
  export interface DerivedStats {
    // Sopravvivenza
    hpMax: number;        // Body [BOD]
    jigokaMax: number;   // Mana/Jigoka [JIG]
  
    // Azione
    reflexes: number;     // Riflessi [REF]
    velocity: number;     // Velocità d'azione [VEL]
    
    // Movimento & Spazio
    movement: number;     // Movimento in metri [MOV]
    jump: number;         // Salto in metri [JUMP]
    carryWeight: number;  // Peso Trasportabile in kg [P.T.] (design pre-esistente)
  
    // Percezione
    perceptionPhysical: number;   // Percezione Sensi [PER-S]
    perceptionSpiritual: number;  // Percezione Anime [PER-E]
  
    // Lancio (Distanza in metri) [LAN]
    throwRange: {
      small: number;
      medium: number;
      large: number;
      giant: number;
    };

    // Distanza d’ingaggio
    engageDistance: number; // Distanza d’ingaggio [m]

    // Danni base corpo a corpo / a distanza (senza Jikoka)
    meleeDamage: number;   // Danno colpo CAC
    rangedDamage: number;  // Danno colpo CAD
  }
  
  /**
   * Calcola tutte le statistiche derivate basandosi sulle stats base e il rango.
   * * @param stats Le 5 statistiche base (F, C, D, M, E)
   * @param y Il Moltiplicatore di Rango (Tier), default 1.0
   */
  export function calculateDerivedStats(stats: BaseStats, y: number = 1.0): DerivedStats {
    // Helper per arrotondare (generalmente per difetto o matematico nei GDR)
    const round = (val: number) => Math.floor(val);
  
    // Estrazione per leggibilità formume
    const { strength: F, constitution: C, dexterity: D, mind: M, empathy: E } = stats;
  
    return {
      // Body [BOD] = 1*[(Forza*0,5)+(Costituzione*2)] * Y
      hpMax: round(y * ((F * 0.5) + (C * 2))),
  
      // Jigoka [JIG] = 3*[(Mente*0,6)+(Empatia*0,4)] * Y
      jigokaMax: round(y * 3 * ((M * 0.6) + (E * 0.4))),

      // Reflexes [REF] = 1* [(Mente*0,4)+(Destrezza*0,6)] * Y
      reflexes: round(y * ((M * 0.4) + (D * 0.6))),
  
      // Velocità [VEL] = 1* [(Forza*0,4)+(Destrezza*0,6)] * Y
      velocity: round(y * ((F * 0.4) + (D * 0.6))),
  
      // Movimento [MOV] = 0.5*[(Forza*0,5)+(Costituzione*0,6)] * Y
      movement: round(y * 0.5 * ((F * 0.5) + (C * 0.6))),
  
      // Salto [JUMP] = 0.4*[(Forza*0,5)+(Costituzione*0,6)] * Y
      jump: round(y * 0.4 * ((F * 0.5) + (C * 0.6))),
  
      // Peso Trasportabile [P.T.] = 2*[(Forza*0,6)+(Costituzione*0,4)] * Y
      carryWeight: round(y * 2 * ((F * 0.6) + (C * 0.4))),
  
      // Percezione [PER- Sensi] = 1*[(Mente*0,9)+(Costituzione*0,4)]
      perceptionPhysical: round((M * 0.9) + (C * 0.4)),
  
      // Percezione [PER- “anime”] = 1*[(Mente*0,9)+(Empatia*0,4)]
      perceptionSpiritual: round((M * 0.9) + (E * 0.4)),
  
      // Lancio [LAN] — base: (Forza*0,7)+(Destrezza*0,3)
      throwRange: {
        // Piccole =0,6*[(Forza*0,7)+(Destrezza*0,3)]
        small: round(y * 0.6 * ((F * 0.7) + (D * 0.3))),
        // Medie =0,45*[(Forza*0,7)+(Destrezza*0,3)]
        medium: round(y * 0.45 * ((F * 0.7) + (D * 0.3))),
        // Grandi =0,3*[(Forza*0,7)+(Destrezza*0,3)]
        large: round(y * 0.3 * ((F * 0.7) + (D * 0.3))),
        // Giganti =0,15*[(Forza*0,7)+(Destrezza*0,3)]
        giant: round(y * 0.15 * ((F * 0.7) + (D * 0.3))),
      },

      // Distanza d’ingaggio = 0.1*[(Forza*0,4)+(Destrezza*0,6)]
      engageDistance: round(0.1 * ((F * 0.4) + (D * 0.6))),

      // Danno colpo CAC (senza Jikoka) = 1*(Forza*0.3+Destrezza*0.2)
      meleeDamage: round((F * 0.3) + (D * 0.2)),

      // Danno colpo CAD (senza Jikoka) = 1*(Forza*0.2+Destrezza*0.3)
      rangedDamage: round((F * 0.2) + (D * 0.3)),
    };
  }