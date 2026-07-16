"use client";

import { useState, useCallback } from "react";
import { useSviluppoTaxonomy, type TaxonomyKind } from "@/hooks/useSviluppoTaxonomy";

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

type EditableKind = "do" | "madosho" | "ordine" | "premio";
const LABELS: Record<EditableKind, string> = { do: "Dō", madosho: "Madosho", ordine: "Ordini", premio: "Premi" };
const CREATABLE: EditableKind[] = ["madosho", "ordine", "premio"];

export function GestioneTaxonomyPanel() {
  const { state, setState, updateAndSave } = useSviluppoTaxonomy();
  const [openSection, setOpenSection] = useState<EditableKind>("do");
  const [showCreate, setShowCreate] = useState<Record<string, boolean>>({});
  const [newNames, setNewNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const update = (kind: EditableKind, id: string, patch: { name?: string; sottotitolo?: string; statute?: string; descrizione_meccanica?: string }) => {
    setState((prev) => ({
      ...prev,
      [kind]: prev[kind].map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const save = useCallback(async (kind: EditableKind, id: string) => {
    const entry = state[kind].find((e) => e.id === id);
    if (!entry) return;
    const key = `${kind}:${id}`;
    setSaving((prev) => ({ ...prev, [key]: true }));
    await updateAndSave(kind, id, {
      statute: entry.statute,
      sottotitolo: entry.sottotitolo,
      descrizione_meccanica: entry.descrizione_meccanica,
    });
    setSaving((prev) => ({ ...prev, [key]: false }));
  }, [state, updateAndSave]);

  const add = (kind: EditableKind) => {
    const name = (newNames[kind] ?? "").trim();
    if (!name) return;
    const idBase = slugify(name);
    if (!idBase) return;
    let id = idBase;
    let n = 2;
    while (state[kind].some((e) => e.id === id)) { id = `${idBase}-${n}`; n += 1; }
    setState((prev) => ({ ...prev, [kind]: [...prev[kind], { id, name, statute: "", sottotitolo: "", descrizione_meccanica: "" }] }));
    setNewNames((prev) => ({ ...prev, [kind]: "" }));
    updateAndSave(kind, id, { statute: "", sottotitolo: "", descrizione_meccanica: "" });
  };

  return (
    <div className="space-y-3">
      <div className="mb-6">
        <h2 className="font-display text-xl text-[var(--accent-gold)] tracking-wide">Statuti</h2>
        <p className="font-sans text-xs text-[var(--accent-violet-light)] mt-1 leading-relaxed">
          Modifica statuti, sottotitoli e meccaniche. Il salvataggio è automatico all&apos;uscita dal campo — visibile a tutti.
        </p>
      </div>

      {(["do", "madosho", "ordine", "premio"] as const).map((kind) => (
        <section key={kind} className="rounded-lg border border-[var(--border-color)] overflow-hidden bg-black/20">
          {/* Intestazione sezione */}
          <button
            type="button"
            onClick={() => setOpenSection(kind === openSection ? kind : kind)}
            className="w-full px-5 py-3.5 flex items-center justify-between bg-black/30 hover:bg-black/40 transition-colors"
          >
            <span className="font-display text-[var(--accent-gold)] text-sm tracking-wider uppercase">{LABELS[kind]}</span>
            <span className="font-sans text-[10px] text-[var(--accent-violet-light)] tabular-nums">
              {state[kind].length} {openSection === kind ? "−" : "+"}
            </span>
          </button>

          {openSection === kind && (
            <div className="divide-y divide-[var(--border-color)]/30">
              {/* Pulsante "Nuovo" */}
              {CREATABLE.includes(kind) && (
                <div className="px-5 py-3 flex justify-end bg-black/10">
                  <button
                    type="button"
                    onClick={() => setShowCreate((prev) => ({ ...prev, [kind]: !prev[kind] }))}
                    className="px-3 py-1 rounded border border-[var(--accent-violet)]/40 font-sans text-[var(--accent-violet-light)] text-[10px] uppercase tracking-widest hover:bg-[var(--accent-violet)]/10 transition-colors"
                  >
                    {showCreate[kind] ? "Annulla" : "+ Nuovo"}
                  </button>
                </div>
              )}

              {showCreate[kind] && (
                <div className="px-5 py-4 bg-[var(--accent-violet)]/5 border-b border-[var(--accent-violet)]/20">
                  <div className="flex gap-2">
                    <input
                      value={newNames[kind] ?? ""}
                      onChange={(e) => setNewNames((prev) => ({ ...prev, [kind]: e.target.value }))}
                      placeholder={`Nome ${LABELS[kind]}`}
                      className="flex-1 px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] font-sans text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => add(kind)}
                      className="px-4 py-2 rounded border border-[var(--accent-gold)]/50 font-sans text-[var(--accent-gold)] text-xs uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 transition-colors"
                    >
                      Crea
                    </button>
                  </div>
                </div>
              )}

              {/* Voci */}
              {state[kind].map((entry) => {
                const key = `${kind}:${entry.id}`;
                const isSaving = saving[key];
                return (
                  <div key={entry.id} className="px-5 py-5 space-y-4 hover:bg-white/[0.015] transition-colors">
                    {/* Header voce */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-display text-base text-[var(--accent-gold)] leading-tight">{entry.name}</p>
                        {entry.sottotitolo ? (
                          <p className="font-accent italic text-sm text-[var(--accent-violet-light)]/70 mt-0.5 leading-snug">
                            {entry.sottotitolo}
                          </p>
                        ) : null}
                      </div>
                      {isSaving && (
                        <span className="font-sans text-[10px] text-[var(--accent-violet-light)] animate-pulse shrink-0 mt-1">
                          Salvataggio…
                        </span>
                      )}
                    </div>

                    {/* Campo Sottotitolo */}
                    <div className="space-y-1">
                      <label className="font-sans text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)]/60">
                        Sottotitolo
                      </label>
                      <input
                        value={entry.sottotitolo ?? ""}
                        onChange={(e) => update(kind, entry.id, { sottotitolo: e.target.value })}
                        onBlur={() => save(kind, entry.id)}
                        placeholder="es. La via della lanterna."
                        className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] font-accent italic text-sm text-[var(--accent-violet-light)] placeholder:not-italic placeholder:text-gray-600 focus:outline-none focus:border-[var(--accent-gold)]/40 transition-colors"
                      />
                    </div>

                    {/* Divisore decorativo */}
                    <div className="border-t border-[var(--border-color)]/30" />

                    {/* Campo Statuto */}
                    <div className="space-y-1">
                      <label className="font-sans text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)]/60">
                        Statuto
                      </label>
                      <textarea
                        value={entry.statute}
                        onChange={(e) => update(kind, entry.id, { statute: e.target.value })}
                        onBlur={() => save(kind, entry.id)}
                        rows={6}
                        placeholder="Testo dello statuto narrativo…"
                        className="w-full px-3 py-2.5 rounded border border-[var(--border-color)] bg-[var(--background)] font-sans text-sm leading-relaxed resize-y placeholder:text-gray-600 focus:outline-none focus:border-[var(--accent-gold)]/40 transition-colors"
                      />
                    </div>

                    {/* Campo Meccaniche */}
                    <div className="space-y-1">
                      <label className="font-sans text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)]/60">
                        Meccaniche <span className="normal-case text-gray-600">(opzionale)</span>
                      </label>
                      <textarea
                        value={entry.descrizione_meccanica ?? ""}
                        onChange={(e) => update(kind, entry.id, { descrizione_meccanica: e.target.value })}
                        onBlur={() => save(kind, entry.id)}
                        rows={3}
                        placeholder="Note meccaniche interne…"
                        className="w-full px-3 py-2 rounded border border-[var(--border-color)]/60 bg-[var(--background)] font-sans text-xs leading-relaxed text-gray-400 resize-y placeholder:text-gray-600 focus:outline-none focus:border-[var(--accent-violet)]/40 transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
