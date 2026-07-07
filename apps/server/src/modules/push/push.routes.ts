import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { characterService } from '../characters/characters.service'
import {
  deleteWebPushSubscription,
  getWebPushPublicKey,
  isWebPushEnabled,
  upsertWebPushSubscription,
} from './push.service'

export const pushRoutes = new Elysia({ prefix: '/push' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .derive(async ({ user }) => {
        const char = await characterService.getCharacterByUserId(user!.id)
        return { characterId: char?.id ?? null }
      })
      .get('/vapid-public-key', ({ set }) => {
        const key = getWebPushPublicKey()
        if (!key) {
          set.status = 503
          return { enabled: false, error: 'Web Push non configurato sul server.' }
        }
        return { enabled: true, publicKey: key }
      })
      .post(
        '/subscribe',
        async ({ characterId, body, headers, set }) => {
          if (!characterId) {
            set.status = 401
            return { error: 'Character not found' }
          }
          if (!isWebPushEnabled()) {
            set.status = 503
            return { error: 'Web Push non configurato sul server.' }
          }
          await upsertWebPushSubscription({
            characterId,
            endpoint: body.endpoint,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
            userAgent: headers['user-agent'] ?? null,
          })
          return { ok: true }
        },
        {
          body: t.Object({
            endpoint: t.String(),
            keys: t.Object({
              p256dh: t.String(),
              auth: t.String(),
            }),
          }),
        },
      )
      .post(
        '/unsubscribe',
        async ({ characterId, body, set }) => {
          if (!characterId) {
            set.status = 401
            return { error: 'Character not found' }
          }
          await deleteWebPushSubscription(characterId, body.endpoint)
          return { ok: true }
        },
        {
          body: t.Object({ endpoint: t.String() }),
        },
      ),
  )
