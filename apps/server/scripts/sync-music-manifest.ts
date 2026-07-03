import { writeFile } from 'fs/promises'
import { join } from 'path'
import { getAvailableSongs } from '../src/modules/music/music-catalog.service'

const LOCAL_MANIFEST_PATH = join(import.meta.dir, '../data/music-remote-manifest.json')
const CATALOG_PHP_URL =
  process.env.MUSIC_CATALOG_URL?.trim()?.replace(/\/?$/, '/catalog.php') ||
  'https://senmoyka.altervista.org/musicaoyasumi/catalog.php'

async function main() {
  console.log('→ Provo catalog.php:', CATALOG_PHP_URL)
  try {
    const res = await fetch(CATALOG_PHP_URL, { signal: AbortSignal.timeout(15_000) })
    const text = await res.text()
    if (!res.ok) {
      console.error(`❌ catalog.php HTTP ${res.status}`)
      process.exit(1)
    }
    const data = JSON.parse(text) as unknown
    if (!Array.isArray(data) || data.some((f) => typeof f !== 'string')) {
      console.error('❌ Risposta catalog.php non valida (atteso array di stringhe)')
      process.exit(1)
    }
    await writeFile(LOCAL_MANIFEST_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
    console.log(`✅ Manifest locale aggiornato (${data.length} brani)`)
    return
  } catch (e) {
    console.warn('⚠️  catalog.php non disponibile:', e instanceof Error ? e.message : e)
  }

  const { songs, remoteWarning } = await getAvailableSongs()
  const remote = songs.filter((s) => s.origin === 'remote').map((s) => s.filename.replace(/^remote:/, ''))
  if (remote.length === 0) {
    console.error('❌ Nessun brano remoto trovato.', remoteWarning ?? '')
    process.exit(1)
  }
  await writeFile(LOCAL_MANIFEST_PATH, `${JSON.stringify(remote, null, 2)}\n`, 'utf-8')
  console.log(`✅ Manifest locale aggiornato da fallback (${remote.length} brani)`)
  if (remoteWarning) console.log('ℹ️ ', remoteWarning)
}

main().catch((err) => {
  console.error('❌', err)
  process.exit(1)
})
