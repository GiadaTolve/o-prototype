import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "../../plugins/db";
import { privateMessages, characters } from "../../db/schema";

export type Conversation = {
  otherId: string;
  otherName: string;
  otherMiniAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
};

export type ThreadMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  isOutgoing: boolean;
};

/** Lista conversazioni per il personaggio (altri con cui ha scambiato messaggi). */
export async function getConversations(characterId: string): Promise<Conversation[]> {
  const myId = characterId;
  const rows = await db
    .select({
      id: privateMessages.id,
      senderId: privateMessages.senderId,
      recipientId: privateMessages.recipientId,
      content: privateMessages.content,
      createdAt: privateMessages.createdAt,
      readAt: privateMessages.readAt,
    })
    .from(privateMessages)
    .where(
      or(eq(privateMessages.senderId, myId), eq(privateMessages.recipientId, myId))
    )
    .orderBy(desc(privateMessages.createdAt));

  const otherIds = new Set<string>();
  for (const r of rows) {
    const o = r.senderId === myId ? r.recipientId : r.senderId;
    otherIds.add(o);
  }
  const others =
    otherIds.size === 0
      ? []
      : await db
          .select({ id: characters.id, name: characters.name, miniAvatar: characters.miniAvatar })
          .from(characters)
          .where(inArray(characters.id, [...otherIds]));
  const byId = new Map(others.map((o) => [o.id, { name: o.name, miniAvatar: o.miniAvatar }]));

  const byOther = new Map<
    string,
    { last: (typeof rows)[0]; unread: number }
  >();
  for (const r of rows) {
    const otherId = r.senderId === myId ? r.recipientId : r.senderId;
    if (byOther.has(otherId)) continue;
    byOther.set(otherId, {
      last: r,
      unread: 0,
    });
  }
  for (const r of rows) {
    if (r.recipientId !== myId || r.readAt != null) continue;
    const otherId = r.senderId;
    const v = byOther.get(otherId);
    if (v) v.unread += 1;
  }

  return Array.from(byOther.entries()).map(([otherId, v]) => {
    const o = byId.get(otherId);
    return {
      otherId,
      otherName: o?.name ?? "?",
      otherMiniAvatar: o?.miniAvatar ?? null,
      lastMessage: v.last.content.slice(0, 80) + (v.last.content.length > 80 ? "…" : ""),
      lastAt: v.last.createdAt.toISOString(),
      unreadCount: v.unread,
    };
  });
}

/** Messaggi tra me e other, ordinati per data. Conserva tutta la conversazione (nessun limite). */
export async function getThread(
  myId: string,
  otherId: string
): Promise<ThreadMessage[]> {
  const rows = await db
    .select()
    .from(privateMessages)
    .where(
      or(
        and(eq(privateMessages.senderId, myId), eq(privateMessages.recipientId, otherId)),
        and(eq(privateMessages.senderId, otherId), eq(privateMessages.recipientId, myId))
      )
    )
    .orderBy(desc(privateMessages.createdAt));

  return rows.reverse().map((r) => ({
    id: r.id,
    senderId: r.senderId,
    recipientId: r.recipientId,
    content: r.content,
    readAt: r.readAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    isOutgoing: r.senderId === myId,
  }));
}

export async function sendMessage(
  senderId: string,
  recipientId: string,
  content: string
) {
  const text = content.trim().slice(0, 2000);
  if (!text) throw new Error("Contenuto vuoto");
  const [row] = await db
    .insert(privateMessages)
    .values({ senderId, recipientId, content: text })
    .returning();
  return row!;
}

export async function markThreadAsRead(myId: string, otherId: string): Promise<void> {
  await db
    .update(privateMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(privateMessages.recipientId, myId),
        eq(privateMessages.senderId, otherId),
        isNull(privateMessages.readAt)
      )
    );
}

export async function getUnreadCount(characterId: string): Promise<number> {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(privateMessages)
    .where(
      and(
        eq(privateMessages.recipientId, characterId),
        isNull(privateMessages.readAt)
      )
    );
  return r?.n ?? 0;
}

/** Cancella tutti i messaggi tra me e other (cancella conversazione). */
export async function deleteThread(myId: string, otherId: string): Promise<void> {
  await db
    .delete(privateMessages)
    .where(
      or(
        and(eq(privateMessages.senderId, myId), eq(privateMessages.recipientId, otherId)),
        and(eq(privateMessages.senderId, otherId), eq(privateMessages.recipientId, myId))
      )
    );
}
