import type { ItemCategory, ItemOrigin } from '@domain/economy/types'

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  junk: 'Junk',
  materiale: 'Materiale',
  consumabile: 'Consumabile',
  equipaggiamento: 'Equipaggiamento',
  costrutto_materiale: 'Costrutto',
  oggetto_trama: 'Oggetto di trama',
}

const ORIGIN_LABELS: Record<ItemOrigin, string> = {
  craftato: 'Craftato',
  droppato: 'Trovato',
  comprato: 'Comprato',
}

export function formatItemCategory(category: ItemCategory | string | undefined): string {
  if (!category) return 'Oggetto'
  return CATEGORY_LABELS[category as ItemCategory] ?? category
}

export function formatItemOrigin(origin: ItemOrigin | string | null | undefined): string | null {
  if (!origin) return null
  return ORIGIN_LABELS[origin as ItemOrigin] ?? origin
}

export function categoryAccentClass(category: ItemCategory | string | undefined): string {
  switch (category) {
    case 'materiale':
    case 'equipaggiamento':
      return 'text-[var(--accent-gold)] border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10'
    case 'consumabile':
    case 'costrutto_materiale':
      return 'text-[var(--accent-violet-light)] border-[var(--accent-violet)]/40 bg-[var(--accent-violet)]/10'
    case 'oggetto_trama':
      return 'text-[var(--accent-gold)] border-[var(--accent-gold)]/60 bg-[var(--accent-gold)]/15 shadow-[var(--glow-gold)]'
    default:
      return 'text-gray-400 border-[var(--border-color)] bg-black/40'
  }
}
