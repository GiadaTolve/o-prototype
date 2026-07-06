import { api } from './api'
import type {
  DismantleInventoryResponse,
  DismantleResultResponse,
  DismantleStatusResponse,
} from '@/components/dashboard/mercato/dismantle-types'

export const artigianoApi = {
  getDismantleStatus: () =>
    api.get('/artigiano/me/dismantle/status') as Promise<DismantleStatusResponse>,
  getDismantleInventory: () =>
    api.get('/artigiano/me/dismantle/inventory') as Promise<DismantleInventoryResponse>,
  dismantle: (inventoryIds: string[]) =>
    api.post('/artigiano/me/dismantle', { inventoryIds }) as Promise<DismantleResultResponse>,
}
