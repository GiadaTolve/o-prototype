import type { DropTargetKind } from './drop-commands'

/** Payload drop inviato dal pannello Master (non digitabile in chat). */
export const DROP_ACTION_PREFIX = '[DROP]'

export type DropPanelDirectPayload = {
  readonly kind: 'direct'
  readonly target: DropTargetKind
  /** Obbligatorio se target === 'player'. */
  readonly targetCharacterId?: string
  readonly catalogKey: string
  readonly quantity: number
}

export type DropPanelTablePayload = {
  readonly kind: 'table'
  readonly target: 'player' | 'group'
  readonly targetCharacterId?: string
  readonly tableId: string
}

export type DropPanelPayload = DropPanelDirectPayload | DropPanelTablePayload

export function encodeDropPanelRequest(payload: DropPanelPayload): string {
  return DROP_ACTION_PREFIX + JSON.stringify(payload)
}

export function parseDropPanelRequest(content: string): DropPanelPayload | null {
  const trimmed = content.trim()
  if (!trimmed.startsWith(DROP_ACTION_PREFIX)) return null
  try {
    const data = JSON.parse(trimmed.slice(DROP_ACTION_PREFIX.length)) as DropPanelPayload
    if (data.kind === 'table') {
      if (data.target !== 'player' && data.target !== 'group') return null
      if (typeof data.tableId !== 'string' || !data.tableId.trim()) return null
      if (data.target === 'player' && typeof data.targetCharacterId !== 'string') return null
      return {
        kind: 'table',
        target: data.target,
        targetCharacterId: data.targetCharacterId?.trim() || undefined,
        tableId: data.tableId.trim().toLowerCase(),
      }
    }
    if (data.kind !== 'direct') return null
    if (data.target !== 'ground' && data.target !== 'player' && data.target !== 'group') return null
    if (typeof data.catalogKey !== 'string' || !data.catalogKey.trim()) return null
    const quantity = Number(data.quantity)
    if (!Number.isFinite(quantity) || quantity < 1) return null
    if (data.target === 'player' && typeof data.targetCharacterId !== 'string') return null
    return {
      kind: 'direct',
      target: data.target,
      targetCharacterId: data.targetCharacterId?.trim() || undefined,
      catalogKey: data.catalogKey.trim(),
      quantity: Math.floor(quantity),
    }
  } catch {
    return null
  }
}

export function isDropPanelMessage(content: string): boolean {
  return parseDropPanelRequest(content.trim()) != null
}

/** Payload raccolta loot a terra dal pannello PG. */
export const PRENDI_ACTION_PREFIX = '[PRENDI]'

export type PrendiPanelPayload = {
  readonly catalogKey: string
}

export function encodePrendiPanelRequest(catalogKey: string): string {
  const payload: PrendiPanelPayload = { catalogKey: catalogKey.trim() }
  return PRENDI_ACTION_PREFIX + JSON.stringify(payload)
}

export function parsePrendiPanelRequest(content: string): PrendiPanelPayload | null {
  const trimmed = content.trim()
  if (!trimmed.startsWith(PRENDI_ACTION_PREFIX)) return null
  try {
    const data = JSON.parse(trimmed.slice(PRENDI_ACTION_PREFIX.length)) as PrendiPanelPayload
    if (typeof data.catalogKey === 'string' && data.catalogKey.trim()) {
      return { catalogKey: data.catalogKey.trim() }
    }
    return null
  } catch {
    return null
  }
}

export function isPrendiPanelMessage(content: string): boolean {
  return parsePrendiPanelRequest(content.trim()) != null
}
