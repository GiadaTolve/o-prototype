import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import { buyMaterialFromBanco, getBancoNpcCatalog, sellInventoryToBanco } from './banco.service'
import {
  buyPiazzaListing,
  cancelPiazzaListing,
  createPiazzaListing,
  getMyPiazzaListings,
  getPiazzaTradeFeed,
  listPiazzaListings,
} from './piazza.service'

export const marketRoutes = new Elysia({ prefix: '/market' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/banco/catalog', () => getBancoNpcCatalog())
      .post(
        '/banco/sell',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            return await sellInventoryToBanco(char.id, body.inventoryId)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Vendita fallita' }
          }
        },
        { body: t.Object({ inventoryId: t.String() }) },
      )
      .post(
        '/banco/buy',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            return await buyMaterialFromBanco(char.id, body.catalogKey, body.quantity ?? 1)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Acquisto fallito' }
          }
        },
        {
          body: t.Object({
            catalogKey: t.String(),
            quantity: t.Optional(t.Number()),
          }),
        },
      )
      .get('/piazza/listings', async ({ query }) => {
        const limit = Number(query.limit) || 50
        return { listings: await listPiazzaListings(limit) }
      })
      .get('/piazza/me/listings', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        const char = await db.query.characters.findFirst({
          where: eq(characters.userId, user.id),
        })
        if (!char) {
          set.status = 404
          return { error: 'Personaggio non trovato' }
        }
        return { listings: await getMyPiazzaListings(char.id) }
      })
      .post(
        '/piazza/listings',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const listing = await createPiazzaListing(char.id, body.inventoryId, body.priceRem)
            return { listing }
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Inserzione fallita' }
          }
        },
        {
          body: t.Object({
            inventoryId: t.String(),
            priceRem: t.Number({ minimum: 1 }),
          }),
        },
      )
      .delete(
        '/piazza/listings/:listingId',
        async ({ params, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            return await cancelPiazzaListing(char.id, params.listingId)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Annullamento fallito' }
          }
        },
        { params: t.Object({ listingId: t.String() }) },
      )
      .post(
        '/piazza/listings/:listingId/buy',
        async ({ params, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            return await buyPiazzaListing(char.id, params.listingId)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Acquisto fallito' }
          }
        },
        { params: t.Object({ listingId: t.String() }) },
      )
      .get('/piazza/feed', async ({ query }) => {
        const limit = Number(query.limit) || 30
        return { feed: await getPiazzaTradeFeed(limit) }
      }),
  )
