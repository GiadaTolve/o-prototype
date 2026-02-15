/**
 * Aggiunge la colonna 'banner_for_game_map' alla tabella 'locations'.
 * Permette di scegliere per quale mappa (Ogon, Izayoi, ...) mostrare il banner.
 *
 * Esegui: cd apps/server && bun run scripts/add-locations-banner-for-game-map.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../../.env") });

async function main() {
  const { pool } = await import("../src/plugins/db");
  const client = await pool.connect();

  try {
    const checkResult = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'locations' AND column_name = 'banner_for_game_map'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ Colonna 'banner_for_game_map' già presente.");
      return;
    }

    await client.query("ALTER TABLE locations ADD COLUMN banner_for_game_map text");
    console.log("✅ Colonna 'banner_for_game_map' aggiunta.");
  } finally {
    client.release();
    await pool.end();
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("Errore:", e);
  process.exit(1);
});
