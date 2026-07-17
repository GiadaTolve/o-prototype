import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { characterService } from "../characters/characters.service";
import { canAccessPrivateChatAsync } from "../housing/housing.service";
import { userHasShinigamiAccess } from "../../lib/gestione-access";
import * as quests from "./quests.service";

async function isShinigami(characterId: string): Promise<boolean> {
  const char = await characterService.getCharacterById(characterId);
  if (!char) return false;
  const user = await characterService.getUserByCharacterId(characterId);
  return userHasShinigamiAccess(user?.id ?? "", user?.role);
}

export const questsRoutes = new Elysia({ prefix: "/quests" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .derive(async ({ user, set }) => {
        if (!user) return { characterId: null as string | null };
        const char = await characterService.getCharacterByUserId(user.id);
        return { characterId: char?.id ?? null };
      })
      .get("/", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const list = await quests.listQuests();
        return list;
      })
      .get("/paused", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const paused = await quests.getPausedQuests(characterId);
        return paused;
      })
      .get("/by-room/:roomId", async ({ characterId, params, user, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const roomId = params.roomId;
        if (roomId.startsWith("housing_")) {
          const char = await characterService.getCharacterById(characterId);
          if (!char || !(await canAccessPrivateChatAsync(characterId, roomId, user!, char))) {
            set.status = 403;
            return { error: "Accesso negato a questa chat privata" };
          }
        }
        const quest = await quests.getActiveQuestForRoom(roomId);
        return quest ?? { active: false };
      }, { params: t.Object({ roomId: t.String() }) })
      .get("/:questId", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const quest = await quests.getQuest(params.questId);
        if (!quest) {
          set.status = 404;
          return { error: "Quest not found" };
        }
        return quest;
      }, { params: t.Object({ questId: t.String() }) })
      .get("/:questId/participants", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const participants = await quests.getQuestParticipants(params.questId);
        return participants;
      }, { params: t.Object({ questId: t.String() }) })
      .get("/:questId/rewards", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const rewards = await quests.getQuestRewards(params.questId);
        return rewards;
      }, { params: t.Object({ questId: t.String() }) })
      .get("/:questId/votes", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const votes = await quests.getQuestVotes(params.questId);
        return votes;
      }, { params: t.Object({ questId: t.String() }) })
      .post("/", async ({ characterId, body, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        // Solo Shinigami può creare quest
        const shinigami = await isShinigami(characterId);
        if (!shinigami) {
          set.status = 403;
          return { error: "Solo Shinigami può creare quest" };
        }
        try {
          const quest = await quests.createQuest(characterId, body.title, {
            description: body.description,
            roomId: body.roomId,
            type: body.type ?? "AMBIENT",
            plotId: body.plotId || null,
            participantIds: body.participantIds || [],
            isGlobal: body.type === "GLOBALE",
          });
          return quest;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore creazione quest" };
        }
      }, {
        body: t.Object({
          title: t.String({ minLength: 1, maxLength: 200 }),
          description: t.Optional(t.String({ maxLength: 2000 })),
          roomId: t.Optional(t.String()),
          type: t.Optional(t.Union([t.Literal("AMBIENT"), t.Literal("TRAMA"), t.Literal("BATTLE"), t.Literal("ONE_SHOT"), t.Literal("GLOBALE")])),
          plotId: t.Optional(t.String()),
          participantIds: t.Optional(t.Array(t.String())),
        }),
      })
      .post("/:questId/participate", async ({ characterId, params, body, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        try {
          const participant = await quests.registerParticipant(
            params.questId,
            characterId,
            body.fetchId ?? undefined
          );
          return participant;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore registrazione" };
        }
      }, {
        params: t.Object({ questId: t.String() }),
        body: t.Object({ fetchId: t.Optional(t.String()) }),
      })
      .post("/:questId/rewards", async ({ characterId, body, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        // Solo il creatore della quest può aggiungere premi
        const quest = await quests.getQuest(params.questId);
        if (!quest) {
          set.status = 404;
          return { error: "Quest not found" };
        }
        if (quest.creatorId !== characterId) {
          set.status = 403;
          return { error: "Solo il creatore può aggiungere premi" };
        }
        try {
          const reward = await quests.addReward(
            params.questId,
            body.characterId,
            body.type,
            body.value,
            body.description
          );
          return reward;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore aggiunta premio" };
        }
      }, {
        params: t.Object({ questId: t.String() }),
        body: t.Object({
          characterId: t.String(),
          type: t.Union([t.Literal("EXP"), t.Literal("REM"), t.Literal("ITEM"), t.Literal("CUSTOM"), t.Literal("DROP")]),
          value: t.Optional(t.Number()),
          description: t.Optional(t.String({ maxLength: 500 })),
        }),
      })
      .post("/:questId/vote", async ({ characterId, params, body, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        try {
          const vote = await quests.voteForCharacter(params.questId, characterId, body.votedFor, body.motivation);
          return vote;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore voto" };
        }
      }, {
        params: t.Object({ questId: t.String() }),
        body: t.Object({
          votedFor: t.String(),
          motivation: t.String({ minLength: 1, maxLength: 2000 }),
        }),
      })
      .patch("/:questId/status", async ({ characterId, body, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        // Solo il creatore può modificare lo stato
        const quest = await quests.getQuest(params.questId);
        if (!quest) {
          set.status = 404;
          return { error: "Quest not found" };
        }
        if (quest.creatorId !== characterId) {
          set.status = 403;
          return { error: "Solo il creatore può modificare la quest" };
        }
        try {
          const updated = await quests.updateQuestStatus(params.questId, characterId, body.status);
          return updated;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore aggiornamento" };
        }
      }, {
        params: t.Object({ questId: t.String() }),
        body: t.Object({
          status: t.Union([t.Literal("OPEN"), t.Literal("IN_PROGRESS"), t.Literal("PAUSED"), t.Literal("CLOSED")]),
        }),
      })
      .delete("/:questId", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        // Solo il creatore può eliminare
        const quest = await quests.getQuest(params.questId);
        if (!quest) {
          set.status = 404;
          return { error: "Quest not found" };
        }
        if (quest.creatorId !== characterId) {
          set.status = 403;
          return { error: "Solo il creatore può eliminare la quest" };
        }
        try {
          await quests.deleteQuest(params.questId);
          return { success: true };
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore eliminazione" };
        }
      }, {
        params: t.Object({ questId: t.String() }),
      })
      .get("/:questId/messages", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        try {
          const messages = await quests.getQuestMessages(params.questId);
          return messages;
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Errore recupero messaggi" };
        }
      }, {
        params: t.Object({ questId: t.String() }),
      })
  );
