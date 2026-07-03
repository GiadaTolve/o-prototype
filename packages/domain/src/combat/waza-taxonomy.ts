/** Consistenze e categorie Waza — Ultimate Manual / WAZA_CALCOLI.md */

export const WAZA_CONSISTENCY_IDS = [
  'sonoro',
  'elementale',
  'liquido',
  'gassoso',
  'solido',
  'energetiche',
  'nessuna',
] as const

export type WazaConsistencyId = (typeof WAZA_CONSISTENCY_IDS)[number]

export const WAZA_CATEGORY_IDS = [
  'raggio',
  'proiettile',
  'propagazione_conica',
  'propagazione',
  'emanazione',
  'emanazione_distanza',
  'contatto',
  'potenziamento',
  'costrutti',
  'scudo',
  'irraggiamento',
] as const

export type WazaCategoryId = (typeof WAZA_CATEGORY_IDS)[number]

export type WazaTaxonomyDef = {
  id: string
  tag: string
  label: string
  description: string
  role?: string
  implemented: boolean
}

export const WAZA_CONSISTENCIES: WazaTaxonomyDef[] = [
  {
    id: 'sonoro',
    tag: 'Sonoro',
    label: 'Sonoro',
    description: 'Onde sonore.',
    role: 'Scout, molti danni. Vantaggio vs liquide.',
    implemented: true,
  },
  {
    id: 'elementale',
    tag: 'Elementale',
    label: 'Elementale',
    description: 'Proprietà che imitano gli elementi naturali.',
    role: 'Status, versatilità. Possibile rottura.',
    implemented: true,
  },
  {
    id: 'liquido',
    tag: 'Liquido',
    label: 'Liquido',
    description: 'Corpo liquido.',
    role: 'Maggiore gittata. Controllo, danni AOE.',
    implemented: true,
  },
  {
    id: 'gassoso',
    tag: 'Gassoso',
    label: 'Gassoso',
    description: 'Corpo gassoso.',
    role: 'Hazard persistenti. Cambiano le regole del campo.',
    implemented: true,
  },
  {
    id: 'solido',
    tag: 'Solido',
    label: 'Solido',
    description: 'Corpo solido e tangibile.',
    role: 'Danni ingenti, pochi colpi. Resistenza più bassa.',
    implemented: true,
  },
  {
    id: 'energetiche',
    tag: 'Energetiche',
    label: 'Energetiche',
    description: 'Emanazione energetica (aura, esplosiva, ecc.).',
    role: 'Tipo più comune, base facile da personalizzare.',
    implemented: true,
  },
  {
    id: 'nessuna',
    tag: 'Nessuna',
    label: 'Nessuna',
    description: 'Nessuna consistenza definita.',
    role: 'Waza senza corpo tangibile proprio.',
    implemented: true,
  },
]

export const WAZA_CATEGORIES: WazaTaxonomyDef[] = [
  { id: 'raggio', tag: 'Raggio', label: 'Raggio', description: 'Waza rappresentate da un raggio.', implemented: true },
  { id: 'proiettile', tag: 'Proiettile', label: 'Proiettile', description: 'Qualcosa scagliato verso un bersaglio.', implemented: true },
  {
    id: 'propagazione_conica',
    tag: 'Propagazione Conica',
    label: 'Propagazione Conica',
    description: 'Origine dall\'analista, si allarga a cono.',
    implemented: true,
  },
  { id: 'propagazione', tag: 'Propagazione', label: 'Propagazione', description: 'Ricopre un\'area.', implemented: true },
  { id: 'emanazione', tag: 'Emanazione', label: 'Emanazione', description: 'Si dirama dall\'analista in tutte le direzioni.', implemented: true },
  {
    id: 'emanazione_distanza',
    tag: 'Emanazione a distanza',
    label: 'Emanazione a Distanza',
    description: 'Si dirama dal punto di impatto in tutte le direzioni.',
    implemented: true,
  },
  { id: 'contatto', tag: 'Contatto', label: 'Contatto', description: 'Corpo fisico in carica verso il bersaglio.', implemented: true },
  { id: 'potenziamento', tag: 'Potenziamento', label: 'Potenziamento', description: 'Agisce sull\'analista o su altri.', implemented: true },
  { id: 'costrutti', tag: 'Costrutto', label: 'Costrutti', description: 'Evoca entità o oggetti sul campo.', implemented: true },
  { id: 'scudo', tag: 'Scudo', label: 'Scudo', description: 'Protezioni momentanee.', implemented: true },
  {
    id: 'irraggiamento',
    tag: 'Irraggiamento',
    label: 'Irraggiamento',
    description: 'Consistenza attiva solo durante i CS di riferimento.',
    implemented: false,
  },
]

const CONSISTENCY_BY_ID = Object.fromEntries(WAZA_CONSISTENCIES.map((c) => [c.id, c])) as Record<
  WazaConsistencyId,
  WazaTaxonomyDef
>

const CATEGORY_BY_ID = Object.fromEntries(WAZA_CATEGORIES.map((c) => [c.id, c])) as Record<
  WazaCategoryId,
  WazaTaxonomyDef
>

function normalizeTagKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

/** Alias bracket → id (include varianti da descrizioni waza). */
const CONSISTENCY_ALIASES: Record<string, WazaConsistencyId> = {
  sonoro: 'sonoro',
  elementale: 'elementale',
  liquido: 'liquido',
  gassoso: 'gassoso',
  solido: 'solido',
  energetiche: 'energetiche',
  energetico: 'energetiche',
  energetica: 'energetiche',
  nessuna: 'nessuna',
  nulla: 'nessuna',
}

const CATEGORY_ALIASES: Record<string, WazaCategoryId> = {
  raggio: 'raggio',
  proiettile: 'proiettile',
  'propagazione conica': 'propagazione_conica',
  propagazione: 'propagazione',
  emanazione: 'emanazione',
  'emanazione a distanza': 'emanazione_distanza',
  contatto: 'contatto',
  'a contatto': 'contatto',
  potenziamento: 'potenziamento',
  costrutto: 'costrutti',
  costrutti: 'costrutti',
  scudo: 'scudo',
  irraggiamento: 'irraggiamento',
}

export type ClassifiedBracketTag =
  | { kind: 'consistency'; id: WazaConsistencyId; raw: string; def: WazaTaxonomyDef }
  | { kind: 'category'; id: WazaCategoryId; raw: string; def: WazaTaxonomyDef }
  | { kind: 'other'; raw: string }

export function classifyBracketTag(raw: string): ClassifiedBracketTag {
  const key = normalizeTagKey(raw)
  const cId = CONSISTENCY_ALIASES[key]
  if (cId) {
    return { kind: 'consistency', id: cId, raw, def: CONSISTENCY_BY_ID[cId] }
  }
  const catId = CATEGORY_ALIASES[key]
  if (catId) {
    return { kind: 'category', id: catId, raw, def: CATEGORY_BY_ID[catId] }
  }
  return { kind: 'other', raw }
}

export function extractBracketTags(text: string): ClassifiedBracketTag[] {
  const found: ClassifiedBracketTag[] = []
  const seen = new Set<string>()
  const re = /\[([^\]]+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    const raw = m[1].trim()
    if (!raw || seen.has(raw.toLowerCase())) continue
    seen.add(raw.toLowerCase())
    found.push(classifyBracketTag(raw))
  }
  return found
}

export function extractWazaTaxonomyFromText(text: string): {
  consistencies: WazaTaxonomyDef[]
  categories: WazaTaxonomyDef[]
} {
  const tags = extractBracketTags(text)
  const consistencies: WazaTaxonomyDef[] = []
  const categories: WazaTaxonomyDef[] = []
  const seenC = new Set<string>()
  const seenCat = new Set<string>()
  for (const t of tags) {
    if (t.kind === 'consistency' && !seenC.has(t.id)) {
      seenC.add(t.id)
      consistencies.push(t.def)
    }
    if (t.kind === 'category' && !seenCat.has(t.id)) {
      seenCat.add(t.id)
      categories.push(t.def)
    }
  }
  return { consistencies, categories }
}

/** Sostituisce tag consistenza/categoria noti prima del catch-all generico. */
export function formatWazaTaxonomyTagsInText(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, (full, inner: string) => {
    const classified = classifyBracketTag(inner)
    if (classified.kind === 'consistency') {
      const d = classified.def
      const title = d.role ? `${d.description} ${d.role}` : d.description
      return `<span class="consistency-tag" title="${escapeHtml(title)}">${escapeHtml(d.tag)}</span>`
    }
    if (classified.kind === 'category') {
      const d = classified.def
      return `<span class="category-tag" title="${escapeHtml(d.description)}">${escapeHtml(d.tag)}</span>`
    }
    return full
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export function countWazaByConsistency(
  ownedDescriptions: string[],
  target: WazaConsistencyId,
): number {
  let n = 0
  for (const desc of ownedDescriptions) {
    const { consistencies } = extractWazaTaxonomyFromText(desc)
    if (consistencies.some((c) => c.id === target)) n++
  }
  return n
}

export function countDistinctConsistenciesOwned(ownedDescriptions: string[]): number {
  const set = new Set<WazaConsistencyId>()
  for (const desc of ownedDescriptions) {
    for (const c of extractWazaTaxonomyFromText(desc).consistencies) {
      set.add(c.id as WazaConsistencyId)
    }
  }
  return set.size
}
