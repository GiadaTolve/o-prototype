// apps/server/src/modules/system/daily-tick.context.ts

import type { DailyTickContext } from '@domain/use-cases/daily-tick'

export async function buildDailyTickContext(): Promise<DailyTickContext> {
  // ⚠️ MOCK TEMPORANEO
  // Qui in futuro leggeremo dal DB

  return {
    today: new Date(),

    balance: 100 as any,

    banState: 'NONE',

    salary: {
      base: 90 as any,
      mode: 'DAILY',
      dailyRent: 5 as any
    }
  }
}
