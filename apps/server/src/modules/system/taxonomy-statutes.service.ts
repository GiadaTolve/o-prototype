import { db } from '../../db'
import { taxonomyStatutes } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

export type TaxonomyStatuteRow = {
  kind: string
  entryId: string
  statute: string
  sottotitolo: string
  descrizione_meccanica: string
}

export const taxonomyStatutesService = {
  async getAll(): Promise<TaxonomyStatuteRow[]> {
    const rows = await db
      .select({
        kind: taxonomyStatutes.kind,
        entryId: taxonomyStatutes.entryId,
        statute: taxonomyStatutes.statute,
        sottotitolo: taxonomyStatutes.sottotitolo,
        descrizione_meccanica: taxonomyStatutes.descrizione_meccanica,
      })
      .from(taxonomyStatutes)
    return rows
  },

  async upsert(kind: string, entryId: string, patch: { statute?: string; sottotitolo?: string; descrizione_meccanica?: string }): Promise<void> {
    await db
      .insert(taxonomyStatutes)
      .values({
        kind,
        entryId,
        statute: patch.statute ?? '',
        sottotitolo: patch.sottotitolo ?? '',
        descrizione_meccanica: patch.descrizione_meccanica ?? '',
      })
      .onConflictDoUpdate({
        target: [taxonomyStatutes.kind, taxonomyStatutes.entryId],
        set: {
          ...(patch.statute !== undefined ? { statute: patch.statute } : {}),
          ...(patch.sottotitolo !== undefined ? { sottotitolo: patch.sottotitolo } : {}),
          ...(patch.descrizione_meccanica !== undefined ? { descrizione_meccanica: patch.descrizione_meccanica } : {}),
          updatedAt: new Date(),
        },
      })
  },
}
