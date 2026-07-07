import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.plugin";
import { characterService } from "../characters/characters.service";
import { broadcastSms } from "../realtime/ws.routes";
import * as sms from "./sms.service";
import { sendWebPushToCharacter } from "../push/push.service";

export const smsRoutes = new Elysia({ prefix: "/sms" })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .derive(async ({ user, set }) => {
        if (!user) return { characterId: null as string | null };
        const char = await characterService.getCharacterByUserId(user.id);
        return { characterId: char?.id ?? null };
      })
      .get("/conversations", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const list = await sms.getConversations(characterId);
        return list;
      })
      .get("/unread-count", async ({ characterId, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const n = await sms.getUnreadCount(characterId);
        return { count: n };
      })
      .get("/thread/:otherId", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        const thread = await sms.getThread(characterId, params.otherId);
        return thread;
      }, { params: t.Object({ otherId: t.String() }) })
      .post("/thread/:otherId/read", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        await sms.markThreadAsRead(characterId, params.otherId);
        return { ok: true };
      }, { params: t.Object({ otherId: t.String() }) })
      .delete("/thread/:otherId", async ({ characterId, params, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        await sms.deleteThread(characterId, params.otherId);
        return { ok: true };
      }, { params: t.Object({ otherId: t.String() }) })
      .post("/send", async ({ characterId, body, set }) => {
        if (!characterId) {
          set.status = 401;
          return { error: "Character not found" };
        }
        try {
          const row = await sms.sendMessage(characterId, body.recipientId, body.content);
          const sender = await characterService.getCharacterById(characterId).catch(() => null)
          await sendWebPushToCharacter(body.recipientId, {
            title: `SMS da ${sender?.name ?? 'Sconosciuto'}`,
            body: row.content.slice(0, 120),
            url: "/dashboard",
            tag: `sms:${characterId}`,
            kind: "sms",
          })
          // Invia al destinatario (se connesso)
          broadcastSms(body.recipientId, {
            id: row.id,
            senderId: row.senderId,
            recipientId: row.recipientId,
            content: row.content,
            createdAt: row.createdAt,
          });
          // Invia anche al mittente per conferma istantanea
          broadcastSms(characterId, {
            id: row.id,
            senderId: row.senderId,
            recipientId: row.recipientId,
            content: row.content,
            createdAt: row.createdAt,
          });
          return {
            id: row.id,
            senderId: row.senderId,
            recipientId: row.recipientId,
            content: row.content,
            createdAt: row.createdAt,
          };
        } catch (e) {
          set.status = 400;
          return { error: e instanceof Error ? e.message : "Send failed" };
        }
      }, {
        body: t.Object({
          recipientId: t.String(),
          content: t.String(),
        }),
      })
  );
