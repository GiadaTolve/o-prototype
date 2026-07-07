import { api } from './api'

export type PushSubscriptionPayload = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export const pushApi = {
  getVapidPublicKey: () =>
    api.get('/push/vapid-public-key') as Promise<{ enabled: boolean; publicKey?: string; error?: string }>,
  subscribe: (payload: PushSubscriptionPayload) =>
    api.post('/push/subscribe', payload) as Promise<{ ok: true }>,
  unsubscribe: (endpoint: string) =>
    api.post('/push/unsubscribe', { endpoint }) as Promise<{ ok: true }>,
}
