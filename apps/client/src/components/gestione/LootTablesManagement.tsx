"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type DropTableRow = {
  id: string;
  label: string;
  entries: Array<{ pool: string; weight: number }>;
};

type DropPoolRow = {
  id: string;
  junkCatalogKeys: string[];
};

const EMPTY_TABLE: DropTableRow = {
  id: "",
  label: "",
  entries: [{ pool: "metallo", weight: 10 }],
};

const EMPTY_POOL: DropPoolRow = {
  id: "",
  junkCatalogKeys: [],
};

export function LootTablesManagement() {
  const [tables, setTables] = useState<DropTableRow[]>([]);
  const [pools, setPools] = useState<DropPoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<DropTableRow | null>(null);
  const [editingPool, setEditingPool] = useState<DropPoolRow | null>(null);
  const [isNewTable, setIsNewTable] = useState(false);
  const [isNewPool, setIsNewPool] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await api.get("/economy-admin/drop-tables")) as {
        tables?: DropTableRow[];
        pools?: DropPoolRow[];
      };
      setTables(data.tables ?? []);
      setPools(data.pools ?? []);
    } catch {
      setTables([]);
      setPools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveTable = async (table: DropTableRow) => {
    const id = table.id.trim().toLowerCase();
    if (!id) {
      alert("ID tabella obbligatorio (es. rovine_urbane).");
      return;
    }
    setSaving(id);
    try {
      await api.put(`/economy-admin/drop-tables/${encodeURIComponent(id)}`, {
        label: table.label,
        entries: table.entries,
      });
      setEditingTable(null);
      setIsNewTable(false);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore salvataggio tabella.");
    } finally {
      setSaving(null);
    }
  };

  const savePool = async (pool: DropPoolRow) => {
    const id = pool.id.trim().toLowerCase();
    if (!id) {
      alert("ID pool obbligatorio (es. metallo).");
      return;
    }
    setSaving(id);
    try {
      await api.put(`/economy-admin/drop-pools/${encodeURIComponent(id)}`, {
        junkCatalogKeys: pool.junkCatalogKeys,
      });
      setEditingPool(null);
      setIsNewPool(false);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore salvataggio pool.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-xs text-gray-500">Caricamento liste loot…</p>;

  return (
    <div className="space-y-6 animate__animated animate__fadeIn">
      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <h3 className="text-sm font-display text-[var(--accent-gold)]">Tabelle drop</h3>
          <button
            type="button"
            className="min-h-[44px] px-3 rounded border border-[var(--accent-violet)]/50 text-xs text-[var(--accent-violet-light)]"
            onClick={() => {
              setIsNewTable(true);
              setEditingTable({ ...EMPTY_TABLE, entries: [{ pool: "metallo", weight: 10 }] });
            }}
          >
            + Nuova tabella
          </button>
        </div>
        <ul className="space-y-3">
          {tables.map((t) => (
            <li key={t.id} className="rounded-lg border border-[var(--border-color)] p-3 bg-black/20">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-sm text-white">{t.label}</p>
                  <p className="text-[10px] text-gray-500 font-mono">{t.id}</p>
                </div>
                <button
                  type="button"
                  className="min-h-[44px] px-3 rounded border border-[var(--border-color)] text-xs text-[var(--accent-violet-light)]"
                  onClick={() => {
                    setIsNewTable(false);
                    setEditingTable({ ...t, entries: t.entries.map((e) => ({ ...e })) });
                  }}
                >
                  Modifica
                </button>
              </div>
              <ul className="mt-2 text-[11px] text-gray-400 space-y-0.5">
                {t.entries.map((e, i) => (
                  <li key={`${e.pool}-${i}`}>
                    Pool <span className="text-[var(--accent-violet-light)]">{e.pool}</span> · peso {e.weight}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <h3 className="text-sm font-display text-[var(--accent-gold)]">Pool → catalog key</h3>
          <button
            type="button"
            className="min-h-[44px] px-3 rounded border border-[var(--accent-violet)]/50 text-xs text-[var(--accent-violet-light)]"
            onClick={() => {
              setIsNewPool(true);
              setEditingPool({ ...EMPTY_POOL });
            }}
          >
            + Nuovo pool
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mb-2">
          Ogni pool elenca i catalog key estratti a caso quando una tabella punta a quel pool.
        </p>
        <ul className="space-y-3">
          {pools.map((p) => (
            <li key={p.id} className="rounded-lg border border-[var(--border-color)] p-3 bg-black/20">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-display text-sm text-[var(--accent-violet-light)]">{p.id}</p>
                <button
                  type="button"
                  className="min-h-[44px] px-3 rounded border border-[var(--border-color)] text-xs"
                  onClick={() => {
                    setIsNewPool(false);
                    setEditingPool({
                      ...p,
                      junkCatalogKeys: [...p.junkCatalogKeys],
                    });
                  }}
                >
                  Modifica chiavi
                </button>
              </div>
              <p className="mt-1 text-[10px] text-gray-500 break-all">{p.junkCatalogKeys.join(", ") || "—"}</p>
            </li>
          ))}
        </ul>
      </section>

      {editingTable && (
        <EditorSheet
          title={isNewTable ? "Nuova tabella drop" : `Tabella · ${editingTable.label}`}
          onClose={() => {
            setEditingTable(null);
            setIsNewTable(false);
          }}
        >
          {isNewTable && (
            <label className="block mb-3">
              <span className="text-[10px] uppercase text-gray-500">ID (slug, es. rovine_custom)</span>
              <input
                type="text"
                value={editingTable.id}
                onChange={(e) =>
                  setEditingTable({
                    ...editingTable,
                    id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                  })
                }
                className="field-input mt-1 font-mono"
                placeholder="rovine_custom"
              />
            </label>
          )}
          <label className="block mb-3">
            <span className="text-[10px] uppercase text-gray-500">Etichetta</span>
            <input
              type="text"
              value={editingTable.label}
              onChange={(e) => setEditingTable({ ...editingTable, label: e.target.value })}
              className="field-input mt-1"
            />
          </label>
          <p className="text-[10px] uppercase text-gray-500 mb-2">Voci (pool · peso)</p>
          {editingTable.entries.map((entry, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                value={entry.pool}
                onChange={(e) => {
                  const entries = [...editingTable.entries];
                  entries[idx] = { ...entry, pool: e.target.value };
                  setEditingTable({ ...editingTable, entries });
                }}
                className="field-input flex-1"
                placeholder="pool"
                list="drop-pool-ids"
              />
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={entry.weight}
                onChange={(e) => {
                  const entries = [...editingTable.entries];
                  entries[idx] = { ...entry, weight: Number(e.target.value) || 1 };
                  setEditingTable({ ...editingTable, entries });
                }}
                className="field-input w-20"
              />
              <button
                type="button"
                className="min-w-[44px] min-h-[44px] text-xs text-gray-500"
                onClick={() =>
                  setEditingTable({
                    ...editingTable,
                    entries: editingTable.entries.filter((_, i) => i !== idx),
                  })
                }
                aria-label="Rimuovi voce"
              >
                ×
              </button>
            </div>
          ))}
          <datalist id="drop-pool-ids">
            {pools.map((p) => (
              <option key={p.id} value={p.id} />
            ))}
          </datalist>
          <button
            type="button"
            className="text-xs text-[var(--accent-violet-light)] mb-3 min-h-[44px]"
            onClick={() =>
              setEditingTable({
                ...editingTable,
                entries: [...editingTable.entries, { pool: pools[0]?.id ?? "metallo", weight: 10 }],
              })
            }
          >
            + Voce
          </button>
          <button
            type="button"
            disabled={saving === editingTable.id.trim().toLowerCase()}
            className="w-full min-h-[44px] rounded border border-[var(--accent-gold)] text-[var(--accent-gold)]"
            onClick={() => saveTable(editingTable)}
          >
            {saving ? "…" : isNewTable ? "Crea tabella" : "Salva tabella"}
          </button>
        </EditorSheet>
      )}

      {editingPool && (
        <EditorSheet
          title={isNewPool ? "Nuovo pool" : `Pool · ${editingPool.id}`}
          onClose={() => {
            setEditingPool(null);
            setIsNewPool(false);
          }}
        >
          {isNewPool && (
            <label className="block mb-3">
              <span className="text-[10px] uppercase text-gray-500">ID pool (es. prep_medico)</span>
              <input
                type="text"
                value={editingPool.id}
                onChange={(e) =>
                  setEditingPool({
                    ...editingPool,
                    id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                  })
                }
                className="field-input mt-1 font-mono"
              />
            </label>
          )}
          <label className="block">
            <span className="text-[10px] uppercase text-gray-500">Catalog key (una per riga)</span>
            <textarea
              value={editingPool.junkCatalogKeys.join("\n")}
              onChange={(e) =>
                setEditingPool({
                  ...editingPool,
                  junkCatalogKeys: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="field-input mt-1 min-h-[160px] font-mono text-xs"
              placeholder="junk-abiti&#10;prep-medico-analgesico-lieve"
            />
          </label>
          <button
            type="button"
            disabled={saving === editingPool.id.trim().toLowerCase()}
            className="w-full min-h-[44px] mt-3 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)]"
            onClick={() => savePool(editingPool)}
          >
            {saving ? "…" : isNewPool ? "Crea pool" : "Salva pool"}
          </button>
        </EditorSheet>
      )}
    </div>
  );
}

function EditorSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--accent-gold)] rounded-t-xl sm:rounded-lg p-4 w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="font-display text-[var(--accent-gold)] mb-3">{title}</h4>
        {children}
      </div>
    </div>
  );
}
