import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

for (const envPath of [
  resolve(import.meta.dir, '../../../.env'),
  resolve(import.meta.dir, '../../.env'),
]) {
  if (existsSync(envPath)) {
    config({ path: envPath })
  }
}

export const JWT_SECRET = process.env.JWT_SECRET || 'secret-di-sviluppo-non-sicuro-12345'
export const APP_URL = process.env.APP_URL || 'http://localhost:3000'

export const IS_RENDER = process.env.RENDER === 'true'
export const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' || IS_RENDER

/** Forza provider: gmail-api | resend | gmail-smtp (vuoto = auto) */
export const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase()

/** Gmail API OAuth — consigliato su Render (HTTPS, nessun dominio) */
export const GMAIL_OAUTH_CLIENT_ID = process.env.GMAIL_OAUTH_CLIENT_ID || ''
export const GMAIL_OAUTH_CLIENT_SECRET = process.env.GMAIL_OAUTH_CLIENT_SECRET || ''
export const GMAIL_OAUTH_REFRESH_TOKEN = process.env.GMAIL_OAUTH_REFRESH_TOKEN || ''

/** Resend (HTTPS) — richiede dominio verificato per destinatari esterni */
export const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
export const EMAIL_FROM = process.env.EMAIL_FROM || 'Oyasumi <onboarding@resend.dev>'

/** Gmail SMTP — solo sviluppo locale (Render free blocca porte SMTP) */
export const EMAIL_USER = process.env.EMAIL_USER || 'oyasumi.staff@gmail.com'
export const EMAIL_PASS = process.env.EMAIL_PASS || ''
export const REGISTRATION_NOTIFY_EMAIL =
  process.env.REGISTRATION_NOTIFY_EMAIL || 'oyasumi.staff@gmail.com'
export const GMAIL_FROM_WELCOME =
  process.env.GMAIL_FROM_WELCOME || '"Oyasumi Staff" <oyasumi.staff@gmail.com>'
export const GMAIL_FROM_NOTIFY =
  process.env.GMAIL_FROM_NOTIFY || '"Notifiche Oyasumi" <oyasumi.staff@gmail.com>'
