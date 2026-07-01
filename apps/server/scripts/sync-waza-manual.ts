/**
 * Sincronizza catalogo Dō da apps/tester wazaPool (nomi/ordine: Oyasumi_Manuale_Completo.pdf).
 * Formule costi/danno: WAZA_CALCOLI.md dove presenti.
 * Esegui da apps/server:
 *   bun run scripts/add-pool-id-column.ts   (prima volta)
 *   bun run scripts/sync-waza-manual.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
config({ path: resolve(process.cwd(), '../../.env') })

import { eq, inArray, isNull, and } from 'drizzle-orm'
import { db } from '../src/plugins/db'
import { skills, characterSkills } from '../src/db/schema'
import { WAZA_POOL, type WazaDef } from '../../../apps/tester/src/wazaPool'
import { SAMPLE_WAZA_STATS } from '../../../apps/tester/src/wazaPool'
import { BRANCH_LABELS, type WazaBranch } from '../../../apps/tester/src/wazaBranches'
import { styleIdFromBranchLabel, type StyleId } from '@domain/progression'

type CatalogEntry = {
  poolId: string
  branch: string
  name: string
  isPassive: boolean
  description: string
  costExp: number
  costJigoka: number
  rank: string | null
}

const BRANCH_SECTIONS: Array<{ header: string; branch: string }> = [
  { header: '## Tōka-dō: Via della Lanterna', branch: 'Tōka-dō' },
  { header: '## Ito-Do (Ramo Manipolazione)', branch: 'Ito-Do' },
  { header: '## Genzai-Do (Ramo Materializzazione)', branch: 'Genzai-Do' },
  { header: '## Hō-Do (Ramo Emissione)', branch: 'Hō-Do' },
  { header: '## Hensei-Do (Ramo Trasformazione)', branch: 'Hensei-Do' },
  { header: '## Naikan-Do (Ramo Supporto)', branch: 'Naikan-Do' },
]

/** Mapping nomi CALCOLI → poolId (Tōka-dō v3 in wazaPool). */
const TOKA_CALCOLI_TO_POOL: Record<string, string> = {
  'tōrō': 'toro-lanterna-incisa',
  'toro': 'toro-lanterna-incisa',
  'michishirube': 'michishirube-luce-guida',
  'shoka': 'shoka-fiamma-docile',
  'shōka': 'shoka-fiamma-docile',
  'nokuri-bi': 'nokuribi-fuoco-residuo',
  'nokuribi': 'nokuribi-fuoco-residuo',
  'kintsugi': 'kintsugi-legame-dei-frammenti',
  'impatto jigoka': 'impatto-jigoka',
  '!': 'impatto-jigoka',
  'estensione': 'estensione',
  'sfogo jigoka': 'hoshutsu-rilascio-della-fiamma',
  'laser psichico': 'laser-psichico',
  'arma animata': 'ukabu-toro-lanterna-fluttuante',
  'sorpresa': 'fuin-no-hi-sigillo-della-fiamma',
  'risonanza della lama': 'kyomei-risonanza-della-fiamma',
}

/** Mapping nomi CALCOLI Genzai → poolId v3. */
const GENZAI_CALCOLI_TO_POOL: Record<string, string> = {
  'addio carne': 'nikutai-mei-carne-iscritta',
  'affinità elementale': 'honshitsu-essenza-affine',
  'affinita elementale': 'honshitsu-essenza-affine',
  'potere della cognizione': 'kochiku-struttura-salda',
  'piccolo arsenale': 'bugusho-arsenale-scritto',
  inventore: 'kaihen-forgia-ibrida',
  'memoria della forma': 'kioku-mei-sigillo-mnemonico',
  'infusione persistente': 'eizoku-sigillo-persistente',
  'minaccia concreta': 'toki-aura-dichiarata',
  'dito divino': 'raimei-fu-sigillo-del-fulmine',
  'alitosi dello yokai': 'yoki-no-iki-soffio-yokai',
  'globo rancoroso': 'onnen-dama-globo-rancore',
  'colonne pazienti': 'hashira-colonne-incise',
}

const WAZA_BRANCH_TO_SYNC: Record<WazaBranch, string> = {
  proiezione: 'Tōka-dō',
  materializzazione: 'Genzai-Do',
  manipolazione: 'Ito-Do',
  emissione: 'Hō-Do',
  trasformazione: 'Hensei-Do',
  supporto: 'Naikan-Do',
  generiche: 'Generiche',
  ordine: 'Ordine',
  onimori: 'Oni no Mori',
}

function syncBranchFromPool(w: WazaDef): string {
  return WAZA_BRANCH_TO_SYNC[w.branch] ?? BRANCH_LABELS[w.branch]?.split(':')[0]?.trim() ?? w.branch
}

const PLACEHOLDER_NAMES_TO_REMOVE = [
  'Tōrō (Arma psichica)',
  'Michishirube (Ordine)',
  'Shoka (Ottimizzazione)',
  'Kintsugi (Legare i Frammenti)',
  'Impatto Concentrato',
  'Sferzata Elementale',
  'Kōsen (Aura difensiva)',
  'Hibiki (Eco del colpo)',
  'Mamoru (Presenza)',
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function stripMarkdownInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/<small>[^<]*<\/small>/gi, '')
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .trim()
}

function extractParagraphs(block: string): string {
  const lines = block.split('\n')
  const paragraphs: string[] = []
  let current: string[] = []

  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      if (current.length) {
        paragraphs.push(stripMarkdownInline(current.join(' ')))
        current = []
      }
      continue
    }
    if (t.startsWith('```')) break
    if (t.startsWith('**[') && t.includes('Calcolo')) break
    if (t.startsWith('**Costo')) break
    if (t.startsWith('|')) break
    if (t.startsWith('- **Esempio')) continue
    if (/^\*\*\[/.test(t) && /Calcolo|Costo|Quadrante/.test(t)) break
    current.push(t)
  }
  if (current.length) paragraphs.push(stripMarkdownInline(current.join(' ')))

  return paragraphs.filter(Boolean).join('\n\n')
}

function parseCalcoliManual(): CatalogEntry[] {
  const mdPath = resolve(process.cwd(), '../../WAZA_CALCOLI.md')
  const md = readFileSync(mdPath, 'utf8')
  const entries: CatalogEntry[] = []

  for (const { header, branch } of BRANCH_SECTIONS) {
    const start = md.indexOf(header)
    if (start < 0) continue
    const nextHeaders = BRANCH_SECTIONS.map((b) => b.header).filter((h) => h !== header)
    let end = md.length
    for (const nh of nextHeaders) {
      const i = md.indexOf(nh, start + header.length)
      if (i >= 0) end = Math.min(end, i)
    }
    const section = md.slice(start, end)

    for (const kind of ['passive', 'active'] as const) {
      const sectionRe =
        kind === 'passive' ? /### Passive \[\d+\]/i : /## Attive \[\d+\]|### Attive \[\d+\]/i
      const m = section.match(sectionRe)
      if (!m || m.index == null) continue
      const sub = section.slice(m.index)
      const nextStop = sub.search(/\n## [^#]|\n---\n\n## Forma standard/)
      const block = nextStop >= 0 ? sub.slice(0, nextStop) : sub

      const headingRe = /####\s+\d+\.\s+(.+?)(?:\n|$)/g
      let match: RegExpExecArray | null
      while ((match = headingRe.exec(block))) {
        const rawTitle = match[1]
        const paren = rawTitle.match(/\(([^)]+)\)/)
        const titleCore = stripMarkdownInline(
          rawTitle.replace(/<small>[^<]*<\/small>/gi, '').replace(/^\!\s*/, '').trim(),
        )
        const title = titleCore || (paren ? stripMarkdownInline(paren[1]) : stripMarkdownInline(rawTitle))
        const bodyStart = match.index + match[0].length
        const nextHeading = block.slice(bodyStart).search(/\n####\s+\d+\./)
        const body =
          nextHeading >= 0 ? block.slice(bodyStart, bodyStart + nextHeading) : block.slice(bodyStart)
        const description = extractParagraphs(body)
        if (!description) continue

        const key = (titleCore || title).toLowerCase().replace(/^!\s*/, '')
        let poolId =
          branch === 'Tōka-dō' && TOKA_CALCOLI_TO_POOL[key]
            ? TOKA_CALCOLI_TO_POOL[key]
            : branch === 'Genzai-Do' && GENZAI_CALCOLI_TO_POOL[key]
              ? GENZAI_CALCOLI_TO_POOL[key]
              : slugify(title.replace(/\s*\([^)]*\)\s*/g, ' '))

        if (!poolId && paren) {
          poolId = slugify(stripMarkdownInline(paren[1]))
        }

        const displayName =
          title.replace(/^\!\s*/, '').trim() ||
          (paren ? stripMarkdownInline(paren[1]) : '') ||
          'Waza'
        entries.push({
          poolId,
          branch,
          name: displayName,
          isPassive: kind === 'passive',
          description: formatDescription(branch, kind === 'passive', description),
          costExp: defaultCostExp(kind === 'passive', null),
          costJigoka: 0,
          rank: kind === 'passive' ? null : 'T2',
        })
      }
    }
  }

  return entries
}

function formatDescription(branch: string, isPassive: boolean, body: string): string {
  const kind = isPassive ? 'Dō passiva' : 'Waza attiva'
  return `[${branch} · ${kind}]\n\n${body}`
}

function poolDescription(w: WazaDef): string {
  const branch = syncBranchFromPool(w)
  const parts = [w.description?.trim(), w.effect?.trim()].filter(Boolean)
  return formatDescription(branch, w.type === 'passive', parts.join('\n\n'))
}

function poolCostJigoka(w: WazaDef): number {
  if (typeof w.costJigo === 'function') {
    try {
      return w.costJigo(SAMPLE_WAZA_STATS)
    } catch {
      return 0
    }
  }
  return 0
}

function defaultCostExp(isPassive: boolean, w: WazaDef | null): number {
  if (w) {
    const cs = w.costCs ?? 0
    const jigo = poolCostJigoka(w)
    if (w.type === 'passive') return 10 + jigo * 3 + (w.prereqGradoMin ?? 1) * 5
    return 20 + cs * 8 + jigo
  }
  return isPassive ? 20 : 40
}

function defaultRank(w: WazaDef | null, isPassive: boolean): string | null {
  if (isPassive) return null
  if (!w) return 'T2'
  const cs = w.costCs ?? 0
  if (cs <= 1) return 'T1'
  if (cs <= 3) return 'T2'
  if (cs <= 5) return 'T3'
  return 'T4'
}

function buildPoolEntries(): CatalogEntry[] {
  return WAZA_POOL.map((w) => ({
    poolId: w.id,
    branch: syncBranchFromPool(w),
    name: w.name,
    isPassive: w.type === 'passive',
    description: poolDescription(w),
    costExp: defaultCostExp(w.type === 'passive', w),
    costJigoka: poolCostJigoka(w),
    rank: defaultRank(w, w.type === 'passive'),
  }))
}

function branchToStyleId(branch: string): StyleId | null {
  return styleIdFromBranchLabel(branch)
}

function poolCoveredBranches(): Set<string> {
  return new Set(WAZA_POOL.map((w) => syncBranchFromPool(w)))
}

function mergeCatalog(): CatalogEntry[] {
  const byId = new Map<string, CatalogEntry>()
  for (const e of buildPoolEntries()) {
    if (e.poolId && e.name.trim()) byId.set(e.poolId, e)
  }
  const covered = poolCoveredBranches()
  for (const e of parseCalcoliManual()) {
    if (!e.poolId || !e.name.trim()) continue
    if (covered.has(e.branch)) continue
    if (!byId.has(e.poolId)) byId.set(e.poolId, e)
  }
  return [...byId.values()]
}

async function upsertEntry(entry: CatalogEntry) {
  const existing = await db.query.skills.findFirst({
    where: eq(skills.poolId, entry.poolId),
    columns: { id: true },
  })

  const values = {
    name: entry.name,
    description: entry.description,
    type: 'WAZA' as const,
    costExp: entry.costExp,
    costKeys: 0,
    costJigoka: entry.costJigoka,
    rank: entry.rank,
    isPassive: entry.isPassive,
    poolId: entry.poolId,
    styleId: branchToStyleId(entry.branch),
  }

  if (existing) {
    await db.update(skills).set(values).where(eq(skills.id, existing.id))
    return 'updated'
  }

  await db.insert(skills).values(values)
  return 'inserted'
}

async function removePlaceholders() {
  const rows = await db.query.skills.findMany({
    where: and(eq(skills.type, 'WAZA'), inArray(skills.name, PLACEHOLDER_NAMES_TO_REMOVE)),
    columns: { id: true, name: true },
  })
  for (const row of rows) {
    const owned = await db.query.characterSkills.findFirst({
      where: eq(characterSkills.skillId, row.id),
      columns: { id: true },
    })
    if (owned) {
      console.log(`  · skip delete ${row.name} (posseduta da PG)`)
      continue
    }
    await db.delete(skills).where(eq(skills.id, row.id))
    console.log(`  − rimossa placeholder: ${row.name}`)
  }

  const orphanWaza = await db.query.skills.findMany({
    where: and(eq(skills.type, 'WAZA'), isNull(skills.poolId)),
    columns: { id: true, name: true },
  })
  for (const row of orphanWaza) {
    const owned = await db.query.characterSkills.findFirst({
      where: eq(characterSkills.skillId, row.id),
      columns: { id: true },
    })
    if (owned) continue
    await db.delete(skills).where(eq(skills.id, row.id))
    console.log(`  − rimossa WAZA senza pool_id: ${row.name?.trim() || '(vuota)'}`)
  }

  const badRows = await db.query.skills.findMany({
    where: and(eq(skills.type, 'WAZA'), eq(skills.poolId, '')),
    columns: { id: true, name: true },
  })
  for (const row of badRows) {
    await db.delete(skills).where(eq(skills.id, row.id))
    console.log(`  − rimossa WAZA invalida: ${row.name || '(vuota)'}`)
  }
}

async function main() {
  console.log('[Waza Manual] Sincronizzazione catalogo Dō (Oyasumi_Manuale_Completo.pdf)…')
  const catalog = mergeCatalog()
  let inserted = 0
  let updated = 0

  for (const entry of catalog) {
    if (!entry.poolId?.trim() || !entry.name?.trim()) continue
    const result = await upsertEntry(entry)
    if (result === 'inserted') inserted++
    else updated++
  }

  console.log(`[Waza Manual] ${catalog.length} voci — ${inserted} inserite, ${updated} aggiornate.`)
  console.log('[Waza Manual] Pulizia placeholder…')
  await removePlaceholders()
  console.log('[Waza Manual] Fatto.')
  console.log('[Waza Manual] Rigenera catalogo tag chat…')
  const { spawnSync } = await import('child_process')
  const gen = spawnSync('bun', ['run', 'scripts/generate-waza-tag-catalog.ts'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  })
  if (gen.status !== 0) {
    throw new Error('generate-waza-tag-catalog.ts fallito')
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[Waza Manual] Errore:', e)
    process.exit(1)
  })
