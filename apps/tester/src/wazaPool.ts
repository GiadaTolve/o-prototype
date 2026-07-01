/**
 * Tipi e utilità Waza; `WAZA_POOL` è popolato dal Tool inserimento (Idee e sviluppo).
 * Vecchio elenco rimosso di proposito — recuperabile dalla history git se serve.
 *
 * Formule (WAZA_CALCOLI.md):
 * Velocità = [((D × 0.6) + (M × 0.4)) + Bonus Waza] × M.G.
 * DMG = [(DBW + (E × 0.7)) + BA/BO/B] × M.G.
 */

const floor = Math.floor

export type WazaType = 'passive' | 'active'
export type { WazaBranch } from './wazaBranches'
export { BRANCH_LABELS, BRANCH_DESCRIPTIONS } from './wazaBranches'
import type { WazaBranch } from './wazaBranches'
import { GENZAI_WAZA_POOL } from './pools/genzai-waza-pool'
import { TOKA_WAZA_POOL } from './pools/toka-waza-pool'
import { ITO_WAZA_POOL } from './pools/ito-waza-pool'
import { NAIKAN_WAZA_POOL } from './pools/naikan-waza-pool'
import { HENSEI_WAZA_POOL } from './pools/hensei-waza-pool'
import { HADO_WAZA_POOL } from './pools/hado-waza-pool'
import { GENERICHE_WAZA_POOL } from './pools/generiche-waza-pool'
import { ORDINE_WAZA_POOL } from './pools/ordine-waza-pool'
import { ONIMORI_WAZA_POOL } from './pools/onimori-waza-pool'

/** Durata effetto waza */
export type DurataType =
  | 'mantenimento'
  | 'un_turno'
  | 'utilizzo'
  | 'due_turni'
  | 'tre_turni'
  | 'quattro_turni'

export const DURATA_LABELS: Record<DurataType, string> = {
  mantenimento: 'Mantenimento',
  un_turno: 'Un turno',
  utilizzo: 'Utilizzo',
  due_turni: 'Due turni',
  tre_turni: 'Tre turni',
  quattro_turni: 'Quattro turni',
}

/** Modo di pagamento Jigoka: una tantum vs a ogni turno di mantenimento attivo */
export type CostJigoTipo = 'fisso' | 'mantenimento'

/** Condizioni accessori Waza (tendina Idee e sviluppo); id stabile per export */
export const WAZA_CONDIZIONI_APPLICABILI = [] as const
export type WazaCondizioneApplicabileId = (typeof WAZA_CONDIZIONI_APPLICABILI)[number]
export const WAZA_CONDIZIONI_APPLICABILI_LABELS: Record<WazaCondizioneApplicabileId, string> = {}

/** Status applicabile da waza (tendina Idee e sviluppo); id stabile per export */
export const WAZA_STATUS_APPLICABILI = [
  'potenziamento',
  'depotenziamento',
  'elementale',
  'vertigini',
  'fuoco',
  'fulmine',
  'gelo',
  'avvelenamento',
  'paralisi',
  'sonno',
  'sanguinamento',
  'bruciatura',
] as const
export type WazaStatusApplicabileId = (typeof WAZA_STATUS_APPLICABILI)[number]

export const WAZA_STATUS_APPLICABILI_LABELS: Record<WazaStatusApplicabileId, string> = {
  potenziamento: 'Potenziamento',
  depotenziamento: 'Depotenziamento',
  elementale: 'Elementale',
  vertigini: 'Vertigini',
  fuoco: 'Fuoco',
  fulmine: 'Fulmine',
  gelo: 'Gelo',
  avvelenamento: 'Avvelenamento',
  paralisi: 'Paralisi',
  sonno: 'Sonno',
  sanguinamento: 'Sanguinamento',
  bruciatura: 'Bruciatura',
}

/** Counter applicabile da waza (tendina Idee e sviluppo) */
export const WAZA_COUNTER_APPLICABILI = [
  'chrono_stack',
  'overheat',
  'carica_tecnica',
  'accumulo_danni',
  'marcatura',
  'combo',
  'punizione',
  'risonanza',
  'carica_sovraccarico',
  'accumulo_turni',
  'segnalatore',
] as const
export type WazaCounterApplicabileId = (typeof WAZA_COUNTER_APPLICABILI)[number]

export const WAZA_COUNTER_APPLICABILI_LABELS: Record<WazaCounterApplicabileId, string> = {
  chrono_stack: 'Chrono Stack (accumulo)',
  overheat: 'Overheat',
  carica_tecnica: 'Carica tecnica',
  accumulo_danni: 'Accumulo danni',
  marcatura: 'Marcatura',
  combo: 'Combo',
  punizione: 'Punizione',
  risonanza: 'Risonanza',
  carica_sovraccarico: 'Carica sovraccarico',
  accumulo_turni: 'Accumulo turni',
  segnalatore: 'Segnalatore',
}

/** Statistiche/parametri dal profilo personaggio — usabili nelle formule Waza (v. WAZA_CALCOLI.md) */
export interface WazaStats {
  F: number   // Forza
  C: number   // Costituzione
  D: number   // Destrezza
  M: number   // Mente
  E: number   // Empatia
  LVL: number // Livello skill (1-3)
  Grado: number // Grado Militare (1-7)
}

/** Stats di esempio per preview/calcoli quando non si ha un personaggio */
export const SAMPLE_WAZA_STATS: WazaStats = {
  F: 10, C: 10, D: 10, M: 10, E: 10, LVL: 1, Grado: 2,
}

/**
 * Riflessi [REF] / Reflexes — statistica derivata (iniziativa, confronti con velocità tecniche).
 * Stessa struttura di `calculateDerivedStats` in `@domain/stats/calculator`: floor(Y × (M×0,4 + D×0,6)).
 * `tierY` è il moltiplicatore di rango; nel tester combattimento si usa spesso Y = 1.
 */
export function reflexesFromWazaStats(s: Pick<WazaStats, 'M' | 'D'>, tierY: number = 1): number {
  return Math.floor(((s.M * 0.4) + (s.D * 0.6)) * tierY)
}

/** Gradi militari ammessi nelle formule waza / requisiti */
export const WAZA_GRADO_MILITARE_VALUES = [1, 2, 3, 4, 5, 6, 7] as const
export type WazaGradoMilitare = (typeof WAZA_GRADO_MILITARE_VALUES)[number]

/** Gem necessarie per ogni salita di rango Waza (I→II o II→III). Oltre alle Gem si pagano EXP dedicate alla tecnica. */
export const WAZA_RANK_UP_GEM_COST = 3 as const

/** Trigger opzionale al lancio — Waza, Madōsho e Patto (effetti in catena dichiarati in chat). */
export type WazaLaunchTriggerKind = 'boost' | 'sconto' | 'raccolta' | 'deficit'
export type WazaLaunchTriggerResource = 'jigoka' | 'chrono_stack' | 'statistiche' | 'danno'
/** Chi subisce o beneficia del calcolo (caster = chi lancia; avversario = soggetto opposto / alleato influenzato). */
export type WazaLaunchTriggerSubject = 'caster' | 'avversario'

export const WAZA_LAUNCH_TRIGGER_KIND_LABELS: Record<WazaLaunchTriggerKind, string> = {
  boost: 'Boost — potenziamento statistiche o danno del colpo successivo (dopo il lancio in chat)',
  sconto: 'Sconto — sulla tecnica successiva; sconto Jigoka o CS sul costo',
  raccolta: 'Raccolta — immediata al lancio; +Jigoka o +CS per chi lancia (una tantum o a mantenimento)',
  deficit: 'Deficit — immediato al lancio; −Jigoka o −CS per chi lancia',
}

/** Sotto-tipo Boost: cosa viene potenziato. */
export type WazaLaunchBoostTarget = 'statistiche' | 'danno'

export const WAZA_LAUNCH_BOOST_STAT_KEYS = ['F', 'C', 'D', 'M', 'E'] as const
export type WazaLaunchBoostStatKey = (typeof WAZA_LAUNCH_BOOST_STAT_KEYS)[number]

export const WAZA_LAUNCH_BOOST_STAT_LABELS: Record<WazaLaunchBoostStatKey, string> = {
  F: 'Forza (F)',
  C: 'Costituzione (C)',
  D: 'Destrezza (D)',
  M: 'Mente (M)',
  E: 'Empatia (E)',
}

export const WAZA_LAUNCH_TRIGGER_RESOURCE_LABELS: Record<WazaLaunchTriggerResource, string> = {
  jigoka: 'Jigoka',
  chrono_stack: 'Chrono Stack',
  statistiche: 'Statistiche',
  danno: 'Danno (prossimo attacco)',
}

export const WAZA_LAUNCH_TRIGGER_SUBJECT_LABELS: Record<WazaLaunchTriggerSubject, string> = {
  caster: 'Caster (chi lancia)',
  avversario: 'Avversario / bersaglio esterno',
}

/**
 * Tag di contesto di gioco dichiarati in chat / gestiti dal Master.
 * Oggi il caso più usato è l’arma (es. Tōrō); in futuro lo stesso elenco potrà agganciare altri ambiti (scena, bersaglio, ecc.).
 */
export const WAZA_WEAPON_CONDITION_TAGS = ['toro'] as const
export type WazaWeaponConditionTag = (typeof WAZA_WEAPON_CONDITION_TAGS)[number]

export const WAZA_WEAPON_CONDITION_TAG_LABELS: Record<WazaWeaponConditionTag, string> = {
  toro: 'Tōrō — lanterna / contesto arma (es. passiva Tōrō)',
}

/** Nel tool di authoring: un solo effetto alternativo per rango (mutuamente esclusivo). */
export type WazaCondRankAltKind = 'none' | 'damage' | 'velocity' | 'gittata'

/** Modificatori applicati al calcolo numerico se il ramo condizionale matcha (per rango I–III). */
export interface WazaConditionalModifiers {
  /** Moltiplicatore sul danno finale [(DBW + …) × M.G.] — es. 2 = «danno raddoppia». Default 1 se assente. */
  damageMult?: number
  /** Somma alla velocità già risolta dalla formula Waza. */
  velocityAdd?: number
  /** Metri aggiunti alla gittata risolta. */
  gittataMetersAdd?: number
}

/** Ramo alternativo: se il contesto di gioco espone almeno uno dei tag richiesti, si usano i modificatori del rango indicato. */
export interface WazaConditionalBranch {
  /** Etichetta breve (UI / authoring). */
  id: string
  /** Basta che uno di questi tag sia attivo nel contesto considerato (OR; oggi di solito contesto arma). */
  requireAnyWeaponTag: string[]
  /** Modificatori per rango; chiavi assenti → nessun delta su quel rango (solo base). */
  byRank: Partial<Record<1 | 2 | 3, WazaConditionalModifiers>>
}

export interface WazaLaunchTrigger {
  kind: WazaLaunchTriggerKind
  resource: WazaLaunchTriggerResource
  /** Calcolo libero: +2, -1, -10%, ecc. */
  calcoloLibero: string
  subject: WazaLaunchTriggerSubject
  /** Quante azioni dura (testo o numero). */
  timingAzioni: string
  /** Solo kind === 'boost' */
  boostTarget?: WazaLaunchBoostTarget
  /** Statistiche potenziate (una o più) */
  boostStatKeys?: WazaLaunchBoostStatKey[]
  /** Percentuale boost statistiche (testo libero) */
  boostStatPercent?: string
  /** Percentuale boost danno sul colpo successivo all’attivazione (lancio in chat) */
  boostDamagePercent?: string
}

export interface WazaDef {
  id: string
  name: string
  type: WazaType
  branch: WazaBranch
  /** Testo narrativo (fluff / scene) — Waza I o intera passive */
  description?: string
  /** Meccanica in scheda ([Effetto], tag tra parentesi quadre, ecc.) */
  effect?: string
  /** Waza II — testo aggiunto al primo upgrade (LVL 2); in scheda: base + questo blocco */
  descriptionUpgrade2?: string
  /** Waza III — testo aggiunto al secondo upgrade (LVL 3); in scheda: base + II + questo blocco */
  descriptionUpgrade3?: string
  /** EXP richieste per I→II oltre a `WAZA_RANK_UP_GEM_COST` Gem */
  upgradeCostExp2?: number
  /** EXP richieste per II→III oltre a `WAZA_RANK_UP_GEM_COST` Gem */
  upgradeCostExp3?: number
  /** Quadrante calcoli — Bulletin formule (opzionale) */
  quadranteCalcoli?: { label: string; formula: string; note?: string }[]
  /** Costo Jigo-ka (mana): una tantum se fisso, a turno se mantenimento */
  costJigo: (stats: WazaStats) => number
  /** Fisso = paghi al lancio ([Costo Jigoka]); mantenimento = Jigoka a turno ([Mantenimento Jigoka]) */
  costJigoTipo?: CostJigoTipo
  /** Costo Chrono Stack (0 = non consuma) */
  costCs: number
  /** Bonus Waza per formula velocità (default 0) — usato se velFormula assente */
  velBonus: number
  /** Formula velocità strutturata [((S1×p1)+(S2×p2))+bonus]×Grado — quando presente sostituisce velBonus */
  velFormula?: (stats: WazaStats) => number
  /** Sostituisce formula velocità da LVL ≥ 2 (Waza II) */
  velFormulaRank2?: (stats: WazaStats) => number
  /** Sostituisce formula velocità da LVL ≥ 3 (Waza III) */
  velFormulaRank3?: (stats: WazaStats) => number
  /** Danno Base Waza (numero o funzione che ritorna da stats) */
  dbw: number | ((stats: WazaStats) => number)
  /** DBW da LVL ≥ 2 */
  dbwRank2?: number | ((stats: WazaStats) => number)
  /** DBW da LVL ≥ 3 */
  dbwRank3?: number | ((stats: WazaStats) => number)
  /** Ha formula velocità applicabile */
  hasVelocity: boolean
  /** Ha formula danno applicabile */
  hasDamage: boolean
  /** Gittata: formula eseguibile al rango ≥ 2 se diversa dal quadrante base */
  gittataFormulaRank2?: (stats: WazaStats) => number
  /** Gittata da LVL ≥ 3 */
  gittataFormulaRank3?: (stats: WazaStats) => number
  /** Durata effetto (opzionale) */
  durata?: DurataType
  /** Status applicato dalla waza (testo senza tag; il tag [ Status ] … va in descrizione se presente) */
  applicaStatusId?: string
  /** Counter applicato (tag [ Counter ] … in descrizione se presente) */
  applicaCounterId?: string
  /** Skiru prerequisito — id da `@domain/skiru/catalog` (SKIRU_CATALOG) */
  prereqSkiruId?: string
  /** Altra Waza già nota al personaggio (es. passiva Tōrō) — id da `WAZA_POOL` */
  prereqWazaId?: string
  /** Grado militare minimo richiesto */
  prereqGradoMin?: WazaGradoMilitare
  /** Trigger opzionale al lancio (sconto, boost, risorse, ecc.) — anche Madōsho / Patto */
  launchTrigger?: WazaLaunchTrigger
  /**
   * Passiva/attiva: quando dichiarata in chat, applica questi tag nel contesto di gioco previsto dalla scheda (oggi spesso arma).
   * Il Master arbitra stack, reset e quali contesti sono validi; il software usa i tag per i calcoli condizionali previsti.
   * Regola Oyasumi (assoluta): le **letture** condizionali considerano i tag validi solo se la waza che li ha concessi
   * è stata dichiarata nello **stesso turno** del giocatore che lancia la tecnica che legge.
   */
  weaponTagsOnLaunch?: string[]
  /**
   * Attiva (tipicamente): se il contesto espone uno dei tag richiesti, applica i modificatori numerici del rango in uso
   * (danno / velocità / gittata); altrimenti restano i valori base della Waza.
   */
  conditionalBranches?: WazaConditionalBranch[]
}

/** Testo in scheda al rango indicato (varianti cumulative II e III). */
export function composeWazaRankText(
  base: string | undefined,
  u2: string | undefined,
  u3: string | undefined,
  rank: 1 | 2 | 3,
): string {
  const b = (base || '').trim()
  const t2 = (u2 || '').trim()
  const t3 = (u3 || '').trim()
  if (rank === 1) return b
  if (rank === 2) return t2 ? (b ? `${b}\n\n${t2}` : t2) : b
  const mid = t2 ? (b ? `${b}\n\n${t2}` : t2) : b
  return t3 ? (mid ? `${mid}\n\n${t3}` : t3) : mid
}


/** Elenco tecniche Waza — popola dal Tool inserimento Waza (Idee e sviluppo → Esporta codice → incolla qui, o usa un file dedicato importato). */
export const WAZA_POOL: WazaDef[] = [
  ...GENERICHE_WAZA_POOL,
  ...ORDINE_WAZA_POOL,
  ...ONIMORI_WAZA_POOL,
  ...TOKA_WAZA_POOL,
  ...GENZAI_WAZA_POOL,
  ...ITO_WAZA_POOL,
  ...NAIKAN_WAZA_POOL,
  ...HENSEI_WAZA_POOL,
  ...HADO_WAZA_POOL,
]

/** Id con placeholder da risolvere — riempi mentre ricostruisci il pool. */
export const WAZA_CON_INCOGNITE = new Set<string>([])

/** Calcola velocità waza: [((D×0.6)+(M×0.4))+Bonus] × M.G. */
export function calcVelocity(
  D: number,
  M: number,
  velBonus: number,
  velMult: number
): number {
  const base = floor(D * 0.6) + floor(M * 0.4) + velBonus
  return Math.floor(base * velMult)
}

/** Risolve DBW (numero o funzione) */
export function resolveDbw(
  dbw: number | ((s: WazaStats) => number),
  stats: WazaStats
): number {
  return typeof dbw === 'function' ? dbw(stats) : dbw
}

/** Calcola danno waza: [(DBW+(E×0.7))+BA/BO/B] × M.G. */
export function calcDamage(
  E: number,
  dbw: number,
  bonus: number,
  dmgMult: number
): number {
  const base = dbw + floor(E * 0.7) + bonus
  return Math.floor(base * dmgMult)
}
