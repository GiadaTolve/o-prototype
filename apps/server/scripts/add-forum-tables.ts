import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Crea tabella forum_sections se non esiste
    await client.query(`
      CREATE TABLE IF NOT EXISTS forum_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Crea tabella forum_boards se non esiste
    await client.query(`
      CREATE TABLE IF NOT EXISTS forum_boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id UUID NOT NULL REFERENCES forum_sections(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Crea tabella forum_topics se non esiste
    await client.query(`
      CREATE TABLE IF NOT EXISTS forum_topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        board_id UUID NOT NULL REFERENCES forum_boards(id) ON DELETE CASCADE,
        character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
        is_locked BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Crea tabella forum_posts se non esiste
    await client.query(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
        character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        like_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Crea tabella forum_post_likes se non esiste
    await client.query(`
      CREATE TABLE IF NOT EXISTS forum_post_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
        character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(post_id, character_id)
      )
    `);

    // Crea indici per migliorare le query
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forum_boards_section_id ON forum_boards(section_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forum_topics_board_id ON forum_topics(board_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forum_topics_updated_at ON forum_topics(updated_at DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id ON forum_posts(topic_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post_id ON forum_post_likes(post_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forum_post_likes_character_id ON forum_post_likes(character_id)
    `);

    await client.query("COMMIT");
    console.log("✅ Tabelle forum create con successo!");
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
