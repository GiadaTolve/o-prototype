import { Elysia } from 'elysia';
import { authPlugin } from '../../plugins/auth.plugin';
import * as bestiario from './bestiario.service';

export const bestiarioRoutes = new Elysia({ prefix: '/bestiario' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/', async () => {
        const grouped = await bestiario.getBestiaryByCategory();
        return grouped;
      })
      .get('/list', async () => {
        const list = await bestiario.getBestiary();
        return list;
      })
  );
