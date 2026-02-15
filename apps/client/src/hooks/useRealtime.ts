"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Presente, ChatMessage } from "@/components/dashboard/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const WS_BASE = API_BASE.replace(/^http/, "ws");

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
export function useRealtime(roomId: string | null): {
  users: Presente[];
  messages: ChatMessage[];
  sendMessage: (text: string, locationTag?: string | null) => void;
  connected: boolean;
} {
  const [users, setUsers] = useState<Presente[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const meIdRef = useRef<string | undefined>(undefined);
  const wsRef = useRef<WebSocket | null>(null);
  const roomRef = useRef<string | null>(roomId);
  roomRef.current = roomId;

  const sendMessage = useCallback(
    (text: string, locationTag?: string | null) => {
      const ws = wsRef.current;
      const r = roomRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN || !r) return;
      const t = String(text).trim().slice(0, 2000);
      if (!t) return;
      const tag = locationTag != null ? String(locationTag).trim().slice(0, 120) || undefined : undefined;
      ws.send(JSON.stringify({ type: "chat", zone: r, text: t, locationTag: tag }));
    },
    []
  );

  useEffect(() => {
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

    const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (ev) => {
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
        };
        if (data.type === "welcome" && data.me) {
          meIdRef.current = data.me.id;
          ws.send(JSON.stringify({ type: "join", zone: roomId }));
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
          const m: ChatMessage = {
            id: data.id,
            zone: data.zone,
            characterId: data.characterId,
            name: data.name,
            surname: "surname" in data && typeof data.surname === "string" ? data.surname : undefined,
            miniAvatar: "miniAvatar" in data && typeof data.miniAvatar === "string" ? data.miniAvatar : undefined,
            pixelIcons: "pixelIcons" in data && typeof data.pixelIcons === "object" && data.pixelIcons !== null ? data.pixelIcons as { ruolo?: string[]; ordine?: string[]; premioSpeciale?: string[] } : undefined,
            content: data.content,
            locationTag: "locationTag" in data && typeof data.locationTag === "string" ? data.locationTag : undefined,
            createdAt: data.createdAt,
          };
          setMessages((prev) => {
            if (prev.some((p) => p.id === m.id)) return prev;
            return [...prev, m];
          });
        }
        if (
          data.type === "global_message" &&
          typeof data.content === "string" &&
          "senderName" in data &&
          typeof data.senderName === "string" &&
          "timestamp" in data &&
          typeof data.timestamp === "string"
        ) {
          // Crea un messaggio globale con un ID univoco basato sul timestamp
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
            // Evita duplicati
            if (prev.some((p) => p.id === globalMsg.id)) return prev;
            return [...prev, globalMsg];
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setUsers([]);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "leave" }));
      }
      ws.close();
      wsRef.current = null;
      setConnected(false);
      setUsers([]);
    };
  }, [roomId]);

  return { users, messages, sendMessage, connected };
}
