import { Resend } from 'resend'
import { RESEND_API_KEY, APP_URL, EMAIL_FROM, REGISTRATION_NOTIFY_EMAIL } from '../config'

function getResend() {
  if (!RESEND_API_KEY) return null
  return new Resend(RESEND_API_KEY)
}

export const emailConfigStatus = () => ({
  configured: Boolean(RESEND_API_KEY),
  from: EMAIL_FROM,
  notifyTo: REGISTRATION_NOTIFY_EMAIL,
  usingResendTestDomain: EMAIL_FROM.includes('@resend.dev'),
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const emailShell = (inner: string) => `
  <div style="background-color:#050508;color:#bfc0d1;padding:24px;font-family:sans-serif;border:1px solid #2a2a32;max-width:520px;margin:0 auto;">
    ${inner}
  </div>
`

/**
 * Invia email di reset password.
 * Se RESEND_API_KEY non è configurato, non invia ma non fallisce (dev).
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY non configurato. Link reset (solo dev):', `${APP_URL}/auth/reset-password?token=${token}`)
    return { ok: true }
  }

  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    subject: 'Oyasumi — Reimposta la password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #d4af37;">Oyasumi 2.0</h2>
        <p>Hai richiesto il reset della password. Clicca il link qui sotto per impostarne una nuova:</p>
        <p><a href="${resetUrl}" style="color: #7c3aed; text-decoration: underline;">Reimposta password</a></p>
        <p style="color: #888; font-size: 12px;">Il link scade tra 1 ora. Se non hai richiesto il reset, ignora questa email.</p>
      </div>
    `,
    text: `Reimposta la password: ${resetUrl}\n\nIl link scade tra 1 ora.`,
  })

  if (error) {
    console.error('[Email] Errore invio:', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

/** Email di benvenuto al nuovo giocatore (senza password in chiaro). */
export async function sendWelcomeEmail(
  to: string,
  characterName: string,
): Promise<{ ok: boolean; error?: string }> {
  const resend = getResend()
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY non configurato — benvenuto NON inviato a:', to, `(${characterName})`)
    return { ok: false, error: 'RESEND_API_KEY non configurato' }
  }

  const loginUrl = `${APP_URL}/`

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    subject: `Benvenuto in Oyasumi, ${characterName}`,
    html: emailShell(`
      <h1 style="color:#a78bfa;border-bottom:2px solid #d4af37;padding-bottom:10px;">Benvenuto, Sognatore.</h1>
      <p>La tua registrazione su <strong style="color:#d4af37;">Oyasumi</strong> è stata completata con successo.</p>
      <p>Il tuo personaggio, <strong>${characterName}</strong>, è pronto per esplorare la realtà che sanguina.</p>
      <p><a href="${loginUrl}" style="color:#a78bfa;">Accedi al sistema</a> con il tuo <strong>Nome PG</strong> e la password che hai scelto.</p>
      <p style="color:#888;font-size:12px;margin-top:24px;">A presto,<br/>Lo Staff di Oyasumi</p>
    `),
    text: `Benvenuto in Oyasumi, ${characterName}. Accedi su ${loginUrl} con Nome PG e password.`,
  })

  if (error) {
    console.error('[Email] Errore benvenuto:', error.message, { to, characterName, from: EMAIL_FROM })
    return { ok: false, error: error.message }
  }
  console.info('[Email] Benvenuto inviato a', to, `(${characterName})`)
  return { ok: true }
}

/** Notifica staff per nuova registrazione. */
export async function sendRegistrationNotifyEmail(params: {
  characterName: string
  email: string
  userId: string
  characterId: string
  playerPreferences?: string
}): Promise<{ ok: boolean; error?: string }> {
  const notifyTo = REGISTRATION_NOTIFY_EMAIL
  if (!notifyTo) {
    return { ok: true }
  }

  const resend = getResend()
  if (!resend) {
    console.warn(
      '[Email] RESEND_API_KEY non configurato — notifica staff NON inviata per:',
      params.characterName,
      '→',
      notifyTo,
    )
    return { ok: false, error: 'RESEND_API_KEY non configurato' }
  }

  const prefs = escapeHtml(params.playerPreferences?.trim() || 'Nessuna preferenza espressa.')

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [notifyTo],
    subject: `Nuova registrazione: ${params.characterName}`,
    html: emailShell(`
      <h2 style="color:#d4af37;">Un nuovo sognatore si è unito a noi</h2>
      <ul style="line-height:1.7;">
        <li><strong>ID utente:</strong> ${params.userId}</li>
        <li><strong>ID personaggio:</strong> ${params.characterId}</li>
        <li><strong>Nome PG:</strong> ${params.characterName}</li>
        <li><strong>Email:</strong> ${params.email}</li>
      </ul>
      <hr style="border-color:#2a2a32;" />
      <h3 style="color:#a78bfa;">Preferenze / note del giocatore</h3>
      <p style="background:#141418;border-left:4px solid #7c3aed;padding:12px;font-style:italic;">${prefs}</p>
    `),
    text: `Nuova registrazione Oyasumi: ${params.characterName} (${params.email})`,
  })

  if (error) {
    console.error('[Email] Errore notifica staff:', error.message, {
      notifyTo,
      characterName: params.characterName,
      from: EMAIL_FROM,
    })
    return { ok: false, error: error.message }
  }
  console.info('[Email] Notifica staff inviata a', notifyTo, `(${params.characterName})`)
  return { ok: true }
}
