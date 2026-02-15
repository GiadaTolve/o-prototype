import { Elysia } from 'elysia'
import { processDailyTick } from '@domain/use-cases/daily-tick'
import { buildDailyTickContext } from './daily-tick.context'

export const dailyTickRoutes = new Elysia()
  .post('/system/daily-tick', async () => {

    const ctx = await buildDailyTickContext()

    return processDailyTick(ctx)
  })
