import { Elysia, t } from 'elysia'
import { isNotNull } from 'drizzle-orm'
import { authPlugin } from '../../plugins/auth.plugin'
import { userCanExecuteDrop } from '../../lib/gestione-access'
import { db } from '../../plugins/db'
import { items } from '../../db/schema'
import { isValidRoom } from '../chat/chat.service'
import { characterService } from '../characters/characters.service'
import { listGroundLoot } from './drop.service'
import { listDropTablesAdmin } from './drop-tables.service'

export const dropRoutes = new Elysia({ prefix: '/drop' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get(
        '/ground/:roomId',
        async ({ params, set }) => {
          if (!isValidRoom(params.roomId)) {
            set.status = 400
            return { error: 'Invalid room' }
          }
          const loot = await listGroundLoot(params.roomId)
          return { items: loot }
        },
        { params: t.Object({ roomId: t.String() }) },
      )
      .get('/panel-data', async ({ user, set }) => {
        const senderUser = await characterService.getUserByCharacterId(user!.characterId)
        const canDrop = await userCanExecuteDrop(
          user!.userId,
          senderUser?.role,
          user!.characterId,
        )
        if (!canDrop) {
          set.status = 403
          return { error: 'Accesso riservato a Master/Moderazione' }
        }

        const rows = await db.query.items.findMany({
          where: isNotNull(items.catalogKey),
          orderBy: (t, { asc }) => [asc(t.category), asc(t.name)],
        })

        const catalogItems = rows.map((row) => ({
          catalogKey: row.catalogKey!,
          name: row.name,
          nameRomaji: row.nameRomaji,
          description: row.description,
          effectText: row.effectText,
          category: row.category,
          integrityMax: row.integrityMax,
          damage: row.damage,
          resistance: row.resistance,
          bonus: row.bonus,
          ammoKind: row.ammoKind,
        }))

        const dropTables = await listDropTablesAdmin()
        return { items: catalogItems, tables: dropTables.tables, pools: dropTables.pools }
      }),
  )
