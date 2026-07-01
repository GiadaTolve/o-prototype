"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type StyleRow = {
  id: string;
  label: string;
  relation: "primary" | "adjacent" | "distant" | "opposite" | null;
  maxWaza: number | null;
  ownedWaza: number;
  unlocked: boolean;
  isPrimary: boolean;
  unlockKeyCost: number;
};

type StyleHexState = {
  primaryStyleId: string | null;
  unlockedStyleIds: string[];
  keys: number;
  unlockKeyCost: number;
  styles: StyleRow[];
  capsByRelation: { primary: number; adjacent: number; distant: number; opposite: number };
};

/** Posizioni esagono (viewBox 300×280). Ordine manuale: Tōka → Genzai → Itō → Naikan → Hensei → Hadō */
const HEX_POSITIONS: Record<string, { x: number; y: number }> = {
  toka: { x: 150, y: 36 },
  genzai: { x: 238, y: 88 },
  ito: { x: 238, y: 192 },
  naikan: { x: 150, y: 244 },
  hensei: { x: 62, y: 192 },
  hado: { x: 62, y: 88 },
};

const RELATION_LABEL: Record<string, string> = {
  primary: "Principale · 6 waza",
  adjacent: "Adiacente · 3 waza",
  distant: "Lontano · 1 waza",
  opposite: "Opposto · 0 waza",
};

function nodeClass(style: StyleRow, selected: string | null): string {
  const base =
    "absolute -translate-x-1/2 -translate-y-1/2 w-[88px] text-center transition-all duration-200";
  if (!style.unlocked) return `${base} opacity-45`;
  if (style.isPrimary) return `${base} scale-105`;
  if (selected === style.id) return `${base} scale-100`;
  return base;
}

export function StyleHexagonPanel({ onCharUpdate }: { onCharUpdate?: () => void }) {
  const [state, setState] = useState<StyleHexState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedTouched, setSelectedTouched] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = (await api.get("/characters/me/style-hexagon")) as StyleHexState;
      if (!mountedRef.current) return;
      setState(data);
    } catch (e) {
      if (!mountedRef.current) return;
      setState(null);
      setError(e instanceof Error ? e.message : "Errore Esagono");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedTouched) return;
    if (state?.primaryStyleId) setSelected(state.primaryStyleId);
  }, [state?.primaryStyleId, selectedTouched]);

  const handleSetPrimary = async (styleId: string) => {
    setBusy(styleId);
    setError(null);
    try {
      const data = (await api.patch("/characters/me/style-hexagon/primary", { styleId })) as StyleHexState;
      setState(data);
      setSelected(styleId);
      onCharUpdate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      if (mountedRef.current) setBusy(null);
    }
  };

  const handleUnlock = async (styleId: string) => {
    setBusy(styleId);
    setError(null);
    try {
      const data = (await api.post("/characters/me/style-hexagon/unlock", { styleId })) as StyleHexState;
      setState(data);
      onCharUpdate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sblocco");
    } finally {
      if (mountedRef.current) setBusy(null);
    }
  };

  if (loading && !state) {
    return <p className="text-sm text-gray-500 py-4">Caricamento Esagono…</p>;
  }
  if (!state) {
    return error ? (
      <p className="text-[11px] text-red-400/90 border border-red-500/30 rounded-md px-3 py-2">{error}</p>
    ) : null;
  }

  const selectedStyle = state.styles.find((s) => s.id === selected);

  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)]/80 overflow-hidden animate__animated animate__fadeIn">
      <header className="px-4 py-3 border-b border-[var(--border-color)]/70 bg-black/50">
        <h3 className="font-display text-sm text-[var(--accent-gold)]">Esagono degli Stili</h3>
        <p className="text-[11px] text-[var(--accent-violet-light)]/65 mt-1 max-w-xl">
          Scegli lo stile principale, sblocca gli altri con Key. I limiti waza seguono il manuale: 6 · 3 · 1 · 0.
        </p>
      </header>

      <div className="p-4 space-y-4">
        {error && (
          <p className="text-[11px] text-red-400/90 border border-red-500/30 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="relative mx-auto w-full max-w-[320px] h-[280px]">
          <svg viewBox="0 0 300 280" className="absolute inset-0 w-full h-full" aria-hidden>
            <polygon
              points="150,36 238,88 238,192 150,244 62,192 62,88"
              fill="none"
              stroke="var(--border-color)"
              strokeWidth="1"
              opacity="0.6"
            />
            {state.primaryStyleId &&
              state.styles.map((s) => {
                const from = HEX_POSITIONS[state.primaryStyleId!];
                const to = HEX_POSITIONS[s.id];
                if (!from || !to || s.id === state.primaryStyleId) return null;
                return (
                  <line
                    key={`line-${s.id}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="var(--accent-violet)"
                    strokeWidth="0.5"
                    opacity={s.relation === "opposite" ? 0.15 : 0.35}
                  />
                );
              })}
          </svg>

          {state.styles.map((style) => {
            const pos = HEX_POSITIONS[style.id];
            if (!pos) return null;
            const border =
              style.isPrimary
                ? "border-[var(--accent-gold)] shadow-[var(--shadow-gold)]"
                : style.unlocked
                  ? style.relation === "adjacent"
                    ? "border-[var(--accent-violet)]"
                    : style.relation === "distant"
                      ? "border-[var(--border-color)]"
                      : style.relation === "opposite"
                        ? "border-[var(--border-color)]/40"
                        : "border-[var(--accent-violet)]/50"
                  : "border-[var(--border-color)]/50 border-dashed";

            return (
              <button
                key={style.id}
                type="button"
                disabled={busy === style.id}
                className={`${nodeClass(style, selected)} left-[${pos.x}px]`}
                style={{ left: `${(pos.x / 300) * 100}%`, top: `${(pos.y / 280) * 100}%` }}
                onClick={() => {
                  setSelectedTouched(true);
                  setSelected(style.id);
                }}
              >
                <span
                  className={`block rounded-md border bg-black/60 px-1.5 py-2 ${border} hover:bg-[var(--accent-violet)]/10`}
                >
                  <span className="block text-[9px] font-display uppercase tracking-wider text-[var(--accent-gold)] leading-tight">
                    {style.label.replace("-dō", "").replace("-Do", "")}
                  </span>
                  <span className="block text-[8px] text-gray-500 tabular-nums mt-0.5">
                    {style.ownedWaza}/{style.maxWaza ?? "—"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {selectedStyle && (
          <div className="rounded-md border border-[var(--border-color)] bg-black/40 px-3 py-2.5 text-[11px] space-y-2">
            <p className="font-display text-[var(--accent-gold)]">{selectedStyle.label}</p>
            {selectedStyle.relation && state.primaryStyleId && (
              <p className="text-[var(--accent-violet-light)]/80">
                {RELATION_LABEL[selectedStyle.relation] ?? selectedStyle.relation}
              </p>
            )}
            <p className="text-gray-500 tabular-nums">
              Waza possedute: {selectedStyle.ownedWaza}
              {selectedStyle.maxWaza != null ? ` / ${selectedStyle.maxWaza}` : ""}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {!state.primaryStyleId && (
                <button
                  type="button"
                  disabled={busy === selectedStyle.id}
                  onClick={() => handleSetPrimary(selectedStyle.id)}
                  className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-[10px] font-display uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                >
                  Imposta principale
                </button>
              )}
              {state.primaryStyleId &&
                !selectedStyle.unlocked &&
                selectedStyle.id !== state.primaryStyleId && (
                  <button
                    type="button"
                    disabled={busy === selectedStyle.id || state.keys < state.unlockKeyCost}
                    onClick={() => handleUnlock(selectedStyle.id)}
                    className="px-3 py-1.5 rounded border border-[var(--accent-violet)] text-[var(--accent-violet-light)] text-[10px] font-display uppercase tracking-wider hover:bg-[var(--accent-violet)]/10 disabled:opacity-50"
                  >
                    Sblocca · {state.unlockKeyCost} Key
                  </button>
                )}
              {selectedStyle.isPrimary && (
                <span className="text-[10px] text-[var(--accent-gold)] uppercase tracking-widest font-display">
                  Stile principale
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
