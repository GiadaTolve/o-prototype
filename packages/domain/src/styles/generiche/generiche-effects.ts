/** Semi-automazione waza Generiche — effetti meccanici tracciabili in chat. */
import { CS_CAPACITY } from '../../combat/chrono-stack'
import { applyStatus } from '../../combat/status/engine'
import type { StatusContainer, StatusId } from '../../combat/status/types'

export const GENERICHE_IPPUKU_POOL = 'generiche-ippuku-gestione-pressione'
export const GENERICHE_IPPUKU_CS_GAIN = 3

export type GenericheStatusOnHitSpec = {
  statusId: StatusId
  stacks?: number
  durationTurns?: number
}

/** Waza generiche che applicano status al bersaglio colpito (con tag colpito). */
export const GENERICHE_STATUS_ON_HIT: Record<string, GenericheStatusOnHitSpec> = {
  'generiche-suishin-acupressione-liquida': { statusId: 'emorragia', stacks: 1 },
  'generiche-nenmo-ragnatela-mercurio': { statusId: 'rallentato', durationTurns: 2 },
  'generiche-kyokan-urlo-lobo-frontale': { statusId: 'vertigini', stacks: 1 },
  'generiche-hankyo-eco-astio': { statusId: 'vertigini', stacks: 1 },
}

/** `[generiche:colpito:NomePG]` o `[generiche:colpito:id:uuid]`. */
export function extractGenericheHitTargetSpec(
  text: string,
): { characterId?: string; nameQuery?: string } | null {
  const idMatch = /\[generiche:\s*colpito\s*:\s*id:([0-9a-f-]{36})\s*\]/i.exec(text)
  if (idMatch) return { characterId: idMatch[1] }
  const nameMatch = /\[generiche:\s*colpito\s*:\s*([^\]]+)\]/i.exec(text)
  if (!nameMatch) return null
  const q = nameMatch[1]?.trim()
  if (!q || /^id:/i.test(q)) return null
  return { nameQuery: q }
}

export type GenericheIppukuResult = {
  csDelta: number
  statusContainer: StatusContainer
  overheatApplied: boolean
}

export function processGenericheIppuku(
  statusContainer: StatusContainer,
  chronoCsAvailable: number,
  priorCsDelta: number,
): GenericheIppukuResult {
  const csDelta = GENERICHE_IPPUKU_CS_GAIN
  const projected = chronoCsAvailable + priorCsDelta + csDelta
  let next = statusContainer
  let overheatApplied = false
  if (projected > CS_CAPACITY) {
    next = applyStatus(next, 'sovraccarico')
    overheatApplied = true
  }
  return { csDelta, statusContainer: next, overheatApplied }
}

export function findGenericheStatusPoolId(poolIds: readonly string[]): string | null {
  for (const id of poolIds) {
    if (GENERICHE_STATUS_ON_HIT[id]) return id
  }
  return null
}
