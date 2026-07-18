"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useInventoryUpdatedListener } from "@/hooks/useInventoryUpdatedListener";
import type { InventoryItemRow } from "@/components/dashboard/inventory/types";
import type { CharacterSummary } from "@/components/dashboard/types";
import { resolveCharacterComputed } from "@/components/dashboard/character-computed";
import { encodeAttackMessage } from "@domain/combat/attack-message";
import { isAmmoConsumable } from "@domain/economy/items";

const MAX_WIELDED = 2; // Ambidestria — vincolo sulle armi IMPUGNATE, non sui Tōrō

const TIER_VALUES: Record<number, number> = { 1: 4, 2: 8, 3: 12, 4: 17, 5: 23 };

const GRADE_INDEX: Record<string, number> = {
  "Nemuribito": 0,
  "Hakyō": 1,
  "Bunsekikan": 2,
  "Sentatsu Bunsekikan": 3,
  "Kanteikan": 4,
  "Shin'enkan": 4,
};

function resolveGradeIndex(grade: string | null | undefined): number {
  if (!grade) return 0;
  for (const [key, val] of Object.entries(GRADE_INDEX)) {
    if (grade.includes(key)) return val;
  }
  return 0;
}

type WeaponRow = {
  inventoryId: string;
  name: string;
  damage: number | null;
  resistance: number | null;
  ammoKind: string | null;
  type: string;
  integrityCurrent: number | null;
  integrityMax: number | null;
};

function countEquippedAmmo(items: InventoryItemRow[], ammoKind: string): number {
  return items
    .filter(
      (it) =>
        it.isEquipped &&
        isAmmoConsumable(it.economy?.category, it.item.ammoKind) &&
        it.item.ammoKind === ammoKind,
    )
    .reduce((sum, it) => sum + (it.quantity ?? 0), 0);
}

function countCarryAmmo(items: InventoryItemRow[], ammoKind: string): number {
  return items
    .filter((it) => it.economy?.category === "consumabile" && it.item.ammoKind === ammoKind)
    .reduce((sum, it) => sum + (it.quantity ?? 0), 0);
}

type CombatWeaponsState = {
  activeIds: string[]; // armi impugnate ora (max 1, 2 con Ambidestria)
  toroIds: string[]; // oggetti dichiarati Tōrō ora — liberi e multipli, nessun limite
  ammo: Record<string, number>;
};

/**
 * Zona 2 — "In uso ora": dichiarazione di cosa si impugna e cos'è Tōrō in questo momento.
 * L'equipaggiamento resta in scheda; qui si dichiara solo l'uso presente (spec §2 Zona2).
 */
export function CombatWeaponsSection({
  char,
  onSendMessage,
}: {
  char?: CharacterSummary;
  onSendMessage?: (text: string) => void;
} = {}) {
  const [weapons, setWeapons] = useState<WeaponRow[]>([]);
  const [inventoryAmmo, setInventoryAmmo] = useState<Record<string, number>>({});
  const [equippedAmmo, setEquippedAmmo] = useState<Record<string, number>>({});
  const [state, setState] = useState<CombatWeaponsState>({ activeIds: [], toroIds: [], ammo: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fistTier, setFistTier] = useState<number>(1);

  const reload = useCallback((opts?: { silent?: boolean }) => {
    let cancelled = false;
    if (!opts?.silent) setLoading(true);
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
        const ammoKinds = new Set(
          weaponItems.map((it) => it.item.ammoKind).filter((k): k is string => !!k),
        );
        const ammoCounts: Record<string, number> = {};
        const equippedCounts: Record<string, number> = {};
        for (const kind of ammoKinds) {
          ammoCounts[kind] = countCarryAmmo(items, kind);
          equippedCounts[kind] = countEquippedAmmo(items, kind);
        }
        setInventoryAmmo(ammoCounts);
        setEquippedAmmo(equippedCounts);
        setWeapons(
          weaponItems.map((it) => ({
            inventoryId: it.id,
            name: it.item.name,
            damage: it.item.damage ?? null,
            resistance: it.item.resistance ?? null,
            ammoKind: it.item.ammoKind ?? null,
            type: it.item.type,
            integrityCurrent: it.economy?.integrityCurrent ?? it.economy?.integrityMax ?? null,
            integrityMax: it.economy?.integrityMax ?? null,
          })),
        );
        setState({
          activeIds: mechanics.combatActiveWeaponIds ?? [],
          toroIds: mechanics.combatToroWeaponIds ?? [],
          ammo: mechanics.combatAmmo ?? {},
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled && !opts?.silent) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  useInventoryUpdatedListener(char?.id, () => reload({ silent: true }));

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

  const attackWithWeapon = useCallback(
    (w: WeaponRow) => {
      if (!onSendMessage) return;
      const computed = resolveCharacterComputed(char?.computed);
      const isRanged = !!w.ammoKind;
      const invAmmo = w.ammoKind ? (equippedAmmo[w.ammoKind] ?? 0) : 0;
      const intCurrent = w.integrityCurrent ?? w.integrityMax ?? 0;
      if (intCurrent < 1) return;
      if (isRanged && invAmmo <= 0) return;

      if (!state.activeIds.includes(w.inventoryId) && state.activeIds.length < MAX_WIELDED) {
        void patch({ activeIds: [...state.activeIds, w.inventoryId] });
      }

      const base = isRanged ? computed.cad : computed.cac;
      const wepDmg = w.damage ?? 0;
      const total = base + wepDmg;
      const statLabel = isRanged ? `CAD (${base})` : `CAC (${base})`;
      const formula = `${statLabel} + ${wepDmg}`;

      onSendMessage(encodeAttackMessage({
        weapon: w.name,
        formula,
        total,
        kind: isRanged ? "ranged" : "melee",
        inventoryId: w.inventoryId,
      }));
    },
    [char, state.activeIds, equippedAmmo, patch, onSendMessage],
  );

  const attackFist = useCallback(() => {
    if (!onSendMessage) return;
    const computed = resolveCharacterComputed(char?.computed);
    const cac = computed.cac;
    const grade = char?.grade ?? null;
    const gradeIdx = resolveGradeIndex(grade);

    if (gradeIdx === 0) {
      onSendMessage(encodeAttackMessage({
        weapon: "Colpo corpo a corpo",
        formula: `CAC (${cac})`,
        total: cac,
        kind: "melee",
      }));
    } else {
      const tierVal = TIER_VALUES[fistTier] ?? 4;
      const bonus = tierVal * gradeIdx;
      const total = cac + bonus;
      onSendMessage(encodeAttackMessage({
        weapon: "Colpo corpo a corpo",
        formula: `CAC (${cac}) + T${fistTier} (${tierVal}) × Gr.${gradeIdx}`,
        total,
        kind: "melee",
      }));
    }
  }, [char, fistTier, onSendMessage]);

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
        const needsAmmo = !!w.ammoKind;
        const ammoVal = state.ammo[w.inventoryId];
        const hasAmmoCounter = ammoVal !== undefined;
        const isArmor = w.type === "ARMOR";
        const intCurrent = w.integrityCurrent ?? w.integrityMax ?? null;
        const intMax = w.integrityMax;
        const invAmmo = w.ammoKind ? (equippedAmmo[w.ammoKind] ?? 0) : 0;
        const stashAmmo = w.ammoKind ? (inventoryAmmo[w.ammoKind] ?? 0) : 0;
        const canStrike =
          intCurrent != null
            ? intCurrent >= 1 && (!needsAmmo || invAmmo > 0)
            : true;

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
              {intMax != null && intCurrent != null && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: "color-mix(in srgb, var(--accent-gold) 12%, transparent)", color: "var(--accent-gold)", border: "1px solid color-mix(in srgb, var(--accent-gold) 30%, transparent)" }}
                  title="Integrità arma"
                >
                  INT {intCurrent}/{intMax}
                </span>
              )}

              {/* pulsante Tōrō — solo su armi, non armature */}
              {!isArmor && (
                <button
                  type="button"
                  disabled={saving}
                  className="text-[10px] px-2 py-0.5 rounded border shrink-0 transition-colors min-h-[44px] sm:min-h-0"
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

            {/* munizioni equipaggiate — consumo automatico su Colpisci/Spara */}
            {needsAmmo && (
              <div className="mt-1.5 flex items-center gap-1.5 pl-5">
                <span
                  className="inline-flex items-center gap-1 text-[9px] font-mono rounded border px-1.5 py-0.5"
                  style={{
                    borderColor: invAmmo > 0 ? "var(--border-color)" : "color-mix(in srgb, red 40%, var(--border-color))",
                    color: invAmmo > 0 ? "var(--muted-foreground)" : "#f87171",
                  }}
                >
                  {w.ammoKind} · {invAmmo} addosso
                  {stashAmmo > invAmmo ? ` · ${stashAmmo - invAmmo} in zaino` : ""}
                </span>
              </div>
            )}

            {/* Spara / Colpisci — direttamente sull'arma (−1 INT, munizioni auto) */}
            {!isArmor && onSendMessage && (
              <div className="mt-2 pl-5 pr-1">
                <button
                  type="button"
                  disabled={saving || !canStrike}
                  className="w-full min-h-[44px] rounded border text-xs font-display tracking-wide transition-colors disabled:opacity-30"
                  style={{
                    background: "color-mix(in srgb, var(--accent-gold) 12%, transparent)",
                    color: "var(--accent-gold)",
                    borderColor: "color-mix(in srgb, var(--accent-gold) 40%, transparent)",
                  }}
                  onClick={() => attackWithWeapon(w)}
                  title={
                    intCurrent != null && intCurrent < 1
                      ? "Integrità esaurita"
                      : needsAmmo && invAmmo <= 0
                        ? "Equipaggia munizioni addosso (Scheda → Inventario)"
                        : needsAmmo
                          ? "Spara — −1 INT, −1 munizione addosso, senza waza"
                          : "Colpisci — −1 INT, senza waza"
                  }
                >
                  {needsAmmo ? "Spara" : "Colpisci"}
                </button>
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
        Casella = impugnata in scena (max {MAX_WIELDED}). Usa <strong className="text-[var(--accent-gold)] font-normal">Spara</strong> o{" "}
        <strong className="text-[var(--accent-gold)] font-normal">Colpisci</strong> sull&apos;arma: −1 INT e munizioni addosso in automatico. Tōrō e waza restano separati.
      </p>

      {/* Attacco a mani nude */}
      {onSendMessage && (
        <div
          className="rounded-lg p-2 mt-1"
          style={{ background: "rgba(0,0,0,0.20)", border: "1px solid var(--border-color)" }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#4a4356" }} />
            <span className="flex-1 text-[11px] leading-tight text-[var(--muted-foreground)]">Corpo a corpo</span>
            {resolveGradeIndex(char?.grade) > 0 && (
              <select
                value={fistTier}
                onChange={(e) => setFistTier(Number(e.target.value))}
                className="text-[9px] bg-black/40 border border-[var(--border-color)] text-[var(--muted-foreground)] rounded px-1 py-0.5"
                title="Tier attacco pugno"
              >
                {[1,2,3,4,5].map((t) => (
                  <option key={t} value={t}>T{t}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={attackFist}
              className="text-[9px] px-2 py-0.5 rounded border shrink-0 transition-colors"
              style={{
                background: "color-mix(in srgb, var(--accent-gold) 10%, transparent)",
                color: "var(--accent-gold)",
                borderColor: "color-mix(in srgb, var(--accent-gold) 35%, transparent)",
              }}
              title="Pugno (senza waza, senza CS)"
            >
              Colpisci
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
