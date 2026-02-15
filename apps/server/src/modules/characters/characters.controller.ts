import { Elysia, t } from 'elysia'
// 👇 Importiamo l'istanza della classe service che abbiamo creato prima
import { characterService } from './characters.service' 
// 👇 Importiamo il plugin corretto
import { authPlugin } from '../../plugins/auth.plugin' 

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
          backgroundImage?: string;
          themeMusicUrl?: string;
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

        return {
          found: true,
          isOnboarded: !char.isRaw,
          ...char,
          avatarUrl: char.avatar,
          backgroundImage: meta.backgroundImage,
          themeMusicUrl: meta.themeMusicUrl,
          stats: {
            f: char.strength,
            c: char.constitution,
            d: char.dexterity,
            m: char.mind,
            e: char.empathy,
          },
          canAccessShinigami,
          canAccessGestione,
        }
      } catch (e) {
        set.status = 500
        return { error: 'Internal Server Error' }
      }
    }, {
      detail: { summary: 'Get current user character' }
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
        return updatedChar;
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
      }),
      detail: { summary: 'Update character profile' }
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

    // 6. Profilo pubblico personaggio (per scheda aperta da "Presenti")
    .get('/:id/public', async ({ params, user, set }) => {
      if (!user) { set.status = 401; return { error: 'Unauthorized' } }
      try {
        const viewerRole = (user.role ?? '').toUpperCase()
        const char = await characterService.getPublicCharacter(params.id)
        if (!char) {
          set.status = 404
          return { error: 'Personaggio non trovato' }
        }

        // Regole di visibilità base: giocatore / shinigami / capo shinigami
        const canSeeBackground = true
        const canSeeJournal = true
        const canSeePrivateLog = viewerRole === 'ADMIN' || viewerRole === 'MASTER'
        // Moderatori e Admin possono vedere la scheda completa (non censurata)
        const canSeeFullSheet = viewerRole === 'ADMIN' || viewerRole === 'MASTER'

        return {
          ...char,
          visibility: {
            canSeeBackground,
            canSeeJournal,
            canSeePrivateLog,
            canSeeFullSheet,
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
        } | null) ?? {}

        return {
          found: true,
          isOnboarded: !char.isRaw,
          ...char,
          avatarUrl: char.avatar,
          backgroundImage: meta.backgroundImage,
          themeMusicUrl: meta.themeMusicUrl,
          stats: {
            f: char.strength,
            c: char.constitution,
            d: char.dexterity,
            m: char.mind,
            e: char.empathy,
          },
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
  )