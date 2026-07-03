import { eq } from 'drizzle-orm'
import { db } from '../plugins/db'
import { characters } from '../db/schema'

/** Admin (proprietario) o moderatore staff possono modificare Guida/Ambientazione. */
export async function userCanEditWiki(
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
