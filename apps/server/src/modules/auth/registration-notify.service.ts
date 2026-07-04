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
const GESTIONE_ROLE_ICONS = new Set(['admin', 'moderatore'])

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function notifyStaffInApp(params: RegistrationNotifyParams) {
  const characterIds = new Set<string>()

  const staffUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.role, [...STAFF_ROLES]))

  if (staffUsers.length > 0) {
    const staffUserIds = staffUsers.map((u) => u.id)
    const staffCharacters = await db
      .select({ id: characters.id })
      .from(characters)
      .where(inArray(characters.userId, staffUserIds))
    staffCharacters.forEach((c) => characterIds.add(c.id))
  }

  const gestioneChars = await db.select({ id: characters.id, uiMetadata: characters.uiMetadata }).from(characters)
  for (const char of gestioneChars) {
    const icon = ((char.uiMetadata as { roleIcon?: string } | null)?.roleIcon ?? '').toLowerCase()
    if (GESTIONE_ROLE_ICONS.has(icon)) {
      characterIds.add(char.id)
    }
  }

  if (characterIds.size === 0) {
    console.warn('[auth] nessun personaggio staff per notifica in-app registrazione')
    return
  }

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
    [...characterIds].map((characterId) =>
      createSystemNotification(characterId, 'new_registration', { title, content }).catch((e) => {
        console.error('[auth] notifica in-app staff fallita:', characterId, e)
      }),
    ),
  )
}

/** Notifica staff: alert in-app immediato + email (con retry). */
export async function notifyStaffNewRegistration(params: RegistrationNotifyParams) {
  await notifyStaffInApp(params)

  let lastError: string | undefined

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await sendRegistrationNotifyEmail(params)
    if (result.ok) {
      return result
    }
    lastError = result.error
    if (attempt < 2) {
      console.warn('[auth] retry notifica staff email, tentativo', attempt + 1, lastError)
      await sleep(1500)
    }
  }

  console.error('[auth] notifica staff email fallita dopo retry:', lastError)
  return { ok: false, error: lastError ?? 'Invio email staff fallito' }
}
