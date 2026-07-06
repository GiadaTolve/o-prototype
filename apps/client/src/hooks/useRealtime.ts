"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Presente, ChatMessage } from "@/components/dashboard/types";
import type { PendingLevelUpBanner } from "@domain/progression/level-up";
import { dispatchInventoryUpdated } from "@/lib/inventory-events";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const WS_BASE = API_BASE.replace(/^http/, "ws");
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const INITIAL_CONNECT_TIMEOUT_MS = 8000;

export type LevelUpWsPayload = {
  pendingLevelUp: PendingLevelUpBanner;
  newKeys?: number;
  newExpTotal?: number;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Real-time: presenza in room + chat per location.
 * roomId = RoomId (es. kessen__cosmicon__junk_town). Passato come "zone" all'API/WS.
 * Ritorna { users, messages, sendMessage, connected }.
 * Se !roomId, non si connette; usare mock per Lista Presenti.
 */
export function useRealtime(
  roomId: string | null,
  options?: { onLevelUp?: (payload: LevelUpWsPayload) => void },
): {
  users: Presente[];
  messages: ChatMessage[];
  sendMessage: (text: string, locationTag?: string | null) => void;
  connected: boolean;
  connectionFailed: boolean;
} {
  const onLevelUpRef = useRef(options?.onLevelUp);
  onLevelUpRef.current = options?.onLevelUp;
  const [users, setUsers] = useState<Presente[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const meIdRef = useRef<string | undefined>(undefined);
  const wsRef = useRef<WebSocket | null>(null);
  const roomRef = useRef<string | null>(roomId);
  const clearedAtRef = useRef<string | null>(null);
  roomRef.current = roomId;

  const sendMessage = useCallback(
    (text: string, locationTag?: string | null) => {
      const ws = wsRef.current;
      const r = roomRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !r) return;
      const t = String(text).trim();
      if (!t) return;
      const tag = locationTag != null ? String(locationTag).trim().slice(0, 120) || undefined : undefined;
      ws.send(JSON.stringify({ type: "chat", zone: r, text: t, locationTag: tag }));
    },
    []
  );

  useEffect(() => {
    clearedAtRef.current = null;
    setConnectionFailed(false);
    if (!roomId) {
      setUsers([]);
      setMessages([]);
      setConnected(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setUsers([]);
      setMessages([]);
      setConnected(false);
      return;
    }

    let shouldReconnect = true;
    let reconnectAttempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let connectTimeout: ReturnType<typeof setTimeout> | null = null;

    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const list = (await res.json()) as ChatMessage[];
          setMessages(list);
        }
      } catch {
        // ignore
      }
    };
    loadHistory();

    const scheduleReconnect = () => {
      if (!shouldReconnect || !roomRef.current) return;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempts, RECONNECT_MAX_MS);
      reconnectAttempts += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    const handleMessage = (ev: MessageEvent, ws: WebSocket) => {
      try {
        const data = JSON.parse(ev.data as string) as {
          type: string;
          me?: { id: string; name: string };
          users?: { id: string; name: string; zone?: string }[];
          id?: string;
          zone?: string;
          characterId?: string;
          name?: string;
          content?: string;
          createdAt?: string;
          locationTag?: string;
          senderName?: string;
          timestamp?: string;
          clearedAt?: string;
          message?: string;
          pendingLevelUp?: PendingLevelUpBanner;
          newKeys?: number;
          newExpTotal?: number;
        };
        if (data.type === "error" && typeof data.message === "string") {
          window.dispatchEvent(
            new CustomEvent("chatSendError", { detail: { message: data.message } })
          );
          return;
        }
        if (data.type === "level_up" && data.pendingLevelUp) {
          onLevelUpRef.current?.({
            pendingLevelUp: data.pendingLevelUp as PendingLevelUpBanner,
            newKeys: typeof data.newKeys === "number" ? data.newKeys : undefined,
            newExpTotal: typeof data.newExpTotal === "number" ? data.newExpTotal : undefined,
          });
          return;
        }
        if (data.type === "welcome" && data.me) {
          meIdRef.current = data.me.id;
          const r = roomRef.current;
          if (r) ws.send(JSON.stringify({ type: "join", zone: r }));
          return;
        }
        if (data.type === "presence" && Array.isArray(data.users)) {
          const mid = meIdRef.current;
          const list: Presente[] = data.users.map((u) => ({
            id: u.id,
            name: u.name,
            zone: u.zone,
            room: u.zone,
            isMe: mid !== undefined && u.id === mid,
            isShadow: (u as { isShadow?: boolean }).isShadow ?? false,
            anonymousColor: (u as { anonymousColor?: string }).anonymousColor,
          }));
          setUsers(list);
          return;
        }
        if (
          data.type === "chat_message" &&
          data.id &&
          data.zone &&
          data.characterId != null &&
          typeof data.name === "string" &&
          typeof data.content === "string" &&
          data.createdAt
        ) {
          const ca = clearedAtRef.current;
          if (ca && data.createdAt <= ca) return;
          const m: ChatMessage = {
            id: data.id,
            zone: data.zone,
            characterId: data.characterId,
            name: data.name,
            surname: "surname" in data && typeof data.surname === "string" ? data.surname : undefined,
            miniAvatar: "miniAvatar" in data && typeof data.miniAvatar === "string" ? data.miniAvatar : undefined,
            anonymousColor: "anonymousColor" in data && typeof data.anonymousColor === "string" ? data.anonymousColor : undefined,
            pixelIcons: "pixelIcons" in data && typeof data.pixelIcons === "object" && data.pixelIcons !== null ? data.pixelIcons as { ruolo?: string[]; ordine?: string[]; premioSpeciale?: string[] } : undefined,
            content: data.content,
            locationTag: "locationTag" in data && typeof data.locationTag === "string" ? data.locationTag : undefined,
            createdAt: data.createdAt,
            isMasterscreen: "isMasterscreen" in data && data.isMasterscreen === true,
          };
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, m];
          });
        }
        if (
          data.type === "character_status_updated" &&
          typeof data.characterId === "string"
        ) {
          window.dispatchEvent(
            new CustomEvent("characterStatusUpdated", {
              detail: { characterId: data.characterId },
            }),
          );
          return;
        }
        if (
          data.type === "character_hp_updated" &&
          typeof data.characterId === "string" &&
          typeof data.hpCurrent === "number" &&
          typeof data.hpMax === "number"
        ) {
          window.dispatchEvent(
            new CustomEvent("characterHpUpdated", {
              detail: {
                characterId: data.characterId,
                hpCurrent: data.hpCurrent,
                hpMax: data.hpMax,
              },
            }),
          );
          window.dispatchEvent(new CustomEvent("characterStatusUpdated"));
          return;
        }
        if (
          data.type === "character_chrono_updated" &&
          typeof data.characterId === "string" &&
          typeof data.csCurrent === "number"
        ) {
          window.dispatchEvent(
            new CustomEvent("characterChronoUpdated", {
              detail: {
                characterId: data.characterId,
                csCurrent: data.csCurrent,
                csCapacity: typeof data.csCapacity === "number" ? data.csCapacity : 20,
                accumulating: data.accumulating === true,
                isOverheated: data.isOverheated === true,
              },
            }),
          );
          return;
        }
        if (data.type === "inventory_updated" && typeof data.characterId === "string") {
          dispatchInventoryUpdated(data.characterId);
          return;
        }
        if (data.type === "chat_cleared" && data.zone === roomRef.current) {
          const clearedAt = typeof data.clearedAt === "string" ? data.clearedAt : new Date().toISOString();
          clearedAtRef.current = clearedAt;
          setMessages([]);
          loadHistory();
          return;
        }
        if (
          data.type === "global_message" &&
          typeof data.content === "string" &&
          "senderName" in data &&
          typeof data.senderName === "string" &&
          "timestamp" in data &&
          typeof data.timestamp === "string"
        ) {
          const globalMsg: ChatMessage = {
            id: `global-${data.timestamp}`,
            zone: "GLOBAL",
            characterId: "SYSTEM",
            name: `[GLOBAL] ${data.senderName}`,
            content: data.content,
            locationTag: undefined,
            createdAt: data.timestamp,
          };
          setMessages((prev) => {
            if (prev.some((p) => p.id === globalMsg.id)) return prev;
            return [...prev, globalMsg];
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    const connect = () => {
      if (!shouldReconnect || !roomRef.current) return;

      const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      let didOpen = false;
      connectTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
        }
      }, INITIAL_CONNECT_TIMEOUT_MS);

      ws.onopen = () => {
        didOpen = true;
        reconnectAttempts = 0;
        if (connectTimeout) clearTimeout(connectTimeout);
        setConnected(true);
        setConnectionFailed(false);
      };

      ws.onmessage = (ev) => handleMessage(ev, ws);

      ws.onclose = () => {
        if (connectTimeout) clearTimeout(connectTimeout);
        setConnected(false);
        setUsers([]);
        if (wsRef.current === ws) wsRef.current = null;
        if (!shouldReconnect) return;
        if (!didOpen && reconnectAttempts >= 5) {
          setConnectionFailed(true);
        }
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (!didOpen) setConnectionFailed(true);
        setConnected(false);
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (connectTimeout) clearTimeout(connectTimeout);
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "leave" }));
      }
      ws?.close();
      wsRef.current = null;
      setConnected(false);
      setUsers([]);
      setConnectionFailed(false);
    };
  }, [roomId]);

  return { users, messages, sendMessage, connected, connectionFailed };
}
