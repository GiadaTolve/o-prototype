import { eq } from "drizzle-orm";
import { db } from "../../plugins/db";
import { meteoPrefetture } from "../../db/schema";

export type MeteoData = {
  prefetturaId: string;
  temp: number;
  condition: string;
  icon: "sun" | "cloud" | "cloud-sun" | "rain";
  updatedById: string | null;
  updatedAt: Date;
};

/**
 * Ottiene il meteo per una prefettura (o null se non esiste).
 */
export async function getMeteo(prefetturaId: string): Promise<MeteoData | null> {
  const [row] = await db
    .select()
    .from(meteoPrefetture)
    .where(eq(meteoPrefetture.prefetturaId, prefetturaId))
    .limit(1);

  if (!row) return null;

  return {
    prefetturaId: row.prefetturaId,
    temp: row.temp,
    condition: row.condition,
    icon: row.icon,
    updatedById: row.updatedById,
    updatedAt: row.updatedAt,
  };
}

/**
 * Ottiene il meteo per tutte le prefetture.
 */
export async function getAllMeteo(): Promise<MeteoData[]> {
  const rows = await db.select().from(meteoPrefetture);
  return rows.map((r) => ({
    prefetturaId: r.prefetturaId,
    temp: r.temp,
    condition: r.condition,
    icon: r.icon,
    updatedById: r.updatedById,
    updatedAt: r.updatedAt,
  }));
}

/**
 * Aggiorna o crea il meteo per una prefettura (solo admin/mod).
 */
export async function upsertMeteo(
  prefetturaId: string,
  temp: number,
  condition: string,
  icon: "sun" | "cloud" | "cloud-sun" | "rain",
  updatedById: string
): Promise<MeteoData> {
  const [row] = await db
    .insert(meteoPrefetture)
    .values({
      prefetturaId,
      temp,
      condition: condition.trim().slice(0, 100),
      icon,
      updatedById,
    })
    .onConflictDoUpdate({
      target: meteoPrefetture.prefetturaId,
      set: {
        temp,
        condition: condition.trim().slice(0, 100),
        icon,
        updatedById,
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    prefetturaId: row.prefetturaId,
    temp: row.temp,
    condition: row.condition,
    icon: row.icon,
    updatedById: row.updatedById,
    updatedAt: row.updatedAt,
  };
}
