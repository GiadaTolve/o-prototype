import * as webpush from 'web-push'
import { and, eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { webPushSubscriptions } from '../../db/schema'

const VAPID_PUBLIC_KEY = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ?? ''
const VAPID_PRIVATE_KEY = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim() ?? ''
const VAPID_SUBJECT = process.env.WEB_PUSH_VAPID_SUBJECT?.trim() ?? 'mailto:oyasumi.staff@gmail.com'

let vapidReady = false

function ensureVapidConfigured(): boolean {
  if (vapidReady) return true
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  vapidReady = true
  return true
}

export function isWebPushEnabled(): boolean {
  return ensureVapidConfigured()
}

export function getWebPushPublicKey(): string | null {
  return ensureVapidConfigured() ? VAPID_PUBLIC_KEY : null
}

export async function upsertWebPushSubscription(input: {
  characterId: string
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string | null
}) {
  const endpoint = input.endpoint.trim()
  if (!endpoint) throw new Error('Endpoint push mancante.')
  const p256dh = input.p256dh.trim()
  const auth = input.auth.trim()
  if (!p256dh || !auth) throw new Error('Chiavi push non valide.')

  const existing = await db.query.webPushSubscriptions.findFirst({
    where: and(
      eq(webPushSubscriptions.characterId, input.characterId),
      eq(webPushSubscriptions.endpoint, endpoint),
    ),
    columns: { id: true },
  })

  if (existing) {
    const [row] = await db
      .update(webPushSubscriptions)
      .set({
        p256dh,
        auth,
        userAgent: input.userAgent ?? null,
        updatedAt: new Date(),
      })
      .where(eq(webPushSubscriptions.id, existing.id))
      .returning()
    return row
  }

  const [row] = await db
    .insert(webPushSubscriptions)
    .values({
      characterId: input.characterId,
      endpoint,
      p256dh,
      auth,
      userAgent: input.userAgent ?? null,
    })
    .returning()
  return row
}

export async function deleteWebPushSubscription(characterId: string, endpoint: string) {
  await db
    .delete(webPushSubscriptions)
    .where(
      and(
        eq(webPushSubscriptions.characterId, characterId),
        eq(webPushSubscriptions.endpoint, endpoint.trim()),
      ),
    )
}

export async function sendWebPushToCharacter(
  characterId: string,
  payload: { title: string; body: string; url?: string; tag?: string; kind?: string },
) {
  if (!ensureVapidConfigured()) return

  const subs = await db.query.webPushSubscriptions.findMany({
    where: eq(webPushSubscriptions.characterId, characterId),
  })
  if (subs.length === 0) return

  const body = JSON.stringify(payload)
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body,
      )
    } catch (error) {
      const statusCode =
        typeof error === 'object' && error != null && 'statusCode' in error
          ? Number((error as { statusCode?: unknown }).statusCode)
          : 0
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(webPushSubscriptions).where(eq(webPushSubscriptions.id, sub.id))
      } else {
        console.warn('[WebPush] send failed:', error)
      }
    }
  }
}
