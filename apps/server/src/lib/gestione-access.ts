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
