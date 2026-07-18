"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type BlueprintRow = {
  id: string;
  tag: string;
  classId: string;
  kind: string;
  name: string;
  description: string;
  materials: Array<{ materialId: string; quantity: number }>;
  outputCatalogKey: string | null;
  isActive: boolean;
};

export function BlueprintCatalogManagement() {
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<BlueprintRow | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await api.get("/economy-admin/blueprints")) as { blueprints?: BlueprintRow[] };
      setBlueprints(data.blueprints ?? []);
    } catch {
      setBlueprints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return blueprints;
    return blueprints.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.classId.toLowerCase().includes(q),
    );
  }, [blueprints, filter]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/economy-admin/blueprints/${encodeURIComponent(editing.id)}`, {
        name: editing.name,
        description: editing.description,
        materials: editing.materials,
        isActive: editing.isActive,
      });
      setEditing(null);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore salvataggio blueprint.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-xs text-gray-500">Caricamento blueprint…</p>;

  return (
    <div className="space-y-4 animate__animated animate__fadeIn">
      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Cerca blueprint…"
        className="w-full min-h-[44px] px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm"
      />

      <ul className="space-y-2">
        {filtered.map((bp) => (
          <li
            key={bp.id}
            className="rounded-lg border border-[var(--border-color)] p-3 bg-black/20 flex flex-col gap-2 sm:flex-row sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-display text-white">{bp.name}</p>
              <p className="text-[10px] text-gray-500 font-mono">
                {bp.id} · {bp.classId} · {bp.kind}
              </p>
              <p className="text-[11px] text-[var(--accent-violet-light)] mt-1 line-clamp-2">{bp.description}</p>
              {bp.outputCatalogKey && (
                <p className="text-[10px] text-gray-500 mt-1">Output: {bp.outputCatalogKey}</p>
              )}
              {!bp.isActive && (
                <span className="text-[10px] uppercase text-gray-600">Disattivo</span>
              )}
            </div>
            <button
              type="button"
              className="min-h-[44px] px-3 rounded border border-[var(--border-color)] text-xs shrink-0"
              onClick={() => setEditing({ ...bp, materials: bp.materials.map((m) => ({ ...m })) })}
            >
              Modifica
            </button>
          </li>
        ))}
      </ul>

      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div
            className="bg-[var(--panel-bg)] border border-[var(--accent-gold)] rounded-t-xl sm:rounded-lg p-4 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-display text-[var(--accent-gold)] mb-3">{editing.name}</h4>
            <label className="block mb-3">
              <span className="text-[10px] uppercase text-gray-500">Nome</span>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="field-input mt-1"
              />
            </label>
            <label className="block mb-3">
              <span className="text-[10px] uppercase text-gray-500">Descrizione</span>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="field-input mt-1 min-h-[90px]"
              />
            </label>
            <label className="block mb-3">
              <span className="text-[10px] uppercase text-gray-500">Materiali (materialId:qty per riga)</span>
              <textarea
                value={editing.materials.map((m) => `${m.materialId}:${m.quantity}`).join("\n")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    materials: e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [materialId, qty] = line.split(":");
                        return { materialId: materialId!.trim(), quantity: Number(qty) || 1 };
                      }),
                  })
                }
                className="field-input mt-1 min-h-[100px] font-mono text-xs"
              />
            </label>
            <label className="flex items-center gap-2 min-h-[44px] text-sm text-gray-400 mb-3">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
              />
              Attivo
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(null)} className="flex-1 min-h-[44px] rounded border border-[var(--border-color)]">
                Annulla
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="flex-1 min-h-[44px] rounded border border-[var(--accent-gold)] text-[var(--accent-gold)]"
              >
                {saving ? "…" : "Salva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
