import { config } from 'dotenv'
import { resolve } from 'path'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
// 👇 Importiamo lo schema appena creato
import * as schema from '../db/schema'

config({ path: resolve(import.meta.dir, '../../../../.env') })

const { Pool } = pg

// La connessione grezza (la teniamo sotto il cofano)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2',
  max: 3,
  // Chiude le connessioni idle dopo 20s → permette a Neon di autosospendersi
  idleTimeoutMillis: 20_000,
})

// 👇 L'istanza magica di Drizzle
// Passando { schema } abilitiamo l'autocompletamento intelligente!
export const db = drizzle(pool, { schema })