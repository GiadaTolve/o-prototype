import { getSocialSubclassesForClass } from './catalog'
import { getSocialBlueprint, SOCIAL_BLUEPRINTS } from './blueprint-catalog'
import { resolveDailyLimitFromSubclasses } from './progression'
import type { SocialBlueprintDef, SocialClassId, SocialSubclassSheet } from './types'

function isUnlocked(sheet: SocialSubclassSheet, id: string): boolean {
  return sheet[id] === true
}

function getCapstoneId(classId: SocialClassId): string | undefined {
  return getSocialSubclassesForClass(classId).find((s) => s.role === 'capstone')?.id
}

function hasCapstone(classId: SocialClassId, sheet: SocialSubclassSheet): boolean {
  const capstoneId = getCapstoneId(classId)
  return capstoneId != null && isUnlocked(sheet, capstoneId)
}

function meetsNumericCap(
  classId: SocialClassId,
  sheet: SocialSubclassSheet,
  blueprint: SocialBlueprintDef,
): boolean {
  const power = blueprint.weightOrPower
  if (power == null) return true

  if (blueprint.kind === 'pact_template') {
    if (power === 5) return true
    return resolveDailyLimitFromSubclasses(classId, sheet, 'pactWeightMax') >= power
  }
  if (blueprint.kind === 'rite') {
    if (power === 5) return true
    return resolveDailyLimitFromSubclasses(classId, sheet, 'ofudaPowerMax') >= power
  }
  return true
}

/**
 * Blueprint visibile se la sottoclasse richiesta è sbloccata, oppure se il capstone
 * è attivo (sblocca tutti i blueprint craft/gather della classe — Q10).
 * Patti e riti rispettano anche il cap numerico (Peso/Potere) della sottoclasse.
 */
export function canAccessSocialBlueprint(
  classId: SocialClassId | null,
  sheet: SocialSubclassSheet,
  blueprintId: string,
): boolean {
  const blueprint = getSocialBlueprint(blueprintId)
  if (!blueprint || !classId || blueprint.classId !== classId) return false

  if (blueprint.exclusiveSubclassIds?.length) {
    if (!blueprint.exclusiveSubclassIds.some((id) => isUnlocked(sheet, id))) return false
    return meetsNumericCap(classId, sheet, blueprint)
  }

  if (blueprint.kind === 'pact_template' || blueprint.kind === 'rite') {
    return meetsNumericCap(classId, sheet, blueprint)
  }

  if (isUnlocked(sheet, blueprint.requiredSubclassId)) return true
  return hasCapstone(classId, sheet)
}

export function listAccessibleSocialBlueprints(
  classId: SocialClassId | null,
  sheet: SocialSubclassSheet,
): SocialBlueprintDef[] {
  if (!classId) return []
  return SOCIAL_BLUEPRINTS.filter((b) => b.classId === classId && canAccessSocialBlueprint(classId, sheet, b.id))
}
