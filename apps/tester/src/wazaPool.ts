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

/** Tutte le waza disponibili (per ora solo Dō) */
export const WAZA_POOL: WazaDef[] = [...WAZA_POOL_DO]

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
