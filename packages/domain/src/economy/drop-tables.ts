import type { JunkItemDef } from './junklist'

/** Pool logico per estrazione tabelle drop. */
export type DropPoolCategory =
  | 'metallo'
  | 'stoffa'
  | 'carta'
  | 'chimica'
  | 'carburante'
  | 'onimori_comune'
  | 'frammento_onirico'

export interface DropTableDef {
  readonly id: string
  readonly label: string
  readonly entries: readonly { readonly pool: DropPoolCategory; readonly weight: number }[]
}

/** Tabelle predefinite — vedi `ECONOMY_ITEMS_SPEC.md` §1. */
export const DROP_TABLES: readonly DropTableDef[] = [
  {
    id: 'rovine_urbane',
    label: 'Rovine urbane',
    entries: [
      { pool: 'metallo', weight: 38 },
      { pool: 'stoffa', weight: 28 },
      { pool: 'carta', weight: 19 },
      { pool: 'chimica', weight: 10 },
      { pool: 'carburante', weight: 5 },
    ],
  },
  {
    id: 'onimori',
    label: 'Onimori',
    entries: [
      { pool: 'onimori_comune', weight: 85 },
      { pool: 'frammento_onirico', weight: 15 },
    ],
  },
  {
    id: 'creatura_kyofu',
    label: 'Creatura Kyōfu',
    entries: [
      { pool: 'onimori_comune', weight: 70 },
      { pool: 'frammento_onirico', weight: 30 },
    ],
  },
  {
    id: 'bottino_umano',
    label: 'Bottino umano',
    entries: [
      { pool: 'metallo', weight: 25 },
      { pool: 'stoffa', weight: 25 },
      { pool: 'carta', weight: 25 },
      { pool: 'chimica', weight: 25 },
    ],
  },
] as const

/** Max drop da tabella per PG per giornata reale (anti-farming). */
export const DROP_TABLE_DAILY_CAP_PER_PLAYER = 3

/** Mapping pool → voci junk (per roll server-side). */
export const DROP_POOL_JUNK_IDS: Readonly<Record<DropPoolCategory, readonly string[]>> = {
  metallo: ['junk-lattine', 'junk-utensili-spezzati', 'junk-serratura', 'junk-ombrello'],
  stoffa: ['junk-abiti', 'junk-ombrello', 'junk-kit-soccorso'],
  carta: ['junk-libri', 'junk-foto', 'junk-butsudan'],
  chimica: ['junk-flaconi', 'junk-batterie', 'junk-kit-soccorso'],
  carburante: ['junk-tanica-sigillata'],
  onimori_comune: ['junk-nido', 'junk-ossa', 'junk-carcassa', 'junk-abiti'],
  frammento_onirico: ['junk-amuleto'],
}

export function getDropTable(id: string): DropTableDef | undefined {
  return DROP_TABLES.find((t) => t.id === id)
}

/** Estrae un junk id da tabella (pesi fissi; `rng` iniettabile per test). */
export function rollDropTableJunk(
  tableId: string,
  rng: () => number = Math.random,
): JunkItemDef['id'] | null {
  const table = getDropTable(tableId)
  if (!table?.entries.length) return null

  const total = table.entries.reduce((s, e) => s + e.weight, 0)
  let roll = rng() * total
  for (const entry of table.entries) {
    roll -= entry.weight
    if (roll <= 0) {
      const pool = DROP_POOL_JUNK_IDS[entry.pool]
      if (!pool.length) return null
      const idx = Math.floor(rng() * pool.length)
      return pool[idx] ?? null
    }
  }
  const last = table.entries[table.entries.length - 1]
  const pool = DROP_POOL_JUNK_IDS[last.pool]
  return pool[0] ?? null
}
