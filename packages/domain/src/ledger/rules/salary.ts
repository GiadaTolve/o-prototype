// packages/domain/src/ledger/rules/salary.ts

import { Rem, createRem } from '../../types/money'

/* ============================
   TIPI
============================ */

export type SalarySource =
  | 'ORDER'
  | 'GUILD'
  | 'SYSTEM'
  | 'EVENT'

export type SalaryMode =
  | 'DAILY'
  | 'MONTHLY'

export type UserBanState =
  | 'NONE'
  | 'SHADOW'
  | 'FULL'

export interface SalaryContext {
  currentBalance: Rem
  baseSalary: Rem
  mode: SalaryMode
  banState: UserBanState

  // DAILY_SALARY (camera accademia)
  dailyRent?: Rem
}

/* ============================
   RISULTATO
============================ */

export type SalaryResult =
  | {
      ok: true
      amount: Rem
      source: SalarySource
      reason: string
    }
  | {
      ok: false
      reason:
        | 'FULL_BAN'
        | 'INSUFFICIENT_DAILY_SALARY'
    }

/* ============================
   REGOLA
============================ */

export function calculateSalary(
  ctx: SalaryContext
): SalaryResult {

  // ❌ FULL BAN: niente stipendio
  if (ctx.banState === 'FULL') {
    return {
      ok: false,
      reason: 'FULL_BAN'
    }
  }

  // 🏫 DAILY SALARY (camera accademia)
  if (ctx.mode === 'DAILY') {
    const rent = ctx.dailyRent ?? createRem(0)

    // stipendio netto = base - affitto
    const net = ctx.baseSalary - rent

    // mai negativo
    if (net <= 0) {
      return {
        ok: false,
        reason: 'INSUFFICIENT_DAILY_SALARY'
      }
    }

    return {
      ok: true,
      amount: createRem(net),
      source: 'ORDER',
      reason: 'Daily salary after academy rent'
    }
  }

  // 💼 MONTHLY / STANDARD
  return {
    ok: true,
    amount: ctx.baseSalary,
    source: 'ORDER',
    reason: 'Standard salary'
  }
}
