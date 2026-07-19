import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { envPlugin } from './plugins/env.plugin'
import { authPlugin } from './plugins/auth.plugin'

import { healthRoutes } from './health/health.routes'
import { dailyTickRoutes } from './modules/system/daily-tick.route'
import { authRoutes } from './modules/auth/auth.routes'
import { charactersRoutes } from './modules/characters/characters.routes'
import { resolveCorsOrigin } from './lib/cors-origins'

export const app = new Elysia()
  .use(cors({
    origin: resolveCorsOrigin(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  
  .use(envPlugin)
  .use(authPlugin)

  .use(healthRoutes)
  .use(authRoutes)
  .use(charactersRoutes)
  .use(dailyTickRoutes)
