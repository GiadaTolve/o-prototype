import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { getMessages, isValidRoom, insertMessage, clearRoom } from "./chat.service";
import { canAccessPrivateChatAsync } from "../housing/housing.service";
import { broadcastGlobalMessage, broadcastChatCleared } from "../realtime/ws.routes";
import { characterService } from "../characters/characters.service";
import { buildCharacterPixelIcons } from "../../lib/character-pixel-icons";

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get(
      "/:roomId",
      async ({ params, query, set, user }) => {
        if (!isValidRoom(params.roomId)) {
          set.status = 400;
          return { error: "Invalid room" };
        }
        if (params.roomId.startsWith("housing_")) {
          const char = await characterService.getCharacterByUserId(user!.id);
          if (!char || !(await canAccessPrivateChatAsync(char.id, params.roomId, user!, char))) {
            set.status = 403;
            return { error: "Accesso negato a questa chat" };
          }
        }
        const limit = Math.min(Number(query.limit) || 50, 100);
        const before = typeof query.before === "string" ? query.before : undefined;
        const rows = await getMessages(params.roomId, limit, before);
        return rows.map((r) => {
          const meta = (r.uiMetadata as {
            roleIcon?: string;
            orderIcon?: string;
            premioSpeciale?: string;
          } | null) ?? {};
          const pixelIcons = buildCharacterPixelIcons(meta, r.order);
          const isAnonymous = !r.isGlobal && r.anonymousAnimalName;
          const displayName = r.isGlobal ? `[GLOBAL] ${r.name}` : (isAnonymous ? r.anonymousAnimalName! : r.name);
          const displayAvatar = isAnonymous ? "/anonymous/mask.svg" : (r.miniAvatar ?? undefined);
          return {
            id: r.id,
            zone: r.isGlobal ? "GLOBAL" : r.zone,
            characterId: r.characterId,
            name: displayName,
            surname: isAnonymous ? undefined : (r.surname ?? undefined),
            miniAvatar: displayAvatar,
            anonymousColor: isAnonymous ? (r.anonymousColor ?? undefined) : undefined,
            pixelIcons,
            content: r.content,
            locationTag: r.locationTag ?? undefined,
            createdAt: r.createdAt,
            isMasterscreen: r.isMasterscreen ?? false,
          };
        });
      },
      {
        params: t.Object({ roomId: t.String() }),
        query: t.Object({
          limit: t.Optional(t.String()),
          before: t.Optional(t.String()),
        }),
      }
    )
    .post(
      "/clear",
      async ({ body, set, user }) => {
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        const roomId = String(body?.roomId ?? "").trim();
        if (!roomId) {
          set.status = 400;
          return { error: "roomId richiesto" };
        }
        if (!isValidRoom(roomId)) {
          set.status = 400;
          return { error: "Invalid room" };
        }
        if (roomId.startsWith("housing_")) {
          const char = await characterService.getCharacterByUserId(user.id);
          if (!char || !(await canAccessPrivateChatAsync(char.id, roomId, user, char))) {
            set.status = 403;
            return { error: "Accesso negato a questa chat" };
          }
        }
        const char = await characterService.getCharacterByUserId(user.id);
        if (!char) {
          set.status = 404;
          return { error: "Character not found" };
        }
        const userRole = (user.role ?? "").toUpperCase();
        const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {};
        const roleIcon = (meta.roleIcon ?? "").toLowerCase();
        const canAccess =
          userRole === "ADMIN" ||
          userRole === "MASTER" ||
          roleIcon === "moderatore" ||
          roleIcon === "admin" ||
          roleIcon === "capo-shinigami" ||
          roleIcon === "shinigami";
        if (!canAccess) {
          set.status = 403;
          return { error: "Solo cariche superiori (Admin/Mod/Shinigami) possono pulire la chat" };
        }
        await clearRoom(roomId, char.id);
        broadcastChatCleared(roomId, new Date().toISOString());
        return { success: true };
      },
      { body: t.Object({ roomId: t.String() }) }
    )
    .post(
      "/global-message",
      async ({ user, body, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        // Verifica permessi Admin/Mod/Capo
        const char = await characterService.getCharacterByUserId(user.id);
        if (!char) {
          set.status = 404;
          return { error: "Character not found" };
        }

        const userRole = (user.role ?? "").toUpperCase();
        const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {};
        const roleIcon = (meta.roleIcon ?? "").toLowerCase();

        const canAccessGestione =
          userRole === "ADMIN" ||
          roleIcon === "moderatore" ||
          roleIcon === "admin";

        if (!canAccessGestione) {
          set.status = 403;
          return { error: "Solo Admin/Mod/Capo può inviare messaggi globali" };
        }

        const content = (body.content as string)?.trim();
        if (!content || content.length === 0) {
          set.status = 400;
          return { error: "Il messaggio non può essere vuoto" };
        }

        // Salva il messaggio globale nel database
        await insertMessage("GLOBAL", char.id, content, undefined, true);

        // Invia il messaggio globale via WebSocket
        broadcastGlobalMessage(content, char.name);

        return { success: true, message: "Messaggio globale inviato" };
      },
      {
        body: t.Object({
          content: t.String({ minLength: 1 }),
        }),
      }
    )
  );
