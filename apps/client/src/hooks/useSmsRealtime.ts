"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const WS_BASE = API_BASE.replace(/^http/, "ws");
const NOTIFICATION_SOUND = "/musica/notifications/message.one.mp3";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Riproduce il suono di notifica SMS (solo se il messaggio è ricevuto, non inviato). */
function playNotificationSound(): void {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.volume = 0.5; // Volume moderato
    audio.play().catch((e) => {
      // Ignora errori di riproduzione (es. browser blocca autoplay)
      console.debug("[SMS] Audio notification error:", e);
    });
  } catch (e) {
    console.debug("[SMS] Audio creation error:", e);
  }
}

/**
 * Hook per ascoltare nuovi SMS in tempo reale via WebSocket.
 * Aggiorna il badge e le conversazioni quando arriva un nuovo messaggio.
 * Riproduce il suono di notifica per messaggi ricevuti (non inviati).
 */
export function useSmsRealtime(options: {
  onNewMessage?: (message: {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    createdAt: string;
  }) => void;
  onUnreadUpdate?: () => void;
  /** CharacterId corrente (per determinare se il messaggio è ricevuto o inviato). */
  myCharacterId?: string | null;
}): {
  connected: boolean;
} {
  const { onNewMessage, onUnreadUpdate, myCharacterId } = options;
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  const onUnreadUpdateRef = useRef(onUnreadUpdate);
  const myCharacterIdRef = useRef(myCharacterId);
  onNewMessageRef.current = onNewMessage;
  onUnreadUpdateRef.current = onUnreadUpdate;
  myCharacterIdRef.current = myCharacterId;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setConnected(false);
      return;
    }

    const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Quando la connessione si apre, il server invia un messaggio "welcome" con myCharacterId
      // Aspettiamo quel messaggio prima di considerare la connessione pronta
    };

    ws.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as {
          type: string;
          id?: string;
          senderId?: string;
          recipientId?: string;
          content?: string;
          createdAt?: string;
          me?: { id: string; name: string };
        };
        if (data.type === "welcome" && data.me?.id) {
          // Aggiorna myCharacterId quando riceviamo il welcome message (prima che arrivi qualsiasi SMS)
          myCharacterIdRef.current = data.me.id;
          console.debug("[SMS] Welcome message received, myCharacterId set to:", data.me.id);
        }
        if (data.type === "sms_message" && data.id && data.senderId && data.recipientId && data.content && data.createdAt) {
          const msg = {
            id: data.id,
            senderId: data.senderId,
            recipientId: data.recipientId,
            content: data.content,
            createdAt: data.createdAt,
          };
          // Riproduci suono solo se il messaggio è ricevuto (non inviato da me)
          let myId = myCharacterIdRef.current;
          // Se myId non è disponibile, prova a ottenerlo da /characters/me (fallback sincrono)
          if (!myId) {
            try {
              const currentToken = getToken();
              if (currentToken) {
                // Usa fetch sincrono per ottenere myId il prima possibile
                const char = await fetch(`${API_BASE}/characters/me`, {
                  headers: { Authorization: `Bearer ${currentToken}` },
                }).then((r) => r.json()).catch(() => null) as { id?: string } | null;
                if (char?.id) {
                  myId = char.id;
                  myCharacterIdRef.current = char.id;
                }
              }
            } catch {
              // ignore
            }
          }
          // Riproduci suono se il messaggio è per me (recipientId === myId) e non l'ho inviato io
          if (myId && msg.recipientId === myId && msg.senderId !== myId) {
            console.debug("[SMS] Playing notification sound - message received", { myId, senderId: msg.senderId, recipientId: msg.recipientId });
            playNotificationSound();
          } else if (!myId) {
            console.debug("[SMS] Cannot play sound - myCharacterId not available yet", { senderId: msg.senderId, recipientId: msg.recipientId });
          }
          onNewMessageRef.current?.(msg);
          onUnreadUpdateRef.current?.();
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
      setConnected(false);
    };
  }, [myCharacterId]);

  return { connected };
}
