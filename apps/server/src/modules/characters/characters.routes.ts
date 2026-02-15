import { Elysia, t } from 'elysia';
import { characterService } from './characters.service'; 
import { authPlugin } from '../../plugins/auth.plugin'; 

export const charactersRoutes = new Elysia({ prefix: '/character' })
  .use(authPlugin) 
  
  .guard({ isAuthenticated: true }, (app) => app
    
    .get('/me', async ({ user }) => {
      // FIX PER TYPESCRIPT: Controlliamo esplicitamente
      if (!user) throw new Error("Unauthorized"); // 👈 Aggiungi questo

      const char = await characterService.getCharacterByUserId(user.id);
      if (!char) {
        return { status: 'NOT_FOUND', message: 'Personaggio non ancora creato.' };
      }
      return char;
    })

    .post('/onboarding', async ({ user, body }) => {
      // FIX PER TYPESCRIPT: Type Narrowing
      if (!user) throw new Error("Unauthorized"); // 👈 Aggiungi questo!
      // Da qui in poi, TS sa che 'user' NON è null.

      const existing = await characterService.getCharacterByUserId(user.id);
      if (existing) {
        throw new Error("Il personaggio esiste già!");
      }

      const newChar = await characterService.createOnboarding(user.id, {
        name: body.name,       
        surname: body.surname,
        avatar: body.avatarUrl,
        order: body.order,
        baseStats: {
          strength: body.stats.f,
          constitution: body.stats.c,
          dexterity: body.stats.d,
          mind: body.stats.m,
          empathy: body.stats.e
        }
      });

      return { status: 'SUCCESS', character: newChar };
    }, {
      body: t.Object({
        name: t.String(),
        surname: t.String(),
        avatarUrl: t.String(),
        order: t.Union([t.Literal('MUGEN-TAI'), t.Literal('CHISEN-TAI'), t.Literal('NONE')]),
        stats: t.Object({
          f: t.Numeric(),
          c: t.Numeric(),
          d: t.Numeric(),
          m: t.Numeric(),
          e: t.Numeric()
        })
      })
    })

    // Aggiorna profilo pubblico (avatar, miniAvatar, surname, bio)
    .put(
      '/me/profilo',
      async ({ user, body, set }) => {
        if (!user) throw new Error("Unauthorized");
        
        const char = await characterService.getCharacterByUserId(user.id);
        if (!char) {
          set.status = 404;
          return { error: 'Personaggio non trovato' };
        }

        try {
          const updated = await characterService.updateProfile(char.id, {
            avatar: body.avatar,
            miniAvatar: body.miniAvatar,
            surname: body.surname,
            bio: body.bio,
          });
          return updated;
        } catch (e: unknown) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento profilo' };
        }
      },
      {
        body: t.Object({
          avatar: t.Optional(t.String()),
          miniAvatar: t.Optional(t.String()),
          surname: t.Optional(t.String()),
          bio: t.Optional(t.String()),
        }),
      }
    )
  );