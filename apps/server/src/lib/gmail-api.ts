import {
  GMAIL_OAUTH_CLIENT_ID,
  GMAIL_OAUTH_CLIENT_SECRET,
  GMAIL_OAUTH_REFRESH_TOKEN,
  EMAIL_USER,
} from '../config'

let cachedAccessToken: { token: string; expiresAt: number } | null = null

export function isGmailApiConfigured(): boolean {
  return Boolean(
    GMAIL_OAUTH_CLIENT_ID && GMAIL_OAUTH_CLIENT_SECRET && GMAIL_OAUTH_REFRESH_TOKEN,
  )
}

async function fetchAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60_000) {
    return cachedAccessToken.token
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_OAUTH_CLIENT_ID,
      client_secret: GMAIL_OAUTH_CLIENT_SECRET,
      refresh_token: GMAIL_OAUTH_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })

  const data = (await res.json()) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }

  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Refresh token Gmail non valido')
  }

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  return cachedAccessToken.token
}

function encodeRfc2047(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value
  const encoded = Buffer.from(value, 'utf8').toString('base64')
  return `=?UTF-8?B?${encoded}?=`
}

function buildMime(params: {
  from: string
  to: string
  replyTo?: string
  subject: string
  html: string
  text: string
}): string {
  const boundary = `oyasumi_${Date.now().toString(36)}`
  const lines = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    ...(params.replyTo ? [`Reply-To: ${params.replyTo}`] : []),
    `Subject: ${encodeRfc2047(params.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(params.text, 'utf8').toString('base64'),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(params.html, 'utf8').toString('base64'),
    `--${boundary}--`,
  ]
  return lines.join('\r\n')
}

function toBase64Url(mime: string): string {
  return Buffer.from(mime, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function sendViaGmailApi(payload: {
  to: string
  subject: string
  html: string
  text: string
  from?: string
  replyTo?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!isGmailApiConfigured()) {
    return { ok: false, error: 'Gmail API OAuth non configurato' }
  }

  try {
    const token = await fetchAccessToken()
    const mime = buildMime({
      from: payload.from ?? `"Oyasumi Staff" <${EMAIL_USER}>`,
      to: payload.to,
      replyTo: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    })

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: toBase64Url(mime) }),
    })

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      return { ok: false, error: err?.error?.message || `Gmail API HTTP ${res.status}` }
    }

    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
