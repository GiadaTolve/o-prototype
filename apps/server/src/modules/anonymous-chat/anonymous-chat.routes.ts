/**
 * API partychat (Circus) — chat anonima con regole a sé.
 * - GET /anonymous-room/:roomId/state — stato stanza (pubblico)
 * - POST /anonymous-room/:roomId/join — entra nella sessione (assegna animale+colore)
 * - POST /anonymous-room/:roomId/leave — esce dalla sessione
 */
import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import * as anonymousService from "./anonymous-chat.service";

const PARADISE_ROOM_ID = "edo__paradise";

export const anonymousChatRoutes = new Elysia({ prefix: "/anonymous-room" })
  .use(authPlugin)
  .get("/:roomId/state", async ({ params }) => anonymousService.getRoomState(params.roomId))
  // Toggle prima delle route dinamiche (ordine importante per Elysia)
  .post(
    "/toggle",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return { error: "Non autenticato" };
      }
      const role = (user?.role ?? "").toUpperCase();
      if (role !== "ADMIN" && role !== "MASTER") {
        set.status = 403;
        return { error: "Accesso riservato ad admin/master" };
      }
      const char = await import("../characters/characters.service").then((m) =>
        m.characterService.getCharacterByUserId(user!.id)
      );
      if (body.isOpen && !char) {
        set.status = 400;
        return { error: "Serve un personaggio attivo per aprire la stanza" };
      }
      const roomId = body.roomId ?? PARADISE_ROOM_ID;
      await anonymousService.setRoomOpen(roomId, body.isOpen, char?.id ?? "");
      return anonymousService.getRoomState(roomId);
    },
    {
      body: t.Object({
        isOpen: t.Boolean(),
        roomId: t.Optional(t.String()),
      }),
    }
  )
  .guard({ isAuthenticated: true }, (app) =>
    app
      .post(
        "/:roomId/join",
        async ({ params, user, set }) => {
          const char = await import("../characters/characters.service").then((m) =>
            m.characterService.getCharacterByUserId(user!.id)
          );
          if (!char) {
            set.status = 404;
            return { error: "Personaggio non trovato" };
          }
          const result = await anonymousService.joinSession(params.roomId, char.id);
          if (!result) {
            set.status = 403;
            return { error: "Area interdetta o sessione chiusa" };
          }
          return result;
        },
        { params: t.Object({ roomId: t.String() }) }
      )
      .post(
        "/:roomId/leave",
        async ({ params, user, set }) => {
          const char = await import("../characters/characters.service").then((m) =>
            m.characterService.getCharacterByUserId(user!.id)
          );
          if (!char) {
            set.status = 404;
            return { error: "Personaggio non trovato" };
          }
          await anonymousService.leaveSession(params.roomId, char.id);
          return { success: true };
        },
        { params: t.Object({ roomId: t.String() }) }
      )
  );
