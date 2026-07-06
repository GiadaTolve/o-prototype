/** Slot passivi Waza — ROADMAP.md §6. */

export const PASSIVE_SLOT_BASE = 2
export const PASSIVE_SLOT_MAX = 6

/** Costo EXP per sbloccare lo slot N (3° → 50, 4° → 100, …). */
export const PASSIVE_SLOT_UNLOCK_COSTS: Readonly<Record<number, number>> = {
  3: 50,
  4: 100,
  5: 200,
  6: 400,
}

export type PassiveSlotsUiMeta = {
  passiveSlotsUnlocked?: number
  /** skillId per slot (lunghezza ≤ slotsUnlocked). */
  equippedPassiveIds?: string[]
}

export function normalizePassiveSlotsUnlocked(value: number | undefined | null): number {
  const n = value ?? PASSIVE_SLOT_BASE
  return Math.max(PASSIVE_SLOT_BASE, Math.min(PASSIVE_SLOT_MAX, n))
}

export function getNextPassiveSlotToUnlock(slotsUnlocked: number): number | null {
  const current = normalizePassiveSlotsUnlocked(slotsUnlocked)
  if (current >= PASSIVE_SLOT_MAX) return null
  return current + 1
}

export function getPassiveSlotUnlockCost(slotNumber: number): number | null {
  return PASSIVE_SLOT_UNLOCK_COSTS[slotNumber] ?? null
}

export function getNextPassiveSlotUnlockCost(slotsUnlocked: number): number | null {
  const next = getNextPassiveSlotToUnlock(slotsUnlocked)
  if (next == null) return null
  return getPassiveSlotUnlockCost(next)
}

export function canUnlockNextPassiveSlot(
  slotsUnlocked: number,
  expSpendable: number,
): boolean {
  const cost = getNextPassiveSlotUnlockCost(slotsUnlocked)
  return cost != null && expSpendable >= cost
}

export function validateEquippedPassiveIds(
  equippedIds: string[],
  slotsUnlocked: number,
  ownedPassiveSkillIds: ReadonlySet<string>,
): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  const slots = normalizePassiveSlotsUnlocked(slotsUnlocked)

  if (equippedIds.length > slots) {
    errors.push(`Massimo ${slots} slot passivi equipaggiabili.`)
  }

  const seen = new Set<string>()
  for (let i = 0; i < equippedIds.length; i++) {
    const id = equippedIds[i]?.trim()
    if (!id) continue
    if (seen.has(id)) {
      errors.push(`Skill duplicata nello slot ${i + 1}.`)
      continue
    }
    seen.add(id)
    if (!ownedPassiveSkillIds.has(id)) {
      errors.push(`Slot ${i + 1}: Waza passiva non posseduta o non valida.`)
    }
  }

  return { ok: errors.length === 0, errors }
}

export function readPassiveSlotsMeta(meta: PassiveSlotsUiMeta | null | undefined): {
  slotsUnlocked: number
  equippedPassiveIds: string[]
} {
  const slotsUnlocked = normalizePassiveSlotsUnlocked(meta?.passiveSlotsUnlocked)
  const raw = meta?.equippedPassiveIds ?? []
  const equippedPassiveIds = Array.from({ length: slotsUnlocked }, (_, i) => {
    const id = raw[i]
    return typeof id === 'string' ? id.trim() : ''
  })
  return { slotsUnlocked, equippedPassiveIds }
}
