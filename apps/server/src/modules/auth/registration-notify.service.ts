import { inArray } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { users, characters } from '../../db/schema'
import { sendRegistrationNotifyEmail } from '../../lib/email'
import { createSystemNotification } from '../notifications/notifications.service'

type RegistrationNotifyParams = {
  characterName: string
  email: string
  userId: string
  characterId: string
  playerPreferences?: string
}

const STAFF_ROLES = ['ADMIN', 'MASTER'] as const

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function notifyStaffInApp(params: RegistrationNotifyParams) {
  const staffUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.role, [...STAFF_ROLES]))

  if (staffUsers.length === 0) return

  const staffUserIds = staffUsers.map((u) => u.id)
  const staffCharacters = await db
    .select({ id: characters.id })
    .from(characters)
    .where(inArray(characters.userId, staffUserIds))

  const prefs = params.playerPreferences?.trim() || 'Nessuna preferenza espressa.'
  const title = `Nuova registrazione: ${params.characterName}`
  const content = [
    `Nome PG: ${params.characterName}`,
    `Email: ${params.email}`,
    `ID utente: ${params.userId}`,
    `ID personaggio: ${params.characterId}`,
    '',
    'Preferenze / note:',
    prefs,
  ].join('\n')

  await Promise.all(
    staffCharacters.map((char) =>
      createSystemNotification(char.id, 'new_registration', { title, content }).catch((e) => {
        console.error('[auth] notifica in-app staff fallita:', char.id, e)
      }),
    ),
  )
}

/** Notifica staff: email (con retry) + alert in-app per ADMIN/MASTER. */
export async function notifyStaffNewRegistration(params: RegistrationNotifyParams) {
  let lastError: string | undefined

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await sendRegistrationNotifyEmail(params)
    if (result.ok) {
      await notifyStaffInApp(params)
      return result
    }
    lastError = result.error
    if (attempt < 2) {
      console.warn('[auth] retry notifica staff email, tentativo', attempt + 1)
      await sleep(1500)
    }
  }

  console.error('[auth] notifica staff email fallita dopo retry:', lastError)
  await notifyStaffInApp(params)
  return { ok: false, error: lastError ?? 'Invio email staff fallito' }
}
