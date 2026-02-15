import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Connessione al DB
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2'

const client = postgres(connectionString)

// Esportiamo 'db' così auth.service.ts lo trova
export const db = drizzle(client, { schema })