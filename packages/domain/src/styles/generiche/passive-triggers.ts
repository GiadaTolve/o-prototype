/** Automazioni chat per passive Generiche equipaggiate (Kajiba, Iai). */

export const KAJIBA_POOL = 'generiche-kajiba-adrenalina'
export const IAI_POOL = 'generiche-iai-incombenza'

export type GenerichePassiveMeta = {
  /** Prima volta sotto 50% HP nel combattimento. */
  genericheKajibaHalfHpTriggered?: boolean
  /** Prossima waza +1 tier (Kajiba). */
  genericheKajibaTierBonusPending?: boolean
  /** Turno precedente senza waza — prerequisito Iai. */
  genericheIaiReady?: boolean
  /** Waza lanciate nel turno corrente (per cap Iai: una sola). */
  genericheIaiWazaLaunchesThisTurn?: number
  /** Bersagli già colpiti dall'attore nel turno/combattimento (Iai). */
  genericheIaiDamagedTargetIds?: string[]
  /** True se nel turno corrente è stata dichiarata almeno una waza. */
  genericheTurnWazaUsed?: boolean
}

export function hasEquippedPassivePool(
  equippedPools: readonly string[] | undefined,
  poolId: string,
): boolean {
  return equippedPools?.includes(poolId) ?? false
}

/** Kajiba: prima discesa sotto 50% HP → bonus tier sulla prossima waza. */
export function onActorHpCrossedBelowHalf(
  meta: GenerichePassiveMeta,
  hpBefore: number,
  hpAfter: number,
  hpMax: number,
  hasKajiba: boolean,
): { meta: GenerichePassiveMeta; triggered: boolean } {
  if (!hasKajiba || meta.genericheKajibaHalfHpTriggered || hpMax <= 0) {
    return { meta, triggered: false }
  }
  const half = hpMax / 2
  if (hpBefore > half && hpAfter <= half) {
    return {
      meta: {
        ...meta,
        genericheKajibaHalfHpTriggered: true,
        genericheKajibaTierBonusPending: true,
      },
      triggered: true,
    }
  }
  return { meta, triggered: false }
}

/** Fine turno: aggiorna stato Iai per il turno successivo. */
export function tickGenericheIaiEndOfTurn(
  meta: GenerichePassiveMeta,
  usedWazaThisTurn: boolean,
): GenerichePassiveMeta {
  return {
    ...meta,
    genericheIaiReady: !usedWazaThisTurn,
    genericheIaiWazaLaunchesThisTurn: 0,
    genericheIaiDamagedTargetIds: [],
    genericheTurnWazaUsed: false,
  }
}

export function markTurnWazaUsed(meta: GenerichePassiveMeta): GenerichePassiveMeta {
  return { ...meta, genericheTurnWazaUsed: true }
}

export function noteWazaLaunchThisTurn(meta: GenerichePassiveMeta): GenerichePassiveMeta {
  const n = meta.genericheIaiWazaLaunchesThisTurn ?? 0
  return {
    ...markTurnWazaUsed(meta),
    genericheIaiWazaLaunchesThisTurn: n + 1,
  }
}

export function noteDamageDealtToTarget(
  meta: GenerichePassiveMeta,
  targetCharacterId: string,
): GenerichePassiveMeta {
  const ids = meta.genericheIaiDamagedTargetIds ?? []
  if (ids.includes(targetCharacterId)) return meta
  return { ...meta, genericheIaiDamagedTargetIds: [...ids, targetCharacterId] }
}

/** Bonus tier cumulativi (Kajiba + Iai) al momento del lancio con colpo. */
export function resolvePassiveLaunchTierBonus(
  meta: GenerichePassiveMeta,
  targetCharacterId: string,
  equippedPools: readonly string[] | undefined,
): { meta: GenerichePassiveMeta; tierSteps: number; sources: string[] } {
  let tierSteps = 0
  const sources: string[] = []
  let next: GenerichePassiveMeta = { ...meta }

  if (hasEquippedPassivePool(equippedPools, KAJIBA_POOL) && next.genericheKajibaTierBonusPending) {
    tierSteps += 1
    sources.push('Kajiba')
    next = { ...next, genericheKajibaTierBonusPending: false }
  }

  if (hasEquippedPassivePool(equippedPools, IAI_POOL) && next.genericheIaiReady) {
    const launches = next.genericheIaiWazaLaunchesThisTurn ?? 0
    const damaged = next.genericheIaiDamagedTargetIds ?? []
    if (launches === 0 && !damaged.includes(targetCharacterId)) {
      tierSteps += 1
      sources.push('Iai')
    }
  }

  return { meta: next, tierSteps, sources }
}
