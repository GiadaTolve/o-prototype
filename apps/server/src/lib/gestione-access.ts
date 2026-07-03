import { eq } from 'drizzle-orm'
import { db } from '../plugins/db'
import { characters } from '../db/schema'

/** Proprietario (admin) o account ADMIN — modifica Ruolo utente in Gestione. */
export function resolveCanEditUserRuolo(userRole?: string | null, roleIcon?: string): boolean {
  const role = (userRole ?? '').toUpperCase()
  const icon = (roleIcon ?? '').toLowerCase()
  return role === 'ADMIN' || icon === 'admin'
}

export async function userCanEditUserRuolo(
  userId: string,
  userRole?: string | null,
): Promise<boolean> {
  const role = (userRole ?? '').toUpperCase()
  if (role === 'ADMIN') return true

  const char = await db.query.characters.findFirst({
    where: eq(characters.userId, userId),
    columns: { uiMetadata: true },
  })
  const icon = ((char?.uiMetadata as { roleIcon?: string } | null)?.roleIcon ?? '').toLowerCase()
  return icon === 'admin'
}

/** Pannello Gestionale: account Admin o pixel-icon moderatore/proprietario. */
export function resolveGestioneAccess(userRole?: string | null, roleIcon?: string): boolean {
  const role = (userRole ?? '').toUpperCase()
  const icon = (roleIcon ?? '').toLowerCase()
  return role === 'ADMIN' || icon === 'moderatore' || icon === 'admin'
}

/** Pannello Shinigami + comandi master in chat (MASTER account = Shinigami). */
export function resolveShinigamiAccess(userRole?: string | null, roleIcon?: string): boolean {
  const role = (userRole ?? '').toUpperCase()
  const icon = (roleIcon ?? '').toLowerCase()
  return (
    role === 'ADMIN' ||
    role === 'MASTER' ||
    icon === 'shinigami' ||
    icon === 'capo-shinigami'
  )
}

export async function userHasGestioneAccess(
  userId: string,
  userRole?: string | null,
): Promise<boolean> {
  const role = (userRole ?? '').toUpperCase()
  if (role === 'ADMIN') return true

  const char = await db.query.characters.findFirst({
    where: eq(characters.userId, userId),
    columns: { uiMetadata: true },
  })
  const icon = ((char?.uiMetadata as { roleIcon?: string } | null)?.roleIcon ?? '').toLowerCase()
  return icon === 'moderatore' || icon === 'admin'
}

export async function userHasShinigamiAccess(
  userId: string,
  userRole?: string | null,
): Promise<boolean> {
  const role = (userRole ?? '').toUpperCase()
  if (role === 'ADMIN' || role === 'MASTER') return true

  const char = await db.query.characters.findFirst({
    where: eq(characters.userId, userId),
    columns: { uiMetadata: true },
  })
  const icon = ((char?.uiMetadata as { roleIcon?: string } | null)?.roleIcon ?? '').toLowerCase()
  return icon === 'shinigami' || icon === 'capo-shinigami'
}

/** Admin o pixel-icon staff dev (moderatore, admin, fixer) — pannello Sviluppo. */
export function resolveSviluppoAccess(userRole?: string | null, roleIcon?: string): boolean {
  const role = (userRole ?? '').toUpperCase()
  const icon = (roleIcon ?? '').toLowerCase()
  return role === 'ADMIN' || icon === 'moderatore' || icon === 'admin' || icon === 'fixer'
}

export async function userHasSviluppoAccess(
  userId: string,
  userRole?: string | null,
): Promise<boolean> {
  const role = (userRole ?? '').toUpperCase()
  if (role === 'ADMIN') return true

  const char = await db.query.characters.findFirst({
    where: eq(characters.userId, userId),
    columns: { uiMetadata: true },
  })
  const icon = ((char?.uiMetadata as { roleIcon?: string } | null)?.roleIcon ?? '').toLowerCase()
  return icon === 'moderatore' || icon === 'admin' || icon === 'fixer'
}

/** Gestione sessioni giocata / quest: creatore o staff Shinigami. */
export function canManageGameSession(
  userRole: string | null | undefined,
  roleIcon: string | null | undefined,
  creatorId: string,
  characterId: string,
): boolean {
  if (creatorId === characterId) return true
  return resolveShinigamiAccess(userRole, roleIcon ?? undefined)
}

/** Staff Shinigami o Gestionale — permesso comandi `/drop`. */
export async function userCanExecuteDrop(
  userId: string,
  userRole?: string | null,
  characterId?: string | null,
): Promise<boolean> {
  if (await userHasGestioneAccess(userId, userRole)) return true
  if (!characterId) return false
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { uiMetadata: true },
  })
  const icon = ((char?.uiMetadata as { roleIcon?: string } | null)?.roleIcon ?? '').toLowerCase()
  return resolveShinigamiAccess(userRole, icon)
}
