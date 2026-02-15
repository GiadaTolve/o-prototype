import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Crea tabella playlists se non esiste
    await client.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Crea tabella songs se non esiste
    await client.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        source_type TEXT NOT NULL DEFAULT 'url' CHECK (source_type IN ('youtube', 'file', 'url')),
        cover_image_url TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Crea indice per migliorare le query
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_songs_playlist_id ON songs(playlist_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_songs_order ON songs(playlist_id, "order", created_at)
    `);

    await client.query("COMMIT");
    console.log("✅ Tabelle playlists e songs create con successo!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Errore durante la creazione delle tabelle:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Errore:", err);
  process.exit(1);
});
