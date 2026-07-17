import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { characterService } from "../characters/characters.service";
import { userHasShinigamiAccess } from "../../lib/gestione-access";
import * as masterNotes from "./master-notes.service";

async function isShinigami(characterId: string): Promise<boolean> {
  const char = await characterService.getCharacterById(characterId);
  if (!char) return false;
  const user = await characterService.getUserByCharacterId(characterId);
  return userHasShinigamiAccess(user?.id ?? "", user?.role);
}

export const masterNotesRoutes = new Elysia({ prefix: "/master-notes" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .derive(async ({ user }) => {
        if (!user) return { characterId: null as string | null };
        const char = await characterService.getCharacterByUserId(user.id);
        return { characterId: char?.id ?? null };
      })
      .get("/:roomId", async ({ params, set }) => {
        const notes = await masterNotes.getMasterNotes(params.roomId);
        return notes ?? { roomId: params.roomId, notes: null, updatedById: null, updatedAt: null };
      }, { params: t.Object({ roomId: t.String() }) })
      .patch("/:roomId", async ({ params, body, characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const shinigami = await isShinigami(characterId);
        if (!shinigami) {
          set.status = 403;
          return { error: "Only Shinigami can modify master notes" };
        }
        const updated = await masterNotes.upsertMasterNotes(params.roomId, body.notes ?? null, characterId);
        return updated;
      }, {
        params: t.Object({ roomId: t.String() }),
        body: t.Object({ notes: t.Optional(t.String()) }),
      })
  );
