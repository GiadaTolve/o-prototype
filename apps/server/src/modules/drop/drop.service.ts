import { and, eq } from 'drizzle-orm'
import {
  DROP_TABLE_DAILY_CAP_PER_PLAYER,
  formatDropEventMessage,
  getDropTable,
  parseDropCommand,
  parsePrendiCommand,
  resolveCatalogKeyFromQuery,
  rollDropTableJunk,
  type DropCommand,
} from '@domain/economy'
import { getJunkItemDef } from '@domain/economy/junklist'
import { db } from '../../plugins/db'
import { characters, dropTableDailyUsage, items, sceneGroundLoot } from '../../db/schema'
import { addItemByCatalogKey } from '../inventory/inventory.service'

export interface RoomParticipant {
  characterId: string
  name: string
}

function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
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

async function getTableUsageCount(characterId: string, dayKey: string): Promise<number> {
  const row = await db.query.dropTableDailyUsage.findFirst({
    where: and(
      eq(dropTableDailyUsage.characterId, characterId),
      eq(dropTableDailyUsage.dayKey, dayKey),
    ),
  })
  return row?.count ?? 0
}

async function incrementTableUsage(characterId: string, dayKey: string): Promise<number> {
  const existing = await db.query.dropTableDailyUsage.findFirst({
    where: and(
      eq(dropTableDailyUsage.characterId, characterId),
      eq(dropTableDailyUsage.dayKey, dayKey),
    ),
  })
  if (existing) {
    const next = (existing.count ?? 0) + 1
    await db
      .update(dropTableDailyUsage)
      .set({ count: next })
      .where(
        and(
          eq(dropTableDailyUsage.characterId, characterId),
          eq(dropTableDailyUsage.dayKey, dayKey),
        ),
      )
    return next
  }
  await db.insert(dropTableDailyUsage).values({ characterId, dayKey, count: 1 })
  return 1
}

async function grantCatalogLoot(
  characterId: string,
  catalogKey: string,
  quantity: number,
): Promise<{ name: string; quantity: number }> {
  await addItemByCatalogKey(characterId, catalogKey, quantity, { origin: 'droppato' })
  const junk = getJunkItemDef(catalogKey)
  const item = await db.query.items.findFirst({
    where: eq(items.catalogKey, catalogKey),
    columns: { name: true },
  })
  return { name: item?.name ?? junk?.name ?? catalogKey, quantity }
}

async function addGroundLoot(
  roomId: string,
  catalogKey: string,
  quantity: number,
  createdByCharacterId: string,
): Promise<{ name: string; quantity: number }> {
  const junk = getJunkItemDef(catalogKey)
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
  const item = await db.query.items.findFirst({
    where: eq(items.catalogKey, catalogKey),
    columns: { name: true },
  })
  return { name: item?.name ?? junk?.name ?? catalogKey, quantity }
}

export async function listGroundLoot(roomId: string) {
  const rows = await db.query.sceneGroundLoot.findMany({
    where: eq(sceneGroundLoot.roomId, roomId),
  })
  return rows
    .filter((r) => (r.quantity ?? 0) > 0)
    .map((r) => {
      const junk = getJunkItemDef(r.catalogKey)
      return {
        id: r.id,
        catalogKey: r.catalogKey,
        quantity: r.quantity ?? 1,
        name: junk?.name ?? r.catalogKey,
      }
    })
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
  if (!getDropTable(cmd.tableId)) {
    throw new Error(`Tabella drop «${cmd.tableId}» sconosciuta.`)
  }

  const targets =
    cmd.target === 'group'
      ? participants
      : resolvePlayersInRoom(cmd.targetName ?? '', participants)

  if (targets.length === 0) {
    throw new Error('Destinatario non trovato nella room.')
  }

  const dayKey = utcDayKey()
  const lines: string[] = []
  const affected: string[] = []

  for (const t of targets) {
    const used = await getTableUsageCount(t.characterId, dayKey)
    if (used >= DROP_TABLE_DAILY_CAP_PER_PLAYER) {
      const label = await getCharacterDisplayName(t.characterId)
      lines.push(`📦 ${label}: limite giornaliero drop da tabella raggiunto.`)
      continue
    }

    const junkId = rollDropTableJunk(cmd.tableId)
    if (!junkId) {
      lines.push(`📦 ${t.name}: estrazione fallita.`)
      continue
    }

    await incrementTableUsage(t.characterId, dayKey)
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
    throw new Error(
      'Comando /drop non valido. Es: `/drop @Nome Abiti del vecchio mondo x2` o `/drop @gruppo tabella:rovine_urbane`',
    )
  }

  if (cmd.kind === 'direct') {
    return executeDirectDrop(cmd, roomId, actorCharacterId, participants)
  }
  return executeTableDrop(cmd, participants)
}

export async function executePrendiCommand(
  text: string,
  roomId: string,
  characterId: string,
): Promise<DropExecutionResult> {
  const cmd = parsePrendiCommand(text)
  if (!cmd) {
    throw new Error('Comando /prendi non valido. Es: `/prendi Abiti del vecchio mondo`')
  }

  const catalogKey = resolveCatalogKeyFromQuery(cmd.query)
  if (!catalogKey) {
    throw new Error('Oggetto non riconosciuto.')
  }

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
  const junk = getJunkItemDef(catalogKey)
  const item = await db.query.items.findFirst({
    where: eq(items.catalogKey, catalogKey),
    columns: { name: true },
  })
  const name = item?.name ?? junk?.name ?? catalogKey

  return {
    eventMessage: `📦 ${label} raccoglie: ${name} ×1`,
    affectedCharacterIds: [characterId],
  }
}
