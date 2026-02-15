import { Rem, canSpend, createRem } from '../types/money'

/**
 * Risultato di una transazione economica
 */
export type TransactionResult =
  | {
      ok: true
      newBalance: Rem
    }
  | {
      ok: false
      reason: 'INSUFFICIENT_FUNDS'
    }

/**
 * Applica una spesa semplice
 */
export function spend(
  balance: Rem,
  amount: Rem
): TransactionResult {
  if (!canSpend(balance, amount)) {
    return {
      ok: false,
      reason: 'INSUFFICIENT_FUNDS'
    }
  }

  const newBalance = createRem(balance - amount)

  return {
    ok: true,
    newBalance
  }
}

/**
 * Risultato di un'entrata economica
 */
export type EarnResult = {
    ok: true
    newBalance: Rem
  }
  
  /**
   * Applica un'entrata (stipendio, reward, bonifico in entrata)
   */
  export function earn(
    balance: Rem,
    amount: Rem
  ): EarnResult {
    const newBalance = createRem(balance + amount)
  
    return {
      ok: true,
      newBalance
    }
  }
  