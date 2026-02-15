import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { characterService } from "../characters/characters.service";
import * as meteo from "./meteo.service";

/**
 * Verifica se un character può gestire il meteo (admin/mod/capo-shinigami).
 */
async function canManageMeteo(characterId: string): Promise<boolean> {
  const char = await characterService.getCharacterById(characterId);
  if (!char) return false;
  const user = await characterService.getUserByCharacterId(characterId);
  if (user?.role === "ADMIN" || user?.role === "MASTER") return true;
  const metadata = char.uiMetadata as { roleIcon?: string } | null;
  if (metadata?.roleIcon) {
    const role = metadata.roleIcon.toLowerCase();
    return role === "moderatore" || role === "admin" || role === "capo-shinigami";
  }
  return false;
}

export const meteoRoutes = new Elysia({ prefix: "/meteo" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .derive(async ({ user }) => {
        if (!user) return { characterId: null as string | null };
        const char = await characterService.getCharacterByUserId(user.id);
        return { characterId: char?.id ?? null };
      })
      .get("/", async () => {
        const all = await meteo.getAllMeteo();
        return all;
      })
      .get("/:prefetturaId", async ({ params, set }) => {
        const data = await meteo.getMeteo(params.prefetturaId);
        if (!data) {
          set.status = 404;
          return { error: "Meteo non trovato per questa prefettura" };
        }
        return data;
      }, { params: t.Object({ prefetturaId: t.String() }) })
      .patch("/:prefetturaId", async ({ params, body, characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const canManage = await canManageMeteo(characterId);
        if (!canManage) {
          set.status = 403;
          return { error: "Only Admin/Mod can manage weather" };
        }
        const updated = await meteo.upsertMeteo(
          params.prefetturaId,
          body.temp,
          body.condition,
          body.icon,
          characterId
        );
        return updated;
      }, {
        params: t.Object({ prefetturaId: t.String() }),
        body: t.Object({
          temp: t.Number(),
          condition: t.String(),
          icon: t.Union([t.Literal("sun"), t.Literal("cloud"), t.Literal("cloud-sun"), t.Literal("rain")]),
        }),
      })
  );
