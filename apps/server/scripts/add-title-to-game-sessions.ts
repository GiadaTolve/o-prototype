import { db } from '../src/plugins/db';
import { sql } from 'drizzle-orm';

/**
 * Script per aggiungere la colonna 'title' alla tabella 'game_sessions'.
 * Esegui con: bun run scripts/add-title-to-game-sessions.ts
 */
async function addTitleColumn() {
  try {
    console.log('Aggiunta colonna title a game_sessions...');
    
    await db.execute(sql`
      ALTER TABLE game_sessions 
      ADD COLUMN IF NOT EXISTS title TEXT;
    `);
    
    console.log('✅ Colonna title aggiunta con successo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore durante l\'aggiunta della colonna:', error);
    process.exit(1);
  }
}

addTitleColumn();
