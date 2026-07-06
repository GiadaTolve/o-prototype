import { and, eq, gte, sql } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters, privateMessages } from '../../db/schema'
import { startOfDay } from '@domain/ledger/rules/housing-rent-cycle'
import { getRentReminderMessage } from '@domain/ledger/rules/rent-reminder-messages'
import * as sms from '../sms/sms.service'
import { broadcastSms } from '../realtime/ws.routes'
import { createSystemNotification } from '../notifications/notifications.service'

async function hasRentReminderToday(locatarioId: string, tenantId: string): Promise<boolean> {
  const todayStart = startOfDay(new Date())
  const existing = await db.query.privateMessages.findFirst({
    where: and(
      eq(privateMessages.senderId, locatarioId),
      eq(privateMessages.recipientId, tenantId),
      gte(privateMessages.createdAt, todayStart),
      sql`${privateMessages.content} LIKE ${'【Affitto】%'}`,
    ),
  })
  return !!existing
}

const LOCATARIO_NAME = 'Locatario'

let cachedLocatarioId: string | null | undefined

/** ID personaggio Locatario (env, cache o lookup per nome). */
export async function resolveLocatarioCharacterId(): Promise<string | null> {
  if (process.env.LOCATARIO_CHARACTER_ID) {
    return process.env.LOCATARIO_CHARACTER_ID
  }
  if (cachedLocatarioId !== undefined) {
    return cachedLocatarioId
  }
  const row = await db.query.characters.findFirst({
    where: eq(characters.name, LOCATARIO_NAME),
    columns: { id: true },
  })
  cachedLocatarioId = row?.id ?? null
  if (!cachedLocatarioId) {
    console.warn(
      '[housing] Personaggio Locatario non trovato — esegui scripts/seed-locatario.ts o imposta LOCATARIO_CHARACTER_ID',
    )
  }
  return cachedLocatarioId
}

export function clearLocatarioCache(): void {
  cachedLocatarioId = undefined
}

type ReminderPayload = {
  messageIndex: number
  housingName: string
  rentAmount: number
  dueDate: Date
}

async function deliverLocatarioMessage(tenantId: string, content: string): Promise<boolean> {
  const locatarioId = await resolveLocatarioCharacterId()
  if (!locatarioId) return false

  if (await hasRentReminderToday(locatarioId, tenantId)) {
    return false
  }

  const row = await sms.sendMessage(locatarioId, tenantId, content)
  broadcastSms(tenantId, {
    id: row.id,
    senderId: row.senderId,
    recipientId: row.recipientId,
    content: row.content,
    createdAt: row.createdAt,
  })
  broadcastSms(locatarioId, {
    id: row.id,
    senderId: row.senderId,
    recipientId: row.recipientId,
    content: row.content,
    createdAt: row.createdAt,
  })
  return true
}

/** Invia SMS del Locatario per sollecito / scadenza affitto. */
export async function sendRentReminderSms(
  tenantCharacterId: string,
  payload: ReminderPayload,
): Promise<boolean> {
  const content = getRentReminderMessage(payload)
  const sent = await deliverLocatarioMessage(tenantCharacterId, content)
  if (sent) {
    await createSystemNotification(tenantCharacterId, 'rent_reminder', {
      title: 'Affitto in scadenza',
      content: `Il Locatario ti ha scritto riguardo a «${payload.housingName}». Controlla i Messaggi.`,
    })
  }
  return sent
}

/** Avviso di sfratto eseguito. */
export async function sendEvictionNoticeSms(
  tenantCharacterId: string,
  housingName: string,
): Promise<boolean> {
  const content = `【Sfratto】 Il contratto per «${housingName}» è stato rescisso per morosità. Sei ora senzatetto. Contatta l'Ufficio Locazioni solo se ritieni ci sia un errore. — Locatario`
  const locatarioId = await resolveLocatarioCharacterId()
  if (!locatarioId) return false

  const row = await sms.sendMessage(locatarioId, tenantCharacterId, content)
  broadcastSms(tenantCharacterId, {
    id: row.id,
    senderId: row.senderId,
    recipientId: row.recipientId,
    content: row.content,
    createdAt: row.createdAt,
  })
  await createSystemNotification(tenantCharacterId, 'rent_eviction', {
    title: 'Sfratto eseguito',
    content: `Hai perso l'abitazione «${housingName}» per mancato pagamento dell'affitto.`,
  })
  return true
}
