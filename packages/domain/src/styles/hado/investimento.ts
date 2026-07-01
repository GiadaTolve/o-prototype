/** Tōshi (投資) — Investimento Energetico · Hadō-dō (Shakkin companion: debito-shakkin.ts). */

export const INVESTIMENTO_DURATION_TURNS = 3
export const INVESTIMENTO_OPEN_CS_COST = 2
export const INVESTIMENTO_DAMAGE_PER_CS = 2
export const INVESTIMENTO_RANGE_M_PER_CS = 1

export type InvestimentoMeta = {
  hadoInvestimentoActive?: boolean
  hadoInvestimentoTurnsLeft?: number
  hadoInvestimentoPoolCs?: number
  /** True se in questo turno è stato versato almeno 1 CS nell'investimento. */
  hadoInvestimentoDepositedThisTurn?: boolean
  /** Bonus in attesa di applicazione alla prossima waza dopo riscossione. */
  hadoInvestimentoPayout?: {
    poolCs: number
    flatDamage: number
    rangeBonusM: number
  } | null
}

export type InvestimentoState = {
  active: boolean
  turnsLeft: number
  poolCs: number
  depositedThisTurn: boolean
  payoutPending: InvestimentoMeta['hadoInvestimentoPayout']
}

export function readInvestimentoFromMeta(meta: InvestimentoMeta | null | undefined): InvestimentoState {
  const active = meta?.hadoInvestimentoActive === true
  return {
    active,
    turnsLeft: active ? Math.max(0, meta?.hadoInvestimentoTurnsLeft ?? 0) : 0,
    poolCs: active ? Math.max(0, meta?.hadoInvestimentoPoolCs ?? 0) : 0,
    depositedThisTurn: meta?.hadoInvestimentoDepositedThisTurn === true,
    payoutPending: meta?.hadoInvestimentoPayout ?? null,
  }
}

export function openInvestimento(meta: InvestimentoMeta): InvestimentoMeta {
  return {
    ...meta,
    hadoInvestimentoActive: true,
    hadoInvestimentoTurnsLeft: INVESTIMENTO_DURATION_TURNS,
    hadoInvestimentoPoolCs: 0,
    hadoInvestimentoDepositedThisTurn: false,
    hadoInvestimentoPayout: null,
  }
}

export function depositInvestimento(
  meta: InvestimentoMeta,
  amount: number,
): { meta: InvestimentoMeta; deposited: number; error?: string } {
  const state = readInvestimentoFromMeta(meta)
  if (!state.active) {
    return { meta, deposited: 0, error: 'Investimento non attivo' }
  }
  const n = Math.max(0, Math.floor(amount))
  if (n <= 0) return { meta, deposited: 0, error: 'Importo non valido' }
  return {
    meta: {
      ...meta,
      hadoInvestimentoPoolCs: state.poolCs + n,
      hadoInvestimentoDepositedThisTurn: true,
    },
    deposited: n,
  }
}

export function cashOutInvestimento(meta: InvestimentoMeta): {
  meta: InvestimentoMeta
  poolCs: number
  flatDamage: number
  rangeBonusM: number
} {
  const state = readInvestimentoFromMeta(meta)
  const poolCs = state.poolCs
  const flatDamage = poolCs * INVESTIMENTO_DAMAGE_PER_CS
  const rangeBonusM = poolCs * INVESTIMENTO_RANGE_M_PER_CS
  return {
    meta: {
      ...meta,
      hadoInvestimentoActive: false,
      hadoInvestimentoTurnsLeft: 0,
      hadoInvestimentoPoolCs: 0,
      hadoInvestimentoDepositedThisTurn: false,
      hadoInvestimentoPayout: poolCs > 0 ? { poolCs, flatDamage, rangeBonusM } : null,
    },
    poolCs,
    flatDamage,
    rangeBonusM,
  }
}

/** Fine turno PG: perde investimento se non ha versato; altrimenti decrementa durata. */
export function tickInvestimentoEndOfTurn(meta: InvestimentoMeta): {
  meta: InvestimentoMeta
  lost: boolean
  expired: boolean
} {
  const state = readInvestimentoFromMeta(meta)
  if (!state.active) {
    return { meta, lost: false, expired: false }
  }

  if (!state.depositedThisTurn) {
    return {
      meta: {
        ...meta,
        hadoInvestimentoActive: false,
        hadoInvestimentoTurnsLeft: 0,
        hadoInvestimentoPoolCs: 0,
        hadoInvestimentoDepositedThisTurn: false,
      },
      lost: true,
      expired: false,
    }
  }

  const turnsLeft = state.turnsLeft - 1
  if (turnsLeft <= 0) {
    return {
      meta: {
        ...meta,
        hadoInvestimentoActive: false,
        hadoInvestimentoTurnsLeft: 0,
        hadoInvestimentoDepositedThisTurn: false,
      },
      lost: false,
      expired: true,
    }
  }

  return {
    meta: {
      ...meta,
      hadoInvestimentoTurnsLeft: turnsLeft,
      hadoInvestimentoDepositedThisTurn: false,
    },
    lost: false,
    expired: false,
  }
}

export function clearInvestimentoPayout(meta: InvestimentoMeta): InvestimentoMeta {
  return { ...meta, hadoInvestimentoPayout: null }
}
