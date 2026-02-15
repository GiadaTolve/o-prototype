import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors' // 👈 Ora deve trovarlo
import { envPlugin } from './plugins/env.plugin'
import { authPlugin } from './plugins/auth.plugin'

import { healthRoutes } from './health/health.routes'
import { dailyTickRoutes } from './modules/system/daily-tick.route'
import { authRoutes } from './modules/auth/auth.routes'
import { charactersRoutes } from './modules/characters/characters.routes' 

export const app = new Elysia()
  // 👇 IL PLUGIN CORS VA MESSO PER PRIMO
  .use(cors({
    origin: true, // Accetta tutte le richieste (per sviluppo va benissimo)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Metodi permessi
    allowedHeaders: ['Content-Type', 'Authorization'], // Header permessi
  }))
  
  .use(envPlugin)
  .use(authPlugin)

  .use(healthRoutes)
  .use(authRoutes)
  .use(charactersRoutes)
  .use(dailyTickRoutes)