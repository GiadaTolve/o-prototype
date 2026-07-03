/**
 * Popola `locations` dalla struttura di map-config (Ogon + mappe root).
 * Esegui: cd apps/server && bun run migrate-locations
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(import.meta.dir, "../../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type LocSeed = {
  key: string;
  name: string;
  type: "MAP" | "CHAT";
  parentKey: string | null;
  prefecture?: string | null;
  bannerForGameMap?: string | null;
};

/** Allineato a apps/client/src/config/map-config.ts */
const LOCATIONS_CONFIG: LocSeed[] = [
  // Mappe di gioco (root)
  { key: "ogon", name: "Ogon", type: "MAP", parentKey: null, bannerForGameMap: "ogon" },
  { key: "izayoi", name: "Izayoi", type: "MAP", parentKey: null, bannerForGameMap: "izayoi" },
  { key: "onimori", name: "Onimori", type: "MAP", parentKey: null, bannerForGameMap: "onimori" },
  { key: "ezochi", name: "Ezochi", type: "MAP", parentKey: null, bannerForGameMap: "ezochi" },
  { key: "altrove", name: "Altrove", type: "MAP", parentKey: null, bannerForGameMap: "altrove" },

  // Zone Ogon
  { key: "kessen", name: "Kessen", type: "MAP", parentKey: "ogon", prefecture: "kessen" },
  { key: "edo", name: "Edo", type: "MAP", parentKey: "ogon", prefecture: "edo" },
  { key: "kotowari", name: "Kotowari", type: "MAP", parentKey: "ogon", prefecture: "kotowari" },
  { key: "hamanachi", name: "Hamanachi", type: "MAP", parentKey: "ogon", prefecture: null },

  // Kessen → Cosmicon Complex → chat
  { key: "cosmicon-complex", name: "Cosmicon Complex", type: "MAP", parentKey: "kessen", prefecture: "kessen" },
  { key: "junk-town", name: "Junk Town", type: "CHAT", parentKey: "cosmicon-complex" },
  { key: "arcade-palace", name: "Arcade Palace", type: "CHAT", parentKey: "cosmicon-complex" },
  { key: "milky-way", name: "Milky Way", type: "CHAT", parentKey: "cosmicon-complex" },

  // Edo → chat
  { key: "circus", name: "Circus", type: "CHAT", parentKey: "edo" },
  { key: "ginza-o-clock", name: "Ginza o' Clock", type: "CHAT", parentKey: "edo" },

  // Kotowari → chat
  { key: "astrolabio", name: "Astrolabio", type: "CHAT", parentKey: "kotowari" },
  { key: "osservatorio", name: "Osservatorio", type: "CHAT", parentKey: "kotowari" },

  // Hamanachi → chat
  { key: "casa-da-te", name: "Casa da tè", type: "CHAT", parentKey: "hamanachi" },
  { key: "ospedale", name: "Ospedale", type: "CHAT", parentKey: "hamanachi" },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'locations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log("❌ Tabella 'locations' assente. Esegui: bun run add-admin-tables");
      await client.query("ROLLBACK");
      process.exit(1);
    }

    const idMap: Record<string, string> = {};

    for (const loc of LOCATIONS_CONFIG) {
      const parentId = loc.parentKey ? idMap[loc.parentKey] ?? null : null;
      if (loc.parentKey && !parentId) {
        throw new Error(`Parent "${loc.parentKey}" non trovato per "${loc.name}"`);
      }

      const existing = await client.query(
        `SELECT id, parent_id FROM locations
         WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
         LIMIT 1`,
        [loc.name],
      );

      if (existing.rows.length > 0) {
        const row = existing.rows[0] as { id: string; parent_id: string | null };
        idMap[loc.key] = row.id;
        await client.query(
          `UPDATE locations SET
            parent_id = $1,
            type = $2,
            prefecture = $3,
            banner_for_game_map = COALESCE($4, banner_for_game_map)
           WHERE id = $5`,
          [parentId, loc.type, loc.prefecture ?? null, loc.bannerForGameMap ?? null, row.id],
        );
        console.log(`✓ Aggiornata "${loc.name}" (${loc.type})`);
      } else {
        const result = await client.query(
          `INSERT INTO locations (parent_id, name, type, prefecture, banner_for_game_map, pos_x, pos_y, created_at)
           VALUES ($1, $2, $3, $4, $5, 50, 50, NOW())
           RETURNING id`,
          [parentId, loc.name, loc.type, loc.prefecture ?? null, loc.bannerForGameMap ?? null],
        );
        idMap[loc.key] = result.rows[0].id as string;
        console.log(`✓ Creata "${loc.name}" (${loc.type})`);
      }
    }

    await client.query("COMMIT");
    const count = await pool.query("SELECT count(*)::int AS n FROM locations");
    console.log(`\n✅ Migrazione completata — ${count.rows[0].n} locations nel database.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Errore migrazione:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(() => process.exit(1));
