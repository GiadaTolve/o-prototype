/**
 * WebSocket real-time: presence per room (chat location) + chat.
 * Client: ws://.../ws?token=<jwt>. Join/leave room; receive presence updates.
 */

import { Elysia, t } from "elysia";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "../../config";
import { characterService } from "../characters/characters.service";
import { insertMessage, isValidRoom } from "../chat/chat.service";
import * as presence from "./presence.store";
import { db } from "../../db";
import { characters } from "../../db/schema";
import { eq } from "drizzle-orm";

const SECRET = new TextEncoder().encode(JWT_SECRET);

type WsUser = { userId: string; characterId: string; name: string };
const wsSessions = new Map<string, WsUser>();

/** roomId -> wsId -> ws (solo send per broadcast) */
const roomSockets = new Map<string, Map<string, { send: (data: string) => void }>>();

/** characterId -> ws (per SMS broadcast) */
const characterSockets = new Map<string, { send: (data: string) => void }>();

function getSockets(roomId: string): Map<string, { send: (data: string) => void }> {
  let m = roomSockets.get(roomId);
  if (!m) {
    m = new Map();
    roomSockets.set(roomId, m);
  }
  return m;
}

function broadcastPresence(roomId: string): void {
  const users = presence.getPresence(roomId).map((u) => ({
    id: u.characterId,
    name: u.name,
    zone: roomId,
  }));
  const msg = JSON.stringify({ type: "presence", zone: roomId, users });
  const m = roomSockets.get(roomId);
  if (!m) return;
  for (const [, w] of m) {
    try {
      w.send(msg);
    } catch (e) {
      console.error("[realtime] broadcast send error:", e);
    }
  }
}

/**
 * Invia un messaggio globale a tutte le room attive.
 */
export function broadcastGlobalMessage(content: string, senderName: string): void {
  const msg = JSON.stringify({
    type: "global_message",
    content,
    senderName,
    timestamp: new Date().toISOString(),
  });
  
  // Invia a tutte le room
  for (const [, roomMap] of roomSockets) {
    for (const [, ws] of roomMap) {
      try {
        ws.send(msg);
      } catch (e) {
        console.error("[realtime] global message send error:", e);
      }
    }
  }
}

/**
 * Invia un evento SMS al destinatario (se connesso via WebSocket).
 * Chiamata da sms.routes.ts quando viene inviato un messaggio.
 */
export function broadcastSms(
  recipientId: string,
  message: {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    createdAt: Date;
  }
): void {
  const ws = characterSockets.get(recipientId);
  if (!ws) return; // Destinatario non connesso
  try {
    const payload = JSON.stringify({
      type: "sms_message",
      id: message.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    });
    ws.send(payload);
  } catch (e) {
    console.error("[realtime] SMS broadcast error:", e);
  }
}

export const realtimeRoutes = new Elysia()
  .ws("/ws", {
    query: t.Object({ token: t.String() }),

    async open(ws) {
      const token = (ws.data as { query?: { token?: string } }).query?.token;
      if (!token) {
        ws.close(4401, "Missing token");
        return;
      }
      let payload: { id?: string; sub?: string };
      try {
        const res = await jwtVerify(token, SECRET);
        payload = res.payload as { id?: string; sub?: string };
      } catch {
        ws.close(4401, "Invalid token");
        return;
      }
      const userId = (payload.id ?? payload.sub) as string;
      if (!userId) {
        ws.close(4401, "Invalid token");
        return;
      }
      const char = await characterService.getCharacterByUserId(userId);
      if (!char) {
        ws.close(4403, "Character not found");
        return;
      }
      const user: WsUser = {
        userId,
        characterId: char.id,
        name: char.name,
      };
      wsSessions.set(ws.id, user);
      // Registra come online globale (anche senza join room)
      presence.markOnline(ws.id, user);
      // Registra per SMS broadcast
      characterSockets.set(char.id, { send: (d) => ws.send(d) });
      try {
        ws.send(JSON.stringify({ type: "welcome", me: { id: char.id, name: char.name } }));
      } catch (e) {
        console.error("[realtime] welcome send error:", e);
      }
    },

    async message(ws, raw) {
      const msg = typeof raw === "string" ? (JSON.parse(raw) as Record<string, unknown>) : (raw as Record<string, unknown>);
      const user = wsSessions.get(ws.id);
      if (!user) return;

      if (msg.type === "join" && typeof msg.zone === "string") {
        const roomId = msg.zone as string;
        if (!isValidRoom(roomId)) return;
        const prev = presence.getRoom(ws.id);
        if (prev) {
          presence.leave(ws.id);
          getSockets(prev).delete(ws.id);
          broadcastPresence(prev);
        }
        presence.join(roomId, ws.id, user);
        getSockets(roomId).set(ws.id, { send: (d) => ws.send(d) });
        broadcastPresence(roomId);
      } else if (msg.type === "leave") {
        const roomId = presence.leave(ws.id);
        if (roomId) {
          getSockets(roomId).delete(ws.id);
          broadcastPresence(roomId);
        }
      } else if (msg.type === "chat" && typeof msg.text === "string" && typeof msg.zone === "string") {
        const roomId = msg.zone as string;
        if (!isValidRoom(roomId)) return;
        const cur = presence.getRoom(ws.id);
        if (cur !== roomId) return;
        const text = String(msg.text).trim().slice(0, 2000);
        if (!text) return;
        const locationTag = typeof msg.locationTag === "string" ? msg.locationTag : undefined;
        try {
          const row = await insertMessage(roomId, user.characterId, text, locationTag);
          // Carica dati completi del personaggio per il messaggio
          const char = await db.query.characters.findFirst({
            where: eq(characters.id, user.characterId),
            columns: { surname: true, miniAvatar: true, uiMetadata: true, order: true },
          });
          
          const meta = (char?.uiMetadata as { roleIcon?: string; orderIcon?: string } | null) ?? {};
          const roleIcon = (meta.roleIcon ?? '').toLowerCase();
          const orderIcon = (meta.orderIcon ?? '').toLowerCase();
          
          // Costruisci pixelIcons
          const pixelIcons: { ruolo?: string[]; ordine?: string[] } = {};
          if (roleIcon && ['admin', 'moderatore', 'capo-shinigami', 'shinigami'].includes(roleIcon)) {
            pixelIcons.ruolo = [roleIcon];
          }
          if (orderIcon && ['mugen-tai', 'chisen-tai'].includes(orderIcon)) {
            pixelIcons.ordine = [orderIcon];
          } else if (char?.order && char.order !== 'NONE') {
            pixelIcons.ordine = [char.order.toLowerCase()];
          }
          
          const payload = JSON.stringify({
            type: "chat_message",
            id: row.id,
            zone: roomId,
            characterId: user.characterId,
            name: user.name,
            surname: char?.surname ?? undefined,
            miniAvatar: char?.miniAvatar ?? undefined,
            pixelIcons: Object.keys(pixelIcons).length > 0 ? pixelIcons : undefined,
            content: row.content,
            locationTag: row.locationTag ?? undefined,
            createdAt: row.createdAt,
          });
          const m = roomSockets.get(roomId);
          if (m) for (const [, w] of m) try { w.send(payload); } catch (e) { console.error("[realtime] chat broadcast:", e); }
        } catch (e) {
          console.error("[realtime] chat persist:", e);
        }
      }
    },

    close(ws) {
      const roomId = presence.leave(ws.id);
      if (roomId) {
        getSockets(roomId).delete(ws.id);
        broadcastPresence(roomId);
      }
      const user = wsSessions.get(ws.id);
      if (user) {
        characterSockets.delete(user.characterId);
      }
      presence.markOffline(ws.id);
      wsSessions.delete(ws.id);
    },
  });
