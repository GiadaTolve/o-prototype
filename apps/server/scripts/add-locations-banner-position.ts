/**
 * Aggiunge la colonna 'banner_position' alla tabella 'locations'.
 * Permette di posizionare l'immagine nel ritaglio (es. top, left, 30% 20%).
 *
 * Esegui: cd apps/server && bun run scripts/add-locations-banner-position.ts
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
      WHERE table_name = 'locations' AND column_name = 'banner_position'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ Colonna 'banner_position' già presente.");
      return;
    }

    await client.query("ALTER TABLE locations ADD COLUMN banner_position text");
    console.log("✅ Colonna 'banner_position' aggiunta.");
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
