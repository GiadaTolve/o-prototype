export const ATTACK_PREFIX = '[ATTACCO]'

export type AttackCardData = {
  readonly weapon: string
  readonly formula: string
  readonly total: number
  readonly kind: 'ranged' | 'melee'
  readonly ammoNote?: string
  /** Riga inventario dell'arma impugnata — server applica −1 integrità. */
  readonly inventoryId?: string
}

export function encodeAttackMessage(data: AttackCardData): string {
  return ATTACK_PREFIX + JSON.stringify(data)
}

export function parseAttackMessage(content: string): AttackCardData | null {
  if (!content.startsWith(ATTACK_PREFIX)) return null
  try {
    return JSON.parse(content.slice(ATTACK_PREFIX.length)) as AttackCardData
  } catch {
    return null
  }
}
