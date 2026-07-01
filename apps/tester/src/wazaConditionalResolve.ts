/**
 * Risoluzione Waza condizionali (tag di contesto ↔ modificatori per rango).
 * Esempio narrativo: passiva Tōrō in chat → tag `toro` nel contesto rilevante (es. arma) → attiva con `conditionalBranches` applica il ramo se matcha.
 * In futuro gli stessi tag potranno agganciare altri ambiti; il resolver confronta solo l’insieme di tag passato nel contesto.
 */

import type {
  WazaConditionalBranch,
  WazaConditionalModifiers,
  WazaDef,
  WazaWeaponConditionTag,
} from './wazaPool'
import { calcDamage } from './wazaPool'
import { evalDbwAtRank, evalGittataAtRank, evalVelAtRank } from './wazaRankResolve'

export type WeaponConditionContext = {
  /**
   * Tag attivi nel contesto usato per questa risoluzione (derivati da dichiarazioni in chat, effetti Master, ecc.).
   * Oggi il tester usa soprattutto il contesto «arma»; altri contesti potranno alimentare lo stesso meccanismo.
   */
  tags: ReadonlySet<string>
  /**
   * Regola Oyasumi: i rami condizionali si applicano solo se la waza che ha **concesso** i tag è stata dichiarata
   * nello **stesso turno** del giocatore che lancia questa tecnica. Se `false`, non attivare alcun ramo (anche con tag presenti).
   * Se omesso → `true` (es. tester / default).
   */
  grantorSameTurn?: boolean
}

export function matchConditionalBranch(
  branches: WazaConditionalBranch[] | undefined,
  ctx: WeaponConditionContext,
): WazaConditionalBranch | null {
  if (ctx.grantorSameTurn === false) return null
  if (!branches?.length) return null
  for (const b of branches) {
    if (b.requireAnyWeaponTag.some((t) => ctx.tags.has(t))) return b
  }
  return null
}

export function modifiersForRank(
  branch: WazaConditionalBranch | null,
  rank: 1 | 2 | 3,
): WazaConditionalModifiers | null {
  if (!branch) return null
  const m = branch.byRank[rank]
  return m && Object.keys(m).length > 0 ? m : null
}

function mergeModifiers(base: WazaConditionalModifiers | null): Required<WazaConditionalModifiers> {
  return {
    damageMult: base?.damageMult ?? 1,
    velocityAdd: base?.velocityAdd ?? 0,
    gittataMetersAdd: base?.gittataMetersAdd ?? 0,
  }
}

export type ResolvedWazaNumbers = {
  rank: 1 | 2 | 3
  /** DBW numerico risolto (prima del moltiplicatore grado sul danno). */
  dbw: number | null
  /** Velocità tecnica (formula Waza), prima dell’additivo condizionale. */
  velocityBase: number | null
  velocityFinal: number | null
  /** Gittata in metri. */
  gittataBase: number | null
  gittataFinal: number | null
  /** Danno dopo formula standard e M.G., prima del damageMult condizionale. */
  damageBase: number | null
  damageFinal: number | null
  conditionalBranchId: string | null
  modifiersApplied: WazaConditionalModifiers | null
}

/**
 * Esempio numerico completo: richiede bonus danno scheda e moltiplicatore grado (come nel bulletin combattimento).
 */
export function resolveWazaCombatNumbers(
  waza: WazaDef,
  rank: 1 | 2 | 3,
  stats: import('./wazaPool').WazaStats,
  ctx: WeaponConditionContext,
  opts: { empathy: number; bonusDmg: number; gradeDmgMult: number },
): ResolvedWazaNumbers {
  const branch = matchConditionalBranch(waza.conditionalBranches, ctx)
  const rawMod = modifiersForRank(branch, rank)
  const mod = mergeModifiers(rawMod)

  const dbw = evalDbwAtRank(waza, rank, stats)
  const velBase = waza.hasVelocity ? evalVelAtRank(waza, rank, stats) : null
  const gitBase = evalGittataAtRank(waza, rank, stats)

  let damageBase: number | null = null
  let damageFinal: number | null = null
  if (waza.hasDamage && dbw != null) {
    damageBase = calcDamage(opts.empathy, dbw, opts.bonusDmg, opts.gradeDmgMult)
    damageFinal = Math.floor(damageBase * mod.damageMult)
  }

  const velocityFinal =
    velBase != null ? Math.floor(velBase + mod.velocityAdd) : null
  const gittataFinal =
    gitBase != null ? Math.floor(gitBase + mod.gittataMetersAdd) : null

  return {
    rank,
    dbw,
    velocityBase: velBase,
    velocityFinal,
    gittataBase: gitBase,
    gittataFinal,
    damageBase,
    damageFinal,
    conditionalBranchId: branch?.id ?? null,
    modifiersApplied: rawMod,
  }
}

/** Tag di esempio per UI (Tōrō attivo). */
export const DEMO_WEAPON_TAGS_TORO: ReadonlySet<WazaWeaponConditionTag> = new Set(['toro'])
