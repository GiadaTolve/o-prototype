"use client";

import { useMemo, useState } from "react";
import {
  STATUS_DEFINITIONS,
} from "@domain/combat/status/catalog";

type LocalStatus = {
  id: string;
  tag: string;
  label: string;
  kind: string;
  description: string;
  defaultStacks: number;
};

function slugifyStatusId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function GestioneStatusPanel() {
  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState<Record<string, LocalStatus>>({});
  const [customStatuses, setCustomStatuses] = useState<LocalStatus[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LocalStatus | null>(null);
  const [newStatus, setNewStatus] = useState<LocalStatus>({
    id: "",
    tag: "",
    label: "",
    kind: "atypical",
    description: "",
    defaultStacks: 1,
  });

  const baseRows = useMemo(
    () =>
      Object.values(STATUS_DEFINITIONS).map((s) => ({
        id: s.id,
        tag: s.tag,
        label: s.label,
        kind: s.kind,
        description: s.description,
        defaultStacks: s.defaultStacks,
        from: "base" as const,
      })),
    [],
  );

  const merged = useMemo(() => {
    const base = baseRows.map((s) => {
      const ov = overrides[s.id];
      if (!ov) return s;
      return {
        ...s,
        ...ov,
        from: "override" as const,
      };
    });
    return [
      ...base,
      ...customStatuses.map((s) => ({
        ...s,
        from: "custom" as const,
      })),
    ];
  }, [baseRows, customStatuses, overrides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.kind.toLowerCase().includes(q),
    );
  }, [merged, query]);

  const createCustom = () => {
    if (!newStatus.label.trim()) return;
    const baseId = slugifyStatusId(newStatus.label);
    if (!baseId) return;
    let nextId = baseId;
    let n = 2;
    while (merged.some((s) => s.id.toLowerCase() === nextId.toLowerCase())) {
      nextId = `${baseId}-${n}`;
      n += 1;
    }
    setCustomStatuses((prev) => [
      ...prev,
      {
        ...newStatus,
        id: nextId,
        tag: (newStatus.tag || newStatus.label).trim(),
        label: newStatus.label.trim(),
        description: newStatus.description.trim(),
      },
    ]);
    setNewStatus({
      id: "",
      tag: "",
      label: "",
      kind: "atypical",
      description: "",
      defaultStacks: 1,
    });
  };

  const selectStatus = (id: string) => {
    const row = merged.find((s) => s.id === id);
    if (!row) return;
    setSelectedId(id);
    setDraft({
      id: row.id,
      tag: row.tag,
      label: row.label,
      kind: row.kind,
      description: row.description,
      defaultStacks: row.defaultStacks,
    });
  };

  const saveDraft = () => {
    if (!draft) return;
    const existsInCustom = customStatuses.some((s) => s.id === draft.id);
    if (existsInCustom) {
      setCustomStatuses((prev) =>
        prev.map((s) => (s.id === draft.id ? { ...draft, id: draft.id.trim().toLowerCase() } : s)),
      );
      return;
    }
    setOverrides((prev) => ({
      ...prev,
      [draft.id]: { ...draft, id: draft.id.trim().toLowerCase() },
    }));
  };

  return (
    <div className="space-y-4 animate__animated animate__fadeIn">
      <div>
        <h2 className="text-lg font-display text-[var(--accent-gold)]">Status</h2>
        <p className="text-xs text-[var(--accent-violet-light)] mt-1">
          Workbench locale: le modifiche restano solo in questa sessione browser e non vengono
          salvate sul server (né su altri dispositivi). Gli status base restano il riferimento di sistema.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca status per nome, tipo, descrizione..."
        className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm text-[var(--foreground)]"
      />

      <div className="rounded border border-[var(--border-color)] bg-[var(--background)]/40 overflow-hidden">
        <div className="px-3 py-2 border-b border-[var(--border-color)] text-[10px] uppercase tracking-wider text-gray-500">
          {filtered.length} status
        </div>
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-[var(--border-color)]/60">
          {filtered.map((s) => (
            <button
              key={`${s.from}-${s.id}`}
              type="button"
              onClick={() => selectStatus(s.id)}
              className={`w-full text-left px-3 py-2.5 transition-colors ${
                selectedId === s.id
                  ? "bg-[var(--accent-gold)]/10 border-l-2 border-[var(--accent-gold)]"
                  : "hover:bg-[var(--panel-bg)] border-l-2 border-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm text-[var(--foreground)]">{s.label}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-color)] text-[var(--accent-violet-light)]">
                  {s.kind}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{s.description}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                Tag: {s.tag} · Stack default: {s.defaultStacks} · Fonte: {s.from}
              </p>
            </button>
          ))}
        </div>
      </div>

      {draft && (
        <div className="rounded border border-[var(--border-color)] bg-[var(--background)]/40 p-4 space-y-3">
          <h3 className="font-display text-sm text-[var(--accent-gold)]">Modifica Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Label</span>
              <input
                value={draft.label}
                onChange={(e) => setDraft((p) => (p ? { ...p, label: e.target.value } : p))}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Tag</span>
              <input
                value={draft.tag}
                onChange={(e) => setDraft((p) => (p ? { ...p, tag: e.target.value } : p))}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Tipo</span>
              <select
                value={draft.kind}
                onChange={(e) => setDraft((p) => (p ? { ...p, kind: e.target.value } : p))}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
              >
                <option value="emotional">emotional</option>
                <option value="elemental">elemental</option>
                <option value="atypical">atypical</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Stack default</span>
              <input
                type="number"
                min={1}
                value={draft.defaultStacks}
                onChange={(e) =>
                  setDraft((p) =>
                    p ? { ...p, defaultStacks: Math.max(1, Number(e.target.value) || 1) } : p,
                  )
                }
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Descrizione</span>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((p) => (p ? { ...p, description: e.target.value } : p))}
              rows={3}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm resize-y"
            />
          </label>
          <button
            type="button"
            onClick={saveDraft}
            className="w-full py-2.5 rounded font-display text-sm uppercase tracking-wider bg-[var(--button-bg)] border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:shadow-[var(--shadow-gold)]"
          >
            Salva modifica in lista di lavoro
          </button>
        </div>
      )}

      <div className="rounded border border-[var(--border-color)] bg-[var(--background)]/40 p-4 space-y-3">
        <h3 className="font-display text-sm text-[var(--accent-gold)]">Crea Nuovo Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Label</span>
            <input
              value={newStatus.label}
              onChange={(e) => setNewStatus((p) => ({ ...p, label: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
              placeholder="Nome status"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Tag (opzionale)</span>
            <input
              value={newStatus.tag}
              onChange={(e) => setNewStatus((p) => ({ ...p, tag: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Tipo</span>
            <select
              value={newStatus.kind}
              onChange={(e) => setNewStatus((p) => ({ ...p, kind: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
            >
              <option value="emotional">emotional</option>
              <option value="elemental">elemental</option>
              <option value="atypical">atypical</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Stack default</span>
            <input
              type="number"
              min={1}
              value={newStatus.defaultStacks}
              onChange={(e) =>
                setNewStatus((p) => ({ ...p, defaultStacks: Math.max(1, Number(e.target.value) || 1) }))
              }
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Descrizione</span>
          <textarea
            value={newStatus.description}
            onChange={(e) => setNewStatus((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm resize-y"
          />
        </label>
        <button
          type="button"
          onClick={createCustom}
          className="w-full py-2.5 rounded font-display text-sm uppercase tracking-wider bg-[var(--button-bg)] border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:shadow-[var(--shadow-gold)]"
        >
          Aggiungi status alla lista di lavoro
        </button>
      </div>
    </div>
  );
}
