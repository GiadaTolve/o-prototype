/**
 * WebSocket real-time: presence per room (chat location) + chat.
 * Client: ws://.../ws → primo messaggio `{ type: "auth", token }` (JWT non in query string).
 */

import { Elysia } from "elysia";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "../../config";
import { characterService } from "../characters/characters.service";
import { insertMessage, isValidRoom } from "../chat/chat.service";
import { userCanExecuteDrop } from "../../lib/gestione-access";
import { executeDropPanelAction, executePrendiByCatalogKey } from "../drop/drop.service";
import { isItemUsePanelMessage } from "@domain/economy/item-use-chat";
import {
  isDropPanelMessage,
  isPrendiPanelMessage,
  parseDropPanelRequest,
  parsePrendiPanelRequest,
} from "@domain/economy/drop-panel-message";
import { parseAttackMessage } from "@domain/combat/attack-message";
import {
  applyWeaponStrikeInventory,
  resolveItemUsePanelMessage,
} from "../inventory/item-use.service";
import { getActiveQuestForRoom } from "../quests/quests.service";
import { resolveDiceInMessage, messageNeedsDiceResolution } from "../../lib/dice-resolver";
import { canAccessPrivateChatAsync } from "../housing/housing.service";
import { getRoomState, joinSession, getParticipant } from "../anonymous-chat/anonymous-chat.service";
import { buildCharacterPixelIcons } from "../../lib/character-pixel-icons";
import * as presence from "./presence.store";
import { db } from "../../plugins/db";
import { characters } from "../../db/schema";
import { eq } from "drizzle-orm";

const SECRET = new TextEncoder().encode(JWT_SECRET);
/** Room ID partychat (Circus) */
const PARTYCHAT_ROOM = "edo__paradise";
const PARADISE_ROOM = PARTYCHAT_ROOM;

type WsUser = { userId: string; characterId: string; name: string; isShadow?: boolean };
const wsSessions = new Map<string, WsUser>();

/** Timeout auth: se non arriva `{ type: "auth", token }` entro questo intervallo → close 4401 */
const WS_AUTH_TIMEOUT_MS = 5_000;
const pendingAuthTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearPendingAuth(wsId: string): void {
  const t = pendingAuthTimers.get(wsId);
  if (t) {
    clearTimeout(t);
    pendingAuthTimers.delete(wsId);
  }
}

async function authenticateWsConnection(
  ws: { id: string; send: (data: string) => void; close: (code?: number, reason?: string) => void },
  token: string,
): Promise<boolean> {
  let payload: { id?: string; sub?: string };
  try {
    const res = await jwtVerify(token, SECRET);
    payload = res.payload as { id?: string; sub?: string };
  } catch {
    ws.close(4401, "Invalid token");
    return false;
  }
  const userId = (payload.id ?? payload.sub) as string;
  if (!userId) {
    ws.close(4401, "Invalid token");
    return false;
  }
  const char = await characterService.getCharacterByUserId(userId);
  if (!char) {
    ws.close(4403, "Character not found");
    return false;
  }
  const userRow = await characterService.getUserByCharacterId(char.id);
  const isShadow = userRow?.banState === "SHADOW";
  const user: WsUser = {
    userId,
    characterId: char.id,
    name: char.name,
    isShadow,
  };
  wsSessions.set(ws.id, user);
  presence.markOnline(ws.id, { ...user, isShadow });
  characterSockets.set(char.id, { send: (d) => ws.send(d) });
  try {
    ws.send(JSON.stringify({ type: "welcome", me: { id: char.id, name: char.name } }));
  } catch (e) {
    console.error("[realtime] welcome send error:", e);
  }
  return true;
}

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
    isShadow: u.isShadow ?? false,
    ...(u.anonymousColor && { anonymousColor: u.anonymousColor }),
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

export function broadcastInventoryUpdated(characterId: string): void {
  const msg = JSON.stringify({ type: 'inventory_updated', characterId });
  const ws = characterSockets.get(characterId);
  if (ws) {
    try {
      ws.send(msg);
    } catch (e) {
      console.error('[realtime] inventory_updated send error:', e);
    }
  }
}

/**
 * I client nella room refetchano la storia. clearedAt permette di ignorare chat_message "in ritardo".
 */
export function broadcastChatCleared(roomId: string, clearedAt: string): void {
  const msg = JSON.stringify({ type: "chat_cleared", zone: roomId, clearedAt });
  const m = roomSockets.get(roomId);
  if (!m) return;
  for (const [, w] of m) {
    try {
      w.send(msg);
    } catch (e) {
      console.error("[realtime] chat_cleared broadcast error:", e);
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
 * Notifica aggiornamento HP combattimento (Master) a tutti i client connessi.
 */
export function broadcastCharacterHpUpdated(payload: {
  characterId: string;
  hpCurrent: number;
  hpMax: number;
}): void {
  const msg = JSON.stringify({
    type: "character_hp_updated",
    ...payload,
  });
  for (const [, roomMap] of roomSockets) {
    for (const [, ws] of roomMap) {
      try {
        ws.send(msg);
      } catch (e) {
        console.error("[realtime] character_hp_updated send error:", e);
      }
    }
  }
}

/** Notifica aggiornamento status combattimento (DoT / decay / apply). */
export function broadcastCharacterStatusUpdated(payload: { characterId: string }): void {
  const msg = JSON.stringify({
    type: "character_status_updated",
    characterId: payload.characterId,
  });
  for (const [, roomMap] of roomSockets) {
    for (const [, ws] of roomMap) {
      try {
        ws.send(msg);
      } catch (e) {
        console.error("[realtime] character_status_updated send error:", e);
      }
    }
  }
}

/** Notifica aggiornamento Chrono Stack (Tenkan / tick / colpo subito). */
export function broadcastCharacterChronoUpdated(payload: {
  characterId: string;
  csCurrent: number;
  csCapacity: number;
  accumulating: boolean;
  overheatTurns: number;
  skipNextTurn: boolean;
  isOverheated: boolean;
  overheatDamagePerTurn: number;
  stacksOverCapacity: number;
}): void {
  const msg = JSON.stringify({
    type: "character_chrono_updated",
    ...payload,
  });
  for (const [, roomMap] of roomSockets) {
    for (const [, ws] of roomMap) {
      try {
        ws.send(msg);
      } catch (e) {
        console.error("[realtime] character_chrono_updated send error:", e);
      }
    }
  }
}

/**
 * Notifica al giocatore che il Master ha dato il responso alla sua fetch.
 * Arriva come messaggio di sistema (System notification).
 */
export function broadcastFetchResponso(
  characterId: string,
  payload: { fetchId: string; fetchTitle: string; comment: string | null }
): void {
  const ws = characterSockets.get(characterId);
  if (!ws) return;
  try {
    ws.send(
      JSON.stringify({
        type: "fetch_responso",
        fetchId: payload.fetchId,
        fetchTitle: payload.fetchTitle,
        comment: payload.comment,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("[realtime] fetch_responso broadcast error:", e);
  }
}

/** Notifica al creatore della fetch che la giocata registrata è stata completata. */
export function broadcastFetchGiocataCompleted(
  characterId: string,
  payload: { sessionId: string; fetchId: string; fetchTitle: string }
): void {
  const ws = characterSockets.get(characterId);
  if (!ws) return;
  try {
    ws.send(
      JSON.stringify({
        type: "fetch_giocata_completed",
        sessionId: payload.sessionId,
        fetchId: payload.fetchId,
        fetchTitle: payload.fetchTitle,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error("[realtime] fetch_giocata_completed broadcast error:", e);
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
    open(ws) {
      clearPendingAuth(ws.id);
      pendingAuthTimers.set(
        ws.id,
        setTimeout(() => {
          pendingAuthTimers.delete(ws.id);
          if (!wsSessions.has(ws.id)) {
            try {
              ws.close(4401, "Auth timeout");
            } catch {
              /* already closed */
            }
          }
        }, WS_AUTH_TIMEOUT_MS),
      );
    },

    async message(ws, raw) {
      let msg: Record<string, unknown>;
      try {
        msg = typeof raw === "string" ? (JSON.parse(raw) as Record<string, unknown>) : (raw as Record<string, unknown>);
      } catch {
        if (!wsSessions.has(ws.id)) {
          clearPendingAuth(ws.id);
          ws.close(4401, "Invalid message");
        }
        return;
      }

      if (!wsSessions.has(ws.id)) {
        if (msg.type === "auth" && typeof msg.token === "string" && msg.token.length > 0) {
          clearPendingAuth(ws.id);
          await authenticateWsConnection(ws, msg.token);
          return;
        }
        clearPendingAuth(ws.id);
        ws.close(4401, "Auth required");
        return;
      }

      const user = wsSessions.get(ws.id);
      if (!user) return;

      if (msg.type === "auth") {
        // già autenticato: ignora
        return;
      }

      if (msg.type === "ping") {
        presence.touchOnline(user.characterId);
        try {
          ws.send(JSON.stringify({ type: "pong" }));
        } catch (_) {}
        return;
      }

      presence.touchOnline(user.characterId);

      if (msg.type === "join" && typeof msg.zone === "string") {
        const roomId = msg.zone as string;
        if (!isValidRoom(roomId)) return;
        if (roomId.startsWith("housing_")) {
          const char = await db.query.characters.findFirst({ where: eq(characters.id, user.characterId), columns: { id: true, uiMetadata: true } });
          const userRow = char ? await characterService.getUserByCharacterId(user.characterId) : null;
          const mockUser = { role: userRow?.role ?? "PLAYER" };
          const canAccess = char && (await canAccessPrivateChatAsync(user.characterId, roomId, mockUser, char));
          if (!canAccess) return;
        }
        // Partychat (Circus): stanza deve essere aperta dall'admin; joinSession assegna animale+colore
        if (roomId === PARADISE_ROOM) {
          const state = await getRoomState(roomId);
          if (!state.isOpen) {
            try {
              ws.send(JSON.stringify({ type: "error", message: "Area interdetta. La stanza non è aperta." }));
            } catch (e) {
              console.error("[realtime] partychat closed notify:", e);
            }
            return;
          }
        }
        const prev = presence.getRoom(ws.id);
        if (prev && prev !== roomId) {
          // Circus: non rimuovere partecipante su cambio room — mantiene nome animale
          presence.leave(ws.id);
          getSockets(prev).delete(ws.id);
          broadcastPresence(prev);
        }
        if (roomId === PARADISE_ROOM) {
          const participant = await joinSession(roomId, user.characterId);
          if (!participant) return;
          presence.join(roomId, ws.id, { ...user, name: participant.animalName, anonymousColor: participant.color });
        } else {
          presence.join(roomId, ws.id, user);
        }
        getSockets(roomId).set(ws.id, { send: (d) => ws.send(d) });
        broadcastPresence(roomId);
      } else if (msg.type === "leave") {
        const roomId = presence.leave(ws.id);
        // Circus: non rimuovere partecipante — mantiene nome animale se rientra nella stessa sessione
        if (roomId) {
          getSockets(roomId).delete(ws.id);
          broadcastPresence(roomId);
        }
      } else if (msg.type === "chat" && typeof msg.text === "string" && typeof msg.zone === "string") {
        const roomId = msg.zone as string;
        if (!isValidRoom(roomId)) return;
        if (roomId.startsWith("housing_")) {
          const char = await db.query.characters.findFirst({ where: eq(characters.id, user.characterId), columns: { id: true, uiMetadata: true } });
          const userRow = char ? await characterService.getUserByCharacterId(user.characterId) : null;
          const mockUser = { role: userRow?.role ?? "PLAYER" };
          const canAccess = char && (await canAccessPrivateChatAsync(user.characterId, roomId, mockUser, char));
          if (!canAccess) return;
        }
        const cur = presence.getRoom(ws.id);
        if (cur !== roomId) return;
        const text = String(msg.text).trim();
        if (!text) return;
        const locationTag = typeof msg.locationTag === "string" ? msg.locationTag : undefined;
        const senderUser = await characterService.getUserByCharacterId(user.characterId);
        if (senderUser?.banState === "SHADOW") return;

        const lowerCmd = text.toLowerCase();
        if (isPrendiPanelMessage(text) || isDropPanelMessage(text)) {
          try {
            if (isDropPanelMessage(text)) {
              const canDrop = await userCanExecuteDrop(
                user.userId,
                senderUser?.role,
                user.characterId,
              );
              if (!canDrop) {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    message: "Solo Master/Moderazione può eseguire drop.",
                  }),
                );
                return;
              }
            }

            const roomParticipants = presence.getPresence(roomId).map((p) => ({
              characterId: p.characterId,
              name: p.name,
            }));

            const dropResult = isDropPanelMessage(text)
              ? await executeDropPanelAction(
                  parseDropPanelRequest(text)!,
                  roomId,
                  user.characterId,
                  roomParticipants,
                )
              : await executePrendiByCatalogKey(
                  roomId,
                  user.characterId,
                  parsePrendiPanelRequest(text)!.catalogKey,
                );

            const participant =
              roomId === PARADISE_ROOM ? await getParticipant(roomId, user.characterId) : null;
            const { row } = await insertMessage(
              roomId,
              user.characterId,
              dropResult.eventMessage,
              locationTag,
              false,
              participant?.animalName ?? undefined,
              participant?.color ?? undefined,
              false,
              true,
            );

            const char = await db.query.characters.findFirst({
              where: eq(characters.id, user.characterId),
              columns: { surname: true, miniAvatar: true, uiMetadata: true, order: true },
            });
            const isPartychat = roomId === PARTYCHAT_ROOM;
            const displayName =
              isPartychat && row.anonymousAnimalName ? row.anonymousAnimalName : user.name;
            const payload = JSON.stringify({
              type: "chat_message",
              id: row.id,
              zone: roomId,
              characterId: user.characterId,
              name: displayName,
              surname: isPartychat ? undefined : char?.surname,
              miniAvatar: isPartychat ? "/anonymous/mask.svg" : char?.miniAvatar ?? undefined,
              anonymousColor: isPartychat ? row.anonymousColor ?? undefined : undefined,
              content: row.content,
              locationTag: row.locationTag ?? undefined,
              createdAt: row.createdAt,
              isMasterscreen: false,
              isDropEvent: true,
            });
            const m = roomSockets.get(roomId);
            if (m) for (const [, w] of m) try { w.send(payload); } catch (_) {}

            for (const cid of dropResult.affectedCharacterIds) {
              broadcastInventoryUpdated(cid);
            }
          } catch (e) {
            try {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: e instanceof Error ? e.message : "Errore drop/raccolta",
                }),
              );
            } catch (_) {}
          }
          return;
        }

        if (lowerCmd.startsWith("/drop ") || lowerCmd.startsWith("/prendi ")) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Usa i pannelli A terra e Drop Master in chat — i comandi testuali non sono disponibili.",
            }),
          );
          return;
        }

        if (isItemUsePanelMessage(text)) {
          try {
            const cardContent = await resolveItemUsePanelMessage(user.characterId, text);
            const participant =
              roomId === PARADISE_ROOM ? await getParticipant(roomId, user.characterId) : null;
            const { row } = await insertMessage(
              roomId,
              user.characterId,
              cardContent,
              locationTag,
              false,
              participant?.animalName ?? undefined,
              participant?.color ?? undefined,
              false,
            );
            const char = await db.query.characters.findFirst({
              where: eq(characters.id, user.characterId),
              columns: { surname: true, miniAvatar: true, uiMetadata: true, order: true },
            });
            const isPartychat = roomId === PARTYCHAT_ROOM;
            const displayName =
              isPartychat && row.anonymousAnimalName ? row.anonymousAnimalName : user.name;
            const meta = (char?.uiMetadata as { roleIcon?: string; orderIcon?: string; premioSpeciale?: string } | null) ?? {};
            const pixelIcons = isPartychat
              ? undefined
              : buildCharacterPixelIcons(meta, char?.order);
            const payload = JSON.stringify({
              type: "chat_message",
              id: row.id,
              zone: roomId,
              characterId: user.characterId,
              name: displayName,
              surname: isPartychat ? undefined : char?.surname,
              miniAvatar: isPartychat ? "/anonymous/mask.svg" : char?.miniAvatar ?? undefined,
              anonymousColor: isPartychat ? row.anonymousColor ?? undefined : undefined,
              pixelIcons,
              content: row.content,
              locationTag: row.locationTag ?? undefined,
              createdAt: row.createdAt,
              isMasterscreen: false,
            });
            const m = roomSockets.get(roomId);
            if (m) for (const [, w] of m) try { w.send(payload); } catch (_) {}
          } catch (e) {
            try {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: e instanceof Error ? e.message : "Errore uso oggetto",
                }),
              );
            } catch (_) {}
          }
          return;
        }

        // Risolvi /d N e [dado:…] con stats del personaggio
        let resolvedText = text;
        if (messageNeedsDiceResolution(text)) {
          const charStats = await db.query.characters.findFirst({
            where: eq(characters.id, user.characterId),
            columns: { mind: true, dexterity: true, strength: true, constitution: true, empathy: true },
          });
          const stats = {
            mind: charStats?.mind ?? 0,
            dexterity: charStats?.dexterity ?? 0,
            strength: charStats?.strength ?? 0,
            constitution: charStats?.constitution ?? 0,
            empathy: charStats?.empathy ?? 0,
          };
          resolvedText = resolveDiceInMessage(text, stats);
        }
        try {
          const participant = roomId === PARADISE_ROOM ? await getParticipant(roomId, user.characterId) : null;
          const activeQuest = await getActiveQuestForRoom(roomId);
          const isMasterscreen = !!(activeQuest && activeQuest.creatorId === user.characterId);
          if (!isMasterscreen) {
            const roomParticipants = presence.getPresence(roomId).map((u) => ({
              characterId: u.characterId,
              name: u.name,
            }));
            const csValidation = await characterService.validateChatWazaCsOnly(
              user.characterId,
              resolvedText,
              { roomParticipants, isMasterscreen },
            );
            if (!csValidation.ok) {
              ws.send(JSON.stringify({ type: "error", message: csValidation.message }));
              return;
            }
          }

          const attackPayload = parseAttackMessage(resolvedText);
          if (attackPayload?.inventoryId) {
            try {
              await applyWeaponStrikeInventory(user.characterId, attackPayload.inventoryId);
            } catch (e) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: e instanceof Error ? e.message : "Errore uso arma",
                }),
              );
              return;
            }
          }

          const { row, levelUp } = await insertMessage(
            roomId,
            user.characterId,
            resolvedText,
            locationTag,
            false,
            participant?.animalName ?? undefined,
            participant?.color ?? undefined,
            isMasterscreen
          );

          try {
            const chrono = await characterService.processChatChronoOnMessage(
              user.characterId,
              resolvedText,
              row.totalChars ?? resolvedText.length,
              { isMasterscreen },
            );
            if (chrono?.chronoStack) {
              broadcastCharacterChronoUpdated({
                characterId: user.characterId,
                ...chrono.chronoStack,
              });
            }
            if (
              chrono?.vitals &&
              chrono.overheatHpDamage > 0
            ) {
              broadcastCharacterHpUpdated({
                characterId: user.characterId,
                hpCurrent: chrono.vitals.hpCurrent,
                hpMax: chrono.vitals.hpMax,
              });
            }
          } catch (e) {
            console.error("[realtime] chrono chat:", e);
          }

          if (!isMasterscreen) {
            try {
              const roomParticipants = presence.getPresence(roomId).map((u) => ({
                characterId: u.characterId,
                name: u.name,
              }));
              const wazaAuto = await characterService.processChatWazaAutomation(
                user.characterId,
                resolvedText,
                { roomParticipants, isMasterscreen },
              );
              if (wazaAuto) {
                broadcastCharacterChronoUpdated({
                  characterId: user.characterId,
                  ...wazaAuto.chronoStack,
                });
                for (const cid of wazaAuto.affectedCharacterIds) {
                  broadcastCharacterStatusUpdated({ characterId: cid });
                  const needsHpBroadcast = wazaAuto.effects.some(
                    (e) =>
                      (e.kind === 'debito_collection' &&
                        e.debtorCharacterId === cid &&
                        e.damage > 0) ||
                      (e.kind === 'shinryaku_contact_damage' && e.victimCharacterId === cid) ||
                      (e.kind === 'waza_launch_damage' && e.victimCharacterId === cid),
                  );
                  if (needsHpBroadcast) {
                    const vitals = await characterService.getCombatVitals(cid);
                    broadcastCharacterHpUpdated({
                      characterId: cid,
                      hpCurrent: vitals.hpCurrent,
                      hpMax: vitals.hpMax,
                    });
                  }
                }
              }
            } catch (e) {
              console.error("[realtime] waza automation chat:", e);
            }
          }

          if (!isMasterscreen) {
            try {
              const chronoCs = (
                await characterService.getCombatChronoVitals(user.characterId)
              ).csCurrent;
              const statusTick = await characterService.tickCharacterStatusAfterChatAction(
                user.characterId,
                chronoCs,
              );
              broadcastCharacterStatusUpdated({ characterId: user.characterId });
              const selfDamage = statusTick.tick?.selfDamage ?? 0;
              const vitals = statusTick.vitals as { hpCurrent: number; hpMax: number };
              if (selfDamage > 0) {
                broadcastCharacterHpUpdated({
                  characterId: user.characterId,
                  hpCurrent: vitals.hpCurrent,
                  hpMax: vitals.hpMax,
                });
              }
            } catch (e) {
              console.error("[realtime] status tick chat:", e);
            }
          }

          // Carica dati completi del personaggio per il messaggio (non usati in Paradise)
          const char = await db.query.characters.findFirst({
            where: eq(characters.id, user.characterId),
            columns: { surname: true, miniAvatar: true, uiMetadata: true, order: true, keys: true, experienceTotal: true },
          });

          const isPartychat = roomId === PARTYCHAT_ROOM;
          const displayName = isPartychat && row.anonymousAnimalName ? row.anonymousAnimalName : user.name;
          const displaySurname = isPartychat ? undefined : char?.surname;
          const displayAvatar = isPartychat ? "/anonymous/mask.svg" : char?.miniAvatar ?? undefined;

          const meta = (char?.uiMetadata as {
            roleIcon?: string;
            orderIcon?: string;
            premioSpeciale?: string;
          } | null) ?? {};
          const pixelIcons = isPartychat
            ? undefined
            : buildCharacterPixelIcons(meta, char?.order);

          const payload = JSON.stringify({
            type: "chat_message",
            id: row.id,
            zone: roomId,
            characterId: user.characterId,
            name: displayName,
            surname: displaySurname,
            miniAvatar: displayAvatar,
            anonymousColor: isPartychat ? row.anonymousColor ?? undefined : undefined,
            pixelIcons,
            content: row.content,
            locationTag: row.locationTag ?? undefined,
            createdAt: row.createdAt,
            isMasterscreen: row.isMasterscreen ?? false,
          });
          const m = roomSockets.get(roomId);
          if (m) for (const [, w] of m) try { w.send(payload); } catch (e) { console.error("[realtime] chat broadcast:", e); }

          if (levelUp) {
            try {
              ws.send(JSON.stringify({
                type: "level_up",
                pendingLevelUp: levelUp,
                newKeys: char?.keys,
                newExpTotal: char?.experienceTotal,
              }));
            } catch (e) {
              console.error("[realtime] level_up notify:", e);
            }
          }
        } catch (e) {
          console.error("[realtime] chat persist:", e);
          try {
            ws.send(JSON.stringify({ type: "error", message: e instanceof Error ? e.message : "Errore nell'invio" }));
          } catch (_) {}
        }
      }
    },

    close(ws) {
      clearPendingAuth(ws.id);
      const roomId = presence.leave(ws.id);
      // Circus: non rimuovere partecipante — mantiene nome animale se rientra nella stessa sessione
      if (roomId) {
        getSockets(roomId).delete(ws.id);
        broadcastPresence(roomId);
      }
      const user = wsSessions.get(ws.id);
      presence.markOffline(ws.id);
      if (user && !presence.hasActiveConnection(user.characterId)) {
        characterSockets.delete(user.characterId);
      }
      wsSessions.delete(ws.id);
    },
  });
