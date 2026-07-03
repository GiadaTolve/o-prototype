/** Kōmei (抗命) — inversione status negativi · Naikan-dō. */

import type { StatusContainer, StatusId, StatusCombatModifiers } from '../../combat/status/types'
import { applyStatus, removeStatus } from '../../combat/status/engine'

export const KOMEI_DURATION_TURNS = 3
export const KOMEI_CS_COST = 6

/** Status negativi invertibili da Kōmei. */
export const KOMEI_INVERTIBLE_STATUS_IDS: readonly StatusId[] = [
  'incendiato',
  'emorragia',
  'sovraccarico',
  'torpore',
  'appesantimento',
  'vertigini',
] as const

export type KomeiInversionId = 'rovente' | 'carburante' | 'armatura' | 'potenza' | 'ferocia'

const STATUS_TO_INVERSION: Partial<Record<StatusId, KomeiInversionId>> = {
  incendiato: 'rovente',
  emorragia: 'rovente',
  sovraccarico: 'carburante',
  torpore: 'armatura',
  appesantimento: 'potenza',
  vertigini: 'ferocia',
}

export type NaikanKomeiState = {
  inversions: KomeiInversionId[]
  turnsLeft: number
}

export type NaikanKomeiMeta = {
  naikanKomei?: NaikanKomeiState | null
}

export function readKomeiState(meta: NaikanKomeiMeta | null | undefined): NaikanKomeiState | null {
  const k = meta?.naikanKomei
  if (!k || k.turnsLeft <= 0 || k.inversions.length === 0) return null
  return k
}

export function hasKomeiEligibleNegativeStatus(container: StatusContainer): boolean {
  return container.statuses.some((s) =>
    (KOMEI_INVERTIBLE_STATUS_IDS as readonly string[]).includes(s.id),
  )
}

export function activateKomei(
  container: StatusContainer,
  meta: NaikanKomeiMeta,
): {
  container: StatusContainer
  meta: NaikanKomeiMeta
  removed: StatusId[]
  inversions: KomeiInversionId[]
  error?: string
} {
  if (!hasKomeiEligibleNegativeStatus(container)) {
    return {
      container,
      meta,
      removed: [],
      inversions: [],
      error: 'Kōmei richiede almeno uno status negativo attivo',
    }
  }

  let next = container
  const removed: StatusId[] = []
  const inversionSet = new Set<KomeiInversionId>()

  for (const id of KOMEI_INVERTIBLE_STATUS_IDS) {
    const idx = next.statuses.findIndex((s) => s.id === id)
    if (idx === -1) continue
    removed.push(id)
    const inv = STATUS_TO_INVERSION[id]
    if (inv) inversionSet.add(inv)
    next = removeStatus(next, id)
  }

  if (inversionSet.has('ferocia')) {
    next = applyStatus(next, 'ira', { stacks: 2 })
  }

  return {
    container: next,
    meta: {
      ...meta,
      naikanKomei: {
        inversions: [...inversionSet],
        turnsLeft: KOMEI_DURATION_TURNS,
      },
    },
    removed,
    inversions: [...inversionSet],
  }
}

export function tickKomeiEndOfTurn(meta: NaikanKomeiMeta): NaikanKomeiMeta {
  const k = readKomeiState(meta)
  if (!k) return { ...meta, naikanKomei: null }
  const turnsLeft = k.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, naikanKomei: null }
  return { ...meta, naikanKomei: { ...k, turnsLeft } }
}

export function compileKomeiModifiers(komei: NaikanKomeiState | null): Partial<StatusCombatModifiers> {
  if (!komei) return {}
  const out: Partial<StatusCombatModifiers> = {}
  for (const inv of komei.inversions) {
    switch (inv) {
      case 'carburante':
        out.bonusCsPerTurn = (out.bonusCsPerTurn ?? 0) + 2
        break
      case 'armatura':
        out.mitigationBonusPercent = (out.mitigationBonusPercent ?? 0) + 10
        break
      case 'potenza':
        out.offensiveTierBonus = (out.offensiveTierBonus ?? 0) + 1
        break
      case 'rovente':
        out.komeiRovente = true
        break
      case 'ferocia':
        break
    }
  }
  return out
}

export function formatKomeiSegment(meta: NaikanKomeiMeta): string | null {
  const k = readKomeiState(meta)
  if (!k) return null
  const labels: Record<KomeiInversionId, string> = {
    rovente: 'Rovente',
    carburante: 'Carburante',
    armatura: 'Armatura',
    potenza: 'Potenza',
    ferocia: 'Ferocia',
  }
  const names = k.inversions.map((i) => labels[i]).join(', ')
  return `Kōmei: ${names} (${k.turnsLeft} turni)`
}

/** Kōmei Rovente: colpo a contatto applica [Incendiato] (1 stack). */
export function applyKomeiRoventeOnContactHit(
  defenderContainer: StatusContainer,
  attackerHasRovente: boolean,
): StatusContainer {
  if (!attackerHasRovente) return defenderContainer
  return applyStatus(defenderContainer, 'incendiato', { stacks: 1, addStacks: true })
}
