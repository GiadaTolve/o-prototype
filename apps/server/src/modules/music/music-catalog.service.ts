import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const AUDIO_EXT = /\.(mp3|wav|ogg|m4a)$/i

export type CatalogSong = {
  filename: string
  title: string
  url: string
  sourceType: 'file' | 'url'
  origin: 'local' | 'remote'
}

const DEFAULT_REMOTE_BASE =
  process.env.MUSIC_CATALOG_URL?.trim() ||
  'https://senmoyka.altervista.org/musicaoyasumi/'

/** File noti se né listing né manifest sono raggiungibili. */
const REMOTE_FALLBACK_FILES = ['RunningUpThatHill.mp3']

const LOCAL_MANIFEST_PATH = join(import.meta.dir, '../../../data/music-remote-manifest.json')

let remoteCache: { at: number; songs: CatalogSong[]; error?: string } | null = null
const REMOTE_CACHE_MS = 5 * 60 * 1000

export function titleFromFilename(filename: string): string {
  const name = filename.replace(AUDIO_EXT, '')
  if (name.includes('.')) {
    return name
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' - ')
  }
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function normalizeBaseUrl(base: string): string {
  return base.endsWith('/') ? base : `${base}/`
}

function toRemoteSong(filename: string, baseUrl: string): CatalogSong {
  const encoded = filename
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
  return {
    filename: `remote:${filename}`,
    title: titleFromFilename(filename),
    url: `${baseUrl}${encoded}`,
    sourceType: 'url',
    origin: 'remote',
  }
}

function parseDirectoryListing(html: string, baseUrl: string): string[] {
  const found = new Set<string>()
  const hrefRegex = /href=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = decodeURIComponent(match[1].trim())
    if (!href || href.startsWith('?') || href.startsWith('#') || href.includes('..')) continue
    const file = href.split('/').pop() ?? ''
    if (AUDIO_EXT.test(file)) found.add(file)
  }
  return [...found]
}

function parseManifest(body: string): string[] {
  try {
    const data = JSON.parse(body) as unknown
    if (Array.isArray(data)) {
      return data.filter((f): f is string => typeof f === 'string' && AUDIO_EXT.test(f))
    }
    if (data && typeof data === 'object' && Array.isArray((data as { files?: unknown }).files)) {
      return (data as { files: unknown[] }).files.filter(
        (f): f is string => typeof f === 'string' && AUDIO_EXT.test(f),
      )
    }
  } catch {
    /* manifest assente o non JSON */
  }
  return []
}

async function loadLocalManifestFiles(): Promise<string[]> {
  try {
    const raw = await readFile(LOCAL_MANIFEST_PATH, 'utf-8')
    return parseManifest(raw)
  } catch {
    return []
  }
}

const CATALOG_SCRIPT =
  process.env.MUSIC_CATALOG_SCRIPT?.trim() || 'catalog.php'

async function fetchJsonCatalog(url: string): Promise<string[] | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) return null
    const text = await res.text()
    if (/scheduled maintenance|briefly unavailable|<!DOCTYPE html>/i.test(text)) return null
    const files = parseManifest(text)
    return files.length > 0 ? files : null
  } catch {
    return null
  }
}

async function fetchRemoteFilenames(baseUrl: string): Promise<{
  files: string[]
  error?: string
  source?: 'catalog.php' | 'manifest.json' | 'directory' | 'local-manifest' | 'fallback'
}> {
  const now = Date.now()
  if (remoteCache && now - remoteCache.at < REMOTE_CACHE_MS) {
    return {
      files: remoteCache.songs.map((s) => s.filename.replace(/^remote:/, '')),
      error: remoteCache.error,
    }
  }

  const files = new Set<string>()
  let error: string | undefined
  let source: 'catalog.php' | 'manifest.json' | 'directory' | 'local-manifest' | 'fallback' | undefined

  const catalogFiles = await fetchJsonCatalog(`${baseUrl}${CATALOG_SCRIPT}`)
  if (catalogFiles) {
    for (const f of catalogFiles) files.add(f)
    source = 'catalog.php'
  }

  if (files.size === 0) {
    const manifestFiles = await fetchJsonCatalog(`${baseUrl}manifest.json`)
    if (manifestFiles) {
      for (const f of manifestFiles) files.add(f)
      source = 'manifest.json'
    }
  }

  if (files.size === 0) {
    try {
      const listingRes = await fetch(baseUrl, {
        headers: { Accept: 'text/html' },
        signal: AbortSignal.timeout(12_000),
      })
      if (!listingRes.ok) {
        error = `Catalogo remoto non disponibile (HTTP ${listingRes.status})`
      } else {
        const html = await listingRes.text()
        if (/scheduled maintenance|briefly unavailable/i.test(html)) {
          error = 'Hosting Altervista in manutenzione'
        } else {
          for (const f of parseDirectoryListing(html, baseUrl)) files.add(f)
          if (files.size > 0) source = 'directory'
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Catalogo remoto non raggiungibile'
    }
  }

  if (files.size === 0) {
    const local = await loadLocalManifestFiles()
    for (const f of local) files.add(f)
    if (files.size > 0) source = 'local-manifest'
  }

  if (files.size === 0) {
    for (const f of REMOTE_FALLBACK_FILES) files.add(f)
    if (files.size > 0) source = 'fallback'
  }

  if (source === 'fallback') {
    error =
      'Nessun catalogo musica trovato. Carica catalog.php su Altervista (vedi apps/server/scripts/altervista-music-catalog.php) oppure aggiorna apps/server/data/music-remote-manifest.json'
  } else if (files.size === 0 && error) {
    error = `${error}. Carica catalog.php su Altervista per l'aggiornamento automatico.`
  } else if (files.size > 0) {
    error = undefined
  }

  const songs = [...files]
    .sort((a, b) => titleFromFilename(a).localeCompare(titleFromFilename(b)))
    .map((f) => toRemoteSong(f, baseUrl))

  remoteCache = { at: now, songs, error }
  return { files: [...files], error, source }
}

async function getLocalSongs(): Promise<CatalogSong[]> {
  try {
    const musicDir = join(process.cwd(), 'apps', 'client', 'public', 'musica')
    const files = await readdir(musicDir)
    return files
      .filter((file) => AUDIO_EXT.test(file))
      .map((file) => ({
        filename: file,
        title: titleFromFilename(file),
        url: `/musica/${file}`,
        sourceType: 'file' as const,
        origin: 'local' as const,
      }))
      .sort((a, b) => a.title.localeCompare(b.title))
  } catch {
    return []
  }
}

export async function getAvailableSongs(): Promise<{
  songs: CatalogSong[]
  remoteBaseUrl: string
  remoteWarning?: string
  remoteHint?: string
  remoteSource?: string
}> {
  const baseUrl = normalizeBaseUrl(DEFAULT_REMOTE_BASE)
  const [local, remoteResult] = await Promise.all([
    getLocalSongs(),
    fetchRemoteFilenames(baseUrl),
  ])

  const remoteSongs = remoteResult.files.map((f) => toRemoteSong(f, baseUrl))
  const byUrl = new Map<string, CatalogSong>()
  for (const song of [...remoteSongs, ...local]) {
    byUrl.set(song.url, song)
  }

  const songs = [...byUrl.values()].sort((a, b) => a.title.localeCompare(b.title))
  const remoteHint =
    remoteResult.source === 'local-manifest'
      ? `Elenco da manifest locale (${remoteResult.files.length} brani). Per aggiornamento automatico carica catalog.php su Altervista.`
      : remoteResult.source === 'catalog.php'
        ? `Catalogo automatico Altervista (${remoteResult.files.length} brani).`
        : undefined

  return {
    songs,
    remoteBaseUrl: baseUrl,
    remoteWarning: remoteResult.error,
    remoteHint,
    remoteSource: remoteResult.source,
  }
}
