/**
 * Route toggle Paradise — path root /paradise-toggle per evitare 404.
 */
import { Elysia, t } from "elysia";
import { authPlugin } from "../plugins/auth.plugin";
import { setRoomOpen, getRoomState } from "./anonymous-chat/anonymous-chat.service";

const PARADISE_ROOM_ID = "edo__paradise";

export const paradiseToggleRoutes = new Elysia()
  .use(authPlugin)
  .post(
    "/paradise-toggle",
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
      const char = await import("./characters/characters.service").then((m) =>
        m.characterService.getCharacterByUserId(user.id)
      );
      if (body.isOpen && !char) {
        set.status = 400;
        return { error: "Serve un personaggio attivo per aprire la stanza" };
      }
      const roomId = body.roomId ?? PARADISE_ROOM_ID;
      await setRoomOpen(roomId, body.isOpen, char?.id ?? "");
      return getRoomState(roomId);
    },
    {
      body: t.Object({
        isOpen: t.Boolean(),
        roomId: t.Optional(t.String()),
      }),
    }
  );
