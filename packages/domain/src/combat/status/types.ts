/** Target dello status — personaggio o costrutto sul campo. */
export type StatusTargetKind = 'character' | 'construct'

export type StatusKind = 'emotional' | 'elemental' | 'atypical'

export type StatusId =
  | 'ira'
  | 'tristezza'
  | 'disperazione'
  | 'beatitudine'
  | 'euforia'
  | 'incendiato'
  | 'sovraccarico'
  | 'torpore'
  | 'appesantimento'
  | 'vertigini'
  | 'emorragia'
  | 'debitore'
  | 'debito'
  | 'metamorfosi'
  | 'trance_onirica'
  | 'sigillato'
  | 'macchiato'
  | 'rallentato'

export type ElementId = 'fuoco' | 'fulmine' | 'acqua' | 'gravita' | 'aria'

export interface StatusInstance {
  id: StatusId
  /** Stack = durata in turni (status emotivi); contatori per Emorragia/Macchiato. */
  stacks: number
}

export interface StatusContainer {
  targetKind: StatusTargetKind
  statuses: StatusInstance[]
}

export interface ApplyStatusOptions {
  stacks?: number
  /** Durata fissa in turni (elementali default 3). Se omessa, usa stacks o default catalogo. */
  durationTurns?: number
  /** Somma agli stack esistenti invece di sostituire. */
  addStacks?: boolean
}

export interface StatusTickResult {
  container: StatusContainer
  /** Danno auto-inflitto a fine turno PG (Emorragia, Incendiato, …). */
  selfDamage: number
  /** Messaggi descrittivi per log Master/tester. */
  log: string[]
}

export interface StatusCombatModifiers {
  offensiveTierBonus: number
  damageTakenTierBonus: number
  damageMultiplier: number
  rangeMultiplier: number
  csCostMultiplier: number
  csCostMin: number
  blockCsGain: boolean
  blockHealing: boolean
  blockWaza: boolean
  blockAllyBuff: boolean
  movementMultiplier: number
  movementTowardEnemyOnly: boolean
  bonusCsPerTurn: number
  indexBonus: number
  forceLowestSkiruInIndex: boolean
  /** Euforia: +1 m ogni 2 stack (somma al movimento derivato). */
  bonusMovementMeters: number
  /** Rallentato e simili: penalità flat al movimento in metri. */
  movementPenaltyMeters: number
  /** Narrativo / anti-morte — non calcolato in pipeline numerica. */
  tranceOnirica: boolean
  /** Hadō Metamorfosi attiva — soglie CS collegate altrove. */
  metamorphosisActive: boolean
  /** Kōmei armatura — +% mitigazione Itami aggiuntiva. */
  mitigationBonusPercent: number
  /** Kōmei rovente — colpi a contatto applicano Incendiato (narrativo). */
  komeiRovente: boolean
  /** Nagori collaterale Liquido — gittata extra. */
  bonusRangeMeters: number
  /** Nagori collaterale Gassoso — durata waza + turni. */
  bonusDurationTurns: number
  /** Nagori collaterale Sonoro — ignora tier Resistenza/Scudo. */
  shieldPenetrationTier: number
  /** Nagori collaterale Elementale — stack status abbandonato. */
  nagoriElementalStackBonus: number
  /** Sutura Elementale — status congelati, niente decay a fine turno. */
  blockStatusDecay: boolean
}

export interface ConfrontationStatusEvent {
  won: boolean
  tookDamage: boolean
}
