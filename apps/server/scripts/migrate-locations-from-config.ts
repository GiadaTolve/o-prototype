import { Pool } from "pg";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Struttura delle locations dal map-config.ts (in ordine gerarchico)
const LOCATIONS_CONFIG = [
  // Root map "Ogon" (livello 0)
  { name: "Ogon", type: "MAP" as const, parentKey: null, prefecture: null },
  
  // Zone sotto Ogon (livello 1)
  { name: "Kessen", type: "MAP" as const, parentKey: "ogon", prefecture: "kessen" },
  { name: "Edo", type: "MAP" as const, parentKey: "ogon", prefecture: "edo" },
  { name: "Kotowari", type: "MAP" as const, parentKey: "ogon", prefecture: "kotowari" },
  { name: "Hamanachi", type: "MAP" as const, parentKey: "ogon", prefecture: null },
  
  // Locations sotto Kessen (livello 2)
  { name: "Cosmicon Complex", type: "MAP" as const, parentKey: "kessen", prefecture: "kessen" },
  
  // Chat sotto Cosmicon Complex (livello 3)
  { name: "Junk Town", type: "CHAT" as const, parentKey: "cosmicon-complex" },
  { name: "Arcade Palace", type: "CHAT" as const, parentKey: "cosmicon-complex" },
  { name: "Milky Way", type: "CHAT" as const, parentKey: "cosmicon-complex" },
  
  // Chat sotto Edo (livello 2)
  { name: "Paradise", type: "CHAT" as const, parentKey: "edo" },
  { name: "Ginza o' Clock", type: "CHAT" as const, parentKey: "edo" },
  
  // Chat sotto Kotowari (livello 2)
  { name: "Astrolabio", type: "CHAT" as const, parentKey: "kotowari" },
  { name: "Osservatorio", type: "CHAT" as const, parentKey: "kotowari" },
  
  // Chat sotto Hamanachi (livello 2)
  { name: "Casa da tè", type: "CHAT" as const, parentKey: "hamanachi" },
  { name: "Ospedale", type: "CHAT" as const, parentKey: "hamanachi" },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verifica se la tabella esiste
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'locations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log("❌ La tabella 'locations' non esiste. Esegui prima: bun run add-admin-tables");
      await client.query("ROLLBACK");
      return;
    }

    // Pulisci le locations esistenti (opzionale, commenta se vuoi mantenere quelle esistenti)
    // await client.query("DELETE FROM locations");

    // Mappa per tracciare gli ID creati (usa chiavi basate sul nome normalizzato)
    const idMap: Record<string, string> = {};

    // Crea tutte le locations in ordine (gerarchico)
    for (const loc of LOCATIONS_CONFIG) {
      // Crea una chiave univoca basata sul nome normalizzato
      const nameKey = loc.name.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "");
      
      // Trova il parent ID se esiste
      const parentKey = loc.parentKey ? loc.parentKey.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "") : null;
      const parentId = parentKey && idMap[parentKey] ? idMap[parentKey] : null;
      
      // Verifica se esiste già una location con lo stesso nome (case-insensitive)
      const existing = await client.query(
        "SELECT id FROM locations WHERE LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', '')) = $1",
        [nameKey]
      );

      if (existing.rows.length > 0) {
        idMap[nameKey] = existing.rows[0].id;
        console.log(`✓ Location "${loc.name}" già esistente (ID: ${existing.rows[0].id})`);
        
        // Aggiorna il parent se necessario
        if (parentId && existing.rows[0].id !== parentId) {
          await client.query(
            "UPDATE locations SET parent_id = $1 WHERE id = $2",
            [parentId, existing.rows[0].id]
          );
          console.log(`  → Aggiornato parent per "${loc.name}"`);
        }
      } else {
        const result = await client.query(
          `INSERT INTO locations (parent_id, name, type, prefecture, pos_x, pos_y, created_at)
           VALUES ($1, $2, $3, $4, 50, 50, NOW())
           RETURNING id`,
          [parentId, loc.name, loc.type, loc.prefecture || null]
        );
        idMap[nameKey] = result.rows[0].id;
        console.log(`✓ Creata location "${loc.name}" (${loc.type}) - ID: ${result.rows[0].id}`);
      }
    }

    await client.query("COMMIT");
    console.log("\n✅ Migrazione locations completata!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Errore durante la migrazione:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
