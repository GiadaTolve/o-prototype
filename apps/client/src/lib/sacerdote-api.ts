import type { SacerdoteStatusResponse } from '@/components/dashboard/professione/sacerdote-types'
import { api } from './api'

export const sacerdoteApi = {
  getStatus: () => api.get('/sacerdote/me/status') as Promise<SacerdoteStatusResponse>,
  craft: (body: { blueprintId: string; consecratedPlace?: boolean; roomId?: string }) =>
    api.post('/sacerdote/me/craft', body),
  activate: (body: {
    blueprintId: string
    bearerCharacterId?: string
    notes?: string
    roomId?: string
  }) => api.post('/sacerdote/me/activate', body),
  consume: (ofudaId: string, body?: { roomId?: string; note?: string }) =>
    api.post(`/sacerdote/me/ofuda/${ofudaId}/consume`, body ?? {}),
}
