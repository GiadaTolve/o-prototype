"use client";

import { useState } from "react";
import { useSviluppoTaxonomy, type TaxonomyKind } from "@/hooks/useSviluppoTaxonomy";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type LegacyKind = "madosho" | "ordine" | "premio";

const LABELS: Record<LegacyKind, string> = {
  madosho: "Madosho",
  ordine: "Ordini",
  premio: "Premi",
};

export function GestioneTaxonomyPanel() {
  const { state, setState } = useSviluppoTaxonomy();
  const [openSection, setOpenSection] = useState<LegacyKind>("madosho");
  const [showCreate, setShowCreate] = useState<Record<LegacyKind, boolean>>({
    madosho: false,
    ordine: false,
    premio: false,
  });
  const [newNames, setNewNames] = useState<Record<LegacyKind, string>>({
    madosho: "",
    ordine: "",
    premio: "",
  });

  const update = (kind: LegacyKind, id: string, patch: { name?: string; statute?: string }) => {
    setState((prev) => ({
      ...prev,
      [kind]: prev[kind].map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const add = (kind: LegacyKind) => {
    const name = newNames[kind].trim();
    if (!name) return;
    const idBase = slugify(name);
    if (!idBase) return;
    let id = idBase;
    let n = 2;
    while (state[kind].some((e) => e.id === id)) {
      id = `${idBase}-${n}`;
      n += 1;
    }
    setState((prev) => ({
      ...prev,
      [kind]: [...prev[kind], { id, name, statute: "" }],
    }));
    setNewNames((prev) => ({ ...prev, [kind]: "" }));
  };

  return (
    <div className="space-y-4 animate__animated animate__fadeIn">
      <h2 className="text-lg font-display text-[var(--accent-gold)]">Statuti</h2>
      <p className="text-xs text-[var(--accent-violet-light)]">
        Gestisci statuti e voci di Madosho, Ordini e Premi nel pannello Sviluppo.
      </p>

      {(["madosho", "ordine", "premio"] as const).map((kind) => (
        <section key={kind} className="rounded border border-[var(--border-color)] bg-[var(--background)]/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenSection((prev) => (prev === kind ? prev : kind))}
            className="w-full px-4 py-3 flex items-center justify-between border-b border-[var(--border-color)]/60 bg-black/20 hover:bg-black/30 transition-colors"
          >
            <span className="font-display text-[var(--accent-gold)] text-sm">{LABELS[kind]}</span>
            <span className="text-[10px] text-[var(--accent-violet-light)]">
              {state[kind].length} statuti {openSection === kind ? "−" : "+"}
            </span>
          </button>

          {openSection === kind && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreate((prev) => ({ ...prev, [kind]: !prev[kind] }))
                  }
                  className="px-3 py-1.5 rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] text-[10px] uppercase tracking-wider hover:bg-[var(--accent-violet)]/10"
                >
                  Nuovo
                </button>
              </div>

              {showCreate[kind] && (
                <div className="rounded border border-[var(--accent-violet)]/30 p-3 bg-[var(--accent-violet)]/5">
                  <div className="flex gap-2">
                    <input
                      value={newNames[kind]}
                      onChange={(e) => setNewNames((prev) => ({ ...prev, [kind]: e.target.value }))}
                      placeholder={`Nuovo ${LABELS[kind].slice(0, -1)}`}
                      className="flex-1 px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => add(kind)}
                      className="px-3 py-2 rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] text-xs uppercase tracking-wider"
                    >
                      Crea
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                {state[kind].map((entry) => (
                  <div key={entry.id} className="rounded border border-[var(--border-color)]/60 p-3 space-y-2">
                    <input
                      value={entry.name}
                      onChange={(e) => update(kind, entry.id, { name: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
                    />
                    <textarea
                      value={entry.statute}
                      onChange={(e) => update(kind, entry.id, { statute: e.target.value })}
                      rows={4}
                      placeholder="Statuto..."
                      className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

