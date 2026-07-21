import { parseWazaTierFromRank } from '../combat/waza-rank'
import { isWazaTier, type WazaTier } from '../combat/tier'

/** Costo EXP di default per tier attivo (regola catalogo Oyasumi). */
export const WAZA_DEFAULT_COST_EXP_BY_TIER: Record<WazaTier, number> = {
  1: 15,
  2: 20,
  3: 25,
  4: 35,
  5: 40,
}

export const WAZA_DEFAULT_PASSIVE_COST_EXP = 15

export function resolveDefaultWazaCostExp(input: {
  isPassive?: boolean
  rank?: string | null
  tier?: number | null
}): number {
  if (input.isPassive) return WAZA_DEFAULT_PASSIVE_COST_EXP

  const tierFromInput =
    input.tier != null && isWazaTier(input.tier) ? input.tier : parseWazaTierFromRank(input.rank)

  if (!tierFromInput) return WAZA_DEFAULT_COST_EXP_BY_TIER[1]
  return WAZA_DEFAULT_COST_EXP_BY_TIER[tierFromInput]
}

export function wazaCostExpLabel(tier: WazaTier | null, isPassive: boolean): string {
  if (isPassive) return `Passiva · ${WAZA_DEFAULT_PASSIVE_COST_EXP} EXP`
  const t = tier ?? 1
  return `T${t} · ${WAZA_DEFAULT_COST_EXP_BY_TIER[t]} EXP`
}
