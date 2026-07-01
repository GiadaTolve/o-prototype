/** Shakkin (借金) — Indebitamento · status Debito Hadō (distinto da Debitore Madoshō). */

export const SHAKKIN_INITIAL_STACKS = 2
export const SHAKKIN_MAX_STACKS = 6
export const SHAKKIN_DURATION_TURNS = 3
export const SHAKKIN_INTEREST_PER_TURN = 1
export const SHAKKIN_DAMAGE_PER_STACK = 5

export type ShakkinDebtEntry = {
  debtorCharacterId: string
  stacks: number
  turnsLeft: number
}

export type ShakkinMeta = {
  hadoDebts?: ShakkinDebtEntry[]
}

export function readShakkinDebts(meta: ShakkinMeta | null | undefined): ShakkinDebtEntry[] {
  return Array.isArray(meta?.hadoDebts) ? [...meta.hadoDebts] : []
}

export function openShakkinDebt(
  meta: ShakkinMeta,
  debtorCharacterId: string,
): { meta: ShakkinMeta; created: boolean; error?: string } {
  const debts = readShakkinDebts(meta)
  if (debts.some((d) => d.debtorCharacterId === debtorCharacterId)) {
    return { meta, created: false, error: 'Debito già attivo su questo bersaglio' }
  }
  return {
    meta: {
      ...meta,
      hadoDebts: [
        ...debts,
        {
          debtorCharacterId,
          stacks: SHAKKIN_INITIAL_STACKS,
          turnsLeft: SHAKKIN_DURATION_TURNS,
        },
      ],
    },
    created: true,
  }
}

export function applyShakkinInterest(meta: ShakkinMeta): {
  meta: ShakkinMeta
  updates: Array<{ debtorCharacterId: string; stacks: number }>
  expirations: Array<{ debtorCharacterId: string; stacks: number; damage: number }>
} {
  const debts = readShakkinDebts(meta)
  const updates: Array<{ debtorCharacterId: string; stacks: number }> = []
  const expirations: Array<{ debtorCharacterId: string; stacks: number; damage: number }> = []
  const nextDebts: ShakkinDebtEntry[] = []

  for (const debt of debts) {
    const stacks = Math.min(
      SHAKKIN_MAX_STACKS,
      debt.stacks + SHAKKIN_INTEREST_PER_TURN,
    )
    const turnsLeft = debt.turnsLeft - 1
    updates.push({ debtorCharacterId: debt.debtorCharacterId, stacks })

    if (turnsLeft <= 0) {
      expirations.push({
        debtorCharacterId: debt.debtorCharacterId,
        stacks,
        damage: stacks * SHAKKIN_DAMAGE_PER_STACK,
      })
    } else {
      nextDebts.push({ ...debt, stacks, turnsLeft })
    }
  }

  return {
    meta: { ...meta, hadoDebts: nextDebts },
    updates,
    expirations,
  }
}

export function collectShakkinDebts(
  meta: ShakkinMeta,
  debtorCharacterId?: string,
): {
  meta: ShakkinMeta
  collections: Array<{ debtorCharacterId: string; stacks: number; damage: number }>
} {
  const debts = readShakkinDebts(meta)
  const collections: Array<{ debtorCharacterId: string; stacks: number; damage: number }> = []
  const remaining = debts.filter((d) => {
    if (debtorCharacterId && d.debtorCharacterId !== debtorCharacterId) return true
    collections.push({
      debtorCharacterId: d.debtorCharacterId,
      stacks: d.stacks,
      damage: d.stacks * SHAKKIN_DAMAGE_PER_STACK,
    })
    return false
  })
  return {
    meta: { ...meta, hadoDebts: remaining },
    collections,
  }
}

export function repayShakkinDebt(
  meta: ShakkinMeta,
  debtorCharacterId: string,
  amount = 1,
): { meta: ShakkinMeta; newStacks: number; cleared: boolean } {
  const debts = readShakkinDebts(meta)
  const idx = debts.findIndex((d) => d.debtorCharacterId === debtorCharacterId)
  if (idx === -1) {
    return { meta, newStacks: 0, cleared: false }
  }
  const nextStacks = Math.max(0, debts[idx].stacks - Math.max(1, Math.floor(amount)))
  if (nextStacks <= 0) {
    debts.splice(idx, 1)
    return {
      meta: { ...meta, hadoDebts: debts },
      newStacks: 0,
      cleared: true,
    }
  }
  debts[idx] = { ...debts[idx], stacks: nextStacks }
  return {
    meta: { ...meta, hadoDebts: debts },
    newStacks: nextStacks,
    cleared: false,
  }
}

export function removeDebtsForDebtor(meta: ShakkinMeta, debtorCharacterId: string): ShakkinMeta {
  return {
    ...meta,
    hadoDebts: readShakkinDebts(meta).filter((d) => d.debtorCharacterId !== debtorCharacterId),
  }
}
