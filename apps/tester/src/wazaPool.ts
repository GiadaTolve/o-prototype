/**
 * Pool di tecniche Waza — Ramo Dō (Le vie) e altri rami
 * Ogni tecnica ha: costo Jigo-ka, eventuale costo CS, formule Velocità e Danno
 *
 * Formule (WAZA_CALCOLI.md):
 * Velocità = [((D × 0.6) + (M × 0.4)) + Bonus Waza] × M.G.
 * DMG = [(DBW + (E × 0.7)) + BA/BO/B] × M.G.
 */

const floor = Math.floor

export type WazaType = 'passive' | 'active'
export type WazaBranch = 'do' | 'manipolazione' | 'materializzazione' | 'emissione' | 'trasformazione' | 'supporto'

export interface WazaStats {
  D: number
  M: number
  E: number
  LVL: number
}

export interface WazaDef {
  id: string
  name: string
  type: WazaType
  branch: WazaBranch
  description?: string
  /** Costo Jigo-ka (mana) */
  costJigo: (stats: WazaStats) => number
  /** Costo Chrono Stack (0 = non consuma) */
  costCs: number
  /** Bonus Waza per formula velocità (default 0) */
  velBonus: number
  /** Danno Base Waza (numero o funzione che ritorna da stats) */
  dbw: number | ((stats: WazaStats) => number)
  /** Ha formula velocità applicabile */
  hasVelocity: boolean
  /** Ha formula danno applicabile */
  hasDamage: boolean
}

/** Ramo Dō (Le vie) — Passive [6] + Attive [6] */
export const WAZA_POOL_DO: WazaDef[] = [
  // ─── PASSIVE [6] ───
  {
    id: 'arma-psichica',
    name: 'Arma psichica',
    type: 'passive',
    branch: 'do',
    costJigo: (s) => 5 + floor(s.M / 4),
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: false,
    hasDamage: false,
  },
  {
    id: 'ordine',
    name: 'Ordine!',
    type: 'passive',
    branch: 'do',
    costJigo: () => 0,
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: true,
    hasDamage: false,
  },
  {
    id: 'ottimizzazione',
    name: 'Ottimizzazione',
    type: 'passive',
    branch: 'do',
    costJigo: () => 0,
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: false,
    hasDamage: false,
  },
  {
    id: 'traccia-elementale',
    name: 'Traccia elementale',
    type: 'passive',
    branch: 'do',
    costJigo: (s) => 8 + floor(s.M / 3),
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: false,
    hasDamage: false,
  },
  {
    id: 'legare-frammenti',
    name: 'Legare i frammenti',
    type: 'passive',
    branch: 'do',
    costJigo: (s) => 12 + floor(s.E * 1.2) + floor(s.M / 4),
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: false,
    hasDamage: false,
  },
  {
    id: 'impatto-jigoka',
    name: 'Impatto Jigo-ka',
    type: 'passive',
    branch: 'do',
    costJigo: (s) => {
      const x = 1 + floor(s.M / 5) + s.LVL
      return x * (4 + floor(s.M / 5))
    },
    costCs: 0,
    velBonus: 0,
    dbw: (s) => 1 + floor(s.M / 5) + s.LVL,
    hasVelocity: false,
    hasDamage: true,
  },
  // ─── ATTIVE [6] ───
  {
    id: 'estensione',
    name: 'Estensione',
    type: 'active',
    branch: 'do',
    costJigo: (s) => 6 + (1 + floor(s.M / 5) + s.LVL) * 2,
    costCs: 2,
    velBonus: 0,
    dbw: 5,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'sfogo-jigoka',
    name: 'Sfogo Jigo-ka',
    type: 'active',
    branch: 'do',
    costJigo: (s) => 10 + floor(s.M / 2),
    costCs: 3,
    velBonus: 0,
    dbw: 8,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'laser-psichico',
    name: 'Laser psichico',
    type: 'active',
    branch: 'do',
    costJigo: (s) => 14 + floor(s.M * 0.8),
    costCs: 5,
    velBonus: 0,
    dbw: 10,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'arma-animata',
    name: 'Arma animata',
    type: 'active',
    branch: 'do',
    costJigo: (s) => 16 + floor(s.M / 2) + floor(s.E / 3),
    costCs: 3,
    velBonus: 0,
    dbw: 6,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'sorpresa',
    name: 'Sorpresa',
    type: 'active',
    branch: 'do',
    costJigo: (s) => 8 + floor(s.M / 4),
    costCs: 2,
    velBonus: 0,
    dbw: 7,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'risonanza-lama',
    name: 'Risonanza della lama',
    type: 'active',
    branch: 'do',
    costJigo: (s) => 12 + floor(s.M / 3),
    costCs: 5,
    velBonus: 0,
    dbw: 9,
    hasVelocity: true,
    hasDamage: true,
  },
]

/** Manipolazione — Passive [6] + Attive [6] */
const WAZA_POOL_MANIPOLAZIONE: WazaDef[] = [
  { id: 'telecinesi', name: 'Telecinesi', type: 'passive', branch: 'manipolazione', costJigo: (s) => 8 + floor(s.M / 4), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'mago-consistenza', name: 'Mago della consistenza', type: 'passive', branch: 'manipolazione', costJigo: (s) => 6 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'mago-forma', name: 'Mago della forma', type: 'passive', branch: 'manipolazione', costJigo: (s) => 10 + floor(s.M / 3), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'pieno-controllo', name: 'Pieno controllo', type: 'passive', branch: 'manipolazione', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'scissione', name: 'Scissione', type: 'passive', branch: 'manipolazione', costJigo: (s) => 5 + floor(s.M / 6), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'furia-telecineta', name: 'Furia Telecineta', type: 'active', branch: 'manipolazione', costJigo: (s) => 12 + floor(s.M / 3) + floor(s.E / 4), costCs: 3, velBonus: 0, dbw: 8, hasVelocity: true, hasDamage: true },
  { id: 'scambio', name: 'Scambio', type: 'active', branch: 'manipolazione', costJigo: (s) => 10 + floor(s.M / 4), costCs: 2, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'danni-collaterali', name: 'Danni poco collaterali', type: 'active', branch: 'manipolazione', costJigo: (s) => 14 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 9, hasVelocity: true, hasDamage: true },
  { id: 'magnetismo', name: 'Magnetismo', type: 'active', branch: 'manipolazione', costJigo: (s) => 16 + floor(s.M / 2) + floor(s.E / 3), costCs: 5, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'entanglement', name: 'Entanglement', type: 'active', branch: 'manipolazione', costJigo: (s) => 18 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'contraffazione', name: 'Contraffazione', type: 'active', branch: 'manipolazione', costJigo: (s) => 12 + floor(s.M / 3), costCs: 3, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'inversione-proprieta', name: 'Inversione di Proprietà', type: 'active', branch: 'manipolazione', costJigo: (s) => 20 + floor(s.M * 0.8), costCs: 5, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
]

/** Materializzazione — Passive [5] + Attive [5] */
const WAZA_POOL_MATERIALIZZAZIONE: WazaDef[] = [
  { id: 'addio-carne', name: 'Addio carne', type: 'passive', branch: 'materializzazione', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'affinita-elementale', name: 'Affinità elementale', type: 'passive', branch: 'materializzazione', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'potere-cognizione', name: 'Potere della cognizione', type: 'passive', branch: 'materializzazione', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'piccolo-arsenale', name: 'Piccolo arsenale', type: 'passive', branch: 'materializzazione', costJigo: (s) => 6 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'inventore', name: 'Inventore', type: 'passive', branch: 'materializzazione', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'memoria-forma', name: 'Memoria della Forma', type: 'passive', branch: 'materializzazione', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'infusione-persistente', name: 'Infusione Persistente', type: 'passive', branch: 'materializzazione', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'minaccia-concreta', name: 'Minaccia concreta', type: 'active', branch: 'materializzazione', costJigo: (s) => 15 + floor(s.M / 2) + floor(s.E / 3), costCs: 4, velBonus: 0, dbw: 10, hasVelocity: true, hasDamage: true },
  { id: 'dito-divino', name: 'Dito divino', type: 'active', branch: 'materializzazione', costJigo: (s) => 18 + floor(s.M * 0.7), costCs: 5, velBonus: 0, dbw: 12, hasVelocity: true, hasDamage: true },
  { id: 'alitosi-yokai', name: 'Alitosi dello Yokai', type: 'active', branch: 'materializzazione', costJigo: (s) => 12 + floor(s.M / 3), costCs: 3, velBonus: 0, dbw: 6, hasVelocity: false, hasDamage: true },
  { id: 'globo-rancoroso', name: 'Globo rancoroso', type: 'active', branch: 'materializzazione', costJigo: (s) => 14 + floor(s.M / 2) + floor(s.E / 4), costCs: 4, velBonus: 0, dbw: 8, hasVelocity: true, hasDamage: true },
  { id: 'colonne-pazienti', name: 'Colonne pazienti', type: 'active', branch: 'materializzazione', costJigo: (s) => 20 + floor(s.M / 2) + floor(s.E / 3), costCs: 5, velBonus: 0, dbw: 7, hasVelocity: false, hasDamage: true },
]

/** Emissione — Passive [5] + Attive [5] */
const WAZA_POOL_EMISSIONE: WazaDef[] = [
  { id: 'batteria', name: 'Batteria', type: 'passive', branch: 'emissione', costJigo: (s) => 8 + floor(s.M / 4), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'inversione', name: 'Inversione', type: 'passive', branch: 'emissione', costJigo: (s) => 6 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'emissione-bassa-freq', name: 'Emissione a bassa frequenza', type: 'passive', branch: 'emissione', costJigo: (s) => 5 + floor(s.M / 6), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'sicurezza-avanzata', name: 'Sicurezza avanzata', type: 'passive', branch: 'emissione', costJigo: (s) => 10 + floor(s.M / 4), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'deflagrazione-instabile', name: 'Deflagrazione instabile', type: 'passive', branch: 'emissione', costJigo: (s) => 7 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'sovraccarico-controllato', name: 'Sovraccarico Controllato', type: 'passive', branch: 'emissione', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'corto-circuito', name: 'Corto circuito', type: 'active', branch: 'emissione', costJigo: (s) => 14 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 11, hasVelocity: true, hasDamage: true },
  { id: 'lancio-jigoka', name: 'Lancio Jigo-ka', type: 'active', branch: 'emissione', costJigo: (s) => 10 + floor(s.M / 3), costCs: 2, velBonus: 0, dbw: 7, hasVelocity: true, hasDamage: true },
  { id: 'impeto-rilascio', name: 'Impeto a rilascio', type: 'active', branch: 'emissione', costJigo: (s) => 16 + floor(s.M * 0.6), costCs: 5, velBonus: 0, dbw: 9, hasVelocity: true, hasDamage: true },
  { id: 'scarico-forza', name: 'Scarico di forza', type: 'active', branch: 'emissione', costJigo: (s) => 18 + floor(s.M / 2), costCs: 5, velBonus: 0, dbw: 12, hasVelocity: true, hasDamage: true },
  { id: 'famiglio-onirico', name: 'Famiglio onirico', type: 'active', branch: 'emissione', costJigo: (s) => 22 + floor(s.M / 2) + floor(s.E / 3), costCs: 6, velBonus: 0, dbw: 8, hasVelocity: true, hasDamage: true },
  { id: 'detonazione-catena', name: 'Detonazione a Catena', type: 'active', branch: 'emissione', costJigo: (s) => 25 + floor(s.M * 0.8), costCs: 8, velBonus: 0, dbw: 15, hasVelocity: true, hasDamage: true },
]

/** Trasformazione — Passive [5] + Attive [5] */
const WAZA_POOL_TRASFORMAZIONE: WazaDef[] = [
  { id: 'volere', name: 'Volere', type: 'passive', branch: 'trasformazione', costJigo: (s) => 8 + floor(s.M / 4), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'cambio-forzato', name: 'Cambio forzato', type: 'passive', branch: 'trasformazione', costJigo: (s) => 10 + floor(s.M / 3), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'rinforzo-elementale', name: 'Rinforzo elementale', type: 'passive', branch: 'trasformazione', costJigo: (s) => 7 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'regole-alchemiche', name: 'Regole alchemiche', type: 'passive', branch: 'trasformazione', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'pietra-filosofale', name: 'Pietra filosofale', type: 'passive', branch: 'trasformazione', costJigo: (s) => 20 + floor(s.M / 2), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'trappola', name: 'Trappola!', type: 'active', branch: 'trasformazione', costJigo: (s) => 12 + floor(s.M / 3), costCs: 3, velBonus: 0, dbw: 6, hasVelocity: false, hasDamage: true },
  { id: 'aberrazione', name: 'Aberrazione', type: 'active', branch: 'trasformazione', costJigo: (s) => 16 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 8, hasVelocity: true, hasDamage: true },
  { id: 'jammer', name: 'Jammer', type: 'active', branch: 'trasformazione', costJigo: (s) => 14 + floor(s.M / 3), costCs: 4, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'velo-onirico', name: 'Velo onirico', type: 'active', branch: 'trasformazione', costJigo: (s) => 15 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'sorpresa-trasf', name: 'Sorpresa!', type: 'active', branch: 'trasformazione', costJigo: (s) => 10 + floor(s.M / 4), costCs: 2, velBonus: 0, dbw: 5, hasVelocity: false, hasDamage: true },
  { id: 'scambio-proprieta', name: 'Scambio di Proprietà', type: 'active', branch: 'trasformazione', costJigo: (s) => 22 + floor(s.M * 0.7), costCs: 6, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
]

/** Supporto — Passive [5] + Attive [5] */
const WAZA_POOL_SUPPORTO: WazaDef[] = [
  { id: 'ego-smisurato', name: 'Ego smisurato', type: 'passive', branch: 'supporto', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'tuttuno', name: "Tutt'uno", type: 'passive', branch: 'supporto', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'scelta-nucleo', name: 'Scelta del nucleo', type: 'passive', branch: 'supporto', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'adattamento-psicofisico', name: 'Adattamento psico-fisico', type: 'passive', branch: 'supporto', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'rinforzo-psichico', name: 'Rinforzo psichico', type: 'passive', branch: 'supporto', costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'forza-scudo', name: 'La mia forza, il mio scudo', type: 'active', branch: 'supporto', costJigo: () => 0, costCs: 3, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'forza-arco', name: 'La mia forza, il mio arco', type: 'active', branch: 'supporto', costJigo: () => 0, costCs: 3, velBonus: 0, dbw: 10, hasVelocity: true, hasDamage: true },
  { id: 'fibre-psichiche', name: 'Fibre psichiche', type: 'active', branch: 'supporto', costJigo: (s) => 12 + floor(s.M / 3) + floor(s.E / 4), costCs: 2, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'traslazione-forzata', name: 'Traslazione forzata', type: 'active', branch: 'supporto', costJigo: (s) => 10 + floor(s.M / 4), costCs: 3, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'tensione', name: 'Tensione', type: 'active', branch: 'supporto', costJigo: (s) => 8 + floor(s.M / 5), costCs: 2, velBonus: 0, dbw: 6, hasVelocity: true, hasDamage: true },
  { id: 'spinta-adrenalinica', name: 'Spinta Adrenalinica', type: 'active', branch: 'supporto', costJigo: (s) => 14 + floor(s.M / 2), costCs: 3, velBonus: 0, dbw: 0, hasVelocity: true, hasDamage: false },
]

/** Tutte le waza disponibili (tutti i rami Dō) */
export const WAZA_POOL: WazaDef[] = [
  ...WAZA_POOL_DO,
  ...WAZA_POOL_MANIPOLAZIONE,
  ...WAZA_POOL_MATERIALIZZAZIONE,
  ...WAZA_POOL_EMISSIONE,
  ...WAZA_POOL_TRASFORMAZIONE,
  ...WAZA_POOL_SUPPORTO,
]

/** Nomi rami per UI */
export const BRANCH_LABELS: Record<WazaBranch, string> = {
  do: 'Dō (Le vie)',
  manipolazione: 'Manipolazione',
  materializzazione: 'Materializzazione',
  emissione: 'Emissione',
  trasformazione: 'Trasformazione',
  supporto: 'Supporto',
}

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
