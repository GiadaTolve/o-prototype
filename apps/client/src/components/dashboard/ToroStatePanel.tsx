"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type ToroState = {
  active: boolean;
  weaponInContact: boolean;
  hasToroPassiveEquipped: boolean;
  hasToroPassiveOwned: boolean;
  blocksManipulationTargeting: boolean;
  allowsTokaChannel: boolean;
  maintenanceJigoka: number;
  hasMichishirube: boolean;
  contactToProjectile: boolean;
};

export function ToroStatePanel() {
  const [state, setState] = useState<ToroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.get("/characters/me/toro-state")) as ToroState;
      setState(data);
    } catch (e: unknown) {
      setState(null);
      setError(e instanceof Error ? e.message : "Errore Tōrō");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleContact = async () => {
    if (!state) return;
    setSaving(true);
    setError(null);
    try {
      const data = (await api.patch("/characters/me/toro-state", {
        weaponInContact: !state.weaponInContact,
      })) as ToroState;
      setState(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-[10px] text-gray-500">Caricamento Tōrō…</p>;
  }

  if (error && !state) {
    return (
      <div className="rounded-lg border border-[var(--border-color)] bg-black/30 px-3 py-2 text-[10px] text-gray-500">
        {error}
      </div>
    );
  }

  if (!state?.hasToroPassiveOwned && !state?.hasToroPassiveEquipped) {
    return null;
  }

  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-black/35 p-4 shadow-[var(--shadow-gold)]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">
          Tōrō · Tōka-dō
        </h3>
        <span
          className={`text-[9px] font-display uppercase px-2 py-0.5 rounded border ${
            state.active
              ? "border-[var(--accent-gold)]/50 text-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
              : "border-[var(--border-color)] text-gray-500"
          }`}
        >
          {state.active ? "Attivo" : "Spento"}
        </span>
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
        Lanterna incisa: a contatto l&apos;arma è Tōrō psichico — protezione da manipolazione esterna e
        canale per le Waza del ramo.
      </p>

      <label className="flex items-center gap-2 text-[11px] text-[var(--accent-violet-light)] cursor-pointer mb-3">
        <input
          type="checkbox"
          checked={state.weaponInContact}
          disabled={saving}
          onChange={toggleContact}
          className="accent-[var(--accent-gold)]"
        />
        Mano a contatto (sigillo Tōrō)
      </label>

      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-display uppercase text-gray-500">
        {state.blocksManipulationTargeting && state.active && (
          <>
            <dt>Manipolazione</dt>
            <dd className="text-right text-[var(--accent-violet-light)]">bloccata su arma</dd>
          </>
        )}
        {state.allowsTokaChannel && (
          <>
            <dt>Canale Tōka</dt>
            <dd className="text-right text-[var(--accent-gold)]">aperto</dd>
          </>
        )}
        {state.contactToProjectile && (
          <>
            <dt>Michishirube</dt>
            <dd className="text-right text-[var(--accent-violet-light)]">A contatto → Proiettile</dd>
          </>
        )}
        {state.maintenanceJigoka > 0 && (
          <>
            <dt>Mantenimento</dt>
            <dd className="text-right tabular-nums">{state.maintenanceJigoka} JIG/turno</dd>
          </>
        )}
      </dl>

      {error && <p className="mt-2 text-[10px] text-[var(--accent-violet-light)]">{error}</p>}
    </section>
  );
}
