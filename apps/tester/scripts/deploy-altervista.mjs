/**
 * Build + upload della cartella dist/ su FTP Altervista.
 *
 * Credenziali (non committare):
 * - export ALTERVISTA_FTP_HOST=… ecc., oppure
 * - file `apps/tester/.altervista-deploy.env` (gitignored), righe KEY=value
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'basic-ftp'

const root = path.dirname(fileURLToPath(import.meta.url))
const testerRoot = path.dirname(root)
const dist = path.join(testerRoot, 'dist')
const deployEnvPath = path.join(testerRoot, '.altervista-deploy.env')

function loadDeployEnvFile() {
  if (!existsSync(deployEnvPath)) return
  const text = readFileSync(deployEnvPath, 'utf8')
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '').trim()
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i <= 0) continue
    const key = line.slice(0, i).trim()
    let val = line.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

function truthy(v) {
  return v === '1' || v === 'true' || v === 'yes'
}

async function main() {
  loadDeployEnvFile()

  const host = process.env.ALTERVISTA_FTP_HOST?.trim()
  const user = process.env.ALTERVISTA_FTP_USER?.trim()
  const password = process.env.ALTERVISTA_FTP_PASSWORD
  const remoteDir = process.env.ALTERVISTA_FTP_DIR?.trim()
  const secure = truthy(process.env.ALTERVISTA_FTP_SECURE ?? '')

  if (!host || !user || password === undefined || password === '') {
    console.error(
      'Mancano credenziali FTP. Imposta ALTERVISTA_FTP_HOST, ALTERVISTA_FTP_USER, ALTERVISTA_FTP_PASSWORD\n' +
        '(export oppure file .altervista-deploy.env — vedi .altervista-deploy.env.example)'
    )
    process.exit(1)
  }

  console.log('Build...')
  execFileSync('npm', ['run', 'build'], { cwd: testerRoot, stdio: 'inherit' })

  const distIndex = path.join(dist, 'index.html')
  if (!existsSync(distIndex)) {
    console.error('dist/index.html assente dopo la build.')
    process.exit(1)
  }

  const apiUrl =
    process.env.ALTERVISTA_TESTER_API_URL?.trim().replace(/\/$/, '') ??
    process.env.VITE_TESTER_API_URL?.trim().replace(/\/$/, '')
  if (apiUrl) {
    let html = readFileSync(distIndex, 'utf8')
    const replaced = html.replace(
      /<meta\s+name="oyasumi-tester-api"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="oyasumi-tester-api" content="${apiUrl.replace(/"/g, '&quot;')}" />`,
    )
    if (replaced === html) {
      console.warn(
        '[deploy] Tag meta oyasumi-tester-api non trovato in dist/index.html; saltata iniezione URL.',
      )
    } else {
      writeFileSync(distIndex, replaced, 'utf8')
      console.log(`[deploy] Iniettato URL tester-api in index.html (${apiUrl})`)
    }
  } else {
    console.log(
      '[deploy] ALTERVISTA_TESTER_API_URL assente: l’HTML avrà meta vuoto (login Idee mostra istruzioni finché non configuri URL).',
    )
  }

  const client = new Client()
  client.ftp.verbose = truthy(process.env.FTP_VERBOSE ?? '')

  console.log(`FTP → ${host}${remoteDir ? ` (${remoteDir})` : ''}…`)
  await client.access({ host, user, password, secure })

  if (remoteDir) {
    await client.ensureDir(remoteDir)
    await client.cd(remoteDir)
  }

  await client.uploadFromDir(dist)
  client.close()

  console.log('Upload completato.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
