"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { InventoryItemRow } from "@/components/dashboard/inventory/types";

const MAX_WIELDED = 2; // Ambidestria — vincolo sulle armi IMPUGNATE, non sui Tōrō

type WeaponRow = {
  inventoryId: string;
  name: string;
  damage: number | null;
  resistance: number | null;
  ammoKind: string | null;
  type: string;
};

type CombatWeaponsState = {
  activeIds: string[]; // armi impugnate ora (max 1, 2 con Ambidestria)
  toroIds: string[]; // oggetti dichiarati Tōrō ora — liberi e multipli, nessun limite
  ammo: Record<string, number>;
};

/**
 * Zona 2 — "In uso ora": dichiarazione di cosa si impugna e cos'è Tōrō in questo momento.
 * L'equipaggiamento resta in scheda; qui si dichiara solo l'uso presente (spec §2 Zona2).
 */
export function CombatWeaponsSection() {
  const [weapons, setWeapons] = useState<WeaponRow[]>([]);
  const [state, setState] = useState<CombatWeaponsState>({ activeIds: [], toroIds: [], ammo: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get("/inventory/me") as Promise<{ carryItems?: InventoryItemRow[]; items?: InventoryItemRow[] }>,
      api.get("/characters/me/do-mechanics") as Promise<{
        combatActiveWeaponIds?: string[];
        combatToroWeaponIds?: string[];
        combatAmmo?: Record<string, number>;
      }>,
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
            damage: it.item.damage ?? null,
            resistance: it.item.resistance ?? null,
            ammoKind: it.item.ammoKind ?? null,
            type: it.item.type,
          })),
        );
        setState({
          activeIds: mechanics.combatActiveWeaponIds ?? [],
          toroIds: mechanics.combatToroWeaponIds ?? [],
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
          toroWeaponIds: next.toroIds ?? state.toroIds,
          ammo: next.ammo !== undefined ? next.ammo : undefined,
        };
        const res = (await api.patch("/characters/me/combat-weapons", payload)) as {
          combatActiveWeaponIds: string[];
          combatToroWeaponIds: string[];
          combatAmmo: Record<string, number>;
        };
        setState({
          activeIds: res.combatActiveWeaponIds,
          toroIds: res.combatToroWeaponIds,
          ammo: res.combatAmmo,
        });
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
        if (state.activeIds.length >= MAX_WIELDED) return;
        nextIds = [...state.activeIds, id];
      }
      void patch({ activeIds: nextIds });
    },
    [state, patch],
  );

  const toggleToro = useCallback(
    (id: string) => {
      const isToro = state.toroIds.includes(id);
      const nextIds = isToro ? state.toroIds.filter((x) => x !== id) : [...state.toroIds, id];
      void patch({ toroIds: nextIds });
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

  return (
    <div className="space-y-1.5">
      {weapons.map((w) => {
        const isActive = state.activeIds.includes(w.inventoryId);
        const isToro = state.toroIds.includes(w.inventoryId);
        const ammoVal = state.ammo[w.inventoryId];
        const hasAmmoCounter = ammoVal !== undefined;
        const needsAmmo = !!w.ammoKind;
        const isArmor = w.type === "ARMOR";

        return (
          <div
            key={w.inventoryId}
            className="rounded-lg p-2 transition-colors"
            style={{
              background: isToro
                ? "color-mix(in srgb, var(--accent-ember, #e8763a) 8%, transparent)"
                : "rgba(0,0,0,0.25)",
              border: `1px solid ${isToro ? "color-mix(in srgb, var(--accent-ember, #e8763a) 45%, transparent)" : "var(--border-color)"}`,
            }}
          >
            {/* riga principale */}
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: isToro ? "var(--accent-ember, #e8763a)" : "#4a4356" }}
              />

              <input
                type="checkbox"
                checked={isActive}
                disabled={saving || (!isActive && state.activeIds.length >= MAX_WIELDED)}
                onChange={() => toggleActive(w.inventoryId)}
                title="Impugnata / indossata ora"
                className="accent-[var(--accent-gold)] shrink-0"
              />

              <span
                className="flex-1 text-[11px] leading-tight truncate"
                style={{ color: isActive ? "var(--foreground)" : "var(--muted-foreground)" }}
              >
                {w.name}
              </span>

              {/* badge danno / resistenza */}
              {!isArmor && w.damage != null && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: "color-mix(in srgb, var(--accent-gold) 15%, transparent)", color: "var(--accent-gold)", border: "1px solid color-mix(in srgb, var(--accent-gold) 35%, transparent)" }}
                  title="Danno base arma"
                >
                  {w.damage} dmg
                </span>
              )}
              {isArmor && w.resistance != null && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: "color-mix(in srgb, var(--accent-violet) 12%, transparent)", color: "var(--accent-violet-light)", border: "1px solid color-mix(in srgb, var(--accent-violet) 30%, transparent)" }}
                  title="Scudo (riduzione danno)"
                >
                  Sc {w.resistance}
                </span>
              )}

              {/* pulsante Tōrō — solo su armi, non armature */}
              {!isArmor && (
                <button
                  type="button"
                  disabled={saving}
                  className="text-[10px] px-2 py-0.5 rounded border shrink-0 transition-colors"
                  style={{
                    background: isToro ? "#3a2519" : "transparent",
                    color: isToro ? "var(--accent-ember, #e8763a)" : "var(--muted-foreground)",
                    borderColor: isToro ? "var(--accent-ember, #e8763a)" : "var(--border-color)",
                  }}
                  onClick={() => toggleToro(w.inventoryId)}
                >
                  {isToro ? "Tōrō ✓" : "Tōrō"}
                </button>
              )}
            </div>

            {/* riga munizioni — solo armi con ammoKind */}
            {needsAmmo && (
              <div className="mt-1.5 flex items-center gap-1.5 pl-5">
                {hasAmmoCounter ? (
                  <span
                    className="inline-flex items-center gap-1 text-[9px] font-mono rounded border px-1"
                    style={{ borderColor: "var(--border-color)", color: "var(--muted-foreground)" }}
                  >
                    <button type="button" disabled={saving} className="disabled:opacity-40" onClick={() => adjustAmmo(w.inventoryId, -1)}>−</button>
                    <span>{w.ammoKind} · {ammoVal}</span>
                    <button type="button" disabled={saving} onClick={() => adjustAmmo(w.inventoryId, +1)}>+</button>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    className="text-[8px] opacity-50 hover:opacity-100 rounded border px-1.5 py-0.5"
                    style={{ borderColor: "var(--border-color)", color: "var(--muted-foreground)" }}
                    onClick={() => adjustAmmo(w.inventoryId, 0)}
                    title="Attiva conteggio munizioni"
                  >
                    + carica {w.ammoKind}
                  </button>
                )}
              </div>
            )}
            {/* munizioni manuali per armi non classificate */}
            {!needsAmmo && hasAmmoCounter && (
              <div className="mt-1.5 flex items-center gap-1.5 pl-5">
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-mono rounded border px-1"
                  style={{ borderColor: "var(--border-color)", color: "var(--muted-foreground)" }}
                >
                  <button type="button" disabled={saving} className="disabled:opacity-40" onClick={() => adjustAmmo(w.inventoryId, -1)}>−</button>
                  <span>munizioni {ammoVal}</span>
                  <button type="button" disabled={saving} onClick={() => adjustAmmo(w.inventoryId, +1)}>+</button>
                </span>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-[8px] text-gray-600 leading-relaxed mt-1 italic">
        Più oggetti possono essere Tōrō insieme. Le munizioni contano solo per gli spari normali, non per le waza.
      </p>
    </div>
  );
}
