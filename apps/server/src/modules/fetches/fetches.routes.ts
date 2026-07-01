import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { authPlugin } from "../../plugins/auth.plugin";
import { characterService } from "../characters/characters.service";
import * as fetches from "./fetches.service";
import * as gameSessions from "../game-sessions/game-sessions.service";
import { broadcastFetchResponso } from "../realtime/ws.routes";
import { createSystemNotification } from "../notifications/notifications.service";
import { db } from "../../plugins/db";
import { grades, levels, fetchAssignments } from "../../db/schema";

async function isShinigami(characterId: string): Promise<boolean> {
  const char = await characterService.getCharacterById(characterId);
  if (!char) return false;
  const user = await characterService.getUserByCharacterId(characterId);
  if (user?.role === "MASTER") return true;
  const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {};
  const r = (meta.roleIcon ?? "").toLowerCase();
  return r === "shinigami" || r === "capo-shinigami";
}

async function canApproveFetch(characterId: string): Promise<boolean> {
  const char = await characterService.getCharacterById(characterId);
  if (!char) return false;
  const user = await characterService.getUserByCharacterId(characterId);
  if (user?.role === "ADMIN") return true;
  const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {};
  const r = (meta.roleIcon ?? "").toLowerCase();
  return r === "moderatore" || r === "admin" || r === "capo-shinigami";
}

export const fetchesRoutes = new Elysia({ prefix: "/fetches" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .derive(async ({ user }) => {
        const char = await characterService.getCharacterByUserId(user!.id);
        return { characterId: char?.id ?? null };
      })
      .get("/grades", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const rows = await db.select().from(grades).orderBy(grades.levelMin);
        return rows;
      })
      .get("/levels", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const rows = await db.select().from(levels).orderBy(levels.level);
        return rows;
      })
      .get("/", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const list = await fetches.listApprovedFetches();
        return list;
      })
      .get("/pending", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        if (!(await canApproveFetch(characterId))) {
          set.status = 403;
          return { error: "Solo Admin/Mod/Capo Shinigami può vedere fetch pending" };
        }
        const list = await fetches.listPendingFetches();
        return list;
      })
      .get("/awaiting-reward", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        if (!(await canApproveFetch(characterId))) {
          set.status = 403;
          return { error: "Solo Admin/Mod/Capo Shinigami può vedere fetch in attesa responso" };
        }
        const list = await fetches.listAwaitingRewardFetches();
        return list;
      })
      .get("/my", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const assignment = await fetches.getAssignmentForCharacter(characterId);
        return assignment ?? { assigned: false };
      })
      .get("/my/concluded", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const list = await fetches.listConcludedFetchesForCharacter(characterId);
        return list;
      })
      .get("/:id", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const f = await fetches.getFetch(params.id);
        if (!f) {
          set.status = 404;
          return { error: "Fetch not found" };
        }
        return f;
      }, { params: t.Object({ id: t.String() }) })
      .get("/:id/session", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        if (!(await canApproveFetch(characterId))) {
          set.status = 403;
          return { error: "Solo Admin/Mod/Capo Shinigami può leggere la giocata" };
        }
        const f = await fetches.getFetch(params.id);
        if (!f) {
          set.status = 404;
          return { error: "Fetch non trovata" };
        }
        if (f.completionStatus !== "AWAITING_REWARD") {
          set.status = 400;
          return { error: "Solo le fetch in attesa di responso hanno una giocata leggibile" };
        }
        const session = await gameSessions.getGameSessionByFetchId(params.id);
        if (!session) {
          set.status = 404;
          return { error: "Giocata non trovata per questa fetch" };
        }
        const messages = await gameSessions.getGameSessionMessages(session.id);
        return { session, messages };
      }, { params: t.Object({ id: t.String() }) })
      .post("/", async ({ characterId, body, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        if (!(await isShinigami(characterId))) {
          set.status = 403;
          return { error: "Solo Shinigami può creare fetch" };
        }
        try {
          const created = await fetches.createFetch(characterId, body.title, {
            description: body.description,
            requirements: body.requirements ?? undefined,
            rewardConfig: body.rewardConfig ?? undefined,
          });
          return created;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore creazione fetch" };
        }
      }, {
        body: t.Object({
          title: t.String({ minLength: 1, maxLength: 200 }),
          description: t.Optional(t.String({ maxLength: 2000 })),
          requirements: t.Optional(t.Object({
            levelMin: t.Optional(t.Number()),
            levelMax: t.Optional(t.Number()),
            gradeIds: t.Optional(t.Array(t.String())),
            order: t.Optional(t.Array(t.Union([t.Literal("MUGEN-TAI"), t.Literal("CHISEN-TAI")]))),
            plotIds: t.Optional(t.Array(t.String())),
            limitPerDay: t.Optional(t.Number()),
            limitPerWeek: t.Optional(t.Number()),
          })),
          rewardConfig: t.Optional(t.Object({
            minActions: t.Optional(t.Number()),
            remReward: t.Optional(t.Number()),
            expReward: t.Optional(t.Number()),
          })),
        }),
      })
      .post("/:id/approve", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        if (!(await canApproveFetch(characterId))) {
          set.status = 403;
          return { error: "Solo Admin/Mod/Capo Shinigami può approvare" };
        }
        try {
          const updated = await fetches.approveFetch(params.id, characterId);
          return updated;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore approvazione" };
        }
      }, { params: t.Object({ id: t.String() }) })
      .post("/:id/reject", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        if (!(await canApproveFetch(characterId))) {
          set.status = 403;
          return { error: "Solo Admin/Mod/Capo Shinigami può rifiutare" };
        }
        try {
          const updated = await fetches.rejectFetch(params.id);
          return updated;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore rifiuto" };
        }
      }, { params: t.Object({ id: t.String() }) })
      .post("/:id/assign", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        try {
          const assignment = await fetches.assignFetchToSelf(params.id, characterId);
          return assignment;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore assegnazione" };
        }
      }, { params: t.Object({ id: t.String() }) })
      .post("/:id/complete", async ({ characterId, params, body, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        if (!(await canApproveFetch(characterId))) {
          set.status = 403;
          return { error: "Solo Admin/Mod/Capo Shinigami può completare fetch" };
        }
        try {
          const updated = await fetches.markFetchAsCompleted(params.id, { comment: body?.comment });
          const [assigned] = await db
            .select({ characterId: fetchAssignments.characterId })
            .from(fetchAssignments)
            .where(eq(fetchAssignments.fetchId, params.id))
            .limit(1);
          if (assigned) {
            const content = updated.responsoComment
              ? `Responso per "${updated.title}": ${updated.responsoComment}`
              : `Il Master ha completato il responso per "${updated.title}". Consulta la Scheda → Registrazioni.`;
            createSystemNotification(assigned.characterId, "fetch_responso", {
              title: `Responso: ${updated.title}`,
              content,
            });
            broadcastFetchResponso(assigned.characterId, {
              fetchId: params.id,
              fetchTitle: updated.title,
              comment: updated.responsoComment ?? null,
            });
          }
          return updated;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore completamento" };
        }
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Optional(t.Object({ comment: t.Optional(t.String({ maxLength: 2000 })) })),
      })
  );
