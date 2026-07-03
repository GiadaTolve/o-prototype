import {
  ELEMENTAL_STATUS_BY_ELEMENT,
  STATUS_DEFINITIONS,
  getStatusDefinition,
} from './catalog'
import type {
  ApplyStatusOptions,
  ConfrontationStatusEvent,
  ElementId,
  StatusContainer,
  StatusId,
  StatusInstance,
  StatusTargetKind,
  StatusTickResult,
} from './types'

export function createStatusContainer(targetKind: StatusTargetKind = 'character'): StatusContainer {
  return { targetKind, statuses: [] }
}

function clampStacks(id: StatusId, stacks: number): number {
  const def = getStatusDefinition(id)
  const min = 1
  const max = def.maxStacks
  if (max == null) return Math.max(min, stacks)
  return Math.max(min, Math.min(max, stacks))
}

function findStatusIndex(container: StatusContainer, id: StatusId): number {
  return container.statuses.findIndex((s) => s.id === id)
}

export function getStatusStacks(container: StatusContainer, id: StatusId): number {
  const idx = findStatusIndex(container, id)
  if (idx === -1) return 0
  return container.statuses[idx].stacks
}

function resolveInitialStacks(id: StatusId, options: ApplyStatusOptions): number {
  const def = getStatusDefinition(id)
  if (options.durationTurns != null) return clampStacks(id, options.durationTurns)
  if (options.stacks != null) return clampStacks(id, options.stacks)
  if (def.baseDurationTurns != null) return clampStacks(id, def.baseDurationTurns)
  return clampStacks(id, def.defaultStacks)
}

/** Applica o aggiorna uno status (personaggio o costrutto). */
export function applyStatus(
  container: StatusContainer,
  id: StatusId,
  options: ApplyStatusOptions = {},
): StatusContainer {
  const stacks = resolveInitialStacks(id, options)
  const idx = findStatusIndex(container, id)
  const next = [...container.statuses]

  if (idx === -1) {
    next.push({ id, stacks })
  } else if (options.addStacks) {
    next[idx] = { id, stacks: clampStacks(id, next[idx].stacks + stacks) }
  } else {
    next[idx] = { id, stacks }
  }

  return { ...container, statuses: next.filter((s) => s.stacks > 0) }
}

export function removeStatus(container: StatusContainer, id: StatusId): StatusContainer {
  return {
    ...container,
    statuses: container.statuses.filter((s) => s.id !== id),
  }
}

export function applyElementalStatus(
  container: StatusContainer,
  element: ElementId,
  options: ApplyStatusOptions = {},
): StatusContainer {
  const mapping = ELEMENTAL_STATUS_BY_ELEMENT[element]
  const def = getStatusDefinition(mapping.statusId)
  return applyStatus(container, mapping.statusId, {
    durationTurns: options.durationTurns ?? def.baseDurationTurns,
    stacks: options.stacks,
    addStacks: options.addStacks,
  })
}

/** Colpo subito con successo — Macchiato perde 1 stack. */
export function onSuccessfulHitTaken(container: StatusContainer): StatusContainer {
  const idx = findStatusIndex(container, 'macchiato')
  if (idx === -1) return container
  const next = [...container.statuses]
  const stacks = next[idx].stacks - 1
  if (stacks <= 0) next.splice(idx, 1)
  else next[idx] = { ...next[idx], stacks }
  return { ...container, statuses: next }
}

/** Euforia: +1 stack se vince il confronto, −1 se subisce danno (min 0 → rimuove). */
export function onConfrontationStatusEvent(
  container: StatusContainer,
  event: ConfrontationStatusEvent,
): StatusContainer {
  const idx = findStatusIndex(container, 'euforia')
  if (idx === -1) return container

  let delta = 0
  if (event.won) delta += 1
  if (event.tookDamage) delta -= 1
  if (delta === 0) return container

  const next = [...container.statuses]
  const stacks = next[idx].stacks + delta
  if (stacks <= 0) next.splice(idx, 1)
  else next[idx] = { ...next[idx], stacks }
  return { ...container, statuses: next }
}

/**
 * Beatitudine → transizioni per soglia CS:
 * CS ≥ 15 → Disperazione; CS ≤ 5 → Euforia; altrimenti → Tristezza.
 */
export function resolveBeatitudeTransitions(
  container: StatusContainer,
  currentCs: number,
): StatusContainer {
  if (findStatusIndex(container, 'beatitudine') === -1) return container

  let next = removeStatus(container, 'beatitudine')
  if (currentCs >= 15) next = applyStatus(next, 'disperazione')
  else if (currentCs <= 5) next = applyStatus(next, 'euforia')
  else next = applyStatus(next, 'tristezza')
  return next
}

function decayStatus(instance: StatusInstance): StatusInstance | null {
  const def = getStatusDefinition(instance.id)
  if (!def.decaysOnEndOfTurn) return instance
  const stacks = instance.stacks - 1
  if (stacks <= 0) return null
  return { ...instance, stacks }
}

/** Fine turno PG: decay stack, danno persistente, transizioni Beatitudine. */
export function tickStatusEndOfCharacterTurn(
  container: StatusContainer,
  options: { currentCs?: number; blockStatusDecay?: boolean } = {},
): StatusTickResult {
  const log: string[] = []
  let selfDamage = 0

  for (const s of container.statuses) {
    const def = getStatusDefinition(s.id)
    const perStack = def.modifiers.endOfTurnSelfDamagePerStack ?? 0
    if (perStack > 0) {
      const dmg = perStack * s.stacks
      selfDamage += dmg
      log.push(`${def.tag}: ${dmg} danno (${s.stacks} stack)`)
    }
  }

  let nextStatuses = options.blockStatusDecay
    ? container.statuses
    : container.statuses
        .map(decayStatus)
        .filter((s): s is StatusInstance => s != null)

  let next: StatusContainer = { ...container, statuses: nextStatuses }

  if (options.currentCs != null && findStatusIndex(next, 'beatitudine') !== -1) {
    next = resolveBeatitudeTransitions(next, options.currentCs)
    log.push(`Beatitudine → transizione (CS ${options.currentCs})`)
  }

  return { container: next, selfDamage, log }
}

export function listActiveStatusTags(container: StatusContainer): string[] {
  return container.statuses.map((s) => getStatusDefinition(s.id).tag)
}

/** Ira: ignorare vincolo movimento costa 2 CS (validazione narrativa). */
export const IRA_IGNORE_MOVEMENT_CS_COST = 2

export { STATUS_DEFINITIONS, ELEMENTAL_STATUS_BY_ELEMENT }
