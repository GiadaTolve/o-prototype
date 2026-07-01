"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type GosaStateResponse = {
  stacks: number;
  atCap: boolean;
  irPenalty: number;
  resistancePenaltyPercent: number;
  styleId: string;
};

export function GosaStatePanel() {
  const [state, setState] = useState<GosaStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await api.get("/characters/me/gosa-state")) as GosaStateResponse;
      setState(data);
    } catch (e: unknown) {
      setState(null);
      setError(e instanceof Error ? e.message : "Errore Gosa");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const correctOne = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = (await api.patch("/characters/me/gosa-state", {
        action: "correct",
      })) as GosaStateResponse;
      setState(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Correzione fallita");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-[10px] text-gray-500">Caricamento Gosa…</p>;
  }

  if (error && !state) {
    return (
      <div className="rounded-lg border border-[var(--border-color)] bg-black/30 px-3 py-2 text-[10px] text-gray-500">
        {error}
      </div>
    );
  }

  if (!state) return null;

  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-black/35 p-4 shadow-[var(--shadow-violet)]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[var(--accent-violet-light)]">
          Gosa · Genzai-dō
        </h3>
        <span
          className={`text-[9px] font-display uppercase px-2 py-0.5 rounded border tabular-nums ${
            state.stacks > 0
              ? "border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] bg-[var(--accent-violet)]/10"
              : "border-[var(--border-color)] text-gray-500"
          }`}
        >
          {state.stacks}/{5}
        </span>
      </div>

      <p className="text-[10px] text-gray-500 leading-relaxed mb-3">
        Margine d&apos;errore nella materializzazione: ogni costrutto impreciso accumula Gosa. Penalizza IR e
        resistenza finché non correggi il sigillo (1 CS per stack).
      </p>

      {state.stacks > 0 && (
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-display uppercase text-gray-500 mb-3">
          <dt>Penalità IR</dt>
          <dd className="text-right text-[var(--accent-violet-light)] tabular-nums">−{state.irPenalty}</dd>
          <dt>Resistenza costrutti</dt>
          <dd className="text-right text-[var(--accent-violet-light)] tabular-nums">
            −{state.resistancePenaltyPercent}%
          </dd>
        </dl>
      )}

      {state.stacks > 0 && (
        <button
          type="button"
          disabled={saving}
          onClick={correctOne}
          className="text-[10px] font-display uppercase tracking-wide px-3 py-1.5 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)] hover:border-[var(--accent-gold)]/50 hover:text-[var(--accent-gold)] transition-colors disabled:opacity-50"
        >
          Correggi (−1 stack · 1 CS)
        </button>
      )}

      {state.atCap && (
        <p className="mt-2 text-[10px] text-[var(--accent-gold)]">Cap Gosa raggiunto — correggi prima di materializzare.</p>
      )}

      {error && <p className="mt-2 text-[10px] text-[var(--accent-violet-light)]">{error}</p>}
    </section>
  );
}
