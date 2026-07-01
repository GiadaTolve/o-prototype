/** Kyōshin (共振) — Frequenza Disarmante · Generiche. */

import { getTierValue, isWazaTier, type WazaTier } from '../../combat/tier'

export const KYOSHIN_POOL = 'generiche-kyoshin-frequenza-disarmante'
export const KYOSHIN_CS_PENALTY = 2
export const KYOSHIN_DEFAULT_TIER = 2 as WazaTier

export type GenericheKyoshinState = {
  tier: WazaTier
}

export type GenericheKyoshinMeta = {
  genericheKyoshin?: GenericheKyoshinState | null
}

export function readKyoshinState(meta: GenericheKyoshinMeta | null | undefined): GenericheKyoshinState | null {
  const k = meta?.genericheKyoshin
  if (!k || !isWazaTier(k.tier)) return null
  return k
}

export function applyKyoshinVibration(
  meta: GenericheKyoshinMeta,
  tier: WazaTier = KYOSHIN_DEFAULT_TIER,
): GenericheKyoshinMeta {
  return { ...meta, genericheKyoshin: { tier } }
}

export function clearKyoshinVibration(meta: GenericheKyoshinMeta): GenericheKyoshinMeta {
  return { ...meta, genericheKyoshin: null }
}

/** Bersaglio usa una waza: paga +2 CS e la vibrazione svanisce. */
export function consumeKyoshinOnWazaUse(meta: GenericheKyoshinMeta): {
  meta: GenericheKyoshinMeta
  csPenalty: number
} {
  if (!readKyoshinState(meta)) return { meta, csPenalty: 0 }
  return { meta: clearKyoshinVibration(meta), csPenalty: KYOSHIN_CS_PENALTY }
}

/** Fine turno senza aver usato waza: danno = tier. */
export function tickKyoshinEndOfTurn(meta: GenericheKyoshinMeta): {
  meta: GenericheKyoshinMeta
  damage: number
} {
  const k = readKyoshinState(meta)
  if (!k) return { meta, damage: 0 }
  return {
    meta: clearKyoshinVibration(meta),
    damage: getTierValue(k.tier),
  }
}

export function formatKyoshinSegment(meta: GenericheKyoshinMeta): string | null {
  const k = readKyoshinState(meta)
  if (!k) return null
  return `Kyōshin: vibrazione attiva (prossima waza +${KYOSHIN_CS_PENALTY} CS · altrimenti ${getTierValue(k.tier)} danno a fine turno)`
}
