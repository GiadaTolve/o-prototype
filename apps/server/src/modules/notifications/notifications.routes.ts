import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { characterService } from "../characters/characters.service";
import { getCharacterNotifications, getUnreadCount, markNotificationRead } from "./notifications.service";

export const notificationsRoutes = new Elysia({ prefix: "/notifications" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .derive(async ({ user }) => {
        const char = await characterService.getCharacterByUserId(user!.id);
        return { characterId: char?.id ?? null };
      })
      .get("/", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const list = await getCharacterNotifications(characterId);
        return list;
      })
      .get("/unread-count", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const count = await getUnreadCount(characterId);
        return { count };
      })
      .post("/:id/read", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        await markNotificationRead(params.id, characterId);
        return { ok: true };
      }, { params: t.Object({ id: t.String() }) })
  );
