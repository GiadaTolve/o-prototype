import nodemailer from 'nodemailer'
import {
  APP_URL,
  REGISTRATION_NOTIFY_EMAIL,
  EMAIL_USER,
  EMAIL_PASS,
  GMAIL_FROM_WELCOME,
  GMAIL_FROM_NOTIFY,
} from '../config'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function emailConfigStatus() {
  const configured = Boolean(EMAIL_PASS)
  return {
    configured,
    provider: 'gmail' as const,
    from: GMAIL_FROM_WELCOME,
    notifyFrom: GMAIL_FROM_NOTIFY,
    notifyTo: REGISTRATION_NOTIFY_EMAIL,
    emailUser: EMAIL_USER,
    warning: configured
      ? null
      : 'EMAIL_PASS non configurato: imposta la password per le app Gmail (come in prerelease).',
  }
}

function getTransporter() {
  if (!EMAIL_PASS) {
    throw new Error('EMAIL_PASS non configurato')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  })
}

/** Invio diagnostico (Gestione). */
export async function sendTestEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = getTransporter()
    await transporter.sendMail({
      from: GMAIL_FROM_NOTIFY,
      to,
      subject: 'Oyasumi — Test email',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <p>Test invio email Oyasumi via Gmail (modalità prerelease).</p>
          <p><strong>Mittente:</strong> ${escapeHtml(GMAIL_FROM_NOTIFY)}</p>
        </div>
      `,
      text: 'Test email Oyasumi via Gmail.',
    })
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

/**
 * Invia email di reset password (stesso transport Gmail).
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<{ ok: boolean; error?: string }> {
  if (!EMAIL_PASS) {
    console.warn('[Email] EMAIL_PASS non configurato. Link reset (solo dev):', `${APP_URL}/auth/reset-password?token=${token}`)
    return { ok: true }
  }

  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

  try {
    const transporter = getTransporter()
    await transporter.sendMail({
      from: GMAIL_FROM_WELCOME,
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
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Email] Errore reset password:', msg)
    return { ok: false, error: msg }
  }
}

/**
 * Email registrazione — identiche al prerelease (benvenuto + notifica staff).
 * Se l'invio fallisce, lancia errore (la route risponde 500).
 */
export async function sendRegistrationEmails(params: {
  email: string
  password: string
  characterName: string
  userId: string
  playerPreferences?: string
}): Promise<void> {
  const transporter = getTransporter()
  const { email, password, characterName, userId, playerPreferences } = params
  const nomePg = escapeHtml(characterName)
  const emailSafe = escapeHtml(email)
  const passwordSafe = escapeHtml(password)
  const prefs = escapeHtml(playerPreferences?.trim() || 'Nessuna preferenza espressa.')

  const mailToUser = {
    from: GMAIL_FROM_WELCOME,
    to: email,
    subject: 'Benvenuto in Oyasumi! Il tuo viaggio ha inizio!',
    html: `
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
    `,
  }

  const mailToStaff = {
    from: GMAIL_FROM_NOTIFY,
    to: REGISTRATION_NOTIFY_EMAIL,
    subject: `🔔 Nuova Registrazione: ${characterName}`,
    html: `
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
    `,
  }

  await transporter.sendMail(mailToUser)
  await transporter.sendMail(mailToStaff)

  console.log(`✅ Registrazione completata per ${characterName}. Email inviate.`)
}
