/**
 * Patch testuali sui file pool / wazaPool (condiviso tra plugin Vite e script apply-tester-contributions).
 */

export const POOL_APPEND: Record<
  'waza' | 'madosho' | 'patti' | 'skiru',
  { rel: string; decl: string }
> = {
  waza: { rel: 'src/wazaPool.ts', decl: 'export const WAZA_POOL: WazaDef[] = ' },
  madosho: { rel: 'src/madoshoPool.ts', decl: 'export const MADOSHO_POOL: MadoshoDef[] = ' },
  patti: { rel: 'src/pattiPool.ts', decl: 'export const PATTI_POOL: PattiDef[] = ' },
  skiru: { rel: 'src/skiruPool.ts', decl: 'export const SKIRU_POOL: SkiruDef[] = ' },
}

export function findClosingBraceIndex(src: string, openIdx: number): number {
  let depth = 0
  let inStr = false
  let strQuote = ''
  let escaped = false
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i]
    if (inStr) {
      if (escaped) {
        escaped = false
        continue
      }
      if (c === '\\') {
        escaped = true
        continue
      }
      if (c === strQuote) inStr = false
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = true
      strQuote = c
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

export function findClosingBracketIndex(src: string, openIdx: number): number {
  let depth = 0
  let inStr = false
  let strQuote = ''
  let escaped = false
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i]
    if (inStr) {
      if (escaped) {
        escaped = false
        continue
      }
      if (c === '\\') {
        escaped = true
        continue
      }
      if (c === strQuote) inStr = false
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = true
      strQuote = c
      continue
    }
    if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function splitPoolEntryRanges(inner: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = []
  let i = 0
  const n = inner.length
  while (i < n) {
    while (i < n && /\s/.test(inner[i])) i++
    if (i >= n) break
    const segmentStart = i
    while (inner.startsWith('//', i)) {
      while (i < n && inner[i] !== '\n') i++
      if (i < n) i++
      while (i < n && /\s/.test(inner[i])) i++
    }
    if (i >= n || inner[i] !== '{') {
      i = segmentStart + 1
      continue
    }
    const braceEnd = findClosingBraceIndex(inner, i)
    if (braceEnd === -1) break
    ranges.push({ start: segmentStart, end: braceEnd + 1 })
    i = braceEnd + 1
    while (i < n && /\s/.test(inner[i])) i++
    if (inner[i] === ',') i++
  }
  return ranges
}

export function replacePoolObjectById(
  fileContent: string,
  decl: string,
  replaceId: string,
  newEntryRaw: string,
): string {
  const idx = fileContent.indexOf(decl)
  if (idx === -1) throw new Error('Dichiarazione array pool non trovata.')
  const brack = fileContent.indexOf('[', idx + decl.length)
  if (brack === -1) throw new Error('Apertura [ dell’array pool non trovata.')
  const close = findClosingBracketIndex(fileContent, brack)
  if (close === -1) throw new Error('Chiusura ] dell’array pool non trovata.')

  const inner = fileContent.slice(brack + 1, close)
  const ranges = splitPoolEntryRanges(inner)
  const idRe = new RegExp(`id:\\s*['"]${replaceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
  let replaced = false
  const chunks = ranges.map((r) => {
    const chunk = inner.slice(r.start, r.end)
    if (idRe.test(chunk)) {
      replaced = true
      return newEntryRaw.trim().replace(/,\s*$/, '')
    }
    return chunk
  })
  if (!replaced) throw new Error(`Voce con id «${replaceId}» non trovata nell’array.`)
  const newInner = `\n${chunks.join(',\n')},\n`
  return fileContent.slice(0, brack + 1) + newInner + fileContent.slice(close)
}

/** Rimuove l’oggetto `{ id: '…' … }` dall’array pool. */
export function removePoolObjectById(fileContent: string, decl: string, removeId: string): string {
  const idx = fileContent.indexOf(decl)
  if (idx === -1) throw new Error('Dichiarazione array pool non trovata.')
  const brack = fileContent.indexOf('[', idx + decl.length)
  if (brack === -1) throw new Error('Apertura [ dell’array pool non trovata.')
  const close = findClosingBracketIndex(fileContent, brack)
  if (close === -1) throw new Error('Chiusura ] dell’array pool non trovata.')

  const inner = fileContent.slice(brack + 1, close)
  const ranges = splitPoolEntryRanges(inner)
  const idRe = new RegExp(`id:\\s*['"]${removeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
  const kept: string[] = []
  let removed = false
  for (const r of ranges) {
    const chunk = inner.slice(r.start, r.end)
    if (idRe.test(chunk)) {
      removed = true
      continue
    }
    kept.push(chunk)
  }
  if (!removed) throw new Error(`Voce con id «${removeId}» non trovata nell’array.`)
  const newInner = kept.length === 0 ? '\n' : `\n${kept.join(',\n')},\n`
  return fileContent.slice(0, brack + 1) + newInner + fileContent.slice(close)
}

export function extractIdFromPoolEntry(entry: string): string | null {
  const m = entry.match(/id:\s*['"]([^'"]+)['"]/)
  return m ? m[1] : null
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function appendWazaAccessorioEntry(
  fileContent: string,
  kind: 'status' | 'counter' | 'condizione',
  id: string,
  label: string,
  note: string,
): string {
  const arrName =
    kind === 'status'
      ? 'WAZA_STATUS_APPLICABILI'
      : kind === 'counter'
        ? 'WAZA_COUNTER_APPLICABILI'
        : 'WAZA_CONDIZIONI_APPLICABILI'
  const labelsName =
    kind === 'status'
      ? 'WAZA_STATUS_APPLICABILI_LABELS'
      : kind === 'counter'
        ? 'WAZA_COUNTER_APPLICABILI_LABELS'
        : 'WAZA_CONDIZIONI_APPLICABILI_LABELS'
  const arrDecl = `export const ${arrName} = [`
  const aidx = fileContent.indexOf(arrDecl)
  if (aidx === -1) {
    throw new Error(`Dichiarazione ${arrName} non trovata in wazaPool.ts.`)
  }
  const abrack = fileContent.indexOf('[', aidx)
  const aclose = findClosingBracketIndex(fileContent, abrack)
  if (aclose === -1) throw new Error(`Chiusura dell’array ${arrName} non trovata.`)

  const arrInner = fileContent.slice(abrack + 1, aclose)
  if (new RegExp(`'${escapeRegExp(id)}'\\s*,`).test(arrInner)) {
    throw new Error(`Id «${id}» già presente in ${arrName}.`)
  }

  const ldecl = `export const ${labelsName}`
  const lidx0 = fileContent.indexOf(ldecl)
  if (lidx0 === -1) throw new Error(`Dichiarazione ${labelsName} non trovata.`)
  const lopen0 = fileContent.indexOf('{', lidx0)
  const lclose0 = findClosingBraceIndex(fileContent, lopen0)
  if (lclose0 === -1) throw new Error(`Oggetto ${labelsName} non chiuso.`)
  const labelsInner0 = fileContent.slice(lopen0 + 1, lclose0)
  if (new RegExp(`^\\s*${escapeRegExp(id)}\\s*:`, 'm').test(labelsInner0)) {
    throw new Error(`Chiave «${id}» già presente in ${labelsName}.`)
  }

  const safeIdInStr = id.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const newArrLine = `  '${safeIdInStr}',\n`
  let next = fileContent.slice(0, aclose) + newArrLine + fileContent.slice(aclose)

  const lidx = next.indexOf(ldecl)
  const lopen = next.indexOf('{', lidx)
  const lclose = findClosingBraceIndex(next, lopen)
  if (lclose === -1) throw new Error(`Oggetto ${labelsName} non trovato dopo modifica array.`)

  let noteComment = ''
  const nt = note.trim()
  if (nt) {
    const oneLine = nt.replace(/\s+/g, ' ').slice(0, 160).replace(/\*\//g, '')
    noteComment = ` // ${oneLine}`
  }
  const labelKey = /^[a-z][a-z0-9_]*$/.test(id) ? id : `'${id.replace(/'/g, "\\'")}'`
  const labelLine = `  ${labelKey}: ${JSON.stringify(label)},${noteComment}\n`
  next = next.slice(0, lclose) + labelLine + next.slice(lclose)

  return next
}

/** Rimuove id da array accessori + etichette (stesso file `appendWazaAccessorioEntry`). */
export function removeWazaAccessorioFromPool(
  fileContent: string,
  kind: 'status' | 'counter' | 'condizione',
  id: string,
): string {
  const arrName =
    kind === 'status'
      ? 'WAZA_STATUS_APPLICABILI'
      : kind === 'counter'
        ? 'WAZA_COUNTER_APPLICABILI'
        : 'WAZA_CONDIZIONI_APPLICABILI'
  const labelsName =
    kind === 'status'
      ? 'WAZA_STATUS_APPLICABILI_LABELS'
      : kind === 'counter'
        ? 'WAZA_COUNTER_APPLICABILI_LABELS'
        : 'WAZA_CONDIZIONI_APPLICABILI_LABELS'
  const arrDecl = `export const ${arrName} = [`
  const aidx = fileContent.indexOf(arrDecl)
  if (aidx === -1) {
    throw new Error(`Dichiarazione ${arrName} non trovata in wazaPool.ts.`)
  }
  const abrack = fileContent.indexOf('[', aidx)
  const aclose = findClosingBracketIndex(fileContent, abrack)
  if (aclose === -1) throw new Error(`Chiusura dell’array ${arrName} non trovata.`)

  let arrInner = fileContent.slice(abrack + 1, aclose)
  const idTok = `'${id.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  const arrLineRe = new RegExp(`^\\s*${idTok}\\s*,\\s*\\n`, 'm')
  if (arrLineRe.test(arrInner)) {
    arrInner = arrInner.replace(arrLineRe, '')
  } else {
    const arrLineLast = new RegExp(`^\\s*${idTok}\\s*\\n`, 'm')
    if (!arrLineLast.test(arrInner)) {
      throw new Error(`Id «${id}» non trovato in ${arrName}.`)
    }
    arrInner = arrInner.replace(arrLineLast, '')
  }
  let next = fileContent.slice(0, abrack + 1) + arrInner + fileContent.slice(aclose)

  const ldecl = `export const ${labelsName}`
  const lidx = next.indexOf(ldecl)
  if (lidx === -1) throw new Error(`Dichiarazione ${labelsName} non trovata.`)
  const lopen = next.indexOf('{', lidx)
  const lclose = findClosingBraceIndex(next, lopen)
  if (lclose === -1) throw new Error(`Oggetto ${labelsName} non chiuso.`)

  const labelsInner = next.slice(lopen + 1, lclose)
  const simpleKey = /^[a-z][a-z0-9_]*$/.test(id)
  const labelLineRe = simpleKey
    ? new RegExp(`^\\s*${escapeRegExp(id)}\\s*:[^\\n]*\\n`, 'm')
    : new RegExp(`^\\s*${idTok}\\s*:[^\\n]*\\n`, 'm')
  if (!labelLineRe.test(labelsInner)) {
    throw new Error(`Chiave «${id}» non trovata in ${labelsName}.`)
  }
  const newLabelsInner = labelsInner.replace(labelLineRe, '')
  next = next.slice(0, lopen + 1) + newLabelsInner + next.slice(lclose)

  return next
}

export function appendToPoolArray(fileContent: string, decl: string, entry: string): string {
  const idx = fileContent.indexOf(decl)
  if (idx === -1) {
    throw new Error('Dichiarazione array pool non trovata nel file (decl mancante).')
  }
  const brack = fileContent.indexOf('[', idx + decl.length)
  if (brack === -1) throw new Error('Apertura [ dell’array pool non trovata.')
  const close = findClosingBracketIndex(fileContent, brack)
  if (close === -1) throw new Error('Chiusura ] dell’array pool non trovata.')

  const innerRaw = fileContent.slice(brack + 1, close)
  const trimmed = innerRaw.trim()
  const normalized = entry.trim()
  const withComma = normalized.endsWith(',') ? normalized : `${normalized},`

  let newInner: string
  if (trimmed === '') {
    newInner = `\n${withComma}\n`
  } else {
    const base = innerRaw.replace(/\s+$/, '')
    const sep = base.endsWith(',') ? '' : ','
    newInner = `${base}${sep}\n${withComma}\n`
  }

  return fileContent.slice(0, brack + 1) + newInner + fileContent.slice(close)
}
