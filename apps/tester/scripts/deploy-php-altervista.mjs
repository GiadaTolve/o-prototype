/**
 * Upload dell’API PHP (apps/tester-altervista-php) su Altervista via FTP.
 *
 * Genera api/config.php (jwt, chiavi admin) e collab_users fissi (hash bcrypt).
 * Scrive file gitignored con admin_key / contribute_key — NON committare.
 *
 * Credenziali FTP: come deploy-altervista.mjs (.altervista-deploy.env).
 *
 * Env opzionali:
 *   ALTERVISTA_SITE_ORIGIN — es. https://oyasumi.altervista.org (per CORS, default da ALTERVISTA_TESTER_API_URL o questo)
 *   ALTERVISTA_PHP_SOURCES_ONLY=1 — carica solo index.php, helpers, .htaccess (non rigenera config né credenziali)
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'basic-ftp'

/** Utenti collaboratore (login: minuscolo). Solo hash bcrypt nel repo. */
const COLLAB_USERS_BCRYPT = {
  alessandra: '$2y$12$1fR0YM7x8b203f9yTAaSxOPng4Yua0B.NyXBllfqQcyFqsMAdFVee',
  davide: '$2y$12$/ORjFM7ekBLLQJPDESYi7OuPWnZx8FbFOfUDY25ipoM7RvTqcyzxe',
  nicolas: '$2y$12$va.xnIK6SvUbcAO38befL.SxoTXsBs.02mSn/.q07162eXvVmIAHm',
  giada: '$2y$12$iIq3d1crBXUA1BDHTQzdU.oOhuq0KLuy1g1JG1owZN8EEOR30LOzq',
}

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

function collabUsersPhpBlock() {
  const lines = Object.entries(COLLAB_USERS_BCRYPT).map(
    ([user, hash]) =>
      `    '${escapePhpSingleQuotedString(user)}' => '${escapePhpSingleQuotedString(hash)}',`,
  )
  return lines.join('\n')
}

async function main() {
  loadDeployEnvFile()

  const host = process.env.ALTERVISTA_FTP_HOST?.trim()
  const user = process.env.ALTERVISTA_FTP_USER?.trim()
  const password = process.env.ALTERVISTA_FTP_PASSWORD
  const remoteDir = process.env.ALTERVISTA_FTP_DIR?.trim()
  const secure = truthy(process.env.ALTERVISTA_FTP_SECURE ?? '')

  const siteOrigin = (
    process.env.ALTERVISTA_SITE_ORIGIN?.trim() ||
    process.env.ALTERVISTA_TESTER_API_URL?.trim() ||
    'https://oyasumi.altervista.org'
  ).replace(/\/$/, '')

  if (!host || !user || password === undefined || password === '') {
    console.error(
      'Mancano credenziali FTP (ALTERVISTA_FTP_HOST, USER, PASSWORD o .altervista-deploy.env).',
    )
    process.exit(1)
  }

  const apiDir = path.join(phpPkgRoot, 'api')
  if (!existsSync(path.join(apiDir, 'index.php'))) {
    console.error(`Cartella API assente: ${apiDir}`)
    process.exit(1)
  }

  const sourcesOnly = truthy(process.env.ALTERVISTA_PHP_SOURCES_ONLY ?? '')
  let tmpConfig = ''

  if (!sourcesOnly) {
    const jwtSecret = randomBytes(32).toString('hex')
    const adminKey = randomBytes(24).toString('base64url')
    const contributeKey = randomBytes(24).toString('base64url')

    const corsLine = `  'cors_origins' => ['${escapePhpSingleQuotedString(siteOrigin)}', 'http://localhost:5173'],`

    const configPhp = `<?php
declare(strict_types=1);

return [
  'data_file' => dirname(__DIR__) . '/oyasumi-data/contributions.jsonl',
  'jwt_secret' => '${escapePhpSingleQuotedString(jwtSecret)}',
  'collab_users' => [
${collabUsersPhpBlock()}
  ],
  'admin_key' => '${escapePhpSingleQuotedString(adminKey)}',
  'contribute_key' => '${escapePhpSingleQuotedString(contributeKey)}',
${corsLine}
];
`

    tmpConfig = path.join(os.tmpdir(), `oyasumi-php-config-${Date.now()}.php`)
    writeFileSync(tmpConfig, configPhp, 'utf8')

    const credPath = path.join(phpPkgRoot, '.php-deploy-credentials.local')
    const credText =
      `# Generato da deploy-php-altervista.mjs — non committare.\n` +
      `# Data: ${new Date().toISOString()}\n` +
      `site_origin=${siteOrigin}\n` +
      `# Login collaboratori (minuscolo): alessandra, davide, nicolas, giada — password come da voi definite.\n` +
      `admin_key=${adminKey}\n` +
      `contribute_key=${contributeKey}\n`
    writeFileSync(credPath, credText, 'utf8')

    console.log(`Chiavi admin/export salvate in ${credPath} (non committare).`)
  } else {
    console.log('Solo sorgenti: config.php sul server non viene sovrascritto.')
  }

  const client = new Client()
  client.ftp.verbose = truthy(process.env.FTP_VERBOSE ?? '')

  console.log(`FTP PHP API → ${host}${remoteDir ? ` (${remoteDir})` : ''}…`)
  await client.access({ host, user, password, secure })

  if (remoteDir) {
    await client.ensureDir(remoteDir)
    await client.cd(remoteDir)
  }

  const deployRoot = await client.pwd()
  // ensureDir sposta la cwd nell’ultimo segmento: tornare a deployRoot tra alberi disjoint.
  await client.ensureDir('api/inc')
  await client.cd(deployRoot)
  await client.ensureDir('oyasumi-data')
  await client.cd(deployRoot)

  await client.uploadFrom(path.join(apiDir, 'index.php'), 'api/index.php')
  await client.uploadFrom(path.join(apiDir, '.htaccess'), 'api/.htaccess')
  await client.uploadFrom(path.join(apiDir, 'inc', 'helpers.php'), 'api/inc/helpers.php')
  if (!sourcesOnly && tmpConfig) {
    await client.uploadFrom(tmpConfig, 'api/config.php')
    unlinkSync(tmpConfig)
  }

  const dataHt = path.join(phpPkgRoot, 'data', '.htaccess')
  if (existsSync(dataHt)) {
    await client.uploadFrom(dataHt, 'oyasumi-data/.htaccess')
  }

  client.close()

  console.log('Upload API PHP completato.')
  if (!sourcesOnly) {
    console.log(`CORS: ${siteOrigin}, localhost:5173`)
    console.log(
      'Login collaboratori: alessandra, davide, nicolas, giada (minuscolo nel form).',
    )
    console.log(
      `Meta tester: imposta ALTERVISTA_TESTER_API_URL=${siteOrigin} e riesegui deploy tester.`,
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
