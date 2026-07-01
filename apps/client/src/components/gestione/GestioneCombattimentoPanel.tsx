"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type CharacterOption = { id: string; label: string };

type StatusEffectsState = {
  effects: { id: string; tag: string; stacks: number; kind: string }[];
  modifiers: Record<string, unknown>;
  tick?: { selfDamage: number; log: string[] };
};

type FieldConstructRow = {
  id: string;
  label: string;
  sizeLabel: string;
  wazaTier: number;
  remainingResistance: number;
  maxResistance: number;
  pctRemaining: number;
  stationary: boolean;
};

const EMOTIONAL = ["ira", "tristezza", "disperazione", "beatitudine", "euforia"] as const;
const ATYPICAL = [
  "emorragia",
  "debitore",
  "debito",
  "metamorfosi",
  "trance_onirica",
  "sigillato",
  "macchiato",
] as const;
const ELEMENTS = [
  { id: "fuoco", label: "Fuoco → Incendiato" },
  { id: "fulmine", label: "Fulmine → Sovraccarico" },
  { id: "acqua", label: "Acqua → Torpore" },
  { id: "gravita", label: "Gravità → Appesantimento" },
  { id: "aria", label: "Aria → Vertigini" },
] as const;

const SIZES = ["piccola", "media", "grande", "enorme"] as const;

export function GestioneCombattimentoPanel({
  users,
}: {
  users: Array<{
    id: string;
    email: string;
    characters?: Array<{ id: string; name: string }>;
  }>;
}) {
  const characters = useMemo<CharacterOption[]>(() => {
    const out: CharacterOption[] = [];
    for (const u of users) {
      for (const c of u.characters ?? []) {
        out.push({ id: c.id, label: `${c.name} (${u.email})` });
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [users]);

  const [characterId, setCharacterId] = useState("");
  const [statusState, setStatusState] = useState<StatusEffectsState | null>(null);
  const [constructs, setConstructs] = useState<FieldConstructRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [cLabel, setCLabel] = useState("Barriera");
  const [cTier, setCTier] = useState(3);
  const [cSize, setCSize] = useState<(typeof SIZES)[number]>("media");
  const [cDamage, setCDamage] = useState(12);

  const load = useCallback(async (cid: string) => {
    if (!cid) {
      setStatusState(null);
      setConstructs([]);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const [st, fc] = await Promise.all([
        api.get(`/characters/${cid}/status-effects`) as Promise<StatusEffectsState>,
        api.get(`/characters/${cid}/field-constructs`) as Promise<{ constructs: FieldConstructRow[] }>,
      ]);
      setStatusState(st);
      setConstructs(fc.constructs ?? []);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Errore caricamento");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (characterId) load(characterId);
  }, [characterId, load]);

  useEffect(() => {
    if (characters.length > 0 && !characterId) setCharacterId(characters[0].id);
  }, [characters, characterId]);

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    if (!characterId) return;
    setBusy(true);
    setMsg(null);
    try {
      const result = await fn();
      if (result && typeof result === "object" && "effects" in result) {
        setStatusState(result as StatusEffectsState);
      }
      if (result && typeof result === "object" && "constructs" in result) {
        setConstructs((result as { constructs: FieldConstructRow[] }).constructs);
      }
      if (result && typeof result === "object" && "list" in result) {
        setConstructs((result as { list: { constructs: FieldConstructRow[] } }).list.constructs);
      }
      setMsg(okMsg);
      await load(characterId);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Operazione fallita");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate__animated animate__fadeIn">
      <header>
        <h2 className="font-display text-lg text-[var(--accent-gold)]">Combattimento Master</h2>
        <p className="text-sm text-gray-500 mt-1">
          Status §2.4 · Costrutti sul campo §2.6 — validazione combattimento in chat.
        </p>
      </header>

      <label className="block max-w-xl">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-display">Personaggio</span>
        <select
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          className="mt-1 w-full rounded border border-[var(--border-color)] bg-black/40 px-3 py-2 text-sm text-white"
        >
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      {msg && (
        <p className="text-xs text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-3 py-2 bg-black/30">
          {msg}
        </p>
      )}

      {/* Status */}
      <section className="rounded-lg border border-[var(--border-color)] bg-black/35 p-4">
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)] mb-3">
          Status attivi
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[1.5rem]">
          {(statusState?.effects ?? []).length === 0 ? (
            <span className="text-[11px] text-gray-500 italic">Nessuno</span>
          ) : (
            statusState?.effects.map((e) => (
              <span key={e.id} className="status-emotional-tag text-[10px]">
                {e.tag} ×{e.stacks}
              </span>
            ))
          )}
        </div>

        <p className="text-[10px] text-gray-500 mb-2 font-display uppercase">Emotivi</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {EMOTIONAL.map((id) => (
            <button
              key={id}
              type="button"
              disabled={busy || !characterId}
              onClick={() =>
                run(
                  () => api.post(`/characters/${characterId}/status-effects/apply`, { statusId: id }),
                  `Status ${id} applicato`,
                )
              }
              className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:border-[var(--accent-gold)]/50 disabled:opacity-40"
            >
              +{id}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-gray-500 mb-2 font-display uppercase">Elementali</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {ELEMENTS.map((el) => (
            <button
              key={el.id}
              type="button"
              disabled={busy || !characterId}
              onClick={() =>
                run(
                  () =>
                    api.post(`/characters/${characterId}/status-effects/apply`, { element: el.id }),
                  el.label,
                )
              }
              className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:border-[var(--accent-violet)]/50 disabled:opacity-40"
            >
              {el.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-gray-500 mb-2 font-display uppercase">Madoshō / atipici</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {ATYPICAL.map((id) => (
            <button
              key={id}
              type="button"
              disabled={busy || !characterId}
              onClick={() =>
                run(
                  () => api.post(`/characters/${characterId}/status-effects/apply`, { statusId: id }),
                  `Status ${id} applicato`,
                )
              }
              className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:border-[var(--accent-violet-light)]/50 disabled:opacity-40"
            >
              +{id}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-color)]/50">
          <button
            type="button"
            disabled={busy || !characterId}
            onClick={() =>
              run(
                () => api.post(`/characters/${characterId}/status-effects/tick-turn`, {}),
                "Fine turno PG (decay + DoT)",
              )
            }
            className="px-3 py-1.5 text-[10px] font-display uppercase tracking-wider rounded border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] disabled:opacity-40"
          >
            Tick turno
          </button>
          <button
            type="button"
            disabled={busy || !characterId}
            onClick={() =>
              run(
                () => api.post(`/characters/${characterId}/status-effects/hit-taken`, {}),
                "Colpo subito (Macchiato)",
              )
            }
            className="px-3 py-1.5 text-[10px] rounded border border-[var(--border-color)] disabled:opacity-40"
          >
            Colpo subito
          </button>
          {(statusState?.effects ?? []).map((e) => (
            <button
              key={`rm-${e.id}`}
              type="button"
              disabled={busy}
              onClick={() =>
                run(
                  () => api.delete(`/characters/${characterId}/status-effects/${e.id}`),
                  `Rimosso ${e.tag}`,
                )
              }
              className="px-2 py-1 text-[10px] text-gray-500 hover:text-red-400 disabled:opacity-40"
            >
              −{e.tag}
            </button>
          ))}
        </div>
      </section>

      {/* Costrutti */}
      <section className="rounded-lg border border-[var(--border-color)] bg-black/35 p-4">
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)] mb-3">
          Costrutti sul campo
        </h3>

        {constructs.length === 0 ? (
          <p className="text-[11px] text-gray-500 italic mb-4">Nessun costrutto attivo.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {constructs.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border-color)]/60 bg-black/25 px-3 py-2 text-[11px]"
              >
                <span>
                  <strong className="text-[var(--accent-violet-light)]">{c.label}</strong>
                  <span className="text-gray-500 ml-2">
                    T{c.wazaTier} · {c.sizeLabel} · {c.remainingResistance}/{c.maxResistance} RES
                    {c.stationary ? " · staz." : ""}
                  </span>
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          api.post(`/characters/field-constructs/${c.id}/damage`, {
                            damage: cDamage,
                          }),
                        `Danno ${cDamage} applicato`,
                      )
                    }
                    className="text-[10px] text-[var(--accent-gold)]"
                  >
                    Danno {cDamage}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => api.delete(`/characters/field-constructs/${c.id}`),
                        "Costrutto rimosso",
                      )
                    }
                    className="text-[10px] text-gray-500 hover:text-red-400"
                  >
                    Elimina
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
          <input
            value={cLabel}
            onChange={(e) => setCLabel(e.target.value)}
            placeholder="Nome"
            className="rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-xs"
          />
          <input
            type="number"
            min={1}
            max={5}
            value={cTier}
            onChange={(e) => setCTier(Number(e.target.value) || 1)}
            className="rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-xs"
            title="Tier waza"
          />
          <select
            value={cSize}
            onChange={(e) => setCSize(e.target.value as (typeof SIZES)[number])}
            className="rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-xs"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-[10px] text-gray-500 flex items-center gap-1">
            Danno test
            <input
              type="number"
              min={1}
              value={cDamage}
              onChange={(e) => setCDamage(Number(e.target.value) || 1)}
              className="w-16 rounded border border-[var(--border-color)] bg-black/40 px-1 py-0.5 text-xs"
            />
          </label>
          <button
            type="button"
            disabled={busy || !characterId}
            onClick={() =>
              run(
                () =>
                  api.post(`/characters/${characterId}/field-constructs`, {
                    label: cLabel,
                    wazaTier: cTier,
                    size: cSize,
                    stationary: true,
                  }),
                "Costrutto creato (Genkai da scheda)",
              )
            }
            className="px-3 py-1.5 text-[10px] font-display uppercase tracking-wider rounded border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] disabled:opacity-40"
          >
            Evoca costrutto
          </button>
        </div>
      </section>
    </div>
  );
}
