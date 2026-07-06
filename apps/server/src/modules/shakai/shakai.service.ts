import { and, asc, eq } from 'drizzle-orm'
import {
  SOCIAL_CLASSES,
  assignSocialClass,
  buildSocialSubclassTree,
  canAccessSocialBlueprint,
  getActiveSocialClassTag,
  getRemainingDailyBudget,
  getSocialToolUx,
  isCraftableBlueprint,
  isSocialClassId,
  listAccessibleSocialBlueprints,
  resolveDailyLimitFromSubclasses,
  socialBlueprintOutputCatalogKey,
  syncSkiruSheetForSocialClass,
  unlockSocialSubclass,
  clearSkiruSocialClassGates,
  validateCraftOfuda,
  EMPTY_SOCIAL_DAILY_USAGE,
  type SocialDailyUsage,
} from '@domain/shakai-kaikyu'
import { getSocialBlueprint } from '@domain/shakai-kaikyu/blueprint-catalog'
import type { SocialClassId, SocialSubclassSheet } from '@domain/shakai-kaikyu/types'
import type { BaseStats } from '@domain/stats/calculator'
import { validateSkiruSheet } from '@domain/skiru'
import { db } from '../../plugins/db'
import { characters, socialBlueprints, socialClassDailyUsage } from '../../db/schema'
import { resolveCharacterSkiruSheet } from '../characters/skiru-sheet'
import { insertMessage, isValidRoom } from '../chat/chat.service'
import {
  addItemByCatalogKey,
  consumeMaterialsByCatalogKey,
} from '../inventory/inventory.service'
import { broadcastInventoryUpdated } from '../realtime/ws.routes'
import * as presence from '../realtime/presence.store'

function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function normalizeSubclassSheet(raw: Record<string, boolean> | null | undefined): SocialSubclassSheet {
  if (!raw || typeof raw !== 'object') return {}
  const sheet: Record<string, boolean> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (value === true) sheet[id] = true
  }
  return sheet
}

async function loadCharacterForUser(userId: string) {
  return db.query.characters.findFirst({
    where: eq(characters.userId, userId),
    columns: {
      id: true,
      strength: true,
      constitution: true,
      dexterity: true,
      mind: true,
      empathy: true,
      experienceSpendable: true,
      skiruSheet: true,
      socialClass: true,
      socialClassChosenAt: true,
      socialSubclassSheet: true,
    },
  })
}

async function getDailyUsage(characterId: string, dayKey: string): Promise<SocialDailyUsage> {
  const row = await db.query.socialClassDailyUsage.findFirst({
    where: and(
      eq(socialClassDailyUsage.characterId, characterId),
      eq(socialClassDailyUsage.dayKey, dayKey),
    ),
  })
  if (!row) return { ...EMPTY_SOCIAL_DAILY_USAGE }
  return {
    healHpUsed: row.healHpUsed ?? 0,
    integrityUsed: row.integrityUsed ?? 0,
    gatherUsed: row.gatherUsed ?? 0,
    pactWeightUsed: row.pactWeightUsed ?? 0,
    ofudaPowerUsed: row.ofudaPowerUsed ?? 0,
  }
}

function baseStatsFromCharacter(char: {
  strength: number
  constitution: number
  dexterity: number
  mind: number
  empathy: number
}): BaseStats {
  return {
    strength: char.strength,
    constitution: char.constitution,
    dexterity: char.dexterity,
    mind: char.mind,
    empathy: char.empathy,
  }
}

function buildSocialClassPayload(
  socialClass: SocialClassId | null,
  socialClassChosenAt: Date | null,
  subclassSheet: SocialSubclassSheet,
  expSpendable: number,
  dailyUsage: SocialDailyUsage,
  dayKey: string,
) {
  const classDef = socialClass ? SOCIAL_CLASSES.find((c) => c.id === socialClass) : undefined
  const dailyBudget =
    socialClass != null
      ? getRemainingDailyBudget(socialClass, subclassSheet, dailyUsage)
      : null

  return {
    socialClass,
    socialClassChosenAt,
    socialClassTag: getActiveSocialClassTag(socialClass),
    socialSubclassSheet: subclassSheet,
    expSpendable,
    classDef: classDef ?? null,
    subclasses: buildSocialSubclassTree(socialClass, subclassSheet, expSpendable),
    dailyBudget,
    dailyUsage,
    dayKey,
    toolUx: socialClass ? getSocialToolUx(socialClass) ?? null : null,
    accessibleBlueprintCount:
      socialClass != null
        ? listAccessibleSocialBlueprints(socialClass, subclassSheet).length
        : 0,
    catalog: SOCIAL_CLASSES,
  }
}

export async function getSocialClassState(userId: string) {
  const character = await loadCharacterForUser(userId)
  if (!character) return null

  const dayKey = utcDayKey()
  const dailyUsage = await getDailyUsage(character.id, dayKey)
  const subclassSheet = normalizeSubclassSheet(
    character.socialSubclassSheet as Record<string, boolean> | undefined,
  )

  return buildSocialClassPayload(
    (character.socialClass as SocialClassId | null) ?? null,
    character.socialClassChosenAt ?? null,
    subclassSheet,
    character.experienceSpendable ?? 0,
    dailyUsage,
    dayKey,
  )
}

export async function chooseSocialClass(userId: string, classId: string) {
  const character = await loadCharacterForUser(userId)
  if (!character) throw new Error('Personaggio non trovato')

  const currentClass = (character.socialClass as SocialClassId | null) ?? null
  const check = assignSocialClass(currentClass, classId)
  if (!check.ok) throw new Error(check.errors.join(' '))

  const socialClass = classId as SocialClassId
  const baseStats = baseStatsFromCharacter(character)
  const skiruSheet = resolveCharacterSkiruSheet(
    character.skiruSheet as Record<string, number> | undefined,
    baseStats,
  )
  const nextSkiruSheet = syncSkiruSheetForSocialClass(skiruSheet, socialClass)
  const validation = validateSkiruSheet(nextSkiruSheet)
  if (!validation.ok) {
    throw new Error(validation.errors.join(' '))
  }

  const chosenAt = new Date()
  await db
    .update(characters)
    .set({
      socialClass,
      socialClassChosenAt: chosenAt,
      skiruSheet: nextSkiruSheet,
    })
    .where(eq(characters.id, character.id))

  return getSocialClassState(userId)
}

export async function unlockSocialSubclassForUser(userId: string, subclassId: string) {
  const character = await loadCharacterForUser(userId)
  if (!character) throw new Error('Personaggio non trovato')

  const socialClass = (character.socialClass as SocialClassId | null) ?? null
  if (!socialClass) {
    throw new Error('Scegli prima una classe sociale.')
  }

  const subclassSheet = normalizeSubclassSheet(
    character.socialSubclassSheet as Record<string, boolean> | undefined,
  )
  const expSpendable = character.experienceSpendable ?? 0
  const result = unlockSocialSubclass(socialClass, subclassSheet, subclassId, expSpendable)
  if (!result.ok || !result.nextSheet || result.nextExpSpendable == null) {
    throw new Error(result.errors.join(' '))
  }

  await db
    .update(characters)
    .set({
      socialSubclassSheet: result.nextSheet,
      experienceSpendable: result.nextExpSpendable,
    })
    .where(eq(characters.id, character.id))

  return getSocialClassState(userId)
}

export async function moderateSocialClass(
  characterId: string,
  input: {
    socialClass?: SocialClassId | null
    resetSubclasses?: boolean
  },
) {
  const character = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: {
      id: true,
      strength: true,
      constitution: true,
      dexterity: true,
      mind: true,
      empathy: true,
      experienceSpendable: true,
      skiruSheet: true,
      socialClass: true,
      socialClassChosenAt: true,
      socialSubclassSheet: true,
      userId: true,
    },
  })
  if (!character) throw new Error('Personaggio non trovato')

  const nextClass =
    input.socialClass === undefined
      ? ((character.socialClass as SocialClassId | null) ?? null)
      : input.socialClass

  if (nextClass != null && !isSocialClassId(nextClass)) {
    throw new Error('Classe sociale non valida.')
  }

  const baseStats = baseStatsFromCharacter(character)
  const skiruSheet = resolveCharacterSkiruSheet(
    character.skiruSheet as Record<string, number> | undefined,
    baseStats,
  )

  let nextSkiruSheet = skiruSheet
  if (nextClass) {
    nextSkiruSheet = syncSkiruSheetForSocialClass(skiruSheet, nextClass)
  } else if (input.socialClass === null) {
    nextSkiruSheet = clearSkiruSocialClassGates(skiruSheet)
  }

  const validation = validateSkiruSheet(nextSkiruSheet)
  if (!validation.ok) {
    throw new Error(validation.errors.join(' '))
  }

  const nextSubclassSheet = input.resetSubclasses
    ? {}
    : normalizeSubclassSheet(character.socialSubclassSheet as Record<string, boolean> | undefined)

  const chosenAt =
    nextClass && nextClass !== character.socialClass
      ? new Date()
      : character.socialClassChosenAt

  await db
    .update(characters)
    .set({
      socialClass: nextClass,
      socialClassChosenAt: nextClass ? chosenAt : null,
      socialSubclassSheet: nextSubclassSheet,
      skiruSheet: nextSkiruSheet,
    })
    .where(eq(characters.id, character.id))

  return getSocialClassState(character.userId)
}

function displayName(char: { name: string; surname?: string | null }): string {
  return [char.name, char.surname].filter(Boolean).join(' ')
}

function resolveCraftRoom(characterId: string, roomId?: string): string | null {
  if (roomId?.trim() && isValidRoom(roomId.trim())) return roomId.trim()
  return presence.getRoomForCharacter(characterId)
}

export async function listCharacterBlueprints(userId: string) {
  const character = await loadCharacterForUser(userId)
  if (!character) return null

  const socialClass = (character.socialClass as SocialClassId | null) ?? null
  if (!socialClass) {
    return { socialClass: null, tag: null, blueprints: [] as const }
  }

  const subclassSheet = normalizeSubclassSheet(
    character.socialSubclassSheet as Record<string, boolean> | undefined,
  )
  const tag = getActiveSocialClassTag(socialClass)

  const rows = await db.query.socialBlueprints.findMany({
    where: eq(socialBlueprints.classId, socialClass),
    orderBy: [asc(socialBlueprints.kind), asc(socialBlueprints.name)],
  })

  const blueprints = rows
    .filter((row) => row.isActive && canAccessSocialBlueprint(socialClass, subclassSheet, row.id))
    .map((row) => ({
      id: row.id,
      tag: row.tag,
      kind: row.kind,
      name: row.name,
      description: row.description,
      materials: row.materials ?? [],
      gatherUnits: row.gatherUnits,
      weightOrPower: row.weightOrPower,
      outputCatalogKey: row.outputCatalogKey,
      craftable: row.outputCatalogKey != null,
      isProcedure: row.isProcedure,
      pathConstraint: row.pathConstraint,
    }))

  return { socialClass, tag, blueprints }
}

export async function craftFromBlueprint(
  userId: string,
  input: { blueprintId: string; consecratedPlace?: boolean; roomId?: string },
) {
  const character = await db.query.characters.findFirst({
    where: eq(characters.userId, userId),
    columns: {
      id: true,
      name: true,
      surname: true,
      socialClass: true,
      socialSubclassSheet: true,
    },
  })
  if (!character) throw new Error('Personaggio non trovato.')

  const socialClass = (character.socialClass as SocialClassId | null) ?? null
  if (!socialClass) throw new Error('Scegli prima una classe sociale.')

  const subclassSheet = normalizeSubclassSheet(
    character.socialSubclassSheet as Record<string, boolean> | undefined,
  )

  const dbRow = await db.query.socialBlueprints.findFirst({
    where: eq(socialBlueprints.id, input.blueprintId),
  })
  if (!dbRow?.isActive) throw new Error('Blueprint non disponibile.')

  const blueprint = getSocialBlueprint(input.blueprintId)
  if (!blueprint || blueprint.classId !== socialClass) {
    throw new Error('Blueprint non valido per la tua classe.')
  }
  if (!canAccessSocialBlueprint(socialClass, subclassSheet, input.blueprintId)) {
    throw new Error('Blueprint non sbloccato nel tuo albero sottoclassi.')
  }
  if (!isCraftableBlueprint(blueprint)) {
    throw new Error('Questo blueprint non produce oggetti tramite craft generico.')
  }

  if (blueprint.kind === 'rite') {
    const check = validateCraftOfuda(
      blueprint,
      {
        maxPower: resolveDailyLimitFromSubclasses('shisai', subclassSheet, 'ofudaPowerMax'),
        maxActive: resolveDailyLimitFromSubclasses('shisai', subclassSheet, 'ofudaActiveMax'),
        activeCount: 0,
      },
      { subclassSheet, consecratedPlace: input.consecratedPlace },
    )
    if (!check.ok) throw new Error(check.reason ?? 'Fabbricazione Ofuda non valida.')
  }

  const materials = blueprint.materials ?? []
  if (materials.length === 0) throw new Error('Blueprint senza materiali.')

  await consumeMaterialsByCatalogKey(character.id, materials)

  const outputKey = socialBlueprintOutputCatalogKey(blueprint)!
  if (dbRow.outputCatalogKey && dbRow.outputCatalogKey !== outputKey) {
    throw new Error('Catalogo output non allineato — esegui seed-social-blueprints.')
  }

  await addItemByCatalogKey(character.id, outputKey, 1, {
    craftedByCharacterId: character.id,
    craftedByName: displayName(character),
    blueprintId: blueprint.id,
    origin: 'craftato',
  })
  broadcastInventoryUpdated(character.id)

  const resolvedRoom = resolveCraftRoom(character.id, input.roomId)
  const line = `[${getActiveSocialClassTag(socialClass)?.replace('#', '') ?? 'Shakai'}] ${displayName(character)} crafta «${blueprint.name}»`
  if (resolvedRoom && isValidRoom(resolvedRoom)) {
    await insertMessage(resolvedRoom, character.id, line, null, false, null, null, false, true)
  }

  return {
    blueprintId: blueprint.id,
    outputCatalogKey: outputKey,
    name: blueprint.name,
    loggedToRoom: resolvedRoom,
  }
}
