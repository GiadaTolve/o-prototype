/**
 * Crea le tabelle Sprint 1 per pannello admin Waza:
 * - waza
 * - waza_versioni
 * - vocabolari
 *
 * Esegui da apps/server:
 * bun run scripts/add-waza-authoring-tables.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'
import { GENITORI_DO, GENITORI_MADOSHO } from '../src/modules/waza/waza-taxonomy'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql.begin(async (tx) => {
    await tx`
      CREATE TABLE IF NOT EXISTS waza (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT NOT NULL UNIQUE,
        categoria TEXT NOT NULL CHECK (categoria IN ('generica', 'do', 'madosho')),
        genitore TEXT NULL,
        tipo TEXT NOT NULL CHECK (tipo IN ('passiva', 'attiva')),
        tier INTEGER NULL CHECK (tier IS NULL OR tier BETWEEN 1 AND 5),
        creato_il TIMESTAMP NOT NULL DEFAULT NOW(),
        archiviata BOOLEAN NOT NULL DEFAULT FALSE,
        versione_pubblicata_id UUID NULL,
        CONSTRAINT waza_genitore_check CHECK (
          (categoria = 'generica' AND genitore IS NULL)
          OR (categoria != 'generica' AND genitore IS NOT NULL)
        )
      )
    `

    await tx`
      CREATE TABLE IF NOT EXISTS waza_versioni (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        waza_id UUID NOT NULL REFERENCES waza(id) ON DELETE CASCADE,
        numero INTEGER NOT NULL CHECK (numero >= 1),
        stato TEXT NOT NULL CHECK (stato IN ('bozza', 'validata', 'pubblicata', 'superata')),
        nome_romaji TEXT NOT NULL,
        nome_italiano TEXT NOT NULL,
        kanji TEXT NULL,
        kanji_verificato BOOLEAN NOT NULL DEFAULT FALSE,
        descrizione TEXT NOT NULL,
        cs INTEGER NOT NULL CHECK (cs >= 0),
        tempo_quarti INTEGER NULL CHECK (tempo_quarti IS NULL OR tempo_quarti >= 0),
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        scelte_al_lancio JSONB NOT NULL DEFAULT '[]'::jsonb,
        effetti JSONB NOT NULL DEFAULT '[]'::jsonb,
        atomi_usati JSONB NOT NULL DEFAULT '[]'::jsonb,
        stato_codifica TEXT NOT NULL CHECK (stato_codifica IN ('da_codificare', 'automatica', 'ibrida', 'manuale')),
        changelog TEXT NULL,
        salvata_il TIMESTAMP NOT NULL DEFAULT NOW(),
        salvata_da UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        UNIQUE (waza_id, numero)
      )
    `

    await tx`
      CREATE TABLE IF NOT EXISTS vocabolari (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        categoria TEXT NOT NULL,
        valore TEXT NOT NULL,
        extra JSONB NULL,
        attivo BOOLEAN NOT NULL DEFAULT TRUE,
        UNIQUE (categoria, valore)
      )
    `

    await tx`
      ALTER TABLE waza
      DROP CONSTRAINT IF EXISTS waza_versione_pubblicata_id_fkey
    `
    await tx`
      ALTER TABLE waza
      ADD CONSTRAINT waza_versione_pubblicata_id_fkey
      FOREIGN KEY (versione_pubblicata_id) REFERENCES waza_versioni(id) ON DELETE SET NULL
    `

    await tx`CREATE INDEX IF NOT EXISTS idx_waza_categoria ON waza(categoria)`
    await tx`CREATE INDEX IF NOT EXISTS idx_waza_genitore ON waza(genitore)`
    await tx`CREATE INDEX IF NOT EXISTS idx_waza_tipo ON waza(tipo)`
    await tx`CREATE INDEX IF NOT EXISTS idx_waza_archiviata ON waza(archiviata)`
    await tx`CREATE INDEX IF NOT EXISTS idx_waza_versioni_waza_id ON waza_versioni(waza_id)`
    await tx`CREATE INDEX IF NOT EXISTS idx_waza_versioni_stato ON waza_versioni(stato)`
    await tx`CREATE INDEX IF NOT EXISTS idx_waza_versioni_stato_codifica ON waza_versioni(stato_codifica)`
    await tx`CREATE INDEX IF NOT EXISTS idx_waza_versioni_atomi_usati_gin ON waza_versioni USING GIN (atomi_usati)`
    await tx`CREATE INDEX IF NOT EXISTS idx_vocabolari_categoria ON vocabolari(categoria)`

    for (const valore of GENITORI_DO) {
      await tx`
        INSERT INTO vocabolari (categoria, valore, attivo)
        VALUES ('genitore_do', ${valore}, TRUE)
        ON CONFLICT (categoria, valore) DO UPDATE SET attivo = TRUE
      `
    }

    for (const valore of GENITORI_MADOSHO) {
      await tx`
        INSERT INTO vocabolari (categoria, valore, attivo)
        VALUES ('genitore_madosho', ${valore}, TRUE)
        ON CONFLICT (categoria, valore) DO UPDATE SET attivo = TRUE
      `
    }
  })

  console.log('✓ Tabelle waza/waza_versioni/vocabolari create o aggiornate.')
} finally {
  await sql.end()
}
