/**
 * Aggiunge la colonna 'motivation' alla tabella 'quest_votes' se non esiste.
 *
 * Esegui: cd apps/server && bun run scripts/add-motivation-quest-votes.ts
 *
 * Richiede: Postgres avviato, DATABASE_URL in .env.
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../../.env") });

async function main() {
  const { pool } = await import("../src/plugins/db");
  const client = await pool.connect();

  try {
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'quest_votes' AND column_name = 'motivation'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ La colonna 'motivation' esiste già in quest_votes");
      return;
    }

    console.log("Aggiungendo la colonna 'motivation' a quest_votes...");
    await client.query('ALTER TABLE quest_votes ADD COLUMN motivation TEXT');
    console.log("✅ Colonna 'motivation' aggiunta con successo!");
  } catch (e: unknown) {
    console.error("❌ Errore:", e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
