import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { getMessages, isValidRoom, insertMessage } from "./chat.service";
import { broadcastGlobalMessage } from "../realtime/ws.routes";
import { characterService } from "../characters/characters.service";

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app.get(
      "/:roomId",
      async ({ params, query, set }) => {
        if (!isValidRoom(params.roomId)) {
          set.status = 400;
          return { error: "Invalid room" };
        }
        const limit = Math.min(Number(query.limit) || 50, 100);
        const before = typeof query.before === "string" ? query.before : undefined;
        const rows = await getMessages(params.roomId, limit, before);
        return rows.map((r) => {
          const meta = (r.uiMetadata as { roleIcon?: string; orderIcon?: string } | null) ?? {};
          const roleIcon = (meta.roleIcon ?? '').toLowerCase();
          const orderIcon = (meta.orderIcon ?? '').toLowerCase();
          
          // Costruisci pixelIcons
          const pixelIcons: { ruolo?: string[]; ordine?: string[] } = {};
          if (roleIcon && ['admin', 'moderatore', 'capo-shinigami', 'shinigami'].includes(roleIcon)) {
            pixelIcons.ruolo = [roleIcon];
          }
          if (orderIcon && ['mugen-tai', 'chisen-tai'].includes(orderIcon)) {
            pixelIcons.ordine = [orderIcon];
          } else if (r.order && r.order !== 'NONE') {
            pixelIcons.ordine = [r.order.toLowerCase()];
          }
          
          return {
            id: r.id,
            zone: r.isGlobal ? "GLOBAL" : r.zone,
            characterId: r.characterId,
            name: r.isGlobal ? `[GLOBAL] ${r.name}` : r.name,
            surname: r.surname ?? undefined,
            miniAvatar: r.miniAvatar ?? undefined,
            pixelIcons: Object.keys(pixelIcons).length > 0 ? pixelIcons : undefined,
            content: r.content,
            locationTag: r.locationTag ?? undefined,
            createdAt: r.createdAt,
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
          userRole === "MASTER" ||
          roleIcon === "moderatore" ||
          roleIcon === "admin" ||
          roleIcon === "capo-shinigami";

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
