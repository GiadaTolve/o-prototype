"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useInventoryUpdatedListener } from "@/hooks/useInventoryUpdatedListener";
import type { InventoryItemRow } from "@/components/dashboard/inventory/types";
import { formatItemCategory } from "@/components/dashboard/inventory/labels";
import { canUseCategoryInChat, encodeItemUseRequest } from "@domain/economy/item-use-chat";
import { isEquippableItem, usesIntegrity } from "@domain/economy/items";
import type { ItemCategory } from "@domain/economy/types";

function isUsableInCombatPanel(inv: InventoryItemRow): boolean {
  const category = (inv.economy?.category ?? "junk") as ItemCategory;
  if (!canUseCategoryInChat(category)) return false;
  if (inv.location !== "CARRY") return false;
  if (inv.economy?.isBroken) return false;

  if (category === "consumabile") {
    return (inv.quantity ?? 0) > 0;
  }

  if (inv.item.type === "WEAPON") return false;

  if (isEquippableItem(inv.item.type, category) && !inv.isEquipped) return false;

  if (usesIntegrity(category)) {
    const current = inv.economy?.integrityCurrent ?? inv.economy?.integrityMax ?? 0;
    if (current < 1) return false;
  }

  return true;
}

function useBlockReason(inv: InventoryItemRow): string | null {
  const category = (inv.economy?.category ?? "junk") as ItemCategory;
  if (!canUseCategoryInChat(category)) return "Non utilizzabile in chat";
  if (inv.economy?.isBroken) return "Oggetto rotto";
  if (category === "consumabile" && (inv.quantity ?? 0) < 1) return "Quantità esaurita";
  if (isEquippableItem(inv.item.type, category) && !inv.isEquipped) return "Equipaggia prima";
  if (usesIntegrity(category)) {
    const current = inv.economy?.integrityCurrent ?? inv.economy?.integrityMax ?? 0;
    if (current < 1) return "Integrità insufficiente";
  }
  return null;
}

/**
 * Zona oggetti — uso da pannello combattimento (1 utilizzo = −1 integrità).
 * Nessun comando chat: invia card strutturata come gli attacchi [ATTACCO].
 */
export function CombatItemsSection({
  characterId,
  onSendMessage,
}: {
  characterId?: string;
  onSendMessage?: (text: string) => void;
}) {
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!characterId) return;
    setLoading(true);
    api
      .get("/inventory/me")
      .then((res) => {
        const data = res as { carryItems?: InventoryItemRow[]; items?: InventoryItemRow[] };
        const carry = data.carryItems ?? data.items ?? [];
        setItems(carry.filter(isUsableInCombatPanel));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [characterId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useInventoryUpdatedListener(characterId, reload);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const ca = a.economy?.category ?? "";
        const cb = b.economy?.category ?? "";
        if (ca !== cb) return ca.localeCompare(cb, "it");
        return a.item.name.localeCompare(b.item.name, "it");
      }),
    [items],
  );

  const useItem = useCallback(
    (inv: InventoryItemRow) => {
      if (!onSendMessage || busyId) return;
      const block = useBlockReason(inv);
      if (block) return;
      setBusyId(inv.id);
      onSendMessage(encodeItemUseRequest(inv.id));
      window.setTimeout(() => setBusyId(null), 600);
    },
    [busyId, onSendMessage],
  );

  if (!characterId) {
    return <p className="text-[9px] text-gray-600 italic">Personaggio non disponibile.</p>;
  }

  if (loading) {
    return <p className="text-[9px] text-gray-500">Caricamento oggetti…</p>;
  }

  if (sortedItems.length === 0) {
    return (
      <p className="text-[9px] text-gray-600 leading-relaxed">
        Nessun oggetto utilizzabile nello zaino. Equipaggia reliquie o tieni consumabili in inventario.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sortedItems.map((inv) => {
        const category = inv.economy?.category;
        const block = useBlockReason(inv);
        const intCurrent = inv.economy?.integrityCurrent;
        const intMax = inv.economy?.integrityMax;
        const qty = inv.quantity ?? 1;

        return (
          <div key={inv.id} className="chat-combat-item-row">
            <div className="chat-combat-item-row__main">
              <p className="chat-combat-item-row__name">{inv.item.name}</p>
              <div className="chat-combat-item-row__labels">
                <span className="chat-combat-item-row__label">{formatItemCategory(category)}</span>
                {inv.isEquipped && (
                  <span className="chat-combat-item-row__label chat-combat-item-row__label--gold">Equip</span>
                )}
                {intMax != null && intCurrent != null && (
                  <span className="chat-combat-item-row__label">INT {intCurrent}/{intMax}</span>
                )}
                {category === "consumabile" && (
                  <span className="chat-combat-item-row__label">×{qty}</span>
                )}
              </div>
              {inv.item.description?.trim() && (
                <p className="chat-combat-item-row__hint">{inv.item.description.trim()}</p>
              )}
            </div>

            <button
              type="button"
              disabled={!!block || busyId === inv.id || !onSendMessage}
              className="chat-combat-item-row__btn"
              title={block ?? "Usa in chat (−1 integrità se applicabile)"}
              onClick={() => useItem(inv)}
            >
              Usa
            </button>
          </div>
        );
      })}

      <p className="text-[8px] text-gray-600 leading-relaxed italic mt-1">
        Ogni utilizzo costa 1 integrità (equip) o 1 quantità (consumabile). Le armi si gestiscono sopra con Colpisci.
      </p>
    </div>
  );
}
