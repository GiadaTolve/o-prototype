import { SHAKAI_KAIKYU_CLASS_SKIRU_IDS } from '../skiru/progression'
import type { SkiruSheet } from '../skiru/types'
import { SOCIAL_CLASSES, getSocialClassDef, getSocialSubclassDef, getSocialSubclassesForClass } from './catalog'
import { canUnlockSocialSubclass, resolveDailyLimitFromSubclasses } from './progression'
import type { SocialClassId, SocialSubclassSheet } from './types'

export interface SocialClassAssignCheck {
  ok: boolean
  errors: string[]
}

export interface SocialDailyUsage {
  healHpUsed: number
  integrityUsed: number
  gatherUsed: number
  pactWeightUsed: number
  ofudaPowerUsed: number
}

export const EMPTY_SOCIAL_DAILY_USAGE: SocialDailyUsage = {
  healHpUsed: 0,
  integrityUsed: 0,
  gatherUsed: 0,
  pactWeightUsed: 0,
  ofudaPowerUsed: 0,
}

export function isSocialClassId(id: string): id is SocialClassId {
  return SOCIAL_CLASSES.some((c) => c.id === id)
}

/** Validazione scelta classe unica (lato giocatore). */
export function assignSocialClass(
  currentClass: SocialClassId | null | undefined,
  classId: string,
): SocialClassAssignCheck {
  if (!isSocialClassId(classId)) {
    return { ok: false, errors: ['Classe sociale non valida.'] }
  }
  if (currentClass) {
    return {
      ok: false,
      errors: ['Classe sociale già scelta. Contatta la moderazione per un cambio.'],
    }
  }
  return { ok: true, errors: [] }
}

/** Allinea il gate Skiru (1 pt sulla classe scelta, 0 sulle altre). */
export function syncSkiruSheetForSocialClass(sheet: SkiruSheet, classId: SocialClassId): SkiruSheet {
  const next = { ...sheet }
  for (const id of SHAKAI_KAIKYU_CLASS_SKIRU_IDS) {
    next[id] = id === classId ? 1 : 0
  }
  return next
}

/** Azzera i gate classe sociale su Skiru (moderazione / reset). */
export function clearSkiruSocialClassGates(sheet: SkiruSheet): SkiruSheet {
  const next = { ...sheet }
  for (const id of SHAKAI_KAIKYU_CLASS_SKIRU_IDS) {
    next[id] = 0
  }
  return next
}

/** Tag invisibile (#Medico, …) derivato dalla classe attiva. */
export function getActiveSocialClassTag(
  socialClass: SocialClassId | null | undefined,
): string | null {
  if (!socialClass) return null
  return getSocialClassDef(socialClass)?.tag ?? null
}

export interface SocialSubclassUnlockResult {
  ok: boolean
  errors: string[]
  xpCost: number
  nextSheet?: SocialSubclassSheet
  nextExpSpendable?: number
}

/** Sblocco sottoclasse con spesa XP (`experienceSpendable`). */
export function unlockSocialSubclass(
  socialClass: SocialClassId | null,
  sheet: SocialSubclassSheet,
  subclassId: string,
  expSpendable: number,
): SocialSubclassUnlockResult {
  const check = canUnlockSocialSubclass(socialClass, sheet, subclassId)
  if (!check.ok) {
    return { ok: false, errors: check.errors, xpCost: 0 }
  }

  const def = getSocialSubclassDef(subclassId)
  if (!def) {
    return { ok: false, errors: ['Sottoclasse sconosciuta.'], xpCost: 0 }
  }

  if (expSpendable < def.xpCost) {
    return {
      ok: false,
      errors: [`Servono ${def.xpCost} XP spendibili (disponibili: ${expSpendable}).`],
      xpCost: def.xpCost,
    }
  }

  return {
    ok: true,
    errors: [],
    xpCost: def.xpCost,
    nextSheet: { ...sheet, [subclassId]: true },
    nextExpSpendable: expSpendable - def.xpCost,
  }
}

export function getRemainingDailyBudget(
  classId: SocialClassId,
  sheet: SocialSubclassSheet,
  usage: SocialDailyUsage,
) {
  const maxHeal = resolveDailyLimitFromSubclasses(classId, sheet, 'dailyHealHpMax')
  const maxIntegrity = resolveDailyLimitFromSubclasses(classId, sheet, 'dailyIntegrityMax')
  const maxGather = resolveDailyLimitFromSubclasses(classId, sheet, 'dailyGatherMax')
  const maxPactWeight = resolveDailyLimitFromSubclasses(classId, sheet, 'pactWeightMax')
  const maxPactActive = resolveDailyLimitFromSubclasses(classId, sheet, 'pactActiveMax')
  const maxOfudaPower = resolveDailyLimitFromSubclasses(classId, sheet, 'ofudaPowerMax')
  const maxOfudaActive = resolveDailyLimitFromSubclasses(classId, sheet, 'ofudaActiveMax')

  return {
    healHp: {
      max: maxHeal,
      used: usage.healHpUsed,
      remaining: Math.max(0, maxHeal - usage.healHpUsed),
    },
    integrity: {
      max: maxIntegrity,
      used: usage.integrityUsed,
      remaining: Math.max(0, maxIntegrity - usage.integrityUsed),
    },
    gather: {
      max: maxGather,
      used: usage.gatherUsed,
      remaining: Math.max(0, maxGather - usage.gatherUsed),
    },
    pactWeight: {
      max: maxPactWeight,
      used: usage.pactWeightUsed,
      remaining: Math.max(0, maxPactWeight - usage.pactWeightUsed),
    },
    pactActive: { max: maxPactActive, used: 0, remaining: maxPactActive },
    ofudaPower: {
      max: maxOfudaPower,
      used: usage.ofudaPowerUsed,
      remaining: Math.max(0, maxOfudaPower - usage.ofudaPowerUsed),
    },
    ofudaActive: { max: maxOfudaActive, used: 0, remaining: maxOfudaActive },
  }
}

export function buildSocialSubclassTree(
  socialClass: SocialClassId | null,
  sheet: SocialSubclassSheet,
  expSpendable: number,
) {
  if (!socialClass) return []

  return getSocialSubclassesForClass(socialClass).map((def) => {
    const unlocked = sheet[def.id] === true
    const check = unlocked
      ? { ok: false, errors: ['Sottoclasse già sbloccata.'] }
      : canUnlockSocialSubclass(socialClass, sheet, def.id)
    const canAfford = expSpendable >= def.xpCost

    return {
      id: def.id,
      role: def.role,
      nameRomaji: def.nameRomaji,
      nameJa: def.nameJa,
      labelItalian: def.labelItalian,
      xpCost: def.xpCost,
      description: def.description,
      tradeoffs: def.tradeoffs,
      unlocked,
      canUnlock: check.ok && canAfford,
      unlockErrors:
        check.ok && !canAfford
          ? [`Servono ${def.xpCost} XP spendibili (disponibili: ${expSpendable}).`]
          : check.errors,
    }
  })
}
