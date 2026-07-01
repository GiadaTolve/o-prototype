import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  getAllHousingTypes,
  getCharacterHousing,
  assignHousing,
  payMonthlyRent,
  removeHousing,
  inviteGuest,
  removeGuest,
  listMyGuests,
  getHousingChatInfo,
  updateHousingChatCustomization,
  canAccessPrivateChat,
} from './housing.service'
import { getHousingArmadioForGuest, stealFromHousing } from '../inventory/inventory.service'

export const housingRoutes = new Elysia({ prefix: '/housing' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Ottiene tutte le tipologie di abitazione
      .get('/types', async () => {
        const types = await getAllHousingTypes()
        return types
      })

      // Metadata chat housing (nome, immagine, descrizione) per una room
      .get('/chat-info', async ({ user, query, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Non autenticato" };
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
            columns: { id: true, uiMetadata: true },
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          const roomId = (query as { roomId?: string }).roomId
          if (!roomId || !roomId.startsWith('housing_')) {
            set.status = 400
            return { error: 'roomId non valida' }
          }
          const isAdminOrMod = canAccessPrivateChat(user, char, roomId)
          const info = await getHousingChatInfo(char.id, roomId, isAdminOrMod)
          return info ?? { error: 'Accesso negato' }
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore' }
        }
      }, { query: t.Object({ roomId: t.String() }) })

      // Ottiene l'abitazione del personaggio corrente
      .get('/me', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: "Non autenticato" }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const housing = await getCharacterHousing(char.id)
          return housing || null
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
        }
      })

      // Assegna un'abitazione al personaggio corrente
      .post(
        '/assign',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: "Non autenticato" }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const housing = await assignHousing(char.id, body.housingTypeId)
            return housing
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'assegnazione' }
          }
        },
        {
          body: t.Object({
            housingTypeId: t.String(),
          }),
        }
      )

      // Paga manualmente l'affitto mensile
      .post('/pay-rent', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: "Non autenticato" }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const result = await payMonthlyRent(char.id)
          return result
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il pagamento' }
        }
      })

      // Rimuove l'abitazione (diventa senzatetto)
      .post('/remove', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: "Non autenticato" }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const result = await removeHousing(char.id)
          return result
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante la rimozione' }
        }
      })

      // Ospiti: elenco
      .get('/guests', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: "Non autenticato" }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          return await listMyGuests(char.id)
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il recupero degli ospiti' }
        }
      })

      // Ospiti: invita
      .post(
        '/guests',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: "Non autenticato" }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const row = await inviteGuest(char.id, body.guestCharacterId)
            return row
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'invito' }
          }
        },
        { body: t.Object({ guestCharacterId: t.String() }) }
      )

      // Personalizzazione chat (nome, immagine, descrizione) — solo proprietario
      .patch(
        '/chat-customization',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: "Non autenticato" }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const result = await updateHousingChatCustomization(char.id, body)
            return result
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento' }
          }
        },
        {
          body: t.Object({
            name: t.Optional(t.Union([t.String(), t.Null()])),
            image: t.Optional(t.Union([t.String(), t.Null()])),
            description: t.Optional(t.Union([t.String(), t.Null()])),
          }),
        }
      )

      // Armadio di casa altrui (solo ospiti) — per pulsante Ruba
      .get('/armadio', async ({ user, query, set }) => {
        if (!user) {
          set.status = 401
          return { error: "Non autenticato" }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          const roomId = (query as { roomId?: string }).roomId
          if (!roomId || !roomId.startsWith('housing_')) {
            set.status = 400
            return { error: 'roomId non valida' }
          }
          const parts = roomId.split('_')
          const ownerCharacterId = parts[parts.length - 1]
          if (!ownerCharacterId || ownerCharacterId === char.id) {
            set.status = 400
            return { error: 'Non puoi vedere l\'armadio della tua stessa casa da qui' }
          }
          const data = await getHousingArmadioForGuest(ownerCharacterId, char.id)
          return data
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore' }
        }
      }, { query: t.Object({ roomId: t.String() }) })

      // Ruba oggetto da casa altrui (solo ospiti)
      .post(
        '/steal-item',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: "Non autenticato" }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const { roomId, inventoryId } = body
            if (!roomId || !roomId.startsWith('housing_') || !inventoryId) {
              set.status = 400
              return { error: 'roomId e inventoryId richiesti' }
            }
            const parts = roomId.split('_')
            const ownerCharacterId = parts[parts.length - 1]
            if (!ownerCharacterId || ownerCharacterId === char.id) {
              set.status = 400
              return { error: 'Non puoi rubare dalla tua stessa casa' }
            }
            await stealFromHousing(ownerCharacterId, inventoryId, char.id)
            return { success: true }
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il furto' }
          }
        },
        {
          body: t.Object({
            roomId: t.String(),
            inventoryId: t.String(),
          }),
        }
      )

      // Ospiti: rimuovi
      .delete(
        '/guests/:guestCharacterId',
        async ({ params, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: "Non autenticato" }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            await removeGuest(char.id, params.guestCharacterId)
            return { success: true }
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante la rimozione dell\'ospite' }
          }
        },
        { params: t.Object({ guestCharacterId: t.String() }) }
      )
  )
