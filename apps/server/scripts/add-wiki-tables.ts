import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS wiki_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kind TEXT NOT NULL CHECK (kind IN ('guida', 'ambientazione')),
        parent_id UUID REFERENCES wiki_sections(id) ON DELETE CASCADE,
        level INTEGER NOT NULL CHECK (level IN (1, 2)),
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        image_url TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wiki_sections_kind ON wiki_sections(kind)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wiki_sections_parent_id ON wiki_sections(parent_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wiki_sections_kind_order ON wiki_sections(kind, "order")
    `);

    await client.query("COMMIT");
    console.log("✅ Tabelle wiki create con successo!");
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
