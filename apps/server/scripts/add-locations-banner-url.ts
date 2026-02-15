/**
 * Aggiunge la colonna 'banner_url' alla tabella 'locations' se non esiste.
 * Usata per il banner nell'header della vista mappa (modificabile in Gestione → Modifica mappa).
 *
 * Esegui: cd apps/server && bun run scripts/add-locations-banner-url.ts
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
    console.log("Verificando se la colonna 'banner_url' esiste in 'locations'...");

    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'locations' AND column_name = 'banner_url'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ La colonna 'banner_url' esiste già nella tabella 'locations'");
      return;
    }

    console.log("Aggiungendo la colonna 'banner_url'...");

    await client.query("BEGIN");

    try {
      await client.query(`
        ALTER TABLE locations
        ADD COLUMN banner_url text
      `);

      await client.query("COMMIT");
      console.log("✅ Colonna 'banner_url' aggiunta con successo!");
    } catch (e: unknown) {
      await client.query("ROLLBACK");
      throw e;
    }
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
  console.error("Errore:", e);
  process.exit(1);
});
