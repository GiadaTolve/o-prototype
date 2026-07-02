import { JUNK_ITEMS } from './junklist'

export type DropTargetKind = 'player' | 'group' | 'ground'

export interface DropDirectCommand {
  readonly kind: 'direct'
  readonly target: DropTargetKind
  readonly targetName?: string
  readonly catalogKey: string
  readonly quantity: number
}

export interface DropTableCommand {
  readonly kind: 'table'
  readonly target: 'player' | 'group'
  readonly targetName?: string
  readonly tableId: string
}

export type DropCommand = DropDirectCommand | DropTableCommand

export interface PrendiCommand {
  readonly query: string
}

const DROP_PREFIX = /^\/drop\s+/i
const PRENDI_PREFIX = /^\/prendi\s+/i

/** Risolve catalog_key da id junk o nome display (match esatto o parziale). */
export function resolveCatalogKeyFromQuery(query: string): string | null {
  const q = query.trim()
  if (!q) return null
  const lower = q.toLowerCase()
  const byId = JUNK_ITEMS.find((j) => j.id.toLowerCase() === lower)
  if (byId) return byId.id
  const byExactName = JUNK_ITEMS.find((j) => j.name.toLowerCase() === lower)
  if (byExactName) return byExactName.id
  const byPartial = JUNK_ITEMS.filter((j) => j.name.toLowerCase().includes(lower))
  if (byPartial.length === 1) return byPartial[0]!.id
  return null
}

function parseTarget(raw: string): { kind: DropTargetKind; name?: string } {
  const t = raw.replace(/^@/, '').trim().toLowerCase()
  if (t === 'gruppo' || t === 'group') return { kind: 'group' }
  if (t === 'aterra' || t === 'terra' || t === 'ground') return { kind: 'ground' }
  return { kind: 'player', name: raw.replace(/^@/, '').trim() }
}

export function parseDropCommand(text: string): DropCommand | null {
  const trimmed = text.trim()
  if (!DROP_PREFIX.test(trimmed)) return null

  const body = trimmed.replace(DROP_PREFIX, '').trim()
  const atMatch = body.match(/^@(\S+)\s+(.+)$/i)
  if (!atMatch) return null

  const targetRaw = atMatch[1]!
  const itemPart = atMatch[2]!.trim()
  const target = parseTarget(`@${targetRaw}`)

  const tableMatch = itemPart.match(/^tabella:(\w+)$/i)
  if (tableMatch) {
    if (target.kind === 'ground') return null
    return {
      kind: 'table',
      target: target.kind === 'group' ? 'group' : 'player',
      targetName: target.kind === 'player' ? target.name : undefined,
      tableId: tableMatch[1]!.toLowerCase(),
    }
  }

  const qtyMatch = itemPart.match(/^(.+?)\s+x(\d+)$/i)
  const itemQuery = (qtyMatch ? qtyMatch[1] : itemPart).trim()
  const quantity = qtyMatch ? Math.max(1, parseInt(qtyMatch[2]!, 10)) : 1
  const catalogKey = resolveCatalogKeyFromQuery(itemQuery)
  if (!catalogKey) return null

  return {
    kind: 'direct',
    target: target.kind,
    targetName: target.kind === 'player' ? target.name : undefined,
    catalogKey,
    quantity,
  }
}

export function parsePrendiCommand(text: string): PrendiCommand | null {
  const trimmed = text.trim()
  if (!PRENDI_PREFIX.test(trimmed)) return null
  const query = trimmed.replace(PRENDI_PREFIX, '').trim()
  if (!query) return null
  return { query }
}

export function formatDropEventMessage(
  recipientLabel: string,
  lines: readonly { name: string; quantity: number }[],
): string {
  if (lines.length === 0) return `📦 ${recipientLabel}: nessun oggetto.`
  const items = lines.map((l) => `${l.name} ×${l.quantity}`).join(', ')
  return `📦 ${recipientLabel} trova: ${items}`
}
