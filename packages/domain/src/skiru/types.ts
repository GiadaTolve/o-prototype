import type { WazaCategoriaPapabile } from './waza-categoria-papabile'

/** Dominio cosmologico Skiru (UltimateManual). */
export type SkiruDomain = 'ten' | 'chi' | 'jin'

/** Skiru acquistabili con exp vs milestone narrative (Jiga no Shihaisha). */
export type SkiruKind = 'standard' | 'milestone'

/** Un volto dell'albero (Meiju o Shiju) dentro una singola Skiru Sōkaiju. */
export interface SokaijuFaceDef {
  labelItalian: string
  nameRomaji: string
  nameJa?: string
  treeSphere: string
  description: string
}

/** Parametro derivato governato da una Skiru. */
export type SkiruDerivedDriver =
  | 'hp'
  | 'movement'
  | 'mitigation'
  | 'constructResistance'
  | 'cac'
  | 'cad'
  | 'chronoStack'
  | 'maxConstructs'
  | 'elementalStatus'
  | 'supportPower'
  | 'counterBonus'
  | 'initiativeTiebreak'
  | 'effectDuration'
  | 'emotionalPower'
  | 'damageFloor'
  | 'surprise'

export interface SkiruBranchDef {
  id: string
  label: string
  /** Romaji del ramo (es. Tōsō, Binshō). */
  labelRomaji?: string
  labelJa?: string
  domain: SkiruDomain
  /** Testo introduttivo del ramo (UI scheda Skiru). */
  description?: string
}

export interface SkiruDef {
  id: string
  name: string
  /** Romaji del nome (es. Undō, Kensei). */
  nameRomaji?: string
  nameJa?: string
  domain: SkiruDomain
  branchId: string
  description?: string
  /** Effetto numerico / formula (UI — riquadro separato dalla descrizione). */
  derivedFormula?: string
  kind: SkiruKind
  /** Solo per kind standard — quali derivati alimenta. */
  drivesDerived?: SkiruDerivedDriver[]
  /** Sotto-ramo: richiede punti sul nodo padre (es. Kensei → Ambidestria). */
  parentSkiruId?: string
  /** Punti minimi sul padre per investire (default 1). */
  minParentPoints?: number
  /** Tetto punti per nodo specifico (default `SKIRU_MAX_POINTS`). */
  maxPoints?: number
  /** Se false, non acquistabile con EXP (es. affinità elementali Gojū — inserimento narrativo). Default true. */
  expPurchasable?: boolean
  /** Sōkaiju: ancoraggio corporeo 1 (testa) – 11 (piede). */
  sokaijuAnchor?: number
  /** Sōkaiju: volto Meiju (Vita) — stessa Skiru del volto Shiju. */
  sokaijuMeiju?: SokaijuFaceDef
  /** Sōkaiju: volto Shiju (Morte) — stessa Skiru del volto Meiju. */
  sokaijuShiju?: SokaijuFaceDef
  /** Sōkaiju (e altre): categoria waza papabile per calcolo IR al lancio. */
  wazaCategoriaPapabile?: WazaCategoriaPapabile
}

/** Mappa skiruId → punti investiti (0–10). */
export type SkiruSheet = Readonly<Record<string, number>>

export interface SkiruValidationResult {
  ok: boolean
  errors: string[]
}
