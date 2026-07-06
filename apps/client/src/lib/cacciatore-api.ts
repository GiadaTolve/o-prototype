import type {
  CacciatoreGatherResponse,
  CacciatoreStatusResponse,
} from '@/components/dashboard/professione/cacciatore-types'
import { api } from './api'

export const cacciatoreApi = {
  getStatus: () => api.get('/cacciatore/me/status') as Promise<CacciatoreStatusResponse>,
  gather: (body: { blueprintId: string; roomId?: string }) =>
    api.post('/cacciatore/me/gather', body) as Promise<CacciatoreGatherResponse>,
}
