import { Resend } from 'resend'
import { RESEND_API_KEY, APP_URL, EMAIL_FROM } from '../config'

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

/**
 * Invia email di reset password.
 * Se RESEND_API_KEY non è configurato, non invia ma non fallisce (dev).
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<{ ok: boolean; error?: string }> {
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
