import { and, eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters, characterHousing, housingGuests, housingTypes, ledgerEntries } from '../../db/schema'
import { createRem } from '@domain/types/money'
import { spend } from '@domain/ledger/transaction'

/**
 * Ottiene tutte le tipologie di abitazione disponibili.
 */
export async function getAllHousingTypes() {
  return await db.query.housingTypes.findMany({
    where: eq(housingTypes.isActiveInCatalog, true),
    orderBy: (types, { asc }) => [asc(types.squareMeters)],
  })
}

/**
 * Ottiene l'abitazione di un personaggio.
 */
export async function getCharacterHousing(characterId: string) {
  return await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
    with: {
      housingType: true,
    },
  })
}

/**
 * Assegna un'abitazione a un personaggio.
 * Se il personaggio ha già un'abitazione, la rimuove prima.
 */
export async function assignHousing(
  characterId: string,
  housingTypeId: string
) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  const housingType = await db.query.housingTypes.findFirst({
    where: eq(housingTypes.id, housingTypeId),
  })

  if (!housingType) {
    throw new Error('Tipo di abitazione non trovato')
  }

  // Verifica requisiti (es. paradise pass)
  if (housingType.requirements?.paradisePass) {
    // TODO: Verifica se il personaggio ha il pass paradise
    // Per ora, permetto a tutti
  }

  // Rimuovi l'abitazione esistente (se presente)
  const existing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
  })

  if (existing) {
    await db.delete(characterHousing).where(eq(characterHousing.id, existing.id))
  }

  // Calcola la prossima scadenza (15 del mese corrente o successivo)
  const today = new Date()
  let nextDueDate: Date | null = null

  if (housingType.monthlyRent) {
    // Per affitti mensili, la scadenza è il 15 del mese corrente (se siamo prima del 15) o del mese successivo
    if (today.getDate() <= 15) {
      nextDueDate = new Date(today.getFullYear(), today.getMonth(), 15)
    } else {
      nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15)
    }
    nextDueDate.setHours(23, 59, 59, 999)
  }

  // Genera un roomId univoco per la chat della casa (affitto mensile O Stanza dell'Ordine)
  let chatRoomId: string | null = null
  if (housingType.monthlyRent || housingType.code === 'order_room') {
    // Formato: housing_{code}_{characterId} (es. housing_container_abc123, housing_order_room_abc123)
    chatRoomId = `housing_${housingType.code}_${characterId}`
  }

  // Crea la nuova abitazione
  const [newHousing] = await db.insert(characterHousing).values({
    characterId,
    housingTypeId,
    chatRoomId,
    nextDueDate,
    hasPaidCurrentMonth: false, // Deve pagare al prossimo 15
    daysOverdue: 0,
    evicted: false,
  }).returning()

  return newHousing
}

/**
 * Paga manualmente l'affitto mensile.
 */
export async function payMonthlyRent(characterId: string) {
  const housing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
    with: {
      housingType: true,
    },
  })

  if (!housing) {
    throw new Error('Nessuna abitazione assegnata')
  }

  if (!housing.housingType.monthlyRent) {
    throw new Error('Questa abitazione non ha affitto mensile')
  }

  if (housing.evicted) {
    throw new Error('Abitazione sfrattata')
  }

  if (housing.hasPaidCurrentMonth) {
    throw new Error('Affitto già pagato per questo mese')
  }

  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  const currentBalance = createRem(char.rem)
  const rentAmount = createRem(housing.housingType.monthlyRent)

  // Verifica se può pagare
  if (currentBalance < rentAmount) {
    throw new Error('Saldo insufficiente per pagare l\'affitto')
  }

  const spendResult = spend(currentBalance, rentAmount)
  if (!spendResult.ok) throw new Error('Saldo insufficiente per pagare l\'affitto')
  const newRemValue = spendResult.newBalance as number

  // Calcola la prossima scadenza (15 del mese successivo)
  const today = new Date()
  const nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15)
  nextDueDate.setHours(23, 59, 59, 999)

  await db.transaction(async (tx) => {
    // Aggiorna il balance
    await tx
      .update(characters)
      .set({ rem: newRemValue })
      .where(eq(characters.id, characterId))

    // Aggiorna l'housing
    await tx
      .update(characterHousing)
      .set({
        hasPaidCurrentMonth: true,
        nextDueDate,
        daysOverdue: 0,
      })
      .where(eq(characterHousing.id, housing.id))

    // Registra nel ledger
    await tx.insert(ledgerEntries).values({
      characterId,
      type: 'RENT',
      amount: -(rentAmount as number),
      balanceAfter: newRemValue,
      description: `Affitto mensile: ${housing.housingType.name}`,
      metadata: {
        housingTypeId: housing.housingType.id,
        housingTypeCode: housing.housingType.code,
      },
    })
  })

  return {
    newBalance: newRemValue,
    nextDueDate,
  }
}

/**
 * Rimuove l'abitazione di un personaggio (diventa senzatetto).
 */
export async function removeHousing(characterId: string) {
  const housing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
  })

  if (!housing) {
    throw new Error('Nessuna abitazione assegnata')
  }

  await db.delete(characterHousing).where(eq(characterHousing.id, housing.id))

  return { success: true }
}

// ==========================================
// OSPITI (housing_guests)
// ==========================================

/**
 * Invita un personaggio come ospite nella propria casa.
 * Solo chi ha un'abitazione con chatRoomId può invitare.
 */
export async function inviteGuest(ownerCharacterId: string, guestCharacterId: string) {
  const housing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, ownerCharacterId),
  })
  if (!housing?.chatRoomId) {
    throw new Error('Non hai un\'abitazione con chat disponibile')
  }
  if (ownerCharacterId === guestCharacterId) {
    throw new Error('Non puoi invitare te stesso')
  }
  const guest = await db.query.characters.findFirst({
    where: eq(characters.id, guestCharacterId),
  })
  if (!guest) {
    throw new Error('Personaggio ospite non trovato')
  }
  const [row] = await db.insert(housingGuests).values({
    ownerCharacterId,
    guestCharacterId,
  }).returning()
  return row
}

/**
 * Rimuove un ospite dalla propria casa.
 */
export async function removeGuest(ownerCharacterId: string, guestCharacterId: string) {
  const deleted = await db.delete(housingGuests).where(
    and(
      eq(housingGuests.ownerCharacterId, ownerCharacterId),
      eq(housingGuests.guestCharacterId, guestCharacterId)
    )
  ).returning({ deletedId: housingGuests.id })
  if (deleted.length === 0) {
    throw new Error('Ospite non trovato')
  }
  return { success: true }
}

/**
 * Elenco ospiti della propria casa.
 */
export async function listMyGuests(ownerCharacterId: string) {
  return await db.query.housingGuests.findMany({
    where: eq(housingGuests.ownerCharacterId, ownerCharacterId),
    with: {
      guest: {
        columns: { id: true, name: true, surname: true },
      },
    },
    orderBy: (g, { asc }) => [asc(g.createdAt)],
  })
}

/**
 * Verifica se un personaggio può accedere alla chat di un housing.
 * true se è il proprietario o un ospite invitato.
 */
export async function canAccessHousingRoom(characterId: string, chatRoomId: string): Promise<boolean> {
  if (!chatRoomId.startsWith('housing_')) return false
  const parts = chatRoomId.split('_')
  const ownerCharacterId = parts[parts.length - 1]
  if (ownerCharacterId === characterId) return true
  const guestRow = await db.query.housingGuests.findFirst({
    where: and(
      eq(housingGuests.ownerCharacterId, ownerCharacterId),
      eq(housingGuests.guestCharacterId, characterId)
    ),
  })
  return !!guestRow
}

/**
 * Verifica se l'utente può accedere a una chat privata (housing).
 * true se: proprietario, ospite invitato, ADMIN, MASTER, o moderatore (roleIcon admin/mod).
 */
export function canAccessPrivateChat(
  user: { role?: string },
  char: { id: string; uiMetadata?: { roleIcon?: string } | null },
  roomId: string
): boolean {
  if (!roomId.startsWith('housing_')) return true // room pubbliche: accesso per tutti
  const userRole = (user?.role ?? '').toUpperCase()
  if (userRole === 'ADMIN' || userRole === 'MASTER') return true
  const roleIcon = (char?.uiMetadata as { roleIcon?: string } | null)?.roleIcon?.toLowerCase()
  if (roleIcon === 'admin' || roleIcon === 'moderatore') return true
  return false
}

/**
 * Verifica accesso chat privata (include canAccessHousingRoom + admin/mod).
 * Per uso nei route che devono fare il check async.
 */
export async function canAccessPrivateChatAsync(
  characterId: string,
  roomId: string,
  user: { role?: string },
  char: { id: string; uiMetadata?: { roleIcon?: string } | null }
): Promise<boolean> {
  if (canAccessPrivateChat(user, char, roomId)) return true
  return canAccessHousingRoom(characterId, roomId)
}

/**
 * Metadata personalizzabili per la chat di un housing (nome, immagine, descrizione).
 * Restituisce null se la room non è housing o l'utente non ha accesso.
 * @param skipAccessCheck se true, non verifica canAccessHousingRoom (per admin/mod).
 */
export async function getHousingChatInfo(
  characterId: string,
  roomId: string,
  skipAccessCheck = false
): Promise<{
  name: string;
  image: string | null;
  description: string | null;
  isOwner: boolean;
} | null> {
  if (!roomId.startsWith('housing_')) return null
  if (!skipAccessCheck) {
    const canAccess = await canAccessHousingRoom(characterId, roomId)
    if (!canAccess) return null
  }

  const housing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.chatRoomId, roomId),
    with: { housingType: true },
  })
  if (!housing) return null

  const defaultName = housing.housingType?.name ?? 'La tua abitazione'
  return {
    name: housing.chatName ?? defaultName,
    image: housing.chatImage ?? null,
    description: housing.chatDescription ?? null,
    isOwner: housing.characterId === characterId,
  }
}

/**
 * Aggiorna nome, immagine e descrizione della chat housing. Solo il proprietario.
 */
export async function updateHousingChatCustomization(
  characterId: string,
  updates: { name?: string | null; image?: string | null; description?: string | null }
) {
  const housing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
  })
  if (!housing?.chatRoomId) {
    throw new Error('Nessuna abitazione con chat')
  }

  const payload: Record<string, string | null> = {}
  if (updates.name !== undefined) payload.chatName = updates.name?.trim() || null
  if (updates.image !== undefined) payload.chatImage = updates.image?.trim() || null
  if (updates.description !== undefined) payload.chatDescription = updates.description?.trim() || null

  await db
    .update(characterHousing)
    .set(payload)
    .where(eq(characterHousing.id, housing.id))

  return await getHousingChatInfo(characterId, housing.chatRoomId)
}
