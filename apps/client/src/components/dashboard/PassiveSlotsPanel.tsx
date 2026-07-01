"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";

type PassiveSlotEquipped = {
  id: string;
  name: string;
  rank: string | null;
  level: number | null;
};

type PassiveSlotRow = {
  slotNumber: number;
  unlocked: boolean;
  unlockCost: number | null;
  equipped: PassiveSlotEquipped | null;
};

type OwnedPassive = {
  id: string;
  name: string;
  description?: string | null;
  rank?: string | null;
  level?: number | null;
  equippedInSlot: number | null;
};

type PassiveSlotsState = {
  slotsUnlocked: number;
  maxSlots: number;
  baseSlots: number;
  nextUnlockCost: number | null;
  nextSlotNumber: number | null;
  canUnlockNext: boolean;
  expSpendable: number;
  equippedPassiveIds: string[];
  slots: PassiveSlotRow[];
  ownedPassives: OwnedPassive[];
};

function SlotDiamond({
  slot,
  selectedId,
  ownedPassives,
  usedElsewhere,
  onSelect,
  disabled,
}: {
  slot: PassiveSlotRow;
  selectedId: string;
  ownedPassives: OwnedPassive[];
  usedElsewhere: Set<string>;
  onSelect: (skillId: string) => void;
  disabled?: boolean;
}) {
  const filled = Boolean(slot.equipped?.name || selectedId);
  const borderClass = slot.unlocked
    ? filled
      ? "border-[var(--accent-gold)]/70 shadow-[var(--shadow-gold)]"
      : "border-[var(--accent-violet)]/40"
    : slot.unlockCost != null
      ? "border-[var(--accent-gold)]/30 border-dashed"
      : "border-[var(--border-color)]/40 opacity-40";

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative w-[72px] h-[72px] flex items-center justify-center ${borderClass}`}
        title={
          slot.unlocked
            ? `Slot ${slot.slotNumber}`
            : slot.unlockCost != null
              ? `Sblocca slot ${slot.slotNumber}: ${slot.unlockCost} EXP`
              : `Slot ${slot.slotNumber} bloccato`
        }
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden>
          <polygon
            points="50,4 96,50 50,96 4,50"
            fill="var(--panel-bg)"
            stroke="currentColor"
            strokeWidth="2"
            className={
              slot.unlocked
                ? filled
                  ? "text-[var(--accent-gold)]"
                  : "text-[var(--accent-violet)]"
                : "text-[var(--border-color)]"
            }
          />
        </svg>
        <span className="relative z-10 text-[9px] font-display uppercase tracking-widest text-[var(--accent-violet-light)]/80">
          {slot.slotNumber}
        </span>
      </div>

      {slot.unlocked ? (
        <select
          value={selectedId}
          disabled={disabled}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full max-w-[140px] text-[10px] rounded border border-[var(--border-color)] bg-black/50 text-gray-300 px-1.5 py-1 focus:border-[var(--accent-violet)] outline-none"
        >
          <option value="">— vuoto —</option>
          {ownedPassives.map((p) => (
            <option
              key={p.id}
              value={p.id}
              disabled={usedElsewhere.has(p.id) && p.id !== selectedId}
            >
              {p.name}
            </option>
          ))}
        </select>
      ) : slot.unlockCost != null ? (
        <p className="text-[9px] text-[var(--accent-gold)] font-display tabular-nums">
          {slot.unlockCost} EXP
        </p>
      ) : (
        <p className="text-[9px] text-gray-600">—</p>
      )}

      {slot.unlocked && (slot.equipped?.name || selectedId) && (
        <p className="text-[9px] text-center text-[var(--accent-violet-light)]/70 line-clamp-2 max-w-[120px]">
          {ownedPassives.find((p) => p.id === selectedId)?.name ?? slot.equipped?.name}
        </p>
      )}
    </div>
  );
}

export function PassiveSlotsPanel({ onCharUpdate }: { onCharUpdate?: () => void }) {
  const [state, setState] = useState<PassiveSlotsState | null>(null);
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.get("/characters/me/passive-slots")) as PassiveSlotsState;
      setState(data);
      setDraftIds(data.equippedPassiveIds ?? []);
    } catch (e) {
      setState(null);
      setError(e instanceof Error ? e.message : "Errore caricamento slot passivi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSlotSelect = (slotIndex: number, skillId: string) => {
    setDraftIds((prev) => {
      const next = [...prev];
      while (next.length < (state?.slotsUnlocked ?? 0)) next.push("");
      next[slotIndex] = skillId;
      return next.slice(0, state?.slotsUnlocked ?? next.length);
    });
  };

  const handleSave = async () => {
    if (!state) return;
    setSaving(true);
    setError(null);
    try {
      const updated = (await api.patch("/characters/me/passive-slots/equip", {
        equippedIds: draftIds,
      })) as PassiveSlotsState;
      setState(updated);
      setDraftIds(updated.equippedPassiveIds ?? []);
      onCharUpdate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore salvataggio loadout");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    setUnlocking(true);
    setError(null);
    try {
      const updated = (await api.post("/characters/me/passive-slots/unlock", {})) as PassiveSlotsState;
      setState(updated);
      setDraftIds(updated.equippedPassiveIds ?? []);
      onCharUpdate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sblocco slot");
    } finally {
      setUnlocking(false);
    }
  };

  const dirty =
    state != null &&
    JSON.stringify(draftIds) !== JSON.stringify(state.equippedPassiveIds ?? []);

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">Caricamento slot passivi…</p>;
  }

  if (!state) {
    return error ? (
      <p className="text-[11px] text-red-400/90 border border-red-500/30 rounded-md px-3 py-2">{error}</p>
    ) : null;
  }

  const usedIds = new Set(draftIds.filter(Boolean));

  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)]/80 overflow-hidden animate__animated animate__fadeIn">
      <header className="px-4 py-3 border-b border-[var(--border-color)]/70 bg-black/50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-sm text-[var(--accent-gold)] flex items-center gap-2">
              <FontAwesomeIcon icon={icons.waza} className="w-3.5 h-3.5 opacity-80" />
              Slot passivi
            </h3>
            <p className="text-[11px] text-[var(--accent-violet-light)]/65 mt-1 max-w-lg">
              {state.baseSlots} slot base · fino a {state.maxSlots} con EXP spendibile.
              Equipaggia Waza passive possedute (effetto narrativo sempre attivo).
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)]/60 font-display tabular-nums">
            {state.slotsUnlocked}/{state.maxSlots} sbloccati
          </p>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {error && (
          <p className="text-[11px] text-red-400/90 border border-red-500/30 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 justify-items-center">
          {state.slots.map((slot, i) => (
            <SlotDiamond
              key={slot.slotNumber}
              slot={{
                ...slot,
                equipped: draftIds[i]
                  ? state.ownedPassives.find((p) => p.id === draftIds[i])
                    ? {
                        id: draftIds[i],
                        name: state.ownedPassives.find((p) => p.id === draftIds[i])!.name,
                        rank: state.ownedPassives.find((p) => p.id === draftIds[i])!.rank ?? null,
                        level: state.ownedPassives.find((p) => p.id === draftIds[i])!.level ?? null,
                      }
                    : slot.equipped
                  : null,
              }}
              selectedId={draftIds[i] ?? ""}
              ownedPassives={state.ownedPassives}
              usedElsewhere={usedIds}
              onSelect={(id) => handleSlotSelect(i, id)}
              disabled={saving}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--border-color)]/50">
          {state.nextUnlockCost != null && (
            <button
              type="button"
              onClick={handleUnlock}
              disabled={!state.canUnlockNext || unlocking}
              className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {unlocking
                ? "…"
                : `Sblocca slot ${state.nextSlotNumber} · ${state.nextUnlockCost} EXP`}
            </button>
          )}
          {dirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded border border-[var(--accent-violet)] text-[var(--accent-violet-light)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-violet)]/10 disabled:opacity-50"
            >
              {saving ? "Salvataggio…" : "Salva loadout"}
            </button>
          )}
          {state.ownedPassives.length === 0 && (
            <p className="text-[11px] text-gray-500 italic">
              Nessuna Waza passiva posseduta — acquistala nella sezione sotto con EXP.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
