/**
 * Dev-only: scrive file sotto apps/tester/src/ (allowlist).
 * Abilita “Salva su disco” dagli strumenti authoring del tester.
 */

import fs from 'node:fs'
import path from 'node:path'
import type { ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import {
  POOL_APPEND,
  appendToPoolArray,
  appendWazaAccessorioEntry,
  extractIdFromPoolEntry,
  removePoolObjectById,
  removeWazaAccessorioFromPool,
  replacePoolObjectById,
} from './poolFilePatches'

const ALLOW_REL = new Set([
  'src/wazaBranches.ts',
  'src/wazaTaxonomy.ts',
  'src/madoshoTaxonomy.ts',
  'src/pattiTaxonomy.ts',
  'src/skiruCategories.ts',
  'src/skiruPool.ts',
  'src/wazaPool.ts',
  'src/madoshoPool.ts',
  'src/pattiPool.ts',
])

function handleAppendWazaAccessorio(testerRootAbs: string, raw: string, res: ServerResponse): void {
  try {
    const parsed = JSON.parse(raw) as {
      kind?: string
      id?: string
      label?: string
      note?: string
    }
    const kind = parsed.kind
    if (kind !== 'status' && kind !== 'counter' && kind !== 'condizione') {
      res.statusCode = 400
      res.end('Invalid body: kind must be status | counter | condizione')
      return
    }
    const id = typeof parsed.id === 'string' ? parsed.id.trim() : ''
    const label = typeof parsed.label === 'string' ? parsed.label.trim() : ''
    const note = typeof parsed.note === 'string' ? parsed.note : ''
    if (!id || !label) {
      res.statusCode = 400
      res.end('Invalid body: id e label richiesti')
      return
    }
    if (!/^[a-z][a-z0-9_-]*$/.test(id)) {
      res.statusCode = 400
      res.end('id deve essere slug: lettera minuscola, poi a-z, 0-9, _ o -')
      return
    }
    const rel = 'src/wazaPool.ts'
    const absTarget = path.resolve(testerRootAbs, rel)
    const srcRoot = path.resolve(testerRootAbs, 'src')
    if (!absTarget.startsWith(srcRoot + path.sep)) {
      res.statusCode = 403
      res.end('Path outside src/')
      return
    }
    let fileContent = fs.readFileSync(absTarget, 'utf8')
    fileContent = appendWazaAccessorioEntry(
      fileContent,
      kind as 'status' | 'counter' | 'condizione',
      id,
      label,
      note,
    )
    fs.writeFileSync(absTarget, fileContent, 'utf8')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true, path: rel, kind, id }))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    res.statusCode = msg.includes('già presente') ? 409 : 500
    res.end(msg)
  }
}

function handleAppendPoolEntry(testerRootAbs: string, raw: string, res: ServerResponse): void {
  try {
    const parsed = JSON.parse(raw) as { pool?: string; entry?: string }
    const pool = parsed.pool
    const entry = parsed.entry
    if (pool !== 'waza' && pool !== 'madosho' && pool !== 'patti' && pool !== 'skiru') {
      res.statusCode = 400
      res.end('Invalid body: pool must be waza | madosho | patti | skiru')
      return
    }
    if (typeof entry !== 'string' || !entry.trim()) {
      res.statusCode = 400
      res.end('Invalid body: entry (snippet da incollare nel pool) richiesto')
      return
    }
    const cfg = POOL_APPEND[pool]
    const absTarget = path.resolve(testerRootAbs, cfg.rel)
    const srcRoot = path.resolve(testerRootAbs, 'src')
    if (!absTarget.startsWith(srcRoot + path.sep)) {
      res.statusCode = 403
      res.end('Path outside src/')
      return
    }
    const id = extractIdFromPoolEntry(entry)
    if (!id) {
      res.statusCode = 400
      res.end('Impossibile ricavare id: … dalla voce. Verifica che ci sia id: \'…\'.')
      return
    }
    const idRe = new RegExp(`id:\\s*['"]${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
    let fileContent = fs.readFileSync(absTarget, 'utf8')
    if (idRe.test(fileContent)) {
      res.statusCode = 409
      res.end(`Voce con id «${id}» già presente in ${cfg.rel}. Rimuovila a mano o cambia id.`)
      return
    }
    fileContent = appendToPoolArray(fileContent, cfg.decl, entry)
    fs.writeFileSync(absTarget, fileContent, 'utf8')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true, path: cfg.rel, id }))
  } catch (e) {
    res.statusCode = 500
    res.end(e instanceof Error ? e.message : String(e))
  }
}

function handleReplacePoolEntry(testerRootAbs: string, raw: string, res: ServerResponse): void {
  try {
    const parsed = JSON.parse(raw) as { pool?: string; entry?: string; replaceId?: string }
    const pool = parsed.pool
    const entry = parsed.entry
    const replaceId = typeof parsed.replaceId === 'string' ? parsed.replaceId.trim() : ''
    if (pool !== 'waza' && pool !== 'madosho' && pool !== 'patti' && pool !== 'skiru') {
      res.statusCode = 400
      res.end('Invalid body: pool must be waza | madosho | patti | skiru')
      return
    }
    if (typeof entry !== 'string' || !entry.trim()) {
      res.statusCode = 400
      res.end('Invalid body: entry richiesto')
      return
    }
    if (!replaceId) {
      res.statusCode = 400
      res.end('Invalid body: replaceId richiesto')
      return
    }
    const cfg = POOL_APPEND[pool]
    const absTarget = path.resolve(testerRootAbs, cfg.rel)
    const srcRoot = path.resolve(testerRootAbs, 'src')
    if (!absTarget.startsWith(srcRoot + path.sep)) {
      res.statusCode = 403
      res.end('Path outside src/')
      return
    }
    const newId = extractIdFromPoolEntry(entry)
    if (!newId) {
      res.statusCode = 400
      res.end('Impossibile ricavare id dalla nuova voce.')
      return
    }
    let fileContent = fs.readFileSync(absTarget, 'utf8')
    const idRe = new RegExp(`id:\\s*['"]${replaceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
    if (!idRe.test(fileContent)) {
      res.statusCode = 404
      res.end(`Nessuna voce con id «${replaceId}» in ${cfg.rel}.`)
      return
    }
    fileContent = replacePoolObjectById(fileContent, cfg.decl, replaceId, entry)
    fs.writeFileSync(absTarget, fileContent, 'utf8')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true, path: cfg.rel, replaceId, id: newId }))
  } catch (e) {
    res.statusCode = 500
    res.end(e instanceof Error ? e.message : String(e))
  }
}

function handleDeletePoolEntry(testerRootAbs: string, raw: string, res: ServerResponse): void {
  try {
    const parsed = JSON.parse(raw) as { pool?: string; removeId?: string }
    const pool = parsed.pool
    const removeId = typeof parsed.removeId === 'string' ? parsed.removeId.trim() : ''
    if (pool !== 'waza' && pool !== 'madosho' && pool !== 'patti' && pool !== 'skiru') {
      res.statusCode = 400
      res.end('Invalid body: pool must be waza | madosho | patti | skiru')
      return
    }
    if (!removeId) {
      res.statusCode = 400
      res.end('Invalid body: removeId richiesto')
      return
    }
    const cfg = POOL_APPEND[pool]
    const absTarget = path.resolve(testerRootAbs, cfg.rel)
    const srcRoot = path.resolve(testerRootAbs, 'src')
    if (!absTarget.startsWith(srcRoot + path.sep)) {
      res.statusCode = 403
      res.end('Path outside src/')
      return
    }
    let fileContent = fs.readFileSync(absTarget, 'utf8')
    fileContent = removePoolObjectById(fileContent, cfg.decl, removeId)
    fs.writeFileSync(absTarget, fileContent, 'utf8')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true, path: cfg.rel, removeId }))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    res.statusCode = msg.includes('non trovat') ? 404 : 500
    res.end(msg)
  }
}

function handleDeleteWazaAccessorio(testerRootAbs: string, raw: string, res: ServerResponse): void {
  try {
    const parsed = JSON.parse(raw) as { kind?: string; id?: string }
    const kind = parsed.kind
    if (kind !== 'status' && kind !== 'counter' && kind !== 'condizione') {
      res.statusCode = 400
      res.end('Invalid body: kind must be status | counter | condizione')
      return
    }
    const id = typeof parsed.id === 'string' ? parsed.id.trim() : ''
    if (!id) {
      res.statusCode = 400
      res.end('Invalid body: id richiesto')
      return
    }
    const rel = 'src/wazaPool.ts'
    const absTarget = path.resolve(testerRootAbs, rel)
    const srcRoot = path.resolve(testerRootAbs, 'src')
    if (!absTarget.startsWith(srcRoot + path.sep)) {
      res.statusCode = 403
      res.end('Path outside src/')
      return
    }
    let fileContent = fs.readFileSync(absTarget, 'utf8')
    fileContent = removeWazaAccessorioFromPool(
      fileContent,
      kind as 'status' | 'counter' | 'condizione',
      id,
    )
    fs.writeFileSync(absTarget, fileContent, 'utf8')
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true, path: rel, kind, id }))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    res.statusCode = msg.includes('non trovat') ? 404 : 500
    res.end(msg)
  }
}

function normalizeRel(p: string): string {
  return p.replace(/^\//, '').replace(/\\/g, '/').split('/').filter((s) => s !== '..' && s !== '.').join('/')
}

export function oyasumiWriteFilePlugin(testerRootAbs: string): Plugin {
  return {
    name: 'oyasumi-write-file',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/__oyasumi/append-pool-entry' && req.method === 'POST') {
          let raw = ''
          req.on('data', (c) => {
            raw += c
          })
          req.on('end', () => {
            handleAppendPoolEntry(testerRootAbs, raw, res)
          })
          return
        }
        if (req.url === '/__oyasumi/replace-pool-entry' && req.method === 'POST') {
          let raw = ''
          req.on('data', (c) => {
            raw += c
          })
          req.on('end', () => {
            handleReplacePoolEntry(testerRootAbs, raw, res)
          })
          return
        }
        if (req.url === '/__oyasumi/append-waza-accessorio' && req.method === 'POST') {
          let raw = ''
          req.on('data', (c) => {
            raw += c
          })
          req.on('end', () => {
            handleAppendWazaAccessorio(testerRootAbs, raw, res)
          })
          return
        }
        if (req.url === '/__oyasumi/delete-pool-entry' && req.method === 'POST') {
          let raw = ''
          req.on('data', (c) => {
            raw += c
          })
          req.on('end', () => {
            handleDeletePoolEntry(testerRootAbs, raw, res)
          })
          return
        }
        if (req.url === '/__oyasumi/delete-waza-accessorio' && req.method === 'POST') {
          let raw = ''
          req.on('data', (c) => {
            raw += c
          })
          req.on('end', () => {
            handleDeleteWazaAccessorio(testerRootAbs, raw, res)
          })
          return
        }
        if (req.url !== '/__oyasumi/write-file' || req.method !== 'POST') {
          next()
          return
        }
        let raw = ''
        req.on('data', (c) => {
          raw += c
        })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(raw) as { path?: string; content?: string }
            const rel = typeof parsed.path === 'string' ? normalizeRel(parsed.path) : ''
            const content = parsed.content
            if (!rel || typeof content !== 'string') {
              res.statusCode = 400
              res.end('Invalid body: path and content required')
              return
            }
            if (!ALLOW_REL.has(rel)) {
              res.statusCode = 403
              res.end(`Path not allowed: ${rel}`)
              return
            }
            const absTarget = path.resolve(testerRootAbs, rel)
            const srcRoot = path.resolve(testerRootAbs, 'src')
            if (!absTarget.startsWith(srcRoot + path.sep) && absTarget !== srcRoot) {
              res.statusCode = 403
              res.end('Path outside src/')
              return
            }
            fs.mkdirSync(path.dirname(absTarget), { recursive: true })
            fs.writeFileSync(absTarget, content, 'utf8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, path: rel }))
          } catch (e) {
            res.statusCode = 500
            res.end(e instanceof Error ? e.message : String(e))
          }
        })
      })
    },
  }
}
