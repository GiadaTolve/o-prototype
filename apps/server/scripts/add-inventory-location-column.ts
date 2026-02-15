/**
 * Aggiunge la colonna 'location' alla tabella 'inventory' se non esiste.
 * 
 * Esegui: cd apps/server && bun run add-inventory-location-column
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
    console.log("Verificando se la colonna 'location' esiste...");
    
    // Verifica se la colonna esiste già
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory' AND column_name = 'location'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ La colonna 'location' esiste già nella tabella 'inventory'");
      return;
    }

    console.log("Aggiungendo la colonna 'location'...");
    
    await client.query("BEGIN");

    try {
      // Aggiungi la colonna con default 'CARRY' e NOT NULL
      await client.query(`
        ALTER TABLE inventory 
        ADD COLUMN location text DEFAULT 'CARRY' NOT NULL
      `);

      await client.query("COMMIT");
      console.log("✅ Colonna 'location' aggiunta con successo!");
      
      // Verifica che la colonna sia stata aggiunta
      const verifyResult = await client.query(`
        SELECT column_name, data_type, column_default, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'location'
      `);
      
      if (verifyResult.rows.length > 0) {
        console.log("✅ Verifica completata:", verifyResult.rows[0]);
      }
    } catch (e: unknown) {
      await client.query("ROLLBACK");
      throw e;
    }
  } catch (e: unknown) {
    console.error("❌ Errore durante l'aggiunta della colonna:", e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }

  console.log("✅ Script completato con successo!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Errore:", e);
  process.exit(1);
});
