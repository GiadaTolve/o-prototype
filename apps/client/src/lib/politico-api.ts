import type { PoliticoStatusResponse, PactLeverage } from '@/components/dashboard/professione/politico-types'
import { api } from './api'

export const politicoApi = {
  getStatus: () => api.get('/politico/me/status') as Promise<PoliticoStatusResponse>,
  createPact: (body: {
    templateId: string
    counterpartyName: string
    counterpartyCharacterId?: string
    leverage?: PactLeverage
    notes?: string
    roomId?: string
  }) => api.post('/politico/me/pacts', body),
  invokePact: (pactId: string, body?: { roomId?: string; invocationNote?: string }) =>
    api.post(`/politico/me/pacts/${pactId}/invoke`, body ?? {}),
}
