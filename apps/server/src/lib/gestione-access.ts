import { eq } from 'drizzle-orm'
import { db } from '../plugins/db'
import { characters } from '../db/schema'

/** Admin/Master o pixel-icon staff (moderatore, admin, capo-shinigami). */
export async function userHasGestioneAccess(
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
  return icon === 'moderatore' || icon === 'admin' || icon === 'capo-shinigami'
}

/** Master/Mod/Shinigami — permesso comandi `/drop`. */
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
  return icon === 'shinigami' || icon === 'capo-shinigami'
}
