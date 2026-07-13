"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type ToroState = {
  active: boolean;
  weaponInContact: boolean;
  toroBatteria?: boolean;
  hasToroPassiveEquipped: boolean;
  hasToroPassiveOwned: boolean;
  allowsTokaChannel: boolean;
  contactToProjectile: boolean;
};

export function CombatToroSection({
  onInsertText,
}: {
  onInsertText: (text: string) => void;
}) {
  const [state, setState] = useState<ToroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [origine, setOrigine] = useState("");
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
    void load();
  }, [load]);

  const patch = async (body: { weaponInContact?: boolean; toroBatteria?: boolean }) => {
    setSaving(true);
    setError(null);
    try {
      const data = (await api.patch("/characters/me/toro-state", body)) as ToroState;
      setState(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-[9px] text-gray-500">Caricamento Tōrō…</p>;
  }

  if (!state?.hasToroPassiveOwned && !state?.hasToroPassiveEquipped) {
    return (
      <p className="text-[9px] text-gray-600 leading-relaxed">
        Tōrō (Tōka-dō): possiedi la passiva «Lanterna Incisa» per attivare il canale. In chat puoi
        comunque scrivere <code className="text-[var(--accent-violet-light)]">[toro]</code> nel
        messaggio.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-display">Stato</span>
        <span
          className={`text-[8px] font-display uppercase px-1.5 py-0.5 rounded border ${
            state.active
              ? "border-[var(--accent-gold)]/50 text-[var(--accent-gold)]"
              : "border-[var(--border-color)] text-gray-500"
          }`}
        >
          {state.active ? "Sigillo attivo" : "Spento"}
        </span>
      </div>

      <label className="flex items-center gap-2 text-[10px] text-[var(--accent-violet-light)] cursor-pointer min-h-[44px]">
        <input
          type="checkbox"
          checked={state.weaponInContact}
          disabled={saving}
          onChange={() => void patch({ weaponInContact: !state.weaponInContact })}
          className="accent-[var(--accent-gold)]"
        />
        Mano a contatto (sigillo Tōrō)
      </label>

      <label className="flex items-center gap-2 text-[10px] text-[var(--accent-violet-light)] cursor-pointer min-h-[44px]">
        <input
          type="checkbox"
          checked={Boolean(state.toroBatteria)}
          disabled={saving}
          onChange={() => void patch({ toroBatteria: !state.toroBatteria })}
          className="accent-[var(--accent-gold)]"
        />
        Batteria Tōrō caricata
      </label>

      {state.contactToProjectile && (
        <p className="text-[8px] text-[var(--accent-violet-light)]">
          Michishirube: [Contatto] → [Proiettile] disponibile.
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className="chat-combat-master-btn"
          onClick={() => onInsertText("[toro] ")}
        >
          + [toro]
        </button>
        <button
          type="button"
          className="chat-combat-master-btn"
          onClick={() => onInsertText("[toro:batteria:1] ")}
        >
          + [toro:batteria:1]
        </button>
      </div>

      <div className="flex gap-1">
        <input
          type="text"
          value={origine}
          onChange={(e) => setOrigine(e.target.value)}
          placeholder="Nome arma (es. Raiden)"
          className="flex-1 min-w-0 rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-[10px] text-white"
        />
        <button
          type="button"
          disabled={!origine.trim()}
          className="chat-combat-master-btn shrink-0"
          onClick={() => {
            onInsertText(`[origine:${origine.trim()}] `);
            setOrigine("");
          }}
        >
          + origine
        </button>
      </div>

      <p className="text-[8px] text-gray-600 leading-relaxed">
        <strong className="text-gray-500 font-normal">Tōrō:</strong> sigillo a contatto + tag{" "}
        <code>[toro]</code> nel lancio. <strong className="text-gray-500 font-normal">Batteria Tōrō</strong>{" "}
        (carica lanterna, condizione <code>toro.batteria</code>): toggle sopra o tag{" "}
        <code>[toro:batteria:1]</code>.
      </p>

      {error && <p className="text-[9px] text-[var(--accent-violet-light)]">{error}</p>}
    </div>
  );
}
