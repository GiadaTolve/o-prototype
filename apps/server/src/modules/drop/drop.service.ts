import { and, eq, inArray } from 'drizzle-orm'
import {
  formatDropEventMessage,
  parseDropCommand,
  parsePrendiCommand,
  resolveCatalogKeyFromQuery,
  type DropCommand,
  type DropPanelPayload,
} from '@domain/economy'
import { getJunkItemDef } from '@domain/economy/junklist'
import { db } from '../../plugins/db'
import { characters, items, sceneGroundLoot } from '../../db/schema'
import { addItemByCatalogKey } from '../inventory/inventory.service'
import { rollDropTableJunkRuntime, getDropTablesRuntime } from './drop-tables.service'

export interface RoomParticipant {
  characterId: string
  name: string
}

async function getCharacterDisplayName(characterId: string): Promise<string> {
  const row = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { name: true, surname: true },
  })
  if (!row) return 'Sconosciuto'
  return row.surname ? `${row.name} ${row.surname}` : row.name
}

function resolvePlayersInRoom(
  targetName: string,
  participants: readonly RoomParticipant[],
): RoomParticipant[] {
  const q = targetName.trim().toLowerCase()
  const matches = participants.filter((p) => {
    const n = p.name.toLowerCase()
    return n === q || n.startsWith(q) || n.includes(q)
  })
  if (matches.length === 1) return matches
  if (matches.length > 1) {
    const exact = matches.filter((p) => p.name.toLowerCase() === q)
    if (exact.length === 1) return exact
  }
  return []
}

async function resolveCatalogDisplayName(catalogKey: string): Promise<string> {
  const item = await db.query.items.findFirst({
    where: eq(items.catalogKey, catalogKey),
    columns: { name: true },
  })
  if (item?.name) return item.name
  const junk = getJunkItemDef(catalogKey)
  return junk?.name ?? catalogKey
}

async function grantCatalogLoot(
  characterId: string,
  catalogKey: string,
  quantity: number,
): Promise<{ name: string; quantity: number }> {
  await assertCatalogKeyDroppable(catalogKey)
  await addItemByCatalogKey(characterId, catalogKey, quantity, { origin: 'droppato' })
  return { name: await resolveCatalogDisplayName(catalogKey), quantity }
}

async function assertCatalogKeyDroppable(catalogKey: string): Promise<void> {
  const item = await db.query.items.findFirst({
    where: eq(items.catalogKey, catalogKey),
    columns: { craftExclusiveClassId: true, name: true },
  })
  if (item?.craftExclusiveClassId) {
    throw new Error(
      `«${item.name}» è craft-esclusivo (${item.craftExclusiveClassId}): non si può droppare. Solo craft di classe o vendita in Piazza.`,
    )
  }
}

async function addGroundLoot(
  roomId: string,
  catalogKey: string,
  quantity: number,
  createdByCharacterId: string,
): Promise<{ name: string; quantity: number }> {
  await assertCatalogKeyDroppable(catalogKey)
  const existing = await db.query.sceneGroundLoot.findFirst({
    where: and(eq(sceneGroundLoot.roomId, roomId), eq(sceneGroundLoot.catalogKey, catalogKey)),
  })
  if (existing) {
    await db
      .update(sceneGroundLoot)
      .set({ quantity: (existing.quantity ?? 0) + quantity })
      .where(eq(sceneGroundLoot.id, existing.id))
  } else {
    await db.insert(sceneGroundLoot).values({
      roomId,
      catalogKey,
      quantity,
      createdByCharacterId,
    })
  }
  return { name: await resolveCatalogDisplayName(catalogKey), quantity }
}

export async function listGroundLoot(roomId: string) {
  const rows = await db.query.sceneGroundLoot.findMany({
    where: eq(sceneGroundLoot.roomId, roomId),
  })
  const active = rows.filter((r) => (r.quantity ?? 0) > 0)
  if (active.length === 0) return []

  const keys = [...new Set(active.map((r) => r.catalogKey))]
  const itemRows = await db.query.items.findMany({
    where: inArray(items.catalogKey, keys),
    columns: { catalogKey: true, name: true },
  })
  const nameByKey = new Map(
    itemRows.filter((r) => r.catalogKey).map((r) => [r.catalogKey!, r.name] as const),
  )

  return active.map((r) => ({
    id: r.id,
    catalogKey: r.catalogKey,
    quantity: r.quantity ?? 1,
    name: nameByKey.get(r.catalogKey) ?? getJunkItemDef(r.catalogKey)?.name ?? r.catalogKey,
  }))
}

export interface DropExecutionResult {
  eventMessage: string
  affectedCharacterIds: string[]
}

async function executeDirectDrop(
  cmd: Extract<DropCommand, { kind: 'direct' }>,
  roomId: string,
  actorCharacterId: string,
  participants: readonly RoomParticipant[],
): Promise<DropExecutionResult> {
  if (cmd.target === 'ground') {
    const line = await addGroundLoot(roomId, cmd.catalogKey, cmd.quantity, actorCharacterId)
    return {
      eventMessage: `📦 A terra compare: ${line.name} ×${line.quantity}`,
      affectedCharacterIds: [],
    }
  }

  const targets =
    cmd.target === 'group'
      ? participants
      : resolvePlayersInRoom(cmd.targetName ?? '', participants)

  if (targets.length === 0) {
    throw new Error('Destinatario non trovato nella room.')
  }

  const lines: { label: string; items: { name: string; quantity: number }[] }[] = []
  const affected: string[] = []

  for (const t of targets) {
    const line = await grantCatalogLoot(t.characterId, cmd.catalogKey, cmd.quantity)
    const label = await getCharacterDisplayName(t.characterId)
    lines.push({ label, items: [line] })
    affected.push(t.characterId)
  }

  const eventMessage = lines
    .map((l) => formatDropEventMessage(l.label, l.items))
    .join('\n')

  return { eventMessage, affectedCharacterIds: affected }
}

async function executeTableDrop(
  cmd: Extract<DropCommand, { kind: 'table' }>,
  participants: readonly RoomParticipant[],
): Promise<DropExecutionResult> {
  const runtime = await getDropTablesRuntime()
  if (!runtime.tables.find((t) => t.id === cmd.tableId)) {
    throw new Error(`Tabella drop «${cmd.tableId}» sconosciuta.`)
  }

  const targets =
    cmd.target === 'group'
      ? participants
      : resolvePlayersInRoom(cmd.targetName ?? '', participants)

  if (targets.length === 0) {
    throw new Error('Destinatario non trovato nella room.')
  }

  const lines: string[] = []
  const affected: string[] = []

  for (const t of targets) {
    const junkId = await rollDropTableJunkRuntime(cmd.tableId)
    if (!junkId) {
      lines.push(`📦 ${t.name}: estrazione fallita.`)
      continue
    }

    const line = await grantCatalogLoot(t.characterId, junkId, 1)
    const label = await getCharacterDisplayName(t.characterId)
    lines.push(formatDropEventMessage(label, [line]))
    affected.push(t.characterId)
  }

  return { eventMessage: lines.join('\n'), affectedCharacterIds: affected }
}

export async function executeDropCommand(
  text: string,
  roomId: string,
  actorCharacterId: string,
  participants: readonly RoomParticipant[],
): Promise<DropExecutionResult> {
  const cmd = parseDropCommand(text)
  if (!cmd) {
    throw new Error('Drop non valido.')
  }

  if (cmd.kind === 'direct') {
    return executeDirectDrop(cmd, roomId, actorCharacterId, participants)
  }
  return executeTableDrop(cmd, participants)
}

function resolveParticipantName(
  targetCharacterId: string | undefined,
  participants: readonly RoomParticipant[],
): string {
  if (!targetCharacterId) {
    throw new Error('Seleziona un destinatario.')
  }
  const match = participants.find((p) => p.characterId === targetCharacterId)
  if (!match) {
    throw new Error('Destinatario non trovato nella room.')
  }
  return match.name
}

export async function executeDropPanelAction(
  payload: DropPanelPayload,
  roomId: string,
  actorCharacterId: string,
  participants: readonly RoomParticipant[],
): Promise<DropExecutionResult> {
  if (payload.kind === 'table') {
    const targetName =
      payload.target === 'player'
        ? resolveParticipantName(payload.targetCharacterId, participants)
        : undefined
    return executeTableDrop(
      {
        kind: 'table',
        target: payload.target,
        targetName,
        tableId: payload.tableId,
      },
      participants,
    )
  }

  const targetName =
    payload.target === 'player'
      ? resolveParticipantName(payload.targetCharacterId, participants)
      : undefined

  return executeDirectDrop(
    {
      kind: 'direct',
      target: payload.target,
      targetName,
      catalogKey: payload.catalogKey,
      quantity: payload.quantity,
    },
    roomId,
    actorCharacterId,
    participants,
  )
}

export async function executePrendiByCatalogKey(
  roomId: string,
  characterId: string,
  catalogKey: string,
): Promise<DropExecutionResult> {
  const row = await db.query.sceneGroundLoot.findFirst({
    where: and(eq(sceneGroundLoot.roomId, roomId), eq(sceneGroundLoot.catalogKey, catalogKey)),
  })

  if (!row || (row.quantity ?? 0) < 1) {
    throw new Error('Nessun oggetto corrispondente a terra in questa scena.')
  }

  await addItemByCatalogKey(characterId, catalogKey, 1, { origin: 'droppato' })

  const remaining = (row.quantity ?? 1) - 1
  if (remaining <= 0) {
    await db.delete(sceneGroundLoot).where(eq(sceneGroundLoot.id, row.id))
  } else {
    await db.update(sceneGroundLoot).set({ quantity: remaining }).where(eq(sceneGroundLoot.id, row.id))
  }

  const label = await getCharacterDisplayName(characterId)
  const name = await resolveCatalogDisplayName(catalogKey)

  return {
    eventMessage: `📦 ${label} raccoglie: ${name} ×1`,
    affectedCharacterIds: [characterId],
  }
}

export async function executePrendiCommand(
  text: string,
  roomId: string,
  characterId: string,
): Promise<DropExecutionResult> {
  const cmd = parsePrendiCommand(text)
  if (!cmd) {
    throw new Error('Raccolta non valida.')
  }

  const catalogKey = resolveCatalogKeyFromQuery(cmd.query)
  if (!catalogKey) {
    throw new Error('Oggetto non riconosciuto.')
  }

  return executePrendiByCatalogKey(roomId, characterId, catalogKey)
}
