import { db } from '../../plugins/db';
import { creatures } from '../../db/schema';

export type BestiaryCategory = 'HOLIC' | 'PHOBIAS' | 'MUEN';

export type BestiaryEntry = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: BestiaryCategory;
  stats: { hp?: number; attack?: number; defense?: number } | null;
};

/** Catalogo globale di tutti i PNG (Holic, Phobias, Muen). */
export async function getBestiary(): Promise<BestiaryEntry[]> {
  const rows = await db.query.creatures.findMany({
    columns: { id: true, name: true, description: true, imageUrl: true, category: true, stats: true },
    orderBy: (c, { asc }) => [asc(c.name)],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    imageUrl: r.imageUrl ?? null,
    category: r.category as BestiaryCategory,
    stats: r.stats as BestiaryEntry['stats'],
  }));
}

/** Ritorna i PNG raggruppati per categoria (Holic, Phobias, Muen). */
export async function getBestiaryByCategory(): Promise<Record<BestiaryCategory, BestiaryEntry[]>> {
  const all = await getBestiary();
  const result: Record<BestiaryCategory, BestiaryEntry[]> = {
    HOLIC: [],
    PHOBIAS: [],
    MUEN: [],
  };
  for (const entry of all) {
    if (entry.category && result[entry.category as BestiaryCategory]) {
      result[entry.category as BestiaryCategory].push(entry);
    }
  }
  return result;
}
