/**
 * Meccanica Tōrō — Tōka-dō
 * Passiva «Tōrō - Lanterna Incisa»: arma psichica, tag `toro`, protezione da manipolazione a contatto.
 */

export const TORO_PASSIVE_POOL_ID = 'toro-lanterna-incisa'
export const TORO_WEAPON_TAG = 'toro'
/** Jigoka di mantenimento passiva Tōrō (narrativo / legacy). */
export const TORO_MAINTENANCE_JIGOKA = 2

export type ToroStateInput = {
  /** Passiva Tōrō equipaggiata o posseduta attiva in loadout. */
  hasToroPassiveEquipped: boolean
  /** Narrativo: mano a contatto con l'arma (sigillo Tōrō). */
  weaponInContact: boolean
  /** Tag attivi nel contesto azione (es. da chat `[toro]` o weaponTagsOnLaunch). */
  weaponTagsInContext?: readonly string[]
}

export type ToroState = {
  active: boolean
  weaponTagInContext: boolean
  /** Terzi non possono bersagliare con [Manipolazione]/[Trasformazione] a contatto. */
  blocksManipulationTargeting: boolean
  /** Canale per Waza Tōka-dō tramite Tōrō. */
  allowsTokaChannel: boolean
  maintenanceJigoka: number
  styleId: 'toka'
}

export function resolveToroState(input: ToroStateInput): ToroState {
  const tags = new Set((input.weaponTagsInContext ?? []).map((t) => t.trim().toLowerCase()))
  const weaponTagInContext = tags.has(TORO_WEAPON_TAG)
  const active = input.hasToroPassiveEquipped && input.weaponInContact
  const allowsTokaChannel = active || (input.hasToroPassiveEquipped && weaponTagInContext)

  return {
    active,
    weaponTagInContext,
    blocksManipulationTargeting: active,
    allowsTokaChannel,
    maintenanceJigoka: active ? TORO_MAINTENANCE_JIGOKA : 0,
    styleId: 'toka',
  }
}

export function hasToroPoolId(poolId: string | null | undefined): boolean {
  return poolId === TORO_PASSIVE_POOL_ID
}

export function hasToroFromSkillMeta(meta: {
  poolId?: string | null
  name?: string | null
}): boolean {
  if (hasToroPoolId(meta.poolId)) return true
  const n = (meta.name ?? '').toLowerCase()
  return n.includes('tōrō') || n.includes('toro') && n.includes('lanterna')
}

/** Trasforma categoria [A contatto] → [Proiettile] via Michishirube (passiva collegata). */
export function toroContactToProjectileEnabled(toro: ToroState, hasMichishirube: boolean): boolean {
  return toro.allowsTokaChannel && hasMichishirube
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Tag chat [Tōrō] / [toro] — stato lanterna Tōka-dō. */
export function formatToroTagsInText(text: string): string {
  return text.replace(/\[(Tōrō|Toro|tōrō|toro)\]/gi, () => {
    return `<span class="toro-tag" title="Tōrō — lanterna incisa, canale Tōka-dō">${escapeHtml('Tōrō')}</span>`
  })
}
