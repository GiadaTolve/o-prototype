import type {
  DismantleInventoryResponse,
  DismantleResultResponse,
  DismantleStatusResponse,
} from '@/components/dashboard/mercato/dismantle-types'
import type {
  ArtigianoRepairRow,
  ArtigianoToolStatus,
} from '@/components/dashboard/professione/artigiano-types'
import { api } from './api'

export const artigianoApi = {
  getDismantleStatus: () =>
    api.get('/artigiano/me/dismantle/status') as Promise<DismantleStatusResponse>,
  getDismantleInventory: () =>
    api.get('/artigiano/me/dismantle/inventory') as Promise<DismantleInventoryResponse>,
  dismantle: (inventoryIds: string[]) =>
    api.post('/artigiano/me/dismantle', { inventoryIds }) as Promise<DismantleResultResponse>,
  getToolStatus: () => api.get('/artigiano/me/tool/status') as Promise<ArtigianoToolStatus>,
  getRepairInventory: () =>
    api.get('/artigiano/me/repair/inventory') as Promise<{
      items: ArtigianoRepairRow[]
      repair: ArtigianoToolStatus['dailyBudget']
    }>,
  repair: (body: { inventoryId: string; amount?: number; roomId?: string }) =>
    api.post('/artigiano/me/repair', body),
  craft: (body: { blueprintId: string; inventoryId?: string; roomId?: string }) =>
    api.post('/artigiano/me/craft', body),
}
