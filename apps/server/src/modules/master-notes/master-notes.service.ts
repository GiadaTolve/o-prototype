import { eq } from "drizzle-orm";
import { db } from "../../plugins/db";
import { roomMasterNotes } from "../../db/schema";

export type MasterNotes = {
  roomId: string;
  notes: string | null;
  updatedById: string | null;
  updatedAt: Date;
};

/**
 * Ottiene le note Master per una room (o null se non esistono).
 */
export async function getMasterNotes(roomId: string): Promise<MasterNotes | null> {
  const [row] = await db
    .select()
    .from(roomMasterNotes)
    .where(eq(roomMasterNotes.roomId, roomId))
    .limit(1);

  if (!row) return null;

  return {
    roomId: row.roomId,
    notes: row.notes,
    updatedById: row.updatedById,
    updatedAt: row.updatedAt,
  };
}

/**
 * Aggiorna o crea le note Master per una room (solo Shinigami).
 */
export async function upsertMasterNotes(
  roomId: string,
  notes: string | null,
  updatedById: string
): Promise<MasterNotes> {
  const trimmed = notes != null ? notes.trim().slice(0, 5000) || null : null;

  // Prova prima a fare update, se non esiste fa insert
  const existing = await getMasterNotes(roomId);
  if (existing) {
    const [row] = await db
      .update(roomMasterNotes)
      .set({
        notes: trimmed,
        updatedById,
        updatedAt: new Date(),
      })
      .where(eq(roomMasterNotes.roomId, roomId))
      .returning();

    return {
      roomId: row.roomId,
      notes: row.notes,
      updatedById: row.updatedById,
      updatedAt: row.updatedAt,
    };
  }

  // Insert se non esiste
  const [row] = await db
    .insert(roomMasterNotes)
    .values({
      roomId,
      notes: trimmed,
      updatedById,
    })
    .returning();

  return {
    roomId: row.roomId,
    notes: row.notes,
    updatedById: row.updatedById,
    updatedAt: row.updatedAt,
  };
}
