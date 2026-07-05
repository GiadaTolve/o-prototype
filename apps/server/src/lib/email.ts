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
  IS_RENDER,
} from '../config'

const REPLY_TO = process.env.EMAIL_REPLY_TO || REGISTRATION_NOTIFY_EMAIL

type EmailProvider = 'resend' | 'gmail' | 'none'

type MailPayload = {
  to: string
  subject: string
  html: string
  text: string
  /** Solo Gmail: mittente con nome display prerelease */
  gmailFrom?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Resend ha priorità (funziona su Render); Gmail solo in locale senza API key. */
export function getEmailProvider(): EmailProvider {
  if (RESEND_API_KEY) return 'resend'
  if (EMAIL_PASS) return 'gmail'
  return 'none'
}

export function emailConfigStatus() {
  const provider = getEmailProvider()
  const usingResendTestDomain = EMAIL_FROM.includes('@resend.dev')
  const warnings: string[] = []

  if (provider === 'none') {
    warnings.push(
      'Configura RESEND_API_KEY (produzione/Render) oppure EMAIL_PASS (solo sviluppo locale).',
    )
  } else if (provider === 'gmail' && IS_RENDER) {
    warnings.push(
      'Su Render la posta SMTP Gmail è bloccata o instabile. Imposta RESEND_API_KEY per invii affidabili.',
    )
  } else if (provider === 'resend' && usingResendTestDomain) {
    warnings.push(
      'EMAIL_FROM usa @resend.dev: in test Resend invia solo all\'email dell\'account. Per produzione verifica un dominio su resend.com/domains.',
    )
  }

  return {
    configured: provider !== 'none',
    provider,
    from: provider === 'resend' ? EMAIL_FROM : GMAIL_FROM_WELCOME,
    notifyTo: REGISTRATION_NOTIFY_EMAIL,
    replyTo: REPLY_TO,
    usingResendTestDomain: provider === 'resend' && usingResendTestDomain,
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

async function sendViaResend(payload: MailPayload): Promise<{ ok: boolean; error?: string }> {
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

async function sendViaGmail(payload: MailPayload): Promise<{ ok: boolean; error?: string }> {
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

async function sendMail(payload: MailPayload): Promise<{ ok: boolean; error?: string }> {
  const provider = getEmailProvider()
  if (provider === 'resend') return sendViaResend(payload)
  if (provider === 'gmail') return sendViaGmail(payload)
  return { ok: false, error: 'Nessun provider email configurato' }
}

/** Invio diagnostico (Gestione). */
export async function sendTestEmail(to: string): Promise<{ ok: boolean; error?: string }> {
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

export async function sendPasswordResetEmail(to: string, token: string): Promise<{ ok: boolean; error?: string }> {
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

/** Email registrazione — testi prerelease (benvenuto + notifica staff). */
export async function sendRegistrationEmails(params: {
  email: string
  password: string
  characterName: string
  userId: string
  playerPreferences?: string
}): Promise<void> {
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
    throw new Error(welcome.error ?? 'Invio email benvenuto fallito')
  }

  const staff = await sendMail({
    to: REGISTRATION_NOTIFY_EMAIL,
    subject: `🔔 Nuova Registrazione: ${characterName}`,
    gmailFrom: GMAIL_FROM_NOTIFY,
    html: staffHtml,
    text: `Nuova registrazione: ${characterName} (${email})`,
  })
  if (!staff.ok) {
    throw new Error(staff.error ?? 'Invio notifica staff fallita')
  }

  console.log(`✅ Registrazione completata per ${characterName}. Email inviate (${getEmailProvider()}).`)
}
