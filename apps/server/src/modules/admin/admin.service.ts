import { eq, and, gte, lte, desc, asc, isNull, sql, inArray, or, ne, ilike } from 'drizzle-orm'
import { db } from '../../plugins/db'
import {
  users,
  characters,
  zoneMessages,
  locations,
  banners,
  dailyEvents,
  sanctions,
  jobs,
  housingTypes,
  characterHousing,
  creatures,
  characterSkills,
  inventory,
  sceneGroundLoot,
  dropTableDailyUsage,
  marketListings,
  marketTradeFeed,
  characterPlayerRequests,
} from '../../db/schema'
import type { UserRole, BanState } from '@domain/security/jwt'

/**
 * Ottiene tutti gli utenti con i loro personaggi associati
 */
export async function getAllUsers() {
  return db.query.users.findMany({
    with: {
      characters: true,
    },
  })
}

/**
 * Aggiorna il ruolo di un utente
 */
export async function updateUserRole(userId: string, role: UserRole) {
  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning()

  if (!updated) {
    throw new Error('Utente non trovato')
  }

  return updated
}

/**
 * Aggiorna lo stato di ban di un utente
 */
export async function updateUserBanState(userId: string, banState: BanState) {
  const [updated] = await db
    .update(users)
    .set({ banState })
    .where(eq(users.id, userId))
    .returning()

  if (!updated) {
    throw new Error('Utente non trovato')
  }

  return updated
}

/**
 * Elimina un utente e i personaggi collegati (per test registrazione o pulizia account).
 * Non consente di eliminare sé stessi né account ADMIN/MASTER.
 */
export async function deleteUser(targetUserId: string, actorUserId: string) {
  if (targetUserId === actorUserId) {
    throw new Error('Non puoi eliminare il tuo account da qui')
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
    with: { characters: { columns: { id: true } } },
  })

  if (!target) {
    throw new Error('Utente non trovato')
  }

  if (target.role === 'ADMIN' || target.role === 'MASTER') {
    throw new Error('Non puoi eliminare un account ADMIN o MASTER')
  }

  const characterIds = target.characters.map((c) => c.id)

  await db.transaction(async (tx) => {
    if (characterIds.length > 0) {
      await tx
        .update(marketListings)
        .set({ buyerCharacterId: null })
        .where(inArray(marketListings.buyerCharacterId, characterIds))
      await tx.delete(marketListings).where(inArray(marketListings.sellerCharacterId, characterIds))
      await tx
        .delete(marketTradeFeed)
        .where(
          or(
            inArray(marketTradeFeed.sellerCharacterId, characterIds),
            inArray(marketTradeFeed.buyerCharacterId, characterIds),
          ),
        )
      await tx
        .update(inventory)
        .set({ craftedByCharacterId: null })
        .where(inArray(inventory.craftedByCharacterId, characterIds))
      await tx.delete(inventory).where(inArray(inventory.characterId, characterIds))
      await tx.delete(characterSkills).where(inArray(characterSkills.characterId, characterIds))
      await tx.delete(dropTableDailyUsage).where(inArray(dropTableDailyUsage.characterId, characterIds))
      await tx
        .delete(sceneGroundLoot)
        .where(inArray(sceneGroundLoot.createdByCharacterId, characterIds))
      await tx.delete(characters).where(inArray(characters.id, characterIds))
    }

    const [deleted] = await tx.delete(users).where(eq(users.id, targetUserId)).returning({
      id: users.id,
      email: users.email,
    })

    if (!deleted) {
      throw new Error('Utente non trovato')
    }

    return deleted
  })

  return {
    success: true,
    deletedUserId: targetUserId,
    email: target.email,
    characterCount: characterIds.length,
  }
}

/**
 * Aggiorna il nome di un personaggio
 */
export async function updateCharacterName(characterId: string, name: string) {
  const [updated] = await db
    .update(characters)
    .set({ name })
    .where(eq(characters.id, characterId))
    .returning()

  if (!updated) {
    throw new Error('Personaggio non trovato')
  }

  return updated
}

const VALID_ROLE_ICONS = new Set(['admin', 'moderatore', 'fixer', 'capo-shinigami', 'shinigami'])

/**
 * Aggiorna la pixel-icon ruolo staff (uiMetadata.roleIcon) di un personaggio.
 */
export async function updateCharacterRoleIcon(characterId: string, roleIcon: string | null) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  const icon = (roleIcon ?? '').trim().toLowerCase()
  if (icon && !VALID_ROLE_ICONS.has(icon)) {
    throw new Error('Icona ruolo non valida')
  }

  const currentMeta = (char.uiMetadata as Record<string, unknown> | null) ?? {}
  const newMeta = { ...currentMeta }
  if (icon) {
    newMeta.roleIcon = icon
  } else {
    delete newMeta.roleIcon
  }

  const [updated] = await db
    .update(characters)
    .set({ uiMetadata: newMeta })
    .where(eq(characters.id, characterId))
    .returning()

  if (!updated) {
    throw new Error('Personaggio non trovato')
  }

  return updated
}

/**
 * Resetta le statistiche base di un personaggio a 0
 */
export async function resetCharacterStats(characterId: string) {
  return resetCharacterAbilities(characterId)
}

/**
 * Assegna il grado di un personaggio (manuale, da Gestionale).
 */
export async function assignCharacterGrade(characterId: string, grade: string) {
  const normalized = grade.trim()
  if (!normalized) {
    throw new Error('Il grado non può essere vuoto')
  }

  const [updated] = await db
    .update(characters)
    .set({ grade: normalized })
    .where(eq(characters.id, characterId))
    .returning()

  if (!updated) {
    throw new Error('Personaggio non trovato')
  }

  return updated
}

/**
 * Reset abilità: azzera Skiru + Waza, conserva EXP e dati identitari.
 */
export async function resetCharacterAbilities(characterId: string) {
  return db.transaction(async (tx) => {
    const char = await tx.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { id: true, uiMetadata: true },
    })
    if (!char) throw new Error('Personaggio non trovato')

    await tx.delete(characterSkills).where(eq(characterSkills.characterId, characterId))

    const meta = (char.uiMetadata as Record<string, unknown> | null) ?? {}
    const nextMeta = { ...meta }
    delete nextMeta.passiveSlotsUnlocked
    delete nextMeta.equippedPassiveIds
    delete nextMeta.primaryStyleId
    delete nextMeta.unlockedStyleIds

    const [updated] = await tx
      .update(characters)
      .set({
        skiruSheet: {},
        uiMetadata: nextMeta,
      })
      .where(eq(characters.id, characterId))
      .returning()

    return updated
  })
}

/**
 * Reset personaggio completo: stato di fabbrica, con rinomina obbligatoria.
 */
export async function resetCharacterFactory(characterId: string, newName: string) {
  const normalizedName = newName.trim()
  if (!normalizedName) {
    throw new Error('Il nuovo nome personaggio è obbligatorio')
  }

  const duplicate = await db.query.characters.findFirst({
    where: and(ilike(characters.name, normalizedName), ne(characters.id, characterId)),
    columns: { id: true },
  })
  if (duplicate) {
    throw new Error('Nome personaggio già in uso')
  }

  return db.transaction(async (tx) => {
    const char = await tx.query.characters.findFirst({
      where: eq(characters.id, characterId),
      columns: { id: true, uiMetadata: true },
    })
    if (!char) throw new Error('Personaggio non trovato')

    await tx.delete(characterSkills).where(eq(characterSkills.characterId, characterId))
    await tx.delete(inventory).where(eq(inventory.characterId, characterId))
    await tx.delete(characterHousing).where(eq(characterHousing.characterId, characterId))
    await tx.delete(dropTableDailyUsage).where(eq(dropTableDailyUsage.characterId, characterId))
    await tx.delete(characterPlayerRequests).where(eq(characterPlayerRequests.characterId, characterId))

    const meta = (char.uiMetadata as Record<string, unknown> | null) ?? {}
    const nextMeta: Record<string, unknown> = {}
    if (typeof meta.roleIcon === 'string' && meta.roleIcon.trim()) {
      nextMeta.roleIcon = meta.roleIcon
    }

    const [updated] = await tx
      .update(characters)
      .set({
        name: normalizedName,
        surname: null,
        bio: null,
        avatar: null,
        miniAvatar: null,
        order: 'NONE',
        grade: 'Nemuribito',
        staffAlias: null,
        masterNotes: null,
        jobId: null,
        rem: 0,
        experienceTotal: 0,
        experienceSpendable: 0,
        keys: 0,
        gems: 0,
        madoshoId: null,
        socialClass: null,
        socialClassChosenAt: null,
        socialSubclassSheet: {},
        strength: 0,
        constitution: 0,
        dexterity: 0,
        mind: 0,
        empathy: 0,
        skiruSheet: {},
        currentHp: null,
        chronoStackState: {
          current: 0,
          accumulating: false,
          overheatTurns: 0,
          skipNextTurn: false,
        },
        baseSlots: 5,
        uiMetadata: nextMeta,
      })
      .where(eq(characters.id, characterId))
      .returning()

    return updated
  })
}

// ==========================================
// LOGS & CHAT ROOMS
// ==========================================

/** Room IDs noti (da chat.service) + housing. Usati per popolare il Log Viewer anche senza messaggi. */
const KNOWN_ROOMS = [
  'kessen__cosmicon__junk_town',
  'kessen__cosmicon__arcade_palace',
  'kessen__cosmicon__milky_way',
  'edo__paradise',
  'edo__ginza_o_clock',
  'kotowari__astrolabio',
  'kotowari__osservatorio',
  'hamanachi__casa_da_te',
  'hamanachi__ospedale',
]

/**
 * Ottiene tutte le chat rooms: zone uniche da zone_messages + housing + room noti (per avere sempre opzioni).
 */
export async function getChatRooms() {
  const fromDb = await db
    .selectDistinct({ id: zoneMessages.zone, name: zoneMessages.zone })
    .from(zoneMessages)
    .orderBy(asc(zoneMessages.zone))

  const byZone = new Map<string, string>()
  for (const r of fromDb) {
    byZone.set(r.id, r.name)
  }
  for (const roomId of KNOWN_ROOMS) {
    if (!byZone.has(roomId)) byZone.set(roomId, roomId)
  }
  return Array.from(byZone.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.id.localeCompare(b.id))
}

/**
 * Ottiene i log di una chat per una fascia temporale (da... a).
 * @param chatId - zone/roomId
 * @param from - ISO string o "date" (YYYY-MM-DD) per inizio giornata
 * @param to - ISO string o "date" (YYYY-MM-DD) per fine giornata
 */
export async function getChatLogs(chatId: string, from: string, to?: string) {
  const startDate = new Date(from)
  if (from.length <= 10) {
    startDate.setHours(0, 0, 0, 0)
  }
  const endDate = to ? new Date(to) : new Date(from)
  if (!to || to.length <= 10) {
    endDate.setHours(23, 59, 59, 999)
  }

  const logs = await db
    .select({
      id: zoneMessages.id,
      timestamp: zoneMessages.createdAt,
      autore: characters.name,
      tipo: sql<string>`CASE 
        WHEN ${zoneMessages.isGlobal} THEN 'GLOBALE'
        ELSE 'CHAT'
      END`,
      testo: zoneMessages.content,
    })
    .from(zoneMessages)
    .leftJoin(characters, eq(zoneMessages.characterId, characters.id))
    .where(
      and(
        eq(zoneMessages.zone, chatId),
        gte(zoneMessages.createdAt, startDate),
        lte(zoneMessages.createdAt, endDate)
      )
    )
    .orderBy(asc(zoneMessages.createdAt))

  return logs
}

// ==========================================
// LOCATIONS (Mappe e Chat)
// ==========================================

/**
 * Ottiene tutte le locations
 */
export async function getAllLocations() {
  return db.query.locations.findMany({
    orderBy: [asc(locations.createdAt)],
  })
}

/** Slug da nome mappa (es. "Ogon" -> "ogon") per match con GameMapId. */
function mapNameToSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_')
}

/**
 * Ritorna banner URL per mappa di gioco (root locations type MAP).
 * Chiave = slug del nome (es. ogon, izayoi). Usabile da dashboard senza permesso admin.
 */
export type MapBannerEntry = { url: string; position?: string }

export async function getMapBanners(): Promise<Record<string, MapBannerEntry>> {
  const list = await db.query.locations.findMany({
    columns: { name: true, bannerUrl: true, bannerForGameMap: true, bannerPosition: true },
    where: and(isNull(locations.parentId), eq(locations.type, 'MAP')),
  })
  const out: Record<string, MapBannerEntry> = {}
  for (const row of list) {
    if (!row.bannerUrl) continue
    const key = (row.bannerForGameMap && row.bannerForGameMap.trim()) || mapNameToSlug(row.name)
    if (key) {
      out[key] = {
        url: row.bannerUrl,
        ...(row.bannerPosition && row.bannerPosition.trim() ? { position: row.bannerPosition.trim() } : {}),
      }
    }
  }
  return out
}

/**
 * Crea una nuova location
 */
export async function createLocation(data: {
  parentId?: string | null
  name: string
  type: 'MAP' | 'CHAT'
  imageUrl?: string
  bannerUrl?: string
  bannerForGameMap?: string
  bannerPosition?: string
  description?: string
  prefecture?: string
  posX?: number
  posY?: number
}) {
  const [location] = await db
    .insert(locations)
    .values({
      parentId: data.parentId || null,
      name: data.name,
      type: data.type,
      imageUrl: data.imageUrl,
      bannerUrl: data.bannerUrl,
      bannerForGameMap: data.bannerForGameMap,
      bannerPosition: data.bannerPosition,
      description: data.description,
      prefecture: data.prefecture,
      posX: data.posX ?? 50,
      posY: data.posY ?? 50,
    })
    .returning()

  return location
}

/**
 * Aggiorna una location
 */
export async function updateLocation(locationId: string, data: {
  name?: string
  type?: 'MAP' | 'CHAT'
  imageUrl?: string
  bannerUrl?: string
  bannerForGameMap?: string
  bannerPosition?: string
  description?: string
  prefecture?: string
  posX?: number
  posY?: number
}) {
  const [updated] = await db
    .update(locations)
    .set(data)
    .where(eq(locations.id, locationId))
    .returning()

  if (!updated) {
    throw new Error('Location non trovata')
  }

  return updated
}

/**
 * Aggiorna il parent di una location (per drag-and-drop)
 */
export async function updateLocationParent(locationId: string, newParentId: string | null) {
  const [updated] = await db
    .update(locations)
    .set({ parentId: newParentId })
    .where(eq(locations.id, locationId))
    .returning()

  if (!updated) {
    throw new Error('Location non trovata')
  }

  return updated
}

/**
 * Elimina una location
 */
export async function deleteLocation(locationId: string) {
  await db.delete(locations).where(eq(locations.id, locationId))
  return { success: true }
}

// ==========================================
// BANNERS
// ==========================================

/**
 * Ottiene tutti i banner
 */
export async function getAllBanners() {
  return db.query.banners.findMany({
    orderBy: [asc(banners.order), asc(banners.createdAt)],
  })
}

/**
 * Crea un nuovo banner
 */
export async function createBanner(data: {
  title: string
  imageUrl: string
  linkUrl?: string
  isActive?: boolean
  order?: number
}) {
  const [banner] = await db
    .insert(banners)
    .values({
      title: data.title,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
    })
    .returning()

  return banner
}

/**
 * Aggiorna un banner
 */
export async function updateBanner(bannerId: string, data: {
  title?: string
  imageUrl?: string
  linkUrl?: string
  isActive?: boolean
  order?: number
}) {
  const [updated] = await db
    .update(banners)
    .set(data)
    .where(eq(banners.id, bannerId))
    .returning()

  if (!updated) {
    throw new Error('Banner non trovato')
  }

  return updated
}

/**
 * Elimina un banner
 */
export async function deleteBanner(bannerId: string) {
  await db.delete(banners).where(eq(banners.id, bannerId))
  return { success: true }
}

// ==========================================
// DAILY EVENTS
// ==========================================

/**
 * Ottiene tutti gli eventi giornalieri
 */
export async function getAllDailyEvents() {
  return db.query.dailyEvents.findMany({
    orderBy: [asc(dailyEvents.eventDate)],
  })
}

/**
 * Ottiene gli eventi di oggi (per calendario dashboard, disponibile a tutti gli utenti autenticati)
 */
export async function getTodayDailyEvents() {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return db.query.dailyEvents.findMany({
    where: eq(dailyEvents.eventDate, today),
    orderBy: [asc(dailyEvents.eventDate)],
  })
}

/**
 * Crea un nuovo evento giornaliero
 */
export async function createDailyEvent(data: {
  eventDate: string
  title: string
  description?: string
}) {
  const [event] = await db
    .insert(dailyEvents)
    .values({
      eventDate: data.eventDate,
      title: data.title,
      description: data.description,
    })
    .returning()

  return event
}

/**
 * Aggiorna un evento giornaliero
 */
export async function updateDailyEvent(eventId: string, data: {
  eventDate?: string
  title?: string
  description?: string
}) {
  const [updated] = await db
    .update(dailyEvents)
    .set(data)
    .where(eq(dailyEvents.id, eventId))
    .returning()

  if (!updated) {
    throw new Error('Evento non trovato')
  }

  return updated
}

/**
 * Elimina un evento giornaliero
 */
export async function deleteDailyEvent(eventId: string) {
  await db.delete(dailyEvents).where(eq(dailyEvents.id, eventId))
  return { success: true }
}

// ==========================================
// BESTIARIO (PNG)
// ==========================================

export async function getAdminCreatures() {
  return db.query.creatures.findMany({
    orderBy: [asc(creatures.category), asc(creatures.name)],
  })
}

export async function createCreature(data: {
  name: string
  description?: string
  imageUrl?: string
  category: 'HOLIC' | 'PHOBIAS' | 'MUEN'
  stats?: { hp?: number; attack?: number; defense?: number }
}) {
  const [c] = await db.insert(creatures).values(data).returning()
  return c!
}

export async function updateCreature(creatureId: string, data: {
  name?: string
  description?: string
  imageUrl?: string
  category?: 'HOLIC' | 'PHOBIAS' | 'MUEN'
  stats?: { hp?: number; attack?: number; defense?: number }
}) {
  const [updated] = await db
    .update(creatures)
    .set(data)
    .where(eq(creatures.id, creatureId))
    .returning()
  if (!updated) throw new Error('PNG non trovato')
  return updated
}

export async function deleteCreature(creatureId: string) {
  await db.delete(creatures).where(eq(creatures.id, creatureId))
  return { success: true }
}

// ==========================================
// SANCTIONS
// ==========================================

/**
 * Ottiene tutte le sanzioni per un utente
 */
export async function getUserSanctions(userId: string) {
  return db.query.sanctions.findMany({
    where: eq(sanctions.userId, userId),
    orderBy: [desc(sanctions.createdAt)],
    with: {
      admin: {
        columns: {
          id: true,
          email: true,
        },
        with: {
          characters: {
            columns: {
              id: true,
              name: true,
            },
            limit: 1,
          },
        },
      },
    },
  })
}

/**
 * Crea una nuova sanzione
 */
export async function createSanction(data: {
  userId: string
  type: 'BAN' | 'SHADOWBAN' | 'WARNING' | 'UNBAN'
  reason?: string
  adminId?: string
}) {
  const [sanction] = await db
    .insert(sanctions)
    .values({
      userId: data.userId,
      type: data.type,
      reason: data.reason,
      adminId: data.adminId,
    })
    .returning()

  // Se è un BAN o SHADOWBAN, aggiorna anche lo stato ban dell'utente
  if (data.type === 'BAN') {
    await db.update(users).set({ banState: 'FULL' }).where(eq(users.id, data.userId))
  } else if (data.type === 'SHADOWBAN') {
    await db.update(users).set({ banState: 'SHADOW' }).where(eq(users.id, data.userId))
  } else if (data.type === 'UNBAN') {
    await db.update(users).set({ banState: 'NONE' }).where(eq(users.id, data.userId))
  }

  return sanction
}

// ==========================================
// JOBS (Arubaito / Lavori)
// ==========================================

/**
 * Ottiene tutti i lavori (per pannello Gestione).
 */
export async function getAdminJobs() {
  return db.query.jobs.findMany({
    orderBy: [asc(jobs.dailySalary)],
  })
}

/**
 * Crea un nuovo lavoro.
 */
export async function createJob(data: {
  title: string
  description?: string
  dailySalary: number
}) {
  const [job] = await db
    .insert(jobs)
    .values({
      title: data.title,
      description: data.description ?? null,
      dailySalary: data.dailySalary,
    })
    .returning()
  return job
}

/**
 * Aggiorna un lavoro.
 */
export async function updateJob(jobId: string, data: {
  title?: string
  description?: string
  dailySalary?: number
}) {
  const [updated] = await db
    .update(jobs)
    .set(data)
    .where(eq(jobs.id, jobId))
    .returning()
  if (!updated) {
    throw new Error('Lavoro non trovato')
  }
  return updated
}

/**
 * Elimina un lavoro.
 */
export async function deleteJob(jobId: string) {
  await db.delete(jobs).where(eq(jobs.id, jobId))
  return { success: true }
}

// ==========================================
// HOUSING TYPES (Tipologie abitazione)
// ==========================================

/**
 * Ottiene tutte le tipologie di abitazione (per pannello Gestione).
 */
export async function getAdminHousingTypes() {
  return db.query.housingTypes.findMany({
    orderBy: [asc(housingTypes.monthlyRent), asc(housingTypes.name)],
  })
}

/**
 * Crea una nuova tipologia di abitazione.
 */
export async function createHousingType(data: {
  code: string
  name: string
  squareMeters: number
  dailyRent?: number | null
  monthlyRent?: number | null
  hpBonus?: number
  inventorySlotsBonus?: number
  requirements?: { paradisePass?: boolean }
}) {
  const [row] = await db
    .insert(housingTypes)
    .values({
      code: data.code.trim(),
      name: data.name.trim(),
      squareMeters: data.squareMeters,
      dailyRent: data.dailyRent ?? null,
      monthlyRent: data.monthlyRent ?? null,
      hpBonus: data.hpBonus ?? 0,
      inventorySlotsBonus: data.inventorySlotsBonus ?? 0,
      requirements: data.requirements ?? {},
    })
    .returning()
  return row
}

/**
 * Aggiorna una tipologia di abitazione.
 */
export async function updateHousingType(
  housingTypeId: string,
  data: {
    code?: string
    name?: string
    squareMeters?: number
    dailyRent?: number | null
    monthlyRent?: number | null
    hpBonus?: number
    inventorySlotsBonus?: number
    requirements?: { paradisePass?: boolean }
  }
) {
  const updates: Record<string, unknown> = {}
  if (data.code !== undefined) updates.code = data.code.trim()
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.squareMeters !== undefined) updates.squareMeters = data.squareMeters
  if (data.dailyRent !== undefined) updates.dailyRent = data.dailyRent
  if (data.monthlyRent !== undefined) updates.monthlyRent = data.monthlyRent
  if (data.hpBonus !== undefined) updates.hpBonus = data.hpBonus
  if (data.inventorySlotsBonus !== undefined) updates.inventorySlotsBonus = data.inventorySlotsBonus
  if (data.requirements !== undefined) updates.requirements = data.requirements

  const [updated] = await db
    .update(housingTypes)
    .set(updates as Record<string, unknown>)
    .where(eq(housingTypes.id, housingTypeId))
    .returning()

  if (!updated) {
    throw new Error('Tipologia di abitazione non trovata')
  }
  return updated
}

/**
 * Elimina una tipologia di abitazione. Fallisce se qualcuno la sta ancora usando.
 */
export async function deleteHousingType(housingTypeId: string) {
  const inUse = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.housingTypeId, housingTypeId),
  })
  if (inUse) {
    throw new Error('Non si può eliminare: almeno un personaggio ha questa abitazione assegnata.')
  }
  await db.delete(housingTypes).where(eq(housingTypes.id, housingTypeId))
  return { success: true }
}
