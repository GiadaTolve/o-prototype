import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
// 👇 Importiamo lo schema appena creato
import * as schema from '../db/schema'

const { Pool } = pg

// La connessione grezza (la teniamo sotto il cofano)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2',
})

// 👇 L'istanza magica di Drizzle
// Passando { schema } abilitiamo l'autocompletamento intelligente!
export const db = drizzle(pool, { schema })