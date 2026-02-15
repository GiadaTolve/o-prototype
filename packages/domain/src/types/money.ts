// type
export type Rem = number & { readonly __brand: 'Rem' }

// costruttore esplicito
export function createRem(value: number): Rem {
  if (value < 0) {
    throw new Error('REM cannot be negative')
  }
  return value as Rem
}

/**
 * Controlla se una spesa è valida
 */
export function canSpend(balance: Rem, amount: Rem): boolean {
  return balance >= amount
}
