#!/usr/bin/env bun
/**
 * Applica in locale i contributi esportati da tester-api (GET /api/contributions)
 * ai file sotto apps/tester/src — stessa logica del plugin Vite.
 *
 * Uso:
 *   bun scripts/apply-tester-contributions.ts export.json
 *   bun scripts/apply-tester-contributions.ts --dry-run export.json
 *   curl -sS -H "Authorization: Bearer $KEY" https://api.../api/contributions | bun scripts/apply-tester-contributions.ts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  POOL_APPEND,
  appendToPoolArray,
  appendWazaAccessorioEntry,
  extractIdFromPoolEntry,
  removePoolObjectById,
  removeWazaAccessorioFromPool,
  replacePoolObjectById,
} from '../apps/tester/plugins/poolFilePatches.ts'

const repoRoot = path.resolve(import.meta.dir, '..')
const testerRoot = path.join(repoRoot, 'apps', 'tester')

type Contribution = {
  id?: string
  createdAt?: string
  type?: string
  subkind?: string
  pool?: string
  author?: string
  payload?: Record<string, unknown>
}

function parseArgs(argv: string[]) {
  let dryRun = false
  let continueOnError = false
  const files: string[] = []
  for (const a of argv) {
    if (a === '--dry-run') dryRun = true
    else if (a === '--continue-on-error') continueOnError = true
    else if (!a.startsWith('-')) files.push(a)
  }
  return { dryRun, continueOnError, files }
}

function parseInput(raw: string): Contribution[] {
  const t = raw.trim()
  if (!t) return []

  const tryJson = (): Contribution[] | null => {
    try {
      const j = JSON.parse(raw) as unknown
      if (Array.isArray(j)) return j as Contribution[]
      if (j && typeof j === 'object' && 'contributions' in j) {
        const c = (j as { contributions: unknown }).contributions
        if (Array.isArray(c)) return c as Contribution[]
      }
      return null
    } catch {
      return null
    }
  }

  const asJson = tryJson()
  if (asJson) return asJson

  const rows: Contribution[] = []
  for (const line of raw.split('\n')) {
    const L = line.trim()
    if (!L) continue
    try {
      rows.push(JSON.parse(L) as Contribution)
    } catch {
      /* skip */
    }
  }
  return rows
}

function sortByDate(a: Contribution, b: Contribution): number {
  const ta = a.createdAt ? Date.parse(a.createdAt) : 0
  const tb = b.createdAt ? Date.parse(b.createdAt) : 0
  return ta - tb
}

function fileAbs(relFromTesterSrc: string): string {
  return path.join(testerRoot, relFromTesterSrc)
}

function applyWazaAccessorio(c: Contribution, dry: boolean): void {
  const sub = c.subkind as string | undefined
  if (sub !== 'condizione' && sub !== 'status' && sub !== 'counter') {
    throw new Error(`waza_accessorio: subkind invalido (${sub})`)
  }
  const p = c.payload ?? {}
  const id = typeof p.id === 'string' ? p.id.trim() : ''
  const label = typeof p.label === 'string' ? p.label.trim() : ''
  const note = typeof p.note === 'string' ? p.note : ''
  if (!id || !label) throw new Error('waza_accessorio: payload.id e payload.label obbligatori')
  if (!/^[a-z][a-z0-9_-]*$/.test(id)) throw new Error(`waza_accessorio: id slug non valido «${id}»`)

  const fp = fileAbs('src/wazaPool.ts')
  let content = readFileSync(fp, 'utf8')
  content = appendWazaAccessorioEntry(content, sub, id, label, note)
  if (!dry) writeFileSync(fp, content, 'utf8')
  console.log(`${dry ? '[dry-run] ' : ''}waza_accessorio ${sub}: ${id}`)
}

const FILE_SNAPSHOT_REL = new Set([
  'src/wazaBranches.ts',
  'src/wazaTaxonomy.ts',
  'src/madoshoTaxonomy.ts',
  'src/pattiTaxonomy.ts',
])

function applyFileSnapshot(c: Contribution, dry: boolean): void {
  const p = c.payload ?? {}
  const rel = typeof p.path === 'string' ? p.path.trim().replace(/^\//, '') : ''
  const content = typeof p.content === 'string' ? p.content : ''
  if (!rel || !content.trim()) throw new Error('file_snapshot: payload.path e payload.content obbligatori')
  if (!FILE_SNAPSHOT_REL.has(rel)) throw new Error(`file_snapshot: path non consentito «${rel}»`)
  const fp = path.join(testerRoot, rel)
  if (!dry) writeFileSync(fp, content, 'utf8')
  console.log(`${dry ? '[dry-run] ' : ''}file_snapshot: ${rel}`)
}

function applySkiruPoolSnapshot(c: Contribution, dry: boolean): void {
  const p = c.payload ?? {}
  const content = typeof p.content === 'string' ? p.content : ''
  if (!content.trim()) throw new Error('skiru_pool_snapshot: payload.content obbligatorio')
  const fp = fileAbs('src/skiruPool.ts')
  if (!dry) writeFileSync(fp, content, 'utf8')
  console.log(`${dry ? '[dry-run] ' : ''}skiru_pool_snapshot`)
}

function applySkiruCategoriesSnapshot(c: Contribution, dry: boolean): void {
  const p = c.payload ?? {}
  const content = typeof p.content === 'string' ? p.content : ''
  if (!content.trim()) throw new Error('skiru_categories_snapshot: payload.content obbligatorio')
  const fp = fileAbs('src/skiruCategories.ts')
  if (!dry) writeFileSync(fp, content, 'utf8')
  console.log(`${dry ? '[dry-run] ' : ''}skiru_categories_snapshot`)
}

function applyPoolEntry(c: Contribution, dry: boolean): void {
  const pool = c.pool as string | undefined
  if (pool !== 'waza' && pool !== 'madosho' && pool !== 'patti' && pool !== 'skiru') {
    throw new Error(`pool_entry: pool invalido (${pool})`)
  }
  const p = c.payload ?? {}
  const entry = typeof p.entry === 'string' ? p.entry.trim() : ''
  if (!entry) throw new Error('pool_entry: payload.entry obbligatorio')

  const cfg = POOL_APPEND[pool]
  const fp = path.join(testerRoot, cfg.rel)
  const id = extractIdFromPoolEntry(entry)
  if (!id) throw new Error('pool_entry: impossibile ricavare id dalla voce')

  let content = readFileSync(fp, 'utf8')
  const idRe = new RegExp(`id:\\s*['"]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
  if (idRe.test(content)) {
    throw new Error(`pool_entry: id «${id}» già presente in ${cfg.rel}`)
  }
  content = appendToPoolArray(content, cfg.decl, entry)
  if (!dry) writeFileSync(fp, content, 'utf8')
  console.log(`${dry ? '[dry-run] ' : ''}pool_entry ${pool}: ${id}`)
}

function applyPoolReplace(c: Contribution, dry: boolean): void {
  const pool = c.pool as string | undefined
  if (pool !== 'waza' && pool !== 'madosho' && pool !== 'patti' && pool !== 'skiru') {
    throw new Error(`pool_entry_replace: pool invalido (${pool})`)
  }
  const p = c.payload ?? {}
  const entry = typeof p.entry === 'string' ? p.entry.trim() : ''
  const replaceId = typeof p.replaceId === 'string' ? p.replaceId.trim() : ''
  if (!entry || !replaceId) {
    throw new Error('pool_entry_replace: payload.entry e payload.replaceId obbligatori')
  }

  const cfg = POOL_APPEND[pool]
  const fp = path.join(testerRoot, cfg.rel)
  let content = readFileSync(fp, 'utf8')
  content = replacePoolObjectById(content, cfg.decl, replaceId, entry)
  if (!dry) writeFileSync(fp, content, 'utf8')
  console.log(`${dry ? '[dry-run] ' : ''}pool_entry_replace ${pool}: ${replaceId} → nuovo id estratto da voce`)
}

function applyPoolEntryDelete(c: Contribution, dry: boolean): void {
  const pool = c.pool as string | undefined
  if (pool !== 'waza' && pool !== 'madosho' && pool !== 'patti' && pool !== 'skiru') {
    throw new Error(`pool_entry_delete: pool invalido (${pool})`)
  }
  const p = c.payload ?? {}
  const removeId = typeof p.removeId === 'string' ? p.removeId.trim() : ''
  if (!removeId) throw new Error('pool_entry_delete: payload.removeId obbligatorio')

  const cfg = POOL_APPEND[pool]
  const fp = path.join(testerRoot, cfg.rel)
  let content = readFileSync(fp, 'utf8')
  content = removePoolObjectById(content, cfg.decl, removeId)
  if (!dry) writeFileSync(fp, content, 'utf8')
  console.log(`${dry ? '[dry-run] ' : ''}pool_entry_delete ${pool}: ${removeId}`)
}

function applyWazaAccessorioDelete(c: Contribution, dry: boolean): void {
  const sub = c.subkind as string | undefined
  if (sub !== 'condizione' && sub !== 'status' && sub !== 'counter') {
    throw new Error(`waza_accessorio_delete: subkind invalido (${sub})`)
  }
  const p = c.payload ?? {}
  const id = typeof p.id === 'string' ? p.id.trim() : ''
  if (!id) throw new Error('waza_accessorio_delete: payload con id obbligatorio')

  const fp = fileAbs('src/wazaPool.ts')
  let content = readFileSync(fp, 'utf8')
  content = removeWazaAccessorioFromPool(content, sub, id)
  if (!dry) writeFileSync(fp, content, 'utf8')
  console.log(`${dry ? '[dry-run] ' : ''}waza_accessorio_delete ${sub}: ${id}`)
}

function applyOne(c: Contribution, dry: boolean): void {
  const t = c.type ?? ''
  switch (t) {
    case 'waza_accessorio':
      applyWazaAccessorio(c, dry)
      break
    case 'pool_entry':
      applyPoolEntry(c, dry)
      break
    case 'pool_entry_replace':
      applyPoolReplace(c, dry)
      break
    case 'pool_entry_delete':
      applyPoolEntryDelete(c, dry)
      break
    case 'waza_accessorio_delete':
      applyWazaAccessorioDelete(c, dry)
      break
    case 'file_snapshot':
      applyFileSnapshot(c, dry)
      break
    case 'skiru_pool_snapshot':
      applySkiruPoolSnapshot(c, dry)
      break
    case 'skiru_categories_snapshot':
      applySkiruCategoriesSnapshot(c, dry)
      break
    default:
      console.warn(`Ignorato tipo non gestito: «${t}» (id record ${c.id ?? '?'})`)
  }
}

function main() {
  const argv = process.argv.slice(2)
  const { dryRun, continueOnError, files } = parseArgs(argv)

  let raw = ''
  if (files.length === 0) {
    try {
      raw = readFileSync(0, 'utf8')
    } catch {
      console.error(
        'Uso: bun scripts/apply-tester-contributions.ts [--dry-run] [--continue-on-error] <export.json>\n' +
          'Oppure pipe JSON su stdin.',
      )
      process.exit(1)
    }
  } else {
    raw = readFileSync(path.resolve(files[0]!), 'utf8')
  }

  const list = parseInput(raw).filter((c) => c && typeof c === 'object')
  if (list.length === 0) {
    console.error('Nessun contributo trovato nel file.')
    process.exit(1)
  }

  list.sort(sortByDate)
  console.log(`Contributi da applicare: ${list.length}${dryRun ? ' (dry-run)' : ''}`)
  console.log(`Target: ${testerRoot}`)

  let errors = 0
  for (const c of list) {
    try {
      applyOne(c, dryRun)
    } catch (e) {
      errors++
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`Errore [${c.type} ${c.id ?? ''}]: ${msg}`)
      if (!continueOnError) {
        process.exit(1)
      }
    }
  }

  if (errors > 0) {
    console.error(`Completato con ${errors} errori.`)
    process.exit(1)
  }
  if (dryRun) console.log('Dry-run: nessun file scritto.')
  else console.log('Fatto.')
}

main()
