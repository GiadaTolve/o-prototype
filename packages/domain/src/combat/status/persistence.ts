import type { StatusContainer, StatusId, StatusInstance } from './types'
import { getStatusDefinition, resolveStatusIdFromTag, STATUS_DEFINITIONS } from './catalog'

export const STATUS_ID_LIST = Object.keys(STATUS_DEFINITIONS) as StatusId[]

export function isStatusId(value: string): value is StatusId {
  return value in STATUS_DEFINITIONS
}

export type PersistedStatusRow = {
  statusId: StatusId
  stacks: number
  targetKind?: 'character' | 'construct'
  constructRef?: string | null
}

export function rowsToStatusContainer(
  rows: PersistedStatusRow[],
  targetKind: 'character' | 'construct' = 'character',
): StatusContainer {
  const statuses: StatusInstance[] = rows
    .filter((r) => (r.targetKind ?? 'character') === targetKind && !r.constructRef)
    .map((r) => ({
      id: r.statusId,
      stacks: Math.max(1, Math.floor(r.stacks)),
    }))
  return { targetKind, statuses }
}

export function statusContainerToRows(container: StatusContainer): PersistedStatusRow[] {
  return container.statuses.map((s) => ({
    statusId: s.id,
    stacks: s.stacks,
    targetKind: container.targetKind,
    constructRef: null,
  }))
}

export function parseStatusIdInput(raw: string): StatusId {
  const trimmed = raw.trim()
  if (isStatusId(trimmed)) return trimmed
  const fromTag = resolveStatusIdFromTag(trimmed)
  if (fromTag) return fromTag
  throw new Error(`Status non valido: ${raw}`)
}

export type StatusEffectApiItem = {
  id: StatusId
  tag: string
  label: string
  kind: string
  stacks: number
  description: string
  maxStacks: number | null
}

export function toStatusEffectApiItems(container: StatusContainer): StatusEffectApiItem[] {
  return container.statuses.map((s) => {
    const def = getStatusDefinition(s.id)
    return {
      id: s.id,
      tag: def.tag,
      label: def.label,
      kind: def.kind,
      stacks: s.stacks,
      description: def.description,
      maxStacks: def.maxStacks,
    }
  })
}
