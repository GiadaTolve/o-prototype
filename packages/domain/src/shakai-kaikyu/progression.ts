import { getSocialSubclassDef, getSocialSubclassesForClass } from './catalog'
import type { SocialClassId, SocialSubclassSheet } from './types'

export interface SocialSubclassUnlockCheck {
  ok: boolean
  errors: string[]
}

function hasUnlocked(sheet: SocialSubclassSheet, id: string): boolean {
  return sheet[id] === true
}

function getKeystoneForClass(classId: SocialClassId) {
  return getSocialSubclassesForClass(classId).find((s) => s.role === 'keystone')
}

function getPathsForClass(classId: SocialClassId) {
  return getSocialSubclassesForClass(classId).filter((s) => s.role === 'path')
}

/** Capstone richiede keystone + almeno un sentiero della stessa classe. */
export function canUnlockSocialSubclass(
  socialClass: SocialClassId | null,
  sheet: SocialSubclassSheet,
  subclassId: string,
): SocialSubclassUnlockCheck {
  const def = getSocialSubclassDef(subclassId)
  const errors: string[] = []

  if (!def) {
    return { ok: false, errors: ['Sottoclasse sconosciuta.'] }
  }

  if (!socialClass) {
    errors.push('Serve una classe sociale assegnata.')
    return { ok: false, errors }
  }

  if (def.classId !== socialClass) {
    errors.push('La sottoclasse non appartiene alla tua classe sociale.')
  }

  if (hasUnlocked(sheet, subclassId)) {
    errors.push('Sottoclasse già sbloccata.')
  }

  if (def.role === 'path' || def.role === 'capstone') {
    const keystone = getKeystoneForClass(def.classId)
    if (keystone && !hasUnlocked(sheet, keystone.id)) {
      errors.push(`Richiede ${keystone.nameRomaji} (${keystone.labelItalian}).`)
    }
  }

  if (def.role === 'path') {
    const paths = getPathsForClass(def.classId)
    const otherPathUnlocked = paths.some((p) => p.id !== subclassId && hasUnlocked(sheet, p.id))
    if (otherPathUnlocked) {
      errors.push('È consentito un solo sentiero per classe.')
    }
  }

  if (def.role === 'capstone') {
    const paths = getPathsForClass(def.classId)
    const hasPath = paths.some((p) => hasUnlocked(sheet, p.id))
    if (!hasPath) {
      errors.push('Richiede almeno un sentiero sbloccato (10 XP).')
    }
  }

  for (const prereq of def.prerequisiteIds ?? []) {
    if (!hasUnlocked(sheet, prereq)) {
      const p = getSocialSubclassDef(prereq)
      errors.push(`Richiede ${p?.nameRomaji ?? prereq}.`)
    }
  }

  return { ok: errors.length === 0, errors }
}

/** Limite giornaliero effettivo dalla sottoclasse più permissiva sbloccata (capstone > path > keystone). */
export function resolveDailyLimitFromSubclasses(
  classId: SocialClassId,
  sheet: SocialSubclassSheet,
  key: 'dailyHealHpMax' | 'dailyIntegrityMax' | 'dailyGatherMax' | 'pactWeightMax' | 'pactActiveMax' | 'ofudaPowerMax' | 'ofudaActiveMax',
): number {
  const unlocked = getSocialSubclassesForClass(classId).filter((s) => hasUnlocked(sheet, s.id))
  let max = 0
  for (const s of unlocked) {
    const v = s[key]
    if (typeof v === 'number' && v > max) max = v
  }
  return max
}
