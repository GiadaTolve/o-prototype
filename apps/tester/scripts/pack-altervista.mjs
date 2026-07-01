/**
 * Dopo la build, crea oyasumi-tester-altervista.zip con il contenuto di dist/
 * (richiede `zip` in PATH: macOS/Linux; su Windows usa 7-Zip o comprimi dist/ a mano).
 */
import { execFileSync } from 'node:child_process'
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const testerRoot = path.dirname(root)
const dist = path.join(testerRoot, 'dist')
const outZip = path.join(testerRoot, 'oyasumi-tester-altervista.zip')

async function main() {
  try {
    const s = await stat(dist)
    if (!s.isDirectory()) throw new Error('dist non è una directory')
  } catch {
    console.error('Cartella dist/ assente. Esegui prima: npm run build')
    process.exit(1)
  }
  const entries = await readdir(dist)
  if (!entries.length) {
    console.error('dist/ è vuota.')
    process.exit(1)
  }

  try {
    execFileSync('zip', ['-r', '-q', outZip, '.', '-x', '.DS_Store'], {
      cwd: dist,
      stdio: 'inherit',
    })
  } catch {
    console.error(
      'Comando zip non disponibile. Apri la cartella dist/ e crea uno zip del contenuto (non la cartella dist stessa).'
    )
    process.exit(1)
  }
  console.log(`Creato: ${outZip}`)
}

main()
