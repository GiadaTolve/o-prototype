import { and, eq } from 'drizzle-orm'
import {
  SOCIAL_CLASSES,
  assignSocialClass,
  buildSocialSubclassTree,
  getActiveSocialClassTag,
  getRemainingDailyBudget,
  getSocialToolUx,
  isSocialClassId,
  listAccessibleSocialBlueprints,
  syncSkiruSheetForSocialClass,
  unlockSocialSubclass,
  clearSkiruSocialClassGates,
  EMPTY_SOCIAL_DAILY_USAGE,
  type SocialDailyUsage,
} from '@domain/shakai-kaikyu'
import type { SocialClassId, SocialSubclassSheet } from '@domain/shakai-kaikyu/types'
import type { BaseStats } from '@domain/stats/calculator'
import { validateSkiruSheet } from '@domain/skiru'
import { db } from '../../plugins/db'
import { characters, socialClassDailyUsage } from '../../db/schema'
import { resolveCharacterSkiruSheet } from '../characters/skiru-sheet'

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
