/**
 * Aggiorna solo admin_key in api/config.php sul server FTP (senza toccare jwt / collab_users).
 *
 * Credenziali: come deploy-php-altervista.mjs (.altervista-deploy.env).
 *
 * Env:
 *   ALTERVISTA_NEW_ADMIN_KEY — se valorizzata, usa quella; altrimenti genera una chiave casuale.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'basic-ftp'

const testerRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const phpPkgRoot = path.resolve(testerRoot, '../tester-altervista-php')
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

function escapePhpSingleQuotedString(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function upsertCredAdminKey(credPath, adminKey) {
  const line = `admin_key=${adminKey}`
  if (existsSync(credPath)) {
    let text = readFileSync(credPath, 'utf8')
    if (/^admin_key=/m.test(text)) {
      text = text.replace(/^admin_key=.*$/m, line)
    } else {
      text = text.trimEnd() + '\n' + line + '\n'
    }
    writeFileSync(credPath, text, 'utf8')
  } else {
    const stamp = new Date().toISOString()
    writeFileSync(
      credPath,
      `# Aggiornato da update-php-admin-key.mjs (${stamp})\n${line}\n`,
      'utf8',
    )
  }
}

async function main() {
  loadDeployEnvFile()

  const host = process.env.ALTERVISTA_FTP_HOST?.trim()
  const ftpUser = process.env.ALTERVISTA_FTP_USER?.trim()
  const password = process.env.ALTERVISTA_FTP_PASSWORD
  const remoteDir = process.env.ALTERVISTA_FTP_DIR?.trim()
  const secure = truthy(process.env.ALTERVISTA_FTP_SECURE ?? '')

  if (!host || !ftpUser || password === undefined || password === '') {
    console.error('Mancano credenziali FTP (.altervista-deploy.env).')
    process.exit(1)
  }

  const envKey = process.env.ALTERVISTA_NEW_ADMIN_KEY?.trim()
  const newKey =
    envKey && envKey !== ''
      ? envKey
      : randomBytes(21).toString('base64url') + randomBytes(3).toString('base64url')

  const tmpDl = path.join(os.tmpdir(), `oyasumi-config-dl-${Date.now()}.php`)

  const client = new Client()
  client.ftp.verbose = truthy(process.env.FTP_VERBOSE ?? '')
  await client.access({ host, user: ftpUser, password, secure })

  if (remoteDir) {
    await client.ensureDir(remoteDir)
    await client.cd(remoteDir)
  }

  try {
    await client.downloadTo(tmpDl, 'api/config.php')
  } catch (e) {
    client.close()
    console.error('Download api/config.php fallito:', e)
    process.exit(1)
  }

  let src = readFileSync(tmpDl, 'utf8')
  unlinkSync(tmpDl)

  const adminRe = /(\s*'admin_key'\s*=>\s*)'(?:[^'\\]|\\.)*'/
  if (!adminRe.test(src)) {
    client.close()
    console.error(
      "Nel config.php remoto non ho trovato una riga 'admin_key' => '...' da sostituire.",
    )
    process.exit(1)
  }

  const escaped = escapePhpSingleQuotedString(newKey)
  const out = src.replace(adminRe, `$1'${escaped}'`)

  const tmpUl = path.join(os.tmpdir(), `oyasumi-config-ul-${Date.now()}.php`)
  writeFileSync(tmpUl, out, 'utf8')
  try {
    await client.uploadFrom(tmpUl, 'api/config.php')
  } finally {
    unlinkSync(tmpUl)
    client.close()
  }

  const credPath = path.join(phpPkgRoot, '.php-deploy-credentials.local')
  upsertCredAdminKey(credPath, newKey)

  console.log('')
  console.log('OK: admin_key aggiornata sul server e in .php-deploy-credentials.local')
  console.log('')
  console.log('--- CHIAVE ADMIN (conservala in luogo sicuro) ---')
  console.log(newKey)
  console.log('-----------------------------------------------')
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
