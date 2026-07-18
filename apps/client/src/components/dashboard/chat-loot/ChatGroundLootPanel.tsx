"use client";

import { useCallback, useEffect, useState } from "react";
import { encodePrendiPanelRequest } from "@domain/economy/drop-panel-message";
import { api } from "@/lib/api";
import { useInventoryUpdatedListener } from "@/hooks/useInventoryUpdatedListener";

type GroundLootRow = {
  id: string;
  catalogKey: string;
  quantity: number;
  name: string;
};

/**
 * Loot a terra nella scena — Fase 2 drop UI (solo pannello, nessun comando chat).
 */
export function ChatGroundLootPanel({
  roomId,
  characterId,
  sendMessage,
}: {
  roomId: string;
  characterId?: string;
  sendMessage: (text: string) => void;
}) {
  const [items, setItems] = useState<GroundLootRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!roomId) return;
    setLoading(true);
    api
      .get(`/drop/ground/${encodeURIComponent(roomId)}`)
      .then((res) => {
        const data = res as { items?: GroundLootRow[] };
        setItems(data.items ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useInventoryUpdatedListener(characterId, reload);

  useEffect(() => {
    const onDropChat = () => reload();
    window.addEventListener("chatDropUpdated", onDropChat);
    return () => window.removeEventListener("chatDropUpdated", onDropChat);
  }, [reload]);

  const prendi = useCallback(
    (row: GroundLootRow) => {
      if (busyId) return;
      setBusyId(row.id);
      sendMessage(encodePrendiPanelRequest(row.catalogKey));
      window.setTimeout(() => {
        setBusyId(null);
        reload();
      }, 800);
    },
    [busyId, reload, sendMessage],
  );

  if (loading && items.length === 0) {
    return (
      <section className="chat-ground-loot-panel">
        <div className="chat-ground-loot-panel__head">
          <span className="chat-ground-loot-panel__title">A terra</span>
        </div>
        <p className="chat-ground-loot-panel__empty">Caricamento…</p>
      </section>
    );
  }

  return (
    <section className="chat-ground-loot-panel">
      <div className="chat-ground-loot-panel__head">
        <span className="chat-ground-loot-panel__title">A terra</span>
        {items.length > 0 && (
          <span className="chat-ground-loot-panel__count">{items.length}</span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="chat-ground-loot-panel__empty">Nessun oggetto in scena.</p>
      ) : (
        <ul className="chat-ground-loot-panel__list">
          {items.map((row) => (
            <li key={row.id} className="chat-ground-loot-panel__row">
              <div className="chat-ground-loot-panel__row-main">
                <p className="chat-ground-loot-panel__name">{row.name}</p>
                <span className="chat-ground-loot-panel__label">×{row.quantity}</span>
              </div>
              <button
                type="button"
                className="chat-ground-loot-panel__btn"
                disabled={busyId === row.id}
                onClick={() => prendi(row)}
              >
                Prendi
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
