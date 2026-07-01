import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { users, characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  getAllUsers,
  updateUserRole,
  updateUserBanState,
  updateCharacterName,
  resetCharacterStats,
  getChatRooms,
  getChatLogs,
  getAllLocations,
  getMapBanners,
  createLocation,
  updateLocation,
  updateLocationParent,
  deleteLocation,
  getAdminJobs,
  createJob,
  updateJob,
  deleteJob,
  getAdminHousingTypes,
  createHousingType,
  updateHousingType,
  deleteHousingType,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllDailyEvents,
  getTodayDailyEvents,
  createDailyEvent,
  updateDailyEvent,
  deleteDailyEvent,
  getUserSanctions,
  createSanction,
  getAdminCreatures,
  createCreature,
  updateCreature,
  deleteCreature,
} from './admin.service'
import { musicService } from '../music/music.service'
import { forumService } from '../forum/forum.service'
import { setRoomOpen, getRoomState } from '../anonymous-chat/anonymous-chat.service'
import type { UserRole, BanState } from '@domain/security/jwt'

const PARADISE_ROOM_ID = 'edo__paradise'

export const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(authPlugin)
  // Toggle Paradise — route statica PRIMA del guard per evitare 404
  .post('/paradise/toggle', async ({ body, user, set }) => {
    if (!user) {
      set.status = 401
      return { error: 'Non autenticato' }
    }
    const userRole = (user.role ?? '').toUpperCase()
    if (userRole !== 'ADMIN' && userRole !== 'MASTER') {
      set.status = 403
      return { error: 'Accesso riservato ad admin/master' }
    }
    const b = body as { isOpen?: boolean; roomId?: string }
    const roomId = b?.roomId ?? PARADISE_ROOM_ID
    const isOpen = !!b?.isOpen
    try {
      if (isOpen && !user?.characterId) {
        set.status = 400
        return { error: 'Serve un personaggio attivo per aprire la stanza' }
      }
      await setRoomOpen(roomId, isOpen, user?.characterId ?? '')
      return getRoomState(roomId)
    } catch (e: unknown) {
      set.status = 400
      return { error: e instanceof Error ? e.message : 'Errore durante il toggle stanza anonima' }
    }
  })
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Verifica se l'utente ha accesso al pannello admin
      .derive(async ({ user }) => {
        if (!user) {
          return { hasAdminAccess: false as boolean }
        }

        const userRole = (user.role ?? '').toUpperCase()
        const hasAdminAccess: boolean =
          userRole === 'ADMIN' ||
          userRole === 'MASTER'

        return { hasAdminAccess }
      })
      // Banner per mappe (disponibile a tutti gli utenti autenticati)
      .get('/map-banners', async ({ set }) => {
        try {
          const banners = await getMapBanners()
          return banners
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore recupero banner mappe' }
        }
      })
      // Eventi di oggi per calendario (disponibile a tutti gli utenti autenticati)
      .get('/daily-events/today', async ({ set }) => {
        try {
          const events = await getTodayDailyEvents()
          return events
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore recupero eventi' }
        }
      })
      .guard(({ hasAdminAccess }: { hasAdminAccess: boolean }) => hasAdminAccess, (app) =>
        app
          // Ottiene tutti gli utenti
          .get('/users', async ({ set }) => {
            try {
              const users = await getAllUsers()
              return users
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante il recupero utenti' }
            }
          })

          // Aggiorna il ruolo di un utente
          .put(
            '/users/:id/role',
            async ({ params, body, set }) => {
              try {
                const updated = await updateUserRole(params.id, body.role)
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento ruolo' }
              }
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              body: t.Object({
                role: t.Union([t.Literal('PLAYER'), t.Literal('ADMIN'), t.Literal('MASTER')]),
              }),
            }
          )

          // Aggiorna lo stato di ban di un utente
          .put(
            '/users/:id/ban',
            async ({ params, body, set }) => {
              try {
                const updated = await updateUserBanState(params.id, body.banState)
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento ban' }
              }
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              body: t.Object({
                banState: t.Union([t.Literal('NONE'), t.Literal('SHADOW'), t.Literal('FULL')]),
              }),
            }
          )

          // Aggiorna il nome del personaggio
          .put(
            '/characters/:id/name',
            async ({ params, body, set }) => {
              try {
                const updated = await updateCharacterName(params.id, body.name)
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento nome' }
              }
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              body: t.Object({
                name: t.String({ minLength: 2, maxLength: 30 }),
              }),
            }
          )

          // Resetta le statistiche di un personaggio
          .put(
            '/characters/:id/reset-stats',
            async ({ params, set }) => {
              try {
                const updated = await resetCharacterStats(params.id)
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante il reset statistiche' }
              }
            },
            {
              params: t.Object({
                id: t.String(),
              }),
            }
          )

          // ==========================================
          // GESTIONE PLAYLIST E MUSICA
          // ==========================================

          // Crea una nuova playlist
          .post(
            '/playlists',
            async ({ body, set }) => {
              try {
                const playlist = await musicService.createPlaylist({
                  name: body.name,
                  description: body.description,
                })
                return playlist
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante la creazione playlist' }
              }
            },
            {
              body: t.Object({
                name: t.String(),
                description: t.Optional(t.String()),
              }),
            }
          )

          // Aggiorna una playlist
          .put(
            '/playlists/:id',
            async ({ params, body, set }) => {
              try {
                const updated = await musicService.updatePlaylist(params.id, {
                  name: body.name,
                  description: body.description,
                })
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento playlist' }
              }
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              body: t.Object({
                name: t.Optional(t.String()),
                description: t.Optional(t.String()),
              }),
            }
          )

          // Elimina una playlist
          .delete('/playlists/:id', async ({ params, set }) => {
            try {
              await musicService.deletePlaylist(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione playlist' }
            }
          })

          // Aggiunge una canzone a una playlist
          .post(
            '/playlists/:id/songs',
            async ({ params, body, set }) => {
              try {
                const song = await musicService.addSong({
                  playlistId: params.id,
                  title: body.title,
                  url: body.url,
                  sourceType: body.sourceType,
                  coverImageUrl: body.coverImageUrl,
                  order: body.order,
                })
                return song
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiunta canzone' }
              }
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              body: t.Object({
                title: t.String(),
                url: t.String(),
                sourceType: t.Union([t.Literal('youtube'), t.Literal('file'), t.Literal('url')]),
                coverImageUrl: t.Optional(t.String()),
                order: t.Optional(t.Number()),
              }),
            }
          )

          // Aggiorna una canzone
          .put(
            '/songs/:id',
            async ({ params, body, set }) => {
              try {
                const updated = await musicService.updateSong(params.id, {
                  title: body.title,
                  url: body.url,
                  sourceType: body.sourceType,
                  coverImageUrl: body.coverImageUrl,
                  order: body.order,
                })
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento canzone' }
              }
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              body: t.Object({
                title: t.Optional(t.String()),
                url: t.Optional(t.String()),
                sourceType: t.Optional(t.Union([t.Literal('youtube'), t.Literal('file'), t.Literal('url')])),
                coverImageUrl: t.Optional(t.String()),
                order: t.Optional(t.Number()),
              }),
            }
          )

          // Elimina una canzone
          .delete('/songs/:id', async ({ params, set }) => {
            try {
              await musicService.deleteSong(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione canzone' }
            }
          })

          // ==========================================
          // GESTIONE FORUM
          // ==========================================

          // Pin/unpin topic
          .put(
            '/forum/topics/:id/pin',
            async ({ params, body, set }) => {
              try {
                const updated = await forumService.updateTopicPin(params.id, body.is_pinned ?? false)
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante il pin topic' }
              }
            },
            {
              body: t.Object({
                is_pinned: t.Optional(t.Boolean()),
              }),
            }
          )

          // Lock/unlock topic
          .put(
            '/forum/topics/:id/lock',
            async ({ params, body, set }) => {
              try {
                const updated = await forumService.updateTopicLock(params.id, body.is_locked ?? false)
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante il lock topic' }
              }
            },
            {
              body: t.Object({
                is_locked: t.Optional(t.Boolean()),
              }),
            }
          )

          // Elimina topic
          .delete('/forum/topics/:id', async ({ params, set }) => {
            try {
              await forumService.deleteTopic(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione topic' }
            }
          })

          // Elimina post
          .delete('/forum/posts/:id', async ({ params, set }) => {
            try {
              await forumService.deletePost(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione post' }
            }
          })

          // ==========================================
          // GESTIONE SEZIONI E BACHECHE FORUM
          // ==========================================

          // Crea una sezione
          .post(
            '/forum/sections',
            async ({ body, set }) => {
              try {
                const section = await forumService.createSection({
                  name: body.name,
                  description: body.description,
                  order: body.order,
                })
                return section
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante la creazione sezione' }
              }
            },
            {
              body: t.Object({
                name: t.String(),
                description: t.Optional(t.String()),
                order: t.Optional(t.Number()),
              }),
            }
          )

          // Aggiorna una sezione
          .put(
            '/forum/sections/:id',
            async ({ params, body, set }) => {
              try {
                const updated = await forumService.updateSection(params.id, {
                  name: body.name,
                  description: body.description,
                  order: body.order,
                })
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento sezione' }
              }
            },
            {
              body: t.Object({
                name: t.Optional(t.String()),
                description: t.Optional(t.String()),
                order: t.Optional(t.Number()),
              }),
            }
          )

          // Elimina una sezione
          .delete('/forum/sections/:id', async ({ params, set }) => {
            try {
              await forumService.deleteSection(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione sezione' }
            }
          })

          // Crea una bacheca
          .post(
            '/forum/boards',
            async ({ body, set }) => {
              try {
                const board = await forumService.createBoard({
                  sectionId: body.section_id,
                  name: body.name,
                  description: body.description,
                  order: body.order,
                })
                return board
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante la creazione bacheca' }
              }
            },
            {
              body: t.Object({
                section_id: t.String(),
                name: t.String(),
                description: t.Optional(t.String()),
                order: t.Optional(t.Number()),
              }),
            }
          )

          // Aggiorna una bacheca
          .put(
            '/forum/boards/:id',
            async ({ params, body, set }) => {
              try {
                const updated = await forumService.updateBoard(params.id, {
                  name: body.name,
                  description: body.description,
                  order: body.order,
                  sectionId: body.section_id,
                })
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento bacheca' }
              }
            },
            {
              body: t.Object({
                name: t.Optional(t.String()),
                description: t.Optional(t.String()),
                order: t.Optional(t.Number()),
                section_id: t.Optional(t.String()),
              }),
            }
          )

          // Elimina una bacheca
          .delete('/forum/boards/:id', async ({ params, set }) => {
            try {
              await forumService.deleteBoard(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione bacheca' }
            }
          })

          // ==========================================
          // LOGS & CHAT ROOMS
          // ==========================================

          // Ottiene tutte le chat rooms
          .get('/chat-rooms', async ({ set }) => {
            try {
              const rooms = await getChatRooms()
              return rooms
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante il recupero chat rooms' }
            }
          })

          // Ottiene i log di una chat per fascia temporale (Da...A)
          .get('/logs', async ({ query, set }) => {
            try {
              const chatId = query.chatId as string
              const from = query.from as string
              const to = (query.to as string) || undefined
              if (!chatId || !from) {
                set.status = 400
                return { error: 'chatId e from sono richiesti' }
              }
              const logs = await getChatLogs(chatId, from, to)
              return logs
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante il recupero log' }
            }
          }, {
            query: t.Object({
              chatId: t.String(),
              from: t.String(),
              to: t.Optional(t.String()),
            }),
          })

          // ==========================================
          // LOCATIONS (Mappe e Chat)
          // ==========================================

          // Ottiene tutte le locations
          .get('/locations', async ({ set }) => {
            try {
              const locations = await getAllLocations()
              return locations
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante il recupero locations' }
            }
          })

          // Crea una nuova location
          .post(
            '/locations',
            async ({ body, set }) => {
              try {
                console.log('Creazione location con dati:', {
                  parent_id: body.parent_id,
                  name: body.name,
                  type: body.type,
                  image_url: body.image_url,
                  banner_url: body.banner_url,
                  description: body.description,
                  prefecture: body.prefecture,
                  pos_x: body.pos_x,
                  pos_y: body.pos_y,
                })
                const location = await createLocation({
                  parentId: body.parent_id || null,
                  name: body.name,
                  type: body.type,
                  imageUrl: body.image_url,
                  bannerUrl: body.banner_url,
                  bannerForGameMap: body.banner_for_game_map,
                  bannerPosition: body.banner_position,
                  description: body.description,
                  prefecture: body.prefecture,
                  posX: body.pos_x,
                  posY: body.pos_y,
                })
                return location
              } catch (e: unknown) {
                console.error('Errore creazione location:', e)
                set.status = 400
                const errorMessage = e instanceof Error ? e.message : 'Errore durante la creazione location'
                return { error: errorMessage }
              }
            },
            {
              body: t.Object({
                parent_id: t.Optional(t.String()),
                name: t.String(),
                type: t.Union([t.Literal('MAP'), t.Literal('CHAT')]),
                image_url: t.Optional(t.String()),
                banner_url: t.Optional(t.String()),
                banner_for_game_map: t.Optional(t.String()),
                banner_position: t.Optional(t.String()),
                description: t.Optional(t.String()),
                prefecture: t.Optional(t.String()),
                pos_x: t.Optional(t.Number()),
                pos_y: t.Optional(t.Number()),
              }),
            }
          )

          // Aggiorna una location
          .put(
            '/locations/:id',
            async ({ params, body, set }) => {
              try {
                const updated = await updateLocation(params.id, {
                  name: body.name,
                  type: body.type,
                  imageUrl: body.image_url,
                  bannerUrl: body.banner_url,
                  bannerForGameMap: body.banner_for_game_map,
                  bannerPosition: body.banner_position,
                  description: body.description,
                  prefecture: body.prefecture,
                  posX: body.pos_x,
                  posY: body.pos_y,
                })
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento location' }
              }
            },
            {
              params: t.Object({ id: t.String() }),
              body: t.Object({
                name: t.Optional(t.String()),
                type: t.Optional(t.Union([t.Literal('MAP'), t.Literal('CHAT')])),
                image_url: t.Optional(t.String()),
                banner_url: t.Optional(t.String()),
                banner_for_game_map: t.Optional(t.String()),
                banner_position: t.Optional(t.String()),
                description: t.Optional(t.String()),
                prefecture: t.Optional(t.String()),
                pos_x: t.Optional(t.Number()),
                pos_y: t.Optional(t.Number()),
              }),
            }
          )

          // Aggiorna il parent di una location (drag-and-drop)
          .put(
            '/locations/:id/parent',
            async ({ params, body, set }) => {
              try {
                const updated = await updateLocationParent(params.id, body.newParentId || null)
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante lo spostamento location' }
              }
            },
            {
              params: t.Object({ id: t.String() }),
              body: t.Object({
                newParentId: t.Optional(t.String()),
              }),
            }
          )

          // Elimina una location
          .delete('/locations/:id', async ({ params, set }) => {
            try {
              await deleteLocation(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione location' }
            }
          })

          // ==========================================
          // JOBS (Arubaito / Lavori)
          // ==========================================

          .get('/jobs', async ({ set }) => {
            try {
              const list = await getAdminJobs()
              return list
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante il recupero lavori' }
            }
          })

          .post(
            '/jobs',
            async ({ body, set }) => {
              try {
                const job = await createJob({
                  title: body.title,
                  description: body.description,
                  dailySalary: body.daily_salary ?? 20,
                })
                return job
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante la creazione lavoro' }
              }
            },
            {
              body: t.Object({
                title: t.String(),
                description: t.Optional(t.String()),
                daily_salary: t.Optional(t.Number()),
              }),
            }
          )

          .put(
            '/jobs/:id',
            async ({ params, body, set }) => {
              try {
                const updated = await updateJob(params.id, {
                  title: body.title,
                  description: body.description,
                  dailySalary: body.daily_salary,
                })
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento lavoro' }
              }
            },
            {
              params: t.Object({ id: t.String() }),
              body: t.Object({
                title: t.Optional(t.String()),
                description: t.Optional(t.String()),
                daily_salary: t.Optional(t.Number()),
              }),
            }
          )

          .delete('/jobs/:id', async ({ params, set }) => {
            try {
              await deleteJob(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione lavoro' }
            }
          })

          // ==========================================
          // HOUSING TYPES (Tipologie abitazione)
          // ==========================================

          .get('/housing-types', async ({ set }) => {
            try {
              const list = await getAdminHousingTypes()
              return list
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante il recupero tipologie abitazione' }
            }
          })

          .post(
            '/housing-types',
            async ({ body, set }) => {
              try {
                const row = await createHousingType({
                  code: body.code,
                  name: body.name,
                  squareMeters: body.square_meters,
                  dailyRent: body.daily_rent,
                  monthlyRent: body.monthly_rent,
                  hpBonus: body.hp_bonus,
                  inventorySlotsBonus: body.inventory_slots_bonus,
                  requirements: body.paradise_pass !== undefined ? { paradisePass: body.paradise_pass } : undefined,
                })
                return row
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante la creazione tipologia' }
              }
            },
            {
              body: t.Object({
                code: t.String(),
                name: t.String(),
                square_meters: t.Number(),
                daily_rent: t.Optional(t.Union([t.Number(), t.Null()])),
                monthly_rent: t.Optional(t.Union([t.Number(), t.Null()])),
                hp_bonus: t.Optional(t.Number()),
                inventory_slots_bonus: t.Optional(t.Number()),
                paradise_pass: t.Optional(t.Boolean()),
              }),
            }
          )

          .put(
            '/housing-types/:id',
            async ({ params, body, set }) => {
              try {
                const updated = await updateHousingType(params.id, {
                  code: body.code,
                  name: body.name,
                  squareMeters: body.square_meters,
                  dailyRent: body.daily_rent,
                  monthlyRent: body.monthly_rent,
                  hpBonus: body.hp_bonus,
                  inventorySlotsBonus: body.inventory_slots_bonus,
                  requirements: body.paradise_pass !== undefined ? { paradisePass: body.paradise_pass } : undefined,
                })
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento' }
              }
            },
            {
              params: t.Object({ id: t.String() }),
              body: t.Object({
                code: t.Optional(t.String()),
                name: t.Optional(t.String()),
                square_meters: t.Optional(t.Number()),
                daily_rent: t.Optional(t.Union([t.Number(), t.Null()])),
                monthly_rent: t.Optional(t.Union([t.Number(), t.Null()])),
                hp_bonus: t.Optional(t.Number()),
                inventory_slots_bonus: t.Optional(t.Number()),
                paradise_pass: t.Optional(t.Boolean()),
              }),
            }
          )

          .delete('/housing-types/:id', async ({ params, set }) => {
            try {
              await deleteHousingType(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione' }
            }
          })

          // ==========================================
          // BANNERS
          // ==========================================

          // Ottiene tutti i banner
          .get('/banners', async ({ set }) => {
            try {
              const banners = await getAllBanners()
              return banners
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante il recupero banner' }
            }
          })

          // Crea un nuovo banner
          .post(
            '/banners',
            async ({ body, set }) => {
              try {
                const banner = await createBanner({
                  title: body.title,
                  imageUrl: body.image_url,
                  linkUrl: body.link_url,
                  isActive: body.is_active,
                  order: body.order,
                })
                return banner
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante la creazione banner' }
              }
            },
            {
              body: t.Object({
                title: t.String(),
                image_url: t.String(),
                link_url: t.Optional(t.String()),
                is_active: t.Optional(t.Boolean()),
                order: t.Optional(t.Number()),
              }),
            }
          )

          // Aggiorna un banner
          .put(
            '/banners/:id',
            async ({ params, body, set }) => {
              try {
                const updated = await updateBanner(params.id, {
                  title: body.title,
                  imageUrl: body.image_url,
                  linkUrl: body.link_url,
                  isActive: body.is_active,
                  order: body.order,
                })
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento banner' }
              }
            },
            {
              params: t.Object({ id: t.String() }),
              body: t.Object({
                title: t.Optional(t.String()),
                image_url: t.Optional(t.String()),
                link_url: t.Optional(t.String()),
                is_active: t.Optional(t.Boolean()),
                order: t.Optional(t.Number()),
              }),
            }
          )

          // Elimina un banner
          .delete('/banners/:id', async ({ params, set }) => {
            try {
              await deleteBanner(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione banner' }
            }
          })

          // ==========================================
          // DAILY EVENTS
          // ==========================================

          // Ottiene tutti gli eventi giornalieri
          .get('/daily-events', async ({ set }) => {
            try {
              const events = await getAllDailyEvents()
              return events
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante il recupero eventi' }
            }
          })

          // Crea un nuovo evento giornaliero
          .post(
            '/daily-events',
            async ({ body, set }) => {
              try {
                const event = await createDailyEvent({
                  eventDate: body.event_date,
                  title: body.title,
                  description: body.description,
                })
                return event
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante la creazione evento' }
              }
            },
            {
              body: t.Object({
                event_date: t.String(),
                title: t.String(),
                description: t.Optional(t.String()),
              }),
            }
          )

          // Aggiorna un evento giornaliero
          .put(
            '/daily-events/:id',
            async ({ params, body, set }) => {
              try {
                const updated = await updateDailyEvent(params.id, {
                  eventDate: body.event_date,
                  title: body.title,
                  description: body.description,
                })
                return updated
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento evento' }
              }
            },
            {
              params: t.Object({ id: t.String() }),
              body: t.Object({
                event_date: t.Optional(t.String()),
                title: t.Optional(t.String()),
                description: t.Optional(t.String()),
              }),
            }
          )

          // Elimina un evento giornaliero
          .delete('/daily-events/:id', async ({ params, set }) => {
            try {
              await deleteDailyEvent(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione evento' }
            }
          })

          // ==========================================
          // BESTIARIO (PNG)
          // ==========================================

          .get('/creatures', async ({ set }) => {
            try {
              const list = await getAdminCreatures()
              return list
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore recupero PNG' }
            }
          })
          .post(
            '/creatures',
            async ({ body, set }) => {
              try {
                const c = await createCreature({
                  name: body.name,
                  description: body.description,
                  imageUrl: body.image_url,
                  category: body.category,
                  stats: body.stats,
                })
                return c
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore creazione PNG' }
              }
            },
            {
              body: t.Object({
                name: t.String(),
                description: t.Optional(t.String()),
                image_url: t.Optional(t.String()),
                category: t.Union([t.Literal('HOLIC'), t.Literal('PHOBIAS'), t.Literal('MUEN')]),
                stats: t.Optional(t.Object({
                  hp: t.Optional(t.Number()),
                  attack: t.Optional(t.Number()),
                  defense: t.Optional(t.Number()),
                })),
              }),
            }
          )
          .put(
            '/creatures/:id',
            async ({ params, body, set }) => {
              try {
                const c = await updateCreature(params.id, {
                  name: body.name,
                  description: body.description,
                  imageUrl: body.image_url,
                  category: body.category,
                  stats: body.stats,
                })
                return c
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore aggiornamento PNG' }
              }
            },
            {
              params: t.Object({ id: t.String() }),
              body: t.Object({
                name: t.Optional(t.String()),
                description: t.Optional(t.String()),
                image_url: t.Optional(t.String()),
                category: t.Optional(t.Union([t.Literal('HOLIC'), t.Literal('PHOBIAS'), t.Literal('MUEN')])),
                stats: t.Optional(t.Object({
                  hp: t.Optional(t.Number()),
                  attack: t.Optional(t.Number()),
                  defense: t.Optional(t.Number()),
                })),
              }),
            }
          )
          .delete('/creatures/:id', async ({ params, set }) => {
            try {
              await deleteCreature(params.id)
              return { success: true }
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore eliminazione PNG' }
            }
          }, { params: t.Object({ id: t.String() }) })

          // ==========================================
          // SANCTIONS
          // ==========================================

          // Ottiene tutte le sanzioni per un utente
          .get('/users/:id/sanctions', async ({ params, set }) => {
            try {
              const sanctions = await getUserSanctions(params.id)
              return sanctions.map((s) => ({
                id: s.id,
                userId: s.userId,
                type: s.type,
                reason: s.reason,
                createdAt: s.createdAt,
                adminName: s.admin?.characters?.[0]?.name || s.admin?.email || null,
              }))
            } catch (e: unknown) {
              set.status = 400
              return { error: e instanceof Error ? e.message : 'Errore durante il recupero sanzioni' }
            }
          })

          // Crea una nuova sanzione
          .post(
            '/sanctions',
            async ({ body, user, set }) => {
              try {
                const sanction = await createSanction({
                  userId: body.user_id,
                  type: body.type,
                  reason: body.reason,
                  adminId: user?.id,
                })
                return sanction
              } catch (e: unknown) {
                set.status = 400
                return { error: e instanceof Error ? e.message : 'Errore durante la creazione sanzione' }
              }
            },
            {
              body: t.Object({
                user_id: t.String(),
                type: t.Union([t.Literal('BAN'), t.Literal('SHADOWBAN'), t.Literal('WARNING'), t.Literal('UNBAN')]),
                reason: t.Optional(t.String()),
              }),
            }
          )
      )
  )
