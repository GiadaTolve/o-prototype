import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "../../plugins/db";
import { systemNotifications } from "../../db/schema";
import { sendWebPushToCharacter } from "../push/push.service";

export async function getUnreadCount(characterId: string): Promise<number> {
  const result = await db
    .select({ id: systemNotifications.id })
    .from(systemNotifications)
    .where(and(eq(systemNotifications.characterId, characterId), isNull(systemNotifications.readAt)));
  return result.length;
}

export async function createSystemNotification(
  characterId: string,
  type: 'fetch_responso' | 'fetch_giocata_completed' | 'new_registration' | 'rent_reminder' | 'rent_eviction',
  opts: { title?: string; content?: string }
) {
  const [row] = await db
    .insert(systemNotifications)
    .values({
      characterId,
      type,
      title: opts.title ?? null,
      content: opts.content ?? null,
    })
    .returning();

  const title = opts.title?.trim() || 'Oyasumi'
  const body = opts.content?.trim() || 'Hai una nuova notifica.'
  await sendWebPushToCharacter(characterId, {
    title,
    body,
    url: '/dashboard',
    tag: `system:${type}`,
    kind: 'system_notification',
  })

  return row;
}

export async function getCharacterNotifications(characterId: string, limit = 20) {
  return db
    .select()
    .from(systemNotifications)
    .where(eq(systemNotifications.characterId, characterId))
    .orderBy(desc(systemNotifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(id: string, characterId: string) {
  await db
    .update(systemNotifications)
    .set({ readAt: new Date() })
    .where(and(eq(systemNotifications.id, id), eq(systemNotifications.characterId, characterId)));
}
