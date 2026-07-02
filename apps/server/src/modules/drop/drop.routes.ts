import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { isValidRoom } from '../chat/chat.service'
import { listGroundLoot } from './drop.service'

export const dropRoutes = new Elysia({ prefix: '/drop' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app.get(
      '/ground/:roomId',
      async ({ params, set }) => {
        if (!isValidRoom(params.roomId)) {
          set.status = 400
          return { error: 'Invalid room' }
        }
        const items = await listGroundLoot(params.roomId)
        return { items }
      },
      { params: t.Object({ roomId: t.String() }) },
    ),
  )
