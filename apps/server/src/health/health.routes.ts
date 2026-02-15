import { Elysia } from 'elysia'
import { pool } from '../plugins/db'

export const healthRoutes = new Elysia()
  .get('/health', () => ({
    status: 'ok',
    service: 'oyasumi-2.0'
  }))
  .get('/health/db', async () => {
    try {
      await pool.query('SELECT 1')
      return { db: 'ok' }
    } catch (err) {
      return {
        db: 'error',
        error: (err as Error).message
      }
    }
  })
