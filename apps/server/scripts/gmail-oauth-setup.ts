/**
 * Setup una tantum OAuth Gmail → refresh token per invio via API (Render-friendly).
 *
 * Prerequisiti Google Cloud:
 * 1. Progetto con Gmail API abilitata
 * 2. OAuth client "Applicazione desktop" (o Web con redirect http://localhost:8765/oauth/callback)
 * 3. Schermata consenso: scope gmail.send, utente di test = oyasumi.staff@gmail.com (se in testing)
 *
 * Uso:
 *   GMAIL_OAUTH_CLIENT_ID=... GMAIL_OAUTH_CLIENT_SECRET=... bun run scripts/gmail-oauth-setup.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

for (const envPath of [
  resolve(import.meta.dir, '../../../.env'),
  resolve(import.meta.dir, '../../.env'),
  resolve(import.meta.dir, '../.env'),
]) {
  if (existsSync(envPath)) config({ path: envPath })
}

const CLIENT_ID = process.env.GMAIL_OAUTH_CLIENT_ID || ''
const CLIENT_SECRET = process.env.GMAIL_OAUTH_CLIENT_SECRET || ''
const REDIRECT_URI = 'http://localhost:8765/oauth/callback'
const SCOPE = 'https://www.googleapis.com/auth/gmail.send'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Imposta GMAIL_OAUTH_CLIENT_ID e GMAIL_OAUTH_CLIENT_SECRET nel .env')
  process.exit(1)
}

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', SCOPE)
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent')

console.log('\n=== Gmail OAuth setup Oyasumi ===\n')
console.log('1. Apri questo URL e accedi con oyasumi.staff@gmail.com:\n')
console.log(authUrl.toString())
console.log('\n2. Autorizza l\'app. Verrai reindirizzato a localhost:8765...\n')

const server = Bun.serve({
  port: 8765,
  async fetch(req) {
    const url = new URL(req.url)
    if (url.pathname !== '/oauth/callback') {
      return new Response('In attesa del callback OAuth…', { status: 404 })
    }

    const code = url.searchParams.get('code')
    const err = url.searchParams.get('error')
    if (err || !code) {
      server.stop()
      return new Response(`Errore OAuth: ${err || 'code mancante'}`, { status: 400 })
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    const data = (await tokenRes.json()) as {
      refresh_token?: string
      access_token?: string
      error?: string
      error_description?: string
    }

    server.stop()

    if (!tokenRes.ok || !data.refresh_token) {
      console.error('\n❌ Scambio token fallito:', data.error_description || data.error || data)
      return new Response('Scambio token fallito — vedi terminale.', { status: 500 })
    }

    console.log('\n✅ Refresh token ottenuto. Aggiungi al .env e su Render:\n')
    console.log(`GMAIL_OAUTH_REFRESH_TOKEN=${data.refresh_token}`)
    console.log('\n(Opzionale) Rimuovi RESEND_API_KEY su Render se passi solo a Gmail API.\n')

    return new Response(
      '<html><body><h1>OAuth OK</h1><p>Refresh token stampato nel terminale. Puoi chiudere questa scheda.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  },
})

console.log(`In ascolto su ${REDIRECT_URI} …\n`)
