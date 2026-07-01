-- Aggiunge la colonna motivation a quest_votes (se non esiste)
-- Esegui: psql $DATABASE_URL -f scripts/add-motivation-to-quest-votes.sql

ALTER TABLE quest_votes ADD COLUMN IF NOT EXISTS motivation TEXT;
