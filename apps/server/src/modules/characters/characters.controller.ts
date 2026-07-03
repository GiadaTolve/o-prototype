import { Elysia, t } from 'elysia'
import { calculateDerivedStats } from '@domain/stats/calculator'
import { characterService } from './characters.service'
import {
  acknowledgeLevelUpBanner,
  dismissLevelUpBanner,
  readPendingLevelUp,
} from './level-up.service'
import { buildCharacterPixelIcons } from '../../lib/character-pixel-icons'
import { authPlugin } from '../../plugins/auth.plugin'
import { broadcastCharacterHpUpdated, broadcastCharacterChronoUpdated, broadcastCharacterStatusUpdated } from '../realtime/ws.routes'

function resolveGestioneAccess(user: { role?: string | null }, roleIcon?: string) {
  const userRole = (user.role ?? '').toUpperCase()
  const icon = (roleIcon ?? '').toLowerCase()
  return (
    userRole === 'ADMIN' ||
    userRole === 'MASTER' ||
    icon === 'moderatore' ||
    icon === 'admin' ||
    icon === 'capo-shinigami'
  )
}

function resolveMasterAccess(user: { role?: string | null }) {
  const userRole = (user.role ?? '').toUpperCase()
  return userRole === 'ADMIN' || userRole === 'MASTER'
}

export const charactersController = new Elysia({ prefix: '/characters' })
  .use(authPlugin) // Carica il plugin Auth
  
  // 👇 Il Guard è fondamentale: dice a TypeScript "Qui l'utente c'è per forza"
  .guard({ isAuthenticated: true }, (app) => app
    
    // 1. CHI SONO IO? (+ canAccessShinigami / canAccessGestione per nascondere link a non autorizzati)
    .get('/me', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }

      try {
        const char = await characterService.getCharacterByUserId(user.id)

        if (!char) {
          return { found: false, isOnboarded: false }
        }

        const meta = (char.uiMetadata as { 
          roleIcon?: string;
          orderIcon?: string;
          premioSpeciale?: string;
          backgroundImage?: string;
          themeMusicUrl?: string;
          bannerPg?: string;
        } | null) ?? {}
        const roleIcon = (meta.roleIcon ?? '').toLowerCase()
        const userRole = (user.role ?? '').toUpperCase()

        const canAccessShinigami =
          userRole === 'MASTER' ||
          roleIcon === 'shinigami' ||
          roleIcon === 'capo-shinigami'

        const canAccessGestione =
          userRole === 'ADMIN' ||
          userRole === 'MASTER' ||
          roleIcon === 'moderatore' ||
          roleIcon === 'admin' ||
          roleIcon === 'capo-shinigami'

        const canAccessSviluppo =
          userRole === 'ADMIN' ||
          roleIcon === 'moderatore' ||
          roleIcon === 'admin' ||
          roleIcon === 'fixer'

        const canEditStaffAlias = canAccessGestione
        const canEditMasterNotes = userRole === 'ADMIN' || userRole === 'MASTER'

        const { gems: _gems, ...charSafe } = char

        const pixelIcons = buildCharacterPixelIcons(meta, char.order)

        return {
          found: true,
          isOnboarded: !char.isRaw,
          ...charSafe,
          pixelIcons,
          avatarUrl: char.avatar,
          backgroundImage: meta.backgroundImage,
          themeMusicUrl: meta.themeMusicUrl,
          bannerPg: meta.bannerPg,
          stats: {
            f: char.strength,
            c: char.constitution,
            d: char.dexterity,
            m: char.mind,
            e: char.empathy,
          },
          canAccessShinigami,
          canAccessGestione,
          canAccessSviluppo,
          canEditStaffAlias,
          canEditMasterNotes,
          pendingLevelUp: readPendingLevelUp(char.uiMetadata),
        }
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      detail: { summary: 'Get current user character' }
    })

    .patch('/me/level-up-banner', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }

      const char = await characterService.getCharacterByUserId(user.id)
      if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }

      if (body.action === 'ack') {
        await acknowledgeLevelUpBanner(char.id)
        return { ok: true }
      }
      if (body.action === 'dismiss') {
        await dismissLevelUpBanner(char.id)
        return { ok: true }
      }

      set.status = 400
      return { error: 'Azione non valida' }
    }, {
      body: t.Object({
        action: t.Union([t.Literal('dismiss'), t.Literal('ack')]),
      }),
      detail: { summary: 'Dismiss o acknowledge banner level-up' },
    })

    // 2. SETUP INIZIALE (Onboarding) — aggiorna il PG "Grezzo" creato in registrazione
    .post('/onboarding', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }

      try {
        const updatedChar = await characterService.updateOnboarding(user.id, {
          surname: body.surname,
          bio: body.bio,
          avatar: body.avatar,
          miniAvatar: body.miniAvatar,
          order: body.order,
          baseStats: {
            strength: Number(body.stats.f),
            constitution: Number(body.stats.c),
            dexterity: Number(body.stats.d),
            mind: Number(body.stats.m),
            empathy: Number(body.stats.e),
          },
        });
        const { gems: _gems, ...safeChar } = updatedChar;
        return safeChar;
      } catch (error) {
        set.status = 400;
        return { error: error instanceof Error ? error.message : 'Setup failed' };
      }
    }, {
      body: t.Object({
        surname: t.String(),
        bio: t.Optional(t.String()),
        avatar: t.String(),
        miniAvatar: t.Optional(t.String()),
        order: t.Union([t.Literal('MUGEN-TAI'), t.Literal('CHISEN-TAI'), t.Literal('NONE')]),
        stats: t.Object({
          f: t.Number(),
          c: t.Number(),
          d: t.Number(),
          m: t.Number(),
          e: t.Number(),
        }),
      }),
    })

    // 3. Lista personaggi per Nuova conversazione SMS (id, name, miniAvatar; esclude me)
    .get('/list', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) return []
        const list = await characterService.listForSms(char.id)
        return list
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, { detail: { summary: 'List characters for SMS new conversation' } })

    // 3b. Ricerca personaggi per SMS (Live Search, debounce 300ms). Query param q.
    .get('/search', async ({ user, set, query }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) return []
        const q = (query as { q?: string })?.q ?? ''
        const list = await characterService.searchForSms(char.id, q)
        return list
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      query: t.Object({ q: t.Optional(t.String()) }),
      detail: { summary: 'Search characters for SMS (Live Search)' }
    })

    // 3a. Skill disponibili per acquisto (con stato owned/canPurchase)
    .get('/me/skills/available', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        const list = await characterService.getAvailableSkillsForPurchase(char.id)
        return list
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    })

    // 3b. Waza del personaggio corrente
    .get('/me/waza', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) {
          set.status = 404
          return { error: 'Personaggio non trovato' }
        }
        const waza = await characterService.getCharacterWaza(char.id)
        return waza
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      detail: { summary: 'Get current character Waza' }
    })

    // 3c. Acquista skill con EXP
    .post('/me/skills', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        const waza = await characterService.purchaseSkill(char.id, body.skillId)
        return waza
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore acquisto skill' }
      }
    }, {
      body: t.Object({ skillId: t.String() }),
    })

    // 3d. Slot passivi Waza
    .get('/me/passive-slots', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.getPassiveSlotsState(char.id)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore slot passivi' }
      }
    }, { detail: { summary: 'Get passive Waza loadout' } })

    .post('/me/passive-slots/unlock', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.unlockPassiveSlot(char.id)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore sblocco slot' }
      }
    }, { detail: { summary: 'Unlock next passive slot with EXP' } })

    .patch('/me/passive-slots/equip', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.setEquippedPassives(char.id, body.equippedIds)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore equip passivi' }
      }
    }, {
      body: t.Object({ equippedIds: t.Array(t.String()) }),
      detail: { summary: 'Equip owned passive Waza in slots' },
    })

    // 3e. Esagono stili Dō
    .get('/me/style-hexagon', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.getStyleHexState(char.id)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore Esagono' }
      }
    }, { detail: { summary: 'Get style hexagon state' } })

    .patch('/me/style-hexagon/primary', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.setPrimaryStyle(char.id, body.styleId)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore stile principale' }
      }
    }, {
      body: t.Object({ styleId: t.String() }),
      detail: { summary: 'Set primary Dō style (once)' },
    })

    .post('/me/style-hexagon/unlock', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.unlockStyle(char.id, body.styleId)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore sblocco stile' }
      }
    }, {
      body: t.Object({ styleId: t.String() }),
      detail: { summary: 'Unlock Dō style with Key' },
    })

    // 3f. Status combattimento
    .get('/me/status-effects', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.getStatusEffectsState(char.id)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore status' }
      }
    }, { detail: { summary: 'Get active combat status effects' } })

    .get('/:id/status-effects', async ({ user, params, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        return await characterService.getStatusEffectsState(params.id)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore status' }
      }
    }, { detail: { summary: 'Get status effects for character (read)' } })

    .post('/:id/status-effects/apply', async ({ user, params, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      if (!resolveMasterAccess(user)) {
        set.status = 403
        return { error: 'Solo Master/Admin possono applicare status' }
      }
      try {
        const result = await characterService.applyStatusEffectToCharacter(params.id, body)
        broadcastCharacterStatusUpdated({ characterId: params.id })
        return result
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore applicazione status' }
      }
    }, {
      body: t.Object({
        statusId: t.Optional(t.String()),
        element: t.Optional(
          t.Union([
            t.Literal('fuoco'),
            t.Literal('fulmine'),
            t.Literal('acqua'),
            t.Literal('gravita'),
            t.Literal('aria'),
          ]),
        ),
        stacks: t.Optional(t.Number()),
        durationTurns: t.Optional(t.Number()),
        addStacks: t.Optional(t.Boolean()),
      }),
      detail: { summary: 'Master: apply status or elemental effect' },
    })

    .post('/:id/combat-hp', async ({ user, params, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      if (!resolveMasterAccess(user)) {
        set.status = 403
        return { error: 'Solo Master/Admin possono modificare HP' }
      }
      try {
        const vitals = await characterService.applyCombatHpDelta(params.id, body.delta, {
          hitTier: body.hitTier,
          attackerCharacterId: body.attackerCharacterId,
          contactHit: body.contactHit,
        })
        broadcastCharacterHpUpdated({ characterId: params.id, ...vitals })
        return vitals
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore HP' }
      }
    }, {
      body: t.Object({
        delta: t.Number(),
        /** Tier colpo subìto (Junnō / Hibiki) — solo con delta negativo. */
        hitTier: t.Optional(t.Number()),
        /** PG che ha inflitto il danno (Shokushin deepen / bonus tier). */
        attackerCharacterId: t.Optional(t.String()),
        /** Colpo a [Contatto] — Kōmei Rovente applica [Incendiato]. */
        contactHit: t.Optional(t.Boolean()),
      }),
      detail: { summary: 'Master: applica danno/cura HP (non va in chat)' },
    })

    .delete('/:id/status-effects/:statusId', async ({ user, params, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      if (!resolveMasterAccess(user)) {
        set.status = 403
        return { error: 'Solo Master/Admin possono rimuovere status' }
      }
      try {
        const result = await characterService.removeStatusEffectFromCharacter(params.id, params.statusId)
        broadcastCharacterStatusUpdated({ characterId: params.id })
        return result
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore rimozione status' }
      }
    }, { detail: { summary: 'Master: remove status' } })

    .post('/:id/status-effects/tick-turn', async ({ user, params, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      if (!resolveMasterAccess(user)) {
        set.status = 403
        return { error: 'Solo Master/Admin' }
      }
      try {
        const result = await characterService.tickCharacterStatusEndOfTurn(params.id, body.currentCs)
        const vitals = result.vitals as { hpCurrent: number; hpMax: number }
        broadcastCharacterStatusUpdated({ characterId: params.id })
        if ((result.tick?.selfDamage ?? 0) > 0) {
          broadcastCharacterHpUpdated({
            characterId: params.id,
            hpCurrent: vitals.hpCurrent,
            hpMax: vitals.hpMax,
          })
        }
        return result
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore tick status' }
      }
    }, {
      body: t.Object({ currentCs: t.Optional(t.Number()) }),
      detail: { summary: 'Master: end-of-turn status tick (decay + DoT log)' },
    })

    .post('/:id/status-effects/hit-taken', async ({ user, params, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      if (!resolveMasterAccess(user)) {
        set.status = 403
        return { error: 'Solo Master/Admin' }
      }
      try {
        const result = await characterService.recordCharacterStatusHitTaken(params.id)
        const vitals = result.vitals as {
          chronoStack?: Parameters<typeof broadcastCharacterChronoUpdated>[0]
        }
        if (vitals.chronoStack) {
          broadcastCharacterChronoUpdated({ characterId: params.id, ...vitals.chronoStack })
        }
        return result
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore evento colpo' }
      }
    }, { detail: { summary: 'Master: successful hit taken (Macchiato −1)' } })

    .get('/me/toro-state', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.getToroState(char.id)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore Tōrō' }
      }
    }, { detail: { summary: 'Get Tōrō lantern state' } })

    .patch('/me/toro-state', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.setToroWeaponInContact(char.id, body.weaponInContact)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore Tōrō' }
      }
    }, {
      body: t.Object({ weaponInContact: t.Boolean() }),
      detail: { summary: 'Toggle weapon contact (Tōrō sigillo)' },
    })

    .get('/me/gosa-state', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.getGosaState(char.id)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore Gosa' }
      }
    }, { detail: { summary: 'Get Gosa stacks' } })

    .patch('/me/gosa-state', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return await characterService.patchGosaState(char.id, body)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore Gosa' }
      }
    }, {
      body: t.Object({
        action: t.Optional(t.Literal('correct')),
        stacks: t.Optional(t.Number()),
      }),
      detail: { summary: 'Correggi Gosa (−1 stack) o imposta stacks (debug)' },
    })

    .get('/me/do-mechanics', async ({ user, query, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        const cs = typeof query.currentCs === 'number' ? query.currentCs : 0
        return await characterService.getDoMechanics(char.id, cs)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore meccaniche Dō' }
      }
    }, {
      query: t.Object({ currentCs: t.Optional(t.Numeric()) }),
      detail: { summary: 'Stato Tensione / Junkan / Yuragi / Atsuryoku' },
    })

    .patch('/me/do-mechanics', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        const result = await characterService.patchDoMechanics(char.id, body)
        const chrono = result.itoPatch?.chrono
        if (chrono) {
          broadcastCharacterChronoUpdated({ characterId: char.id, ...chrono })
        }
        if ((result.itoPatch?.emorragiaStacks ?? 0) > 0) {
          broadcastCharacterStatusUpdated({ characterId: char.id })
        }
        return result
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore meccaniche Dō' }
      }
    }, {
      body: t.Object({
        style: t.Optional(t.Union([
          t.Literal('ito'),
          t.Literal('naikan'),
          t.Literal('hensei'),
          t.Literal('hado'),
        ])),
        action: t.Optional(t.Union([
          t.Literal('release'),
          t.Literal('accumulate'),
          t.Literal('tickTurn'),
          t.Literal('reset'),
          t.Literal('advance'),
          t.Literal('setPhase'),
          t.Literal('vent'),
        ])),
        threads: t.Optional(t.Union([t.Literal(1), t.Literal(2)])),
        phase: t.Optional(t.Union([
          t.Literal('neutro'),
          t.Literal('solido'),
          t.Literal('fluido'),
          t.Literal('gassoso'),
        ])),
        itoTension: t.Optional(t.Number()),
        naikanPhase: t.Optional(t.Number()),
        yuragiPhase: t.Optional(t.String()),
        hadoPressure: t.Optional(t.Number()),
        currentCs: t.Optional(t.Number()),
        lastReceivedHitTier: t.Optional(t.Number()),
      }),
      detail: { summary: 'Aggiorna tracker meccaniche Dō (Itō–Hadō)' },
    })

    .post('/me/do-mechanics/tick-ito-turn', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) { set.status = 404; return { error: 'Personaggio non trovato' } }
        const tick = await characterService.tickItoTensionEndOfTurn(char.id)
        const snapshot = await characterService.getDoMechanics(char.id)
        return { ...snapshot, itoTick: tick }
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore tick Tensione' }
      }
    }, { detail: { summary: 'Fine turno Itō: decay Tensione (−1 se nessun filo)' } })

    .get('/:id/field-constructs', async ({ user, params, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        return await characterService.listFieldConstructsForCharacter(params.id)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore costrutti' }
      }
    }, { detail: { summary: 'List field constructs by creator' } })

    .post('/:id/field-constructs', async ({ user, params, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      if (!resolveMasterAccess(user)) {
        set.status = 403
        return { error: 'Solo Master/Admin' }
      }
      try {
        return await characterService.createFieldConstructForCharacter(params.id, body)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore creazione costrutto' }
      }
    }, {
      body: t.Object({
        label: t.String(),
        wazaTier: t.Number(),
        size: t.Optional(t.String()),
        stationary: t.Optional(t.Boolean()),
      }),
      detail: { summary: 'Master: spawn field construct (Genkai da scheda creatore)' },
    })

    .post('/field-constructs/:constructId/damage', async ({ user, params, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      if (!resolveMasterAccess(user)) {
        set.status = 403
        return { error: 'Solo Master/Admin' }
      }
      try {
        return await characterService.damageFieldConstructById(params.constructId, body.damage)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore danno costrutto' }
      }
    }, {
      body: t.Object({ damage: t.Number() }),
      detail: { summary: 'Master: damage field construct' },
    })

    .delete('/field-constructs/:constructId', async ({ user, params, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      if (!resolveMasterAccess(user)) {
        set.status = 403
        return { error: 'Solo Master/Admin' }
      }
      try {
        return await characterService.destroyFieldConstructById(params.constructId)
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore distruzione costrutto' }
      }
    }, { detail: { summary: 'Master: destroy field construct' } })

    // 4. Aggiorna profilo pubblico (avatar, miniAvatar, surname, bio, backgroundImage, themeMusicUrl)
    .put('/me/profilo', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) {
          set.status = 404
          return { error: 'Personaggio non trovato' }
        }

        const updated = await characterService.updateProfile(char.id, {
          avatar: body.avatar,
          miniAvatar: body.miniAvatar,
          surname: body.surname,
          bio: body.bio,
          backgroundImage: body.backgroundImage,
          themeMusicUrl: body.themeMusicUrl,
          bannerPg: body.bannerPg,
        })
        return updated
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento profilo' }
      }
    }, {
      body: t.Object({
        avatar: t.Optional(t.String()),
        miniAvatar: t.Optional(t.String()),
        surname: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        backgroundImage: t.Optional(t.String()),
        themeMusicUrl: t.Optional(t.String()),
        bannerPg: t.Optional(t.String()),
      }),
      detail: { summary: 'Update character profile' }
    })

    // 4b. Admin/Mod: aggiorna profilo di un altro personaggio
    .put('/:id/profilo', async ({ params, user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      const viewerRole = (user.role ?? '').toUpperCase()
      if (viewerRole !== 'ADMIN' && viewerRole !== 'MASTER') {
        set.status = 403
        return { error: 'Solo Admin e Moderatori possono modificare schede altrui.' }
      }
      try {
        const updated = await characterService.updateProfile(params.id, {
          avatar: body.avatar,
          miniAvatar: body.miniAvatar,
          surname: body.surname,
          bio: body.bio,
          backgroundImage: body.backgroundImage,
          themeMusicUrl: body.themeMusicUrl,
          bannerPg: body.bannerPg,
        })
        return updated
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento profilo' }
      }
    }, {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        avatar: t.Optional(t.String()),
        miniAvatar: t.Optional(t.String()),
        surname: t.Optional(t.String()),
        bio: t.Optional(t.String()),
        backgroundImage: t.Optional(t.String()),
        themeMusicUrl: t.Optional(t.String()),
        bannerPg: t.Optional(t.String()),
      }),
      detail: { summary: 'Update another character profile (Admin/Mod only)' }
    })

    // 4c. Alias staff / Note Master (permessi separati)
    .patch('/:id/staff-meta', async ({ params, user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }

      try {
        const targetChar = await characterService.getCharacterById(params.id)
        if (!targetChar) {
          set.status = 404
          return { error: 'Personaggio non trovato' }
        }

        const viewerChar = await characterService.getCharacterByUserId(user.id)
        const viewerMeta = (viewerChar?.uiMetadata as { roleIcon?: string } | null) ?? {}
        const canEditAlias = resolveGestioneAccess(user, viewerMeta.roleIcon)
        const canEditNotes = resolveMasterAccess(user)

        if (body.staffAlias !== undefined && !canEditAlias) {
          set.status = 403
          return { error: 'Solo staff (Shinigami/Moderatori) può assegnare l\'alias.' }
        }
        if (body.masterNotes !== undefined && !canEditNotes) {
          set.status = 403
          return { error: 'Solo Master e Admin possono modificare le Note Master.' }
        }

        const updated = await characterService.updateStaffMeta(params.id, {
          staffAlias: body.staffAlias,
          masterNotes: body.masterNotes,
        })

        return {
          staffAlias: updated.staffAlias,
          masterNotes: updated.masterNotes,
        }
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento' }
      }
    }, {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        staffAlias: t.Optional(t.Union([t.String(), t.Null()])),
        masterNotes: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: { summary: 'Update staff alias and/or master notes' },
    })

    // 5. Waza per un personaggio specifico (scheda pubblica / Journal)
    .get('/:id/waza', async ({ params, set }) => {
      try {
        const waza = await characterService.getCharacterWaza(params.id)
        return waza
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      params: t.Object({ id: t.String() }),
      detail: { summary: 'Get Waza for character by ID' }
    })

    // 6. Profilo pubblico personaggio (per scheda aperta da "Presenti"). Stessa Scheda, dati censurati.
    .get('/:id/public', async ({ params, user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const viewerRole = (user.role ?? '').toUpperCase()
        const char = await characterService.getPublicCharacter(params.id)
        if (!char) {
          set.status = 404
          return { error: 'Personaggio non trovato' }
        }

        const derivedLegacy = calculateDerivedStats(
          {
            strength: char.stats.f,
            constitution: char.stats.c,
            dexterity: char.stats.d,
            mind: char.stats.m,
            empathy: char.stats.e,
          },
          1.0,
        )

        const canSeeBackground = true
        const canSeeJournal = true
        const canSeePrivateLog = viewerRole === 'ADMIN' || viewerRole === 'MASTER'
        const canSeeFullSheet = viewerRole === 'ADMIN' || viewerRole === 'MASTER'
        const canEdit = canSeeFullSheet

        const dbChar = await characterService.getCharacterById(params.id)
        const isOwner = dbChar?.userId === user.id
        const viewerChar = await characterService.getCharacterByUserId(user.id)
        const viewerMeta = (viewerChar?.uiMetadata as { roleIcon?: string } | null) ?? {}
        const canEditStaffAlias = resolveGestioneAccess(user, viewerMeta.roleIcon)
        const canEditMasterNotes = resolveMasterAccess(user)
        const showMasterNotes = isOwner || canEditMasterNotes

        return {
          ...char,
          avatarUrl: char.avatar,
          staffAlias: char.staffAlias,
          masterNotes: showMasterNotes ? char.masterNotes : null,
          skiruSheet: char.skiruSheet,
          skiruDomains: char.skiruDomains,
          computed: {
            ...char.computed,
            jigokaMax: derivedLegacy.jigokaMax,
            reflexes: derivedLegacy.reflexes,
            velocity: derivedLegacy.velocity,
          },
          experienceTotal: 0,
          experienceSpendable: 0,
          rem: 0,
          keys: 0,
          canEditStaffAlias,
          canEditMasterNotes,
          visibility: {
            canSeeBackground,
            canSeeJournal,
            canSeePrivateLog,
            canSeeFullSheet,
            canEdit,
            showMasterNotes,
          },
        }
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      params: t.Object({ id: t.String() }),
      detail: { summary: 'Get public character profile' }
    })

    // 7. Scheda completa personaggio (solo per Moderatori/Admin)
    .get('/:id/full', async ({ params, user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const viewerRole = (user.role ?? '').toUpperCase()
        // Solo Admin e Master possono vedere la scheda completa di altri
        if (viewerRole !== 'ADMIN' && viewerRole !== 'MASTER') {
          set.status = 403
          return { error: 'Accesso negato. Solo Moderatori e Admin possono vedere la scheda completa.' }
        }

        const char = await characterService.getCharacterByUserId(
          (await characterService.getUserByCharacterId(params.id))?.id ?? ''
        )
        if (!char) {
          set.status = 404
          return { error: 'Personaggio non trovato' }
        }

        const meta = (char.uiMetadata as { 
          roleIcon?: string;
          backgroundImage?: string;
          themeMusicUrl?: string;
          bannerPg?: string;
        } | null) ?? {}

        const viewerChar = await characterService.getCharacterByUserId(user.id)
        const viewerMeta = (viewerChar?.uiMetadata as { roleIcon?: string } | null) ?? {}

        return {
          found: true,
          isOnboarded: !char.isRaw,
          ...char,
          avatarUrl: char.avatar,
          backgroundImage: meta.backgroundImage,
          themeMusicUrl: meta.themeMusicUrl,
          bannerPg: meta.bannerPg,
          stats: {
            f: char.strength,
            c: char.constitution,
            d: char.dexterity,
            m: char.mind,
            e: char.empathy,
          },
          canEditStaffAlias: resolveGestioneAccess(user, viewerMeta.roleIcon),
          canEditMasterNotes: resolveMasterAccess(user),
        }
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      params: t.Object({ id: t.String() }),
      detail: { summary: 'Get full character sheet (Mod/Admin only)' }
    })

    // 8. Log EXP personaggio (EXP ultimi 7 giorni + log premi)
    .get('/me/exp-logs', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const char = await characterService.getCharacterByUserId(user.id)
        if (!char) {
          set.status = 404
          return { error: 'Personaggio non trovato' }
        }
        const logs = await characterService.getCharacterExpLogs(char.id)
        return logs
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      detail: { summary: 'Get character EXP logs (last 7 days + reward history)' }
    })

    // 8b. Admin/Mod: log EXP di un altro personaggio
    .get('/:id/exp-logs', async ({ params, user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      const viewerRole = (user.role ?? '').toUpperCase()
      if (viewerRole !== 'ADMIN' && viewerRole !== 'MASTER') {
        set.status = 403
        return { error: 'Solo Admin e Moderatori possono vedere i log altrui.' }
      }
      try {
        const logs = await characterService.getCharacterExpLogs(params.id)
        return logs
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      params: t.Object({ id: t.String() }),
      detail: { summary: 'Get another character EXP logs (Admin/Mod only)' }
    })

    // ── Skiru API ────────────────────────────────────────────────────

    // 9. GET scheda Skiru (sheet + derivati + costo prossimo punto per nodo)
    .get('/me/skiru', async ({ user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const data = await characterService.getSkiruSheet(user.id)
        if (!data) { set.status = 404; return { error: 'Personaggio non trovato' } }
        return data
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      detail: {
        summary: 'Get Skiru sheet + derived stats + exp cost per node',
      },
    })

    // 9b. PATCH — acquista punti Skiru con EXP spendibile
    .patch('/me/skiru', async ({ user, body, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const data = await characterService.raiseSkiruNode(user.id, body.skiruId, body.targetPoints)
        return data
      } catch (e: unknown) {
        set.status = 400
        return { error: e instanceof Error ? e.message : 'Errore aggiornamento Skiru' }
      }
    }, {
      body: t.Object({
        skiruId: t.String({ description: 'ID nodo Skiru dal catalogo (es. "undo", "konjou")' }),
        targetPoints: t.Number({
          minimum: 1,
          maximum: 10,
          description: 'Punti target (deve essere > punti attuali)',
        }),
      }),
      detail: {
        summary: 'Raise a Skiru node — spende EXP spendibile',
      },
    })
  )