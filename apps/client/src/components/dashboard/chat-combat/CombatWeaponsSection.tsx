"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { InventoryItemRow } from "@/components/dashboard/inventory/types";

const MAX_ACTIVE_WEAPONS = 2; // Ambidestria

type WeaponRow = {
  inventoryId: string;
  name: string;
  ammo: number | null;
};

type CombatWeaponsState = {
  activeIds: string[];
  ammo: Record<string, number>;
};

export function CombatWeaponsSection({
  onInsertText,
}: {
  onInsertText: (text: string) => void;
}) {
  const [weapons, setWeapons] = useState<WeaponRow[]>([]);
  const [state, setState] = useState<CombatWeaponsState>({ activeIds: [], ammo: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get("/inventory/me") as Promise<{ carryItems?: InventoryItemRow[]; items?: InventoryItemRow[] }>,
      api.get("/characters/me/do-mechanics") as Promise<{ combatActiveWeaponIds?: string[]; combatAmmo?: Record<string, number> }>,
    ])
      .then(([inv, mechanics]) => {
        if (cancelled) return;
        const items = inv.carryItems ?? inv.items ?? [];
        const weaponItems = items.filter(
          (it) => it.item.type === "WEAPON" && it.isEquipped,
        );
        setWeapons(
          weaponItems.map((it) => ({
            inventoryId: it.id,
            name: it.item.name,
            ammo: mechanics.combatAmmo?.[it.id] ?? null,
          })),
        );
        setState({
          activeIds: mechanics.combatActiveWeaponIds ?? [],
          ammo: mechanics.combatAmmo ?? {},
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const patch = useCallback(
    async (next: Partial<CombatWeaponsState>) => {
      setSaving(true);
      try {
        const payload = {
          activeWeaponIds: next.activeIds ?? state.activeIds,
          ammo: next.ammo !== undefined ? next.ammo : undefined,
        };
        const res = (await api.patch("/characters/me/combat-weapons", payload)) as {
          combatActiveWeaponIds: string[];
          combatAmmo: Record<string, number>;
        };
        setState({ activeIds: res.combatActiveWeaponIds, ammo: res.combatAmmo });
        setWeapons((prev) =>
          prev.map((w) => ({ ...w, ammo: res.combatAmmo[w.inventoryId] ?? null })),
        );
      } catch {}
      finally { setSaving(false); }
    },
    [state],
  );

  const toggleActive = useCallback(
    (id: string) => {
      const isActive = state.activeIds.includes(id);
      let nextIds: string[];
      if (isActive) {
        nextIds = state.activeIds.filter((x) => x !== id);
      } else {
        if (state.activeIds.length >= MAX_ACTIVE_WEAPONS) return;
        nextIds = [...state.activeIds, id];
      }
      void patch({ activeIds: nextIds });
    },
    [state, patch],
  );

  const adjustAmmo = useCallback(
    (id: string, delta: number) => {
      const current = state.ammo[id] ?? 0;
      const next = Math.max(0, current + delta);
      void patch({ ammo: { ...state.ammo, [id]: next } });
    },
    [state, patch],
  );

  if (loading) {
    return <p className="text-[9px] text-gray-500">Caricamento armi…</p>;
  }

  if (weapons.length === 0) {
    return (
      <p className="text-[9px] text-gray-600 leading-relaxed">
        Nessuna arma equipaggiata. Equipaggia un&apos;arma dall&apos;inventario.
      </p>
    );
  }

  const activeCount = state.activeIds.length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-display">
          Armi in uso
        </span>
        <span
          className="text-[8px] px-1.5 py-0.5 rounded border font-display uppercase"
          style={{
            borderColor: activeCount >= MAX_ACTIVE_WEAPONS
              ? "color-mix(in srgb, var(--accent-gold) 40%, transparent)"
              : "var(--border-color)",
            color: activeCount >= MAX_ACTIVE_WEAPONS ? "var(--accent-gold)" : "var(--muted-foreground)",
          }}
        >
          {activeCount}/{MAX_ACTIVE_WEAPONS} Ambidestria
        </span>
      </div>

      {weapons.map((w) => {
        const isActive = state.activeIds.includes(w.inventoryId);
        const ammoVal = state.ammo[w.inventoryId];
        const hasAmmo = ammoVal !== undefined;

        return (
          <div
            key={w.inventoryId}
            className="flex items-center gap-2 rounded-lg p-2 transition-colors"
            style={{
              background: isActive
                ? "color-mix(in srgb, var(--accent-gold) 8%, transparent)"
                : "rgba(0,0,0,0.25)",
              border: `1px solid ${isActive ? "color-mix(in srgb, var(--accent-gold) 35%, transparent)" : "var(--border-color)"}`,
            }}
          >
            <input
              type="checkbox"
              checked={isActive}
              disabled={saving || (!isActive && activeCount >= MAX_ACTIVE_WEAPONS)}
              onChange={() => toggleActive(w.inventoryId)}
              className="accent-[var(--accent-gold)] shrink-0"
            />
            <span
              className="flex-1 text-[10px] leading-tight truncate"
              style={{ color: isActive ? "var(--accent-gold)" : "var(--foreground)" }}
            >
              {w.name}
            </span>

            {isActive && (
              <button
                type="button"
                disabled={saving}
                className="text-[9px] px-1.5 py-0.5 rounded border transition-colors shrink-0"
                style={{ borderColor: "var(--border-color)", color: "var(--muted-foreground)" }}
                onClick={() => onInsertText(`[origine:${w.name}] `)}
              >
                + tag
              </button>
            )}

            {/* Contatore munizioni (visibile solo se già impostato o se arma attiva) */}
            {isActive && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={saving || !hasAmmo}
                  className="w-5 h-5 rounded text-[10px] flex items-center justify-center border border-[var(--border-color)] disabled:opacity-40"
                  onClick={() => adjustAmmo(w.inventoryId, -1)}
                >
                  −
                </button>
                <span
                  className="text-[10px] w-5 text-center font-mono"
                  style={{ color: "var(--accent-gold)" }}
                >
                  {hasAmmo ? ammoVal : "∞"}
                </span>
                <button
                  type="button"
                  disabled={saving}
                  className="w-5 h-5 rounded text-[10px] flex items-center justify-center border border-[var(--border-color)]"
                  onClick={() => adjustAmmo(w.inventoryId, +1)}
                >
                  +
                </button>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[8px] text-gray-600 leading-relaxed mt-1">
        Seleziona fino a {MAX_ACTIVE_WEAPONS} armi (Ambidestria). Il contatore munizioni si attiva con +.
      </p>
    </div>
  );
}
