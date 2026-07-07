import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dir, '../../../.env') })

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { authRoutes } from './modules/auth/auth.routes'
import { charactersController } from './modules/characters/characters.controller'
import { healthRoutes } from './health/health.routes'
import { realtimeRoutes } from './modules/realtime/ws.routes'
import { presenceRoutes } from './modules/realtime/presence.routes'
import { chatRoutes } from './modules/chat/chat.routes'
import { anonymousChatRoutes } from './modules/anonymous-chat/anonymous-chat.routes'
import { smsRoutes } from './modules/sms/sms.routes'
import { questsRoutes } from './modules/quests/quests.routes'
import { fetchesRoutes } from './modules/fetches/fetches.routes'
import { masterNotesRoutes } from './modules/master-notes/master-notes.routes'
import { meteoRoutes } from './modules/meteo/meteo.routes'
import { gameSessionsRoutes } from './modules/game-sessions/game-sessions.routes'
import { dailyTickRoutes } from './modules/daily-tick/daily-tick.routes'
import { housingRoutes } from './modules/housing/housing.routes'
import { masterStatsRoutes } from './modules/master-stats/master-stats.routes'
import { loreRoutes } from './modules/lore/lore.routes'
import { inventoryRoutes } from './modules/inventory/inventory.routes'
import { dropRoutes } from './modules/drop/drop.routes'
import { artigianoRoutes } from './modules/artigiano/artigiano.routes'
import { medicoRoutes } from './modules/medico/medico.routes'
import { cacciatoreRoutes } from './modules/cacciatore/cacciatore.routes'
import { politicoRoutes } from './modules/politico/politico.routes'
import { sacerdoteRoutes } from './modules/sacerdote/sacerdote.routes'
import { shakaiRoutes } from './modules/shakai/shakai.routes'
import { marketRoutes } from './modules/market/market.routes'
import { marketCatalogAdminRoutes } from './modules/market/market-catalog-admin.routes'
import { shopRoutes } from './modules/shop/shop.routes'
import { bancaRoutes } from './modules/banca/banca.routes'
import { adminRoutes } from './modules/admin/admin.routes'
import { musicRoutes } from './modules/music/music.routes'
import { forumRoutes } from './modules/forum/forum.routes'
import { bestiarioRoutes } from './modules/bestiario/bestiario.routes'
import { wazaRoutes } from './modules/waza/waza.routes'
import { wazaAdminRoutes } from './modules/waza/waza-admin.routes'
import { wikiRoutes } from './modules/wiki/wiki.routes'
import { playerRequestsRoutes } from './modules/player-requests/player-requests.routes'
import { notificationsRoutes } from './modules/notifications/notifications.routes'
import { pushRoutes } from './modules/push/push.routes'
import { startDailyTickScheduler } from './scheduler/daily-tick.scheduler'
import { JWT_SECRET } from './config'
import { emailConfigStatus } from './lib/email'

const PORT = Number(process.env.PORT) || 4000

const app = new Elysia()
  .use(cors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_SECRET,
    })
  )
  .use(healthRoutes)
  .use(authRoutes)
  .use(charactersController)
  .use(chatRoutes)
  .use(anonymousChatRoutes)
  .use(smsRoutes)
  .use(questsRoutes)
  .use(fetchesRoutes)
  .use(masterNotesRoutes)
  .use(meteoRoutes)
  .use(gameSessionsRoutes)
  .use(dailyTickRoutes)
  .use(housingRoutes)
  .use(masterStatsRoutes)
  .use(loreRoutes)
  .use(inventoryRoutes)
  .use(dropRoutes)
  .use(artigianoRoutes)
  .use(medicoRoutes)
  .use(cacciatoreRoutes)
  .use(politicoRoutes)
  .use(sacerdoteRoutes)
  .use(shakaiRoutes)
  .use(marketRoutes)
  .use(marketCatalogAdminRoutes)
  .use(shopRoutes)
  .use(bancaRoutes)
  .use(adminRoutes)
  .use(musicRoutes)
  .use(forumRoutes)
  .use(bestiarioRoutes)
  .use(wazaRoutes)
  .use(wazaAdminRoutes)
  .use(wikiRoutes)
  .use(playerRequestsRoutes)
  .use(notificationsRoutes)
  .use(pushRoutes)
  .use(realtimeRoutes)
  .use(presenceRoutes)
  .listen(PORT, () => {
    console.log(`🚀 Server avviato su http://localhost:${PORT}`)
    const email = emailConfigStatus()
    if (!email.configured) {
      console.warn('⚠️  Email disabilitate: configura RESEND_API_KEY (Render) o EMAIL_PASS (locale)')
    } else if (email.warning) {
      console.warn(`⚠️  Email via ${email.provider}: ${email.warning}`)
    } else {
      console.log(`📧 Email attive via ${email.provider} (staff → ${email.notifyTo})`)
    }
    
    // Avvia il scheduler del Daily Tick
    if (process.env.ENABLE_DAILY_TICK_SCHEDULER !== 'false') {
      startDailyTickScheduler()
      console.log('📅 Daily Tick Scheduler avviato')
    } else {
      console.log('⚠️  Daily Tick Scheduler disabilitato (ENABLE_DAILY_TICK_SCHEDULER=false)')
    }
  })

console.log(`🦊 Oyasumi Server running at http://localhost:${PORT}`)