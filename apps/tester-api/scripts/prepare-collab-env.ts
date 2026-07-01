#!/usr/bin/env bun
/**
 * Genera righe per .env del tester-api (hash password + JWT secret).
 * Non committare il file di input contenente password in chiaro.
 *
 * Uso:
 *   bun scripts/prepare-collab-env.ts ./collab-secrets.txt
 *
 * Formato collab-secrets.txt (una riga per utente, # = commento):
 *   alessandra   Panico
 *   davide       Pegaso
 */
import { readFileSync } from 'node:fs'

const path = process.argv[2]
if (!path) {
  console.error('Uso: bun scripts/prepare-collab-env.ts <file-secrets.txt>')
  process.exit(1)
}

const lines = readFileSync(path, 'utf8').split('\n')
const out: Record<string, string> = {}

for (const line of lines) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const sp = t.split(/\s+/)
  if (sp.length < 2) continue
  const u = sp[0]!.toLowerCase()
  const pw = sp.slice(1).join(' ')
  out[u] = await Bun.password.hash(pw, { algorithm: 'bcrypt', cost: 12 })
}

const jwtSecret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')
console.log(`TESTER_JWT_SECRET=${jwtSecret}`)
console.log(`TESTER_COLLAB_USERS=${JSON.stringify(out)}`)
