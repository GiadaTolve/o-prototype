import { api } from './api'
import type {
  BancoCatalogResponse,
  BancoBuyResponse,
  BancoSellResponse,
  PiazzaBuyResponse,
  PiazzaFeedResponse,
  PiazzaListingsResponse,
} from '@/components/dashboard/mercato/mercato-types'

export const marketApi = {
  getBancoCatalog: () => api.get('/market/banco/catalog') as Promise<BancoCatalogResponse>,
  sellToBanco: (inventoryId: string) =>
    api.post('/market/banco/sell', { inventoryId }) as Promise<BancoSellResponse>,
  buyFromBanco: (catalogKey: string, quantity = 1) =>
    api.post('/market/banco/buy', { catalogKey, quantity }) as Promise<BancoBuyResponse>,
  listPiazza: (limit = 50) =>
    api.get(`/market/piazza/listings?limit=${limit}`) as Promise<PiazzaListingsResponse>,
  myListings: () => api.get('/market/piazza/me/listings') as Promise<PiazzaListingsResponse>,
  createListing: (inventoryId: string, priceRem: number) =>
    api.post('/market/piazza/listings', { inventoryId, priceRem }),
  cancelListing: (listingId: string) => api.delete(`/market/piazza/listings/${listingId}`),
  buyListing: (listingId: string) =>
    api.post(`/market/piazza/listings/${listingId}/buy`, {}) as Promise<PiazzaBuyResponse>,
  getFeed: (limit = 30) =>
    api.get(`/market/piazza/feed?limit=${limit}`) as Promise<PiazzaFeedResponse>,
}
