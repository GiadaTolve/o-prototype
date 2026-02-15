// apps/server/src/scheduler/daily-tick.scheduler.ts

import { processDailyTickForAllCharacters } from '../modules/daily-tick/daily-tick.service'

/**
 * Calcola il prossimo esecuzione del Daily Tick (ogni giorno alle 00:00 UTC).
 * Restituisce il numero di millisecondi fino alla prossima esecuzione.
 */
function getNextDailyTickDelay(): number {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)
  
  return tomorrow.getTime() - now.getTime()
}

/**
 * Esegue il Daily Tick e programma la prossima esecuzione.
 */
async function scheduleNextDailyTick(): Promise<void> {
  try {
    console.log('[Daily Tick] Esecuzione Daily Tick...')
    const result = await processDailyTickForAllCharacters()
    console.log(`[Daily Tick] Completato: ${result.processed} personaggi processati`)
  } catch (error) {
    console.error('[Daily Tick] Errore durante l\'esecuzione:', error)
  } finally {
    // Programma la prossima esecuzione
    const delay = getNextDailyTickDelay()
    console.log(`[Daily Tick] Prossima esecuzione tra ${Math.round(delay / 1000 / 60)} minuti (${new Date(Date.now() + delay).toISOString()})`)
    
    setTimeout(() => {
      scheduleNextDailyTick()
    }, delay)
  }
}

/**
 * Avvia il scheduler del Daily Tick.
 * Esegue immediatamente se siamo già passati le 00:00 UTC oggi, altrimenti aspetta fino alle 00:00 UTC.
 */
export function startDailyTickScheduler(): void {
  const now = new Date()
  const todayMidnight = new Date(now)
  todayMidnight.setUTCHours(0, 0, 0, 0)
  
  // Se siamo già passati le 00:00 UTC oggi, esegui subito (per test/sviluppo)
  // In produzione, potresti voler aspettare sempre fino alla prossima mezzanotte
  const shouldRunNow = now.getTime() - todayMidnight.getTime() > 0
  
  if (shouldRunNow) {
    // Esegui subito, poi programma la prossima
    scheduleNextDailyTick()
  } else {
    // Aspetta fino alle 00:00 UTC
    const delay = todayMidnight.getTime() - now.getTime()
    console.log(`[Daily Tick] Scheduler avviato. Prima esecuzione tra ${Math.round(delay / 1000 / 60)} minuti (${todayMidnight.toISOString()})`)
    setTimeout(() => {
      scheduleNextDailyTick()
    }, delay)
  }
}
