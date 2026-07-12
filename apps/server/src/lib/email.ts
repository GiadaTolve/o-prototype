import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import {
  APP_URL,
  REGISTRATION_NOTIFY_EMAIL,
  EMAIL_USER,
  EMAIL_PASS,
  GMAIL_FROM_WELCOME,
  GMAIL_FROM_NOTIFY,
  RESEND_API_KEY,
  EMAIL_FROM,
  EMAIL_PROVIDER,
  IS_RENDER,
} from '../config'
import { isGmailApiConfigured, sendViaGmailApi } from './gmail-api'

const REPLY_TO = process.env.EMAIL_REPLY_TO || REGISTRATION_NOTIFY_EMAIL

export type EmailProvider = 'gmail-api' | 'resend' | 'gmail-smtp' | 'none'

type MailPayload = {
  to: string
  subject: string
  html: string
  text: string
  gmailFrom?: string
}

export type MailSendResult = { ok: boolean; error?: string }

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolveAutoProvider(): EmailProvider {
  if (isGmailApiConfigured()) return 'gmail-api'
  if (RESEND_API_KEY) return 'resend'
  if (EMAIL_PASS) return 'gmail-smtp'
  return 'none'
}

export function getEmailProvider(): EmailProvider {
  if (EMAIL_PROVIDER === 'gmail-api' || EMAIL_PROVIDER === 'resend' || EMAIL_PROVIDER === 'gmail-smtp') {
    return EMAIL_PROVIDER
  }
  return resolveAutoProvider()
}

export function emailConfigStatus() {
  const provider = getEmailProvider()
  const usingResendTestDomain = EMAIL_FROM.includes('@resend.dev')
  const warnings: string[] = []

  if (provider === 'none') {
    warnings.push(
      'Configura Gmail API OAuth (Render), RESEND_API_KEY (+ dominio), o EMAIL_PASS (solo locale).',
    )
  } else if (provider === 'gmail-api' && !isGmailApiConfigured()) {
    warnings.push('EMAIL_PROVIDER=gmail-api ma mancano GMAIL_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN.')
  } else if (provider === 'gmail-smtp' && IS_RENDER) {
    warnings.push(
      'Su Render il piano free blocca SMTP (587). Usa Gmail API OAuth o Resend con dominio verificato.',
    )
  } else if (provider === 'resend' && usingResendTestDomain) {
    warnings.push(
      'EMAIL_FROM usa @resend.dev: Resend invia solo all\'email dell\'account. Verifica un dominio o passa a Gmail API.',
    )
  }

  const fromByProvider: Record<EmailProvider, string> = {
    'gmail-api': GMAIL_FROM_WELCOME,
    resend: EMAIL_FROM,
    'gmail-smtp': GMAIL_FROM_WELCOME,
    none: GMAIL_FROM_WELCOME,
  }

  return {
    configured: provider !== 'none' && !(provider === 'gmail-api' && !isGmailApiConfigured()),
    provider,
    from: fromByProvider[provider],
    notifyTo: REGISTRATION_NOTIFY_EMAIL,
    replyTo: REPLY_TO,
    usingResendTestDomain: provider === 'resend' && usingResendTestDomain,
    gmailApiReady: isGmailApiConfigured(),
    warning: warnings.length > 0 ? warnings.join(' ') : null,
  }
}

function getResend() {
  if (!RESEND_API_KEY) return null
  return new Resend(RESEND_API_KEY)
}

function getGmailTransporter() {
  if (!EMAIL_PASS) return null
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
    tls: { minVersion: 'TLSv1.2' },
  })
}

function formatResendError(error: { message: string; name?: string }) {
  return error.name ? `${error.name}: ${error.message}` : error.message
}

async function sendViaResend(payload: MailPayload): Promise<MailSendResult> {
  const resend = getResend()
  if (!resend) return { ok: false, error: 'RESEND_API_KEY non configurato' }

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [payload.to],
    replyTo: REPLY_TO,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })

  if (error) {
    return { ok: false, error: formatResendError(error) }
  }
  return { ok: true }
}

async function sendViaGmailSmtp(payload: MailPayload): Promise<MailSendResult> {
  const transporter = getGmailTransporter()
  if (!transporter) return { ok: false, error: 'EMAIL_PASS non configurato' }

  try {
    await transporter.sendMail({
      from: payload.gmailFrom ?? GMAIL_FROM_WELCOME,
      to: payload.to,
      replyTo: REPLY_TO,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

async function sendMail(payload: MailPayload): Promise<MailSendResult> {
  const provider = getEmailProvider()
  if (provider === 'gmail-api') {
    return sendViaGmailApi({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      from: payload.gmailFrom ?? GMAIL_FROM_WELCOME,
      replyTo: REPLY_TO,
    })
  }
  if (provider === 'resend') return sendViaResend(payload)
  if (provider === 'gmail-smtp') return sendViaGmailSmtp(payload)
  return { ok: false, error: 'Nessun provider email configurato' }
}

export async function sendTestEmail(to: string): Promise<MailSendResult> {
  const status = emailConfigStatus()
  if (!status.configured) {
    return { ok: false, error: status.warning ?? 'Email non configurata' }
  }

  return sendMail({
    to,
    subject: 'Oyasumi — Test email',
    gmailFrom: GMAIL_FROM_NOTIFY,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Test invio email Oyasumi.</p>
        <p><strong>Provider:</strong> ${escapeHtml(status.provider)}</p>
        <p><strong>Mittente:</strong> ${escapeHtml(status.from)}</p>
      </div>
    `,
    text: `Test email Oyasumi (${status.provider})`,
  })
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<MailSendResult> {
  if (getEmailProvider() === 'none') {
    console.warn('[Email] Nessun provider. Link reset (solo dev):', `${APP_URL}/auth/reset-password?token=${token}`)
    return { ok: true }
  }

  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

  return sendMail({
    to,
    subject: 'Oyasumi — Reimposta la password',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 480px;">
        <h2 style="color: #333;">Oyasumi</h2>
        <p>Hai richiesto il reset della password. Clicca il link qui sotto per impostarne una nuova:</p>
        <p><a href="${resetUrl}">Reimposta password</a></p>
        <p style="color: #888; font-size: 12px;">Il link scade tra 1 ora. Se non hai richiesto il reset, ignora questa email.</p>
      </div>
    `,
    text: `Reimposta la password: ${resetUrl}\n\nIl link scade tra 1 ora.`,
  })
}

export type RegistrationEmailResult = {
  welcome: MailSendResult
  staff: MailSendResult
}

export async function sendRegistrationEmails(params: {
  email: string
  password: string
  characterName: string
  userId: string
  playerPreferences?: string
}): Promise<RegistrationEmailResult> {
  const { email, password, characterName, userId, playerPreferences } = params
  const nomePg = escapeHtml(characterName)
  const emailSafe = escapeHtml(email)
  const passwordSafe = escapeHtml(password)
  const prefs = escapeHtml(playerPreferences?.trim() || 'Nessuna preferenza espressa.')

  const welcomeHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Ciao ${nomePg}!</h2>
      <p>Siamo felicissimi di darti il benvenuto nel mondo oscuro e onirico di <strong>Oyasumi</strong>.</p>
      <p>Il tuo account è stato creato con successo. Ecco un riepilogo dei tuoi dati:</p>
      <ul>
        <li><strong>Nome Personaggio:</strong> ${nomePg}</li>
        <li><strong>Email:</strong> ${emailSafe}</li>
        <li><strong>Password:</strong> ${passwordSafe}</li>
      </ul>
      <p>Custodisci queste informazioni e preparati a vivere la tua avventura.</p>
      <p>A presto,<br/>Lo Staff di Oyasumi</p>
    </div>
  `

  const staffHtml = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>Un nuovo sognatore si è unito a noi!</h2>
      <p>Un nuovo utente si è registrato su Oyasumi:</p>
      <ul>
        <li><strong>ID Utente:</strong> ${escapeHtml(userId)}</li>
        <li><strong>Nome Personaggio:</strong> ${nomePg}</li>
        <li><strong>Email:</strong> ${emailSafe}</li>
      </ul>
      <hr>
      <h3>Preferenze/Note del Giocatore:</h3>
      <p style="background-color: #f4f4f4; border-left: 4px solid #ccc; padding: 10px; font-style: italic;">
        ${prefs}
      </p>
    </div>
  `

  const welcome = await sendMail({
    to: email,
    subject: 'Benvenuto in Oyasumi! Il tuo viaggio ha inizio!',
    gmailFrom: GMAIL_FROM_WELCOME,
    html: welcomeHtml,
    text: `Benvenuto in Oyasumi, ${characterName}.`,
  })

  if (!welcome.ok) {
    console.error(`[Email] Benvenuto non inviato a ${email}:`, welcome.error)
  }

  const staff = await sendMail({
    to: REGISTRATION_NOTIFY_EMAIL,
    subject: `🔔 Nuova Registrazione: ${characterName}`,
    gmailFrom: GMAIL_FROM_NOTIFY,
    html: staffHtml,
    text: `Nuova registrazione: ${characterName} (${email})`,
  })

  if (!staff.ok) {
    console.error(`[Email] Notifica staff non inviata:`, staff.error)
  }

  if (welcome.ok && staff.ok) {
    console.log(`✅ Registrazione ${characterName}: email inviate (${getEmailProvider()}).`)
  } else {
    console.warn(
      `[Email] Registrazione ${characterName}: email parziali (benvenuto=${welcome.ok}, staff=${staff.ok}).`,
    )
  }

  return { welcome, staff }
}
