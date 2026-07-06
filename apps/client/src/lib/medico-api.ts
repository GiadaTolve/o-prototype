import type {
  MedicoCraftResponse,
  MedicoHealResponse,
  MedicoStatusResponse,
} from '@/components/dashboard/professione/medico-types'
import { api } from '@/lib/api'

export const medicoApi = {
  getStatus: () => api.get('/medico/me/status') as Promise<MedicoStatusResponse>,
  getHealTargets: () =>
    api.get('/medico/me/heal-targets') as Promise<{ targets: import('./medico-types').MedicoHealTarget[] }>,
  getMaterials: () =>
    api.get('/medico/me/materials') as Promise<{
      materials: Array<{ id: string; name: string; quantity: number; economy: { materialId?: string | null } }>
    }>,
  heal: (body: { targetCharacterId: string; amount: number; roomId?: string }) =>
    api.post('/medico/me/heal', body) as Promise<MedicoHealResponse>,
  craft: (blueprintId: string) =>
    api.post('/medico/me/craft', { blueprintId }) as Promise<MedicoCraftResponse>,
}
