"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { SKIRU_CATALOG } from "@domain/skiru/catalog";
import { STYLE_LABELS, type StyleId } from "@domain/progression/style-hexagon";
import { MADOSHO_CATALOG, resolveMadoshoIdFromPoolId } from "@domain/progression/madosho";
import { invalidateWazaCatalogCache } from "@/hooks/useWazaCatalog";

type AdminWazaRow = {
  skillId: string | null;
  poolId: string;
  name: string;
  description: string | null;
  effect: string | null;
  rank: string | null;
  isPassive: boolean;
  styleId: string | null;
  launchSkiruIds: string[];
  damageSkiruIds: string[];
  damageIndexKind: "CAC" | "CAD" | null;
  costExp: number;
  hasDbRow: boolean;
};

export type WazaScope = "all" | "generiche" | "do" | "madosho" | "ordine" | "premi";

const STYLE_OPTIONS = Object.entries(STYLE_LABELS) as [StyleId, string][];
const RANK_OPTIONS = ["T1", "T2", "T3", "T4", "T5"] as const;

const SKIRU_OPTIONS = SKIRU_CATALOG.filter((s) => s.kind === "standard")
  .map((s) => ({ id: s.id, name: s.name, domain: s.domain }))
  .sort((a, b) => a.name.localeCompare(b.name, "it"));
const DOMAIN_ORDER = ["chi", "ten", "jin"] as const;
const DOMAIN_LABEL: Record<(typeof DOMAIN_ORDER)[number], string> = {
  chi: "Chi",
  ten: "Ten",
  jin: "Jin",
};

function emptyDraft(): AdminWazaRow | null {
  return null;
}

function matchesScope(row: AdminWazaRow, scope: WazaScope) {
  const pool = row.poolId.toLowerCase();
  if (scope === "all") return true;
  if (scope === "generiche") return pool.startsWith("generiche-");
  if (scope === "do") return Boolean(row.styleId);
  if (scope === "ordine") return pool.startsWith("ordine-");
  if (scope === "premi") return pool.startsWith("premio-");
  if (scope === "madosho") {
    return (
      !pool.startsWith("generiche-") &&
      !pool.startsWith("ordine-") &&
      !pool.startsWith("premio-") &&
      !row.styleId
    );
  }
  return true;
}

function resolveParentLabel(row: AdminWazaRow): string {
  const pool = row.poolId.toLowerCase();
  if (row.styleId) return `Dō · ${row.styleId}`;
  if (pool.startsWith("ordine-")) return "Ordine";
  if (pool.startsWith("premio-")) return "Premio";
  if (!pool.startsWith("generiche-")) return "Madosho";
  return "Generica";
}

export function GestioneWazaPanel({
  scope = "all",
  title = "Catalogo Waza",
}: {
  scope?: WazaScope;
  title?: string;
}) {
  const [rows, setRows] = useState<AdminWazaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [styleFilter, setStyleFilter] = useState<string>("");
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminWazaRow | null>(emptyDraft());
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = (await api.get("/waza/admin")) as AdminWazaRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Errore caricamento waza");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (!matchesScope(r, scope)) return false;
      if (styleFilter && r.styleId !== styleFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.poolId.toLowerCase().includes(q) ||
        (r.effect ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query, styleFilter, scope]);

  const selectRow = useCallback((row: AdminWazaRow) => {
    setSelectedPoolId(row.poolId);
    setDraft({
      ...row,
      launchSkiruIds: [...row.launchSkiruIds],
      damageSkiruIds: [...(row.damageSkiruIds ?? [])],
    });
    setMessage(null);
  }, []);

  const groupedMadoshoRows = useMemo(() => {
    if (scope !== "madosho") return [];
    const byMadosho = new Map<string, AdminWazaRow[]>();
    for (const row of filtered) {
      const mid = resolveMadoshoIdFromPoolId(row.poolId) ?? "other";
      const list = byMadosho.get(mid) ?? [];
      list.push(row);
      byMadosho.set(mid, list);
    }
    return [
      ...MADOSHO_CATALOG.map((m) => ({
        id: m.id,
        label: m.name,
        statute: m.statute,
        rows: byMadosho.get(m.id) ?? [],
      })).filter((g) => g.rows.length > 0),
      ...(byMadosho.get("other")?.length
        ? [
            {
              id: "other",
              label: "Altre Madosho",
              statute: "Waza non ancora mappate a uno statuto Madoshō.",
              rows: byMadosho.get("other") ?? [],
            },
          ]
        : []),
    ];
  }, [filtered, scope]);

  useEffect(() => {
    if (!selectedPoolId && filtered.length > 0) {
      selectRow(filtered[0]!);
    }
  }, [filtered, selectedPoolId, selectRow]);

  const toggleLaunchSkiru = (skiruId: string) => {
    if (!draft) return;
    const set = new Set(draft.launchSkiruIds);
    if (set.has(skiruId)) set.delete(skiruId);
    else set.add(skiruId);
    setDraft({ ...draft, launchSkiruIds: [...set] });
  };

  const toggleDamageSkiru = (skiruId: string) => {
    if (!draft) return;
    const set = new Set(draft.damageSkiruIds);
    if (set.has(skiruId)) set.delete(skiruId);
    else set.add(skiruId);
    setDraft({ ...draft, damageSkiruIds: [...set] });
  };

  const save = async () => {
    if (!draft?.poolId) return;
    setSaving(true);
    setMessage(null);
    try {
      const saved = (await api.put(`/waza/admin/${encodeURIComponent(draft.poolId)}`, {
        name: draft.name,
        description: draft.description,
        effect: draft.effect,
        rank: draft.rank,
        isPassive: draft.isPassive,
        styleId: draft.styleId,
        launchSkiruIds: draft.launchSkiruIds,
        damageSkiruIds: draft.damageSkiruIds,
        damageIndexKind: draft.isPassive ? null : draft.damageIndexKind,
        costExp: draft.costExp,
      })) as AdminWazaRow;
      invalidateWazaCatalogCache();
      setRows((prev) => prev.map((r) => (r.poolId === saved.poolId ? saved : r)));
      setDraft({
        ...saved,
        launchSkiruIds: [...saved.launchSkiruIds],
        damageSkiruIds: [...(saved.damageSkiruIds ?? [])],
      });
      setMessage("Salvato — il catalogo in chat si aggiorna al prossimo caricamento.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Errore salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate__animated animate__fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-display text-[var(--accent-gold)]">{title}</h2>
          <p className="text-xs text-[var(--accent-violet-light)] mt-1 max-w-2xl">
            Modifica descrizione, effetto meccanico e Skiru su cui scala il lancio in chat.
            Le modifiche sono salvate nel database e prevalgono sul bundle wazaPool.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
        >
          <FontAwesomeIcon icon={icons.refresh} className="w-3 h-3 mr-1" />
          Aggiorna
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome o effetto…"
          className="flex-1 min-w-[200px] px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm text-[var(--foreground)]"
        />
        <select
          value={styleFilter}
          onChange={(e) => setStyleFilter(e.target.value)}
          className="px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm text-[var(--foreground)]"
        >
          <option value="">Tutti i rami</option>
          {STYLE_OPTIONS.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p className="text-xs text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-3 py-2">
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Caricamento catalogo…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 min-h-[480px]">
          <div className="rounded border border-[var(--border-color)] bg-[var(--background)]/40 overflow-hidden flex flex-col max-h-[70vh]">
            <div className="px-3 py-2 border-b border-[var(--border-color)] text-[10px] uppercase tracking-wider text-gray-500">
              {filtered.length} waza
            </div>
            <ul className="overflow-y-auto flex-1 divide-y divide-[var(--border-color)]/60">
              {scope === "madosho"
                ? groupedMadoshoRows.map((group) => (
                    <li key={group.id} className="p-0">
                      <div className="px-3 py-2 border-b border-[var(--border-color)]/50 bg-black/20">
                        <p className="font-display text-[11px] uppercase tracking-[0.12em] text-[var(--accent-gold)]">
                          {group.label}
                        </p>
                        <p className="text-[10px] text-[var(--accent-violet-light)]/80 mt-1">
                          {group.statute}
                        </p>
                      </div>
                      <ul className="divide-y divide-[var(--border-color)]/60">
                        {group.rows.map((row) => (
                          <li key={row.poolId}>
                            <button
                              type="button"
                              onClick={() => selectRow(row)}
                              className={`w-full text-left px-3 py-2.5 transition-colors ${
                                selectedPoolId === row.poolId
                                  ? "bg-[var(--accent-gold)]/10 border-l-2 border-[var(--accent-gold)]"
                                  : "hover:bg-[var(--panel-bg)] border-l-2 border-transparent"
                              }`}
                            >
                              <div className="font-display text-sm text-[var(--foreground)] leading-snug">
                                {row.name}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                                {row.rank ? `${row.rank}` : ""}
                                {row.isPassive ? " · Passiva" : ""}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))
                : filtered.map((row) => (
                    <li key={row.poolId}>
                      <button
                        type="button"
                        onClick={() => selectRow(row)}
                        className={`w-full text-left px-3 py-2.5 transition-colors ${
                          selectedPoolId === row.poolId
                            ? "bg-[var(--accent-gold)]/10 border-l-2 border-[var(--accent-gold)]"
                            : "hover:bg-[var(--panel-bg)] border-l-2 border-transparent"
                        }`}
                      >
                        <div className="font-display text-sm text-[var(--foreground)] leading-snug">
                          {row.name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {row.rank ? `${row.rank}` : ""}
                          {row.isPassive ? " · Passiva" : ""}
                        </div>
                      </button>
                    </li>
                  ))}
            </ul>
          </div>

          {draft ? (
            <div className="rounded border border-[var(--border-color)] bg-[var(--background)]/40 p-4 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-[var(--accent-gold)] text-sm">{draft.name}</h3>
              </div>

              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Nome</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Tier</span>
                  <select
                    value={draft.rank ?? ""}
                    onChange={(e) => setDraft({ ...draft, rank: e.target.value || null })}
                    disabled={draft.isPassive}
                    className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm disabled:opacity-50"
                  >
                    <option value="">—</option>
                    {RANK_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Genitore Waza</span>
                  <p className="text-[11px] text-[var(--accent-violet-light)] rounded border border-[var(--border-color)] px-3 py-2 bg-[var(--background)]/40">
                    {resolveParentLabel(draft)}
                  </p>
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Genitore Dō (se applicabile)</span>
                  <select
                    value={draft.styleId ?? ""}
                    onChange={(e) => setDraft({ ...draft, styleId: e.target.value || null })}
                    className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
                  >
                    <option value="">—</option>
                    {STYLE_OPTIONS.map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--accent-violet-light)]">
                <input
                  type="checkbox"
                  checked={draft.isPassive}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      isPassive: e.target.checked,
                      rank: e.target.checked ? null : draft.rank,
                      damageIndexKind: e.target.checked ? null : draft.damageIndexKind,
                    })
                  }
                  className="rounded border-[var(--border-color)]"
                />
                Waza passiva (Dō)
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  Descrizione narrativa
                </span>
                <textarea
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm resize-y"
                  placeholder="Fluff, scene, testo in scheda…"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  Effetto meccanico
                </span>
                <textarea
                  value={draft.effect ?? ""}
                  onChange={(e) => setDraft({ ...draft, effect: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm font-mono text-[12px] resize-y"
                  placeholder="Attiva · [Contatto] · CS 2 · tag…"
                />
                <span className="text-[10px] text-gray-500">
                  Usato per tier, CS, confronti IR e inferenza Skiru se non ne selezioni sotto.
                </span>
              </label>

              <fieldset className="space-y-2">
                <legend className="text-[10px] uppercase tracking-wider text-[var(--accent-gold)]">
                  Sezione IR
                </legend>
                <p className="text-[10px] text-gray-500">
                  Quali Skiru incidono sull&apos;Indice di Risoluzione? Selezionane una o piu.
                </p>
                <div className="max-h-56 overflow-y-auto p-2 rounded border border-[var(--border-color)]/60 space-y-2">
                  {DOMAIN_ORDER.map((domain) => {
                    const list = SKIRU_OPTIONS.filter((s) => s.domain === domain);
                    if (list.length === 0) return null;
                    return (
                      <div key={`ir-${domain}`} className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)]">
                          {DOMAIN_LABEL[domain]}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {list.map((s) => {
                            const on = draft.launchSkiruIds.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => toggleLaunchSkiru(s.id)}
                                className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                  on
                                    ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
                                    : "border-[var(--border-color)] text-gray-400 hover:border-[var(--accent-violet)]"
                                }`}
                                title={s.id}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="text-[10px] uppercase tracking-wider text-[var(--accent-gold)]">
                  Sezione Danno
                </legend>
                <p className="text-[10px] text-gray-500">
                  Quali Skiru incidono sul danno? Imposta anche l&apos;indice di riferimento (CAC/CAD).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">
                      Indice danno
                    </span>
                    <select
                      value={draft.damageIndexKind ?? ""}
                      disabled={draft.isPassive}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          damageIndexKind:
                            e.target.value === "CAC" || e.target.value === "CAD"
                              ? (e.target.value as "CAC" | "CAD")
                              : null,
                        })
                      }
                      className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm disabled:opacity-50"
                    >
                      <option value="">—</option>
                      <option value="CAC">CAC</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </label>
                </div>
                <div className="max-h-56 overflow-y-auto p-2 rounded border border-[var(--border-color)]/60 space-y-2">
                  {DOMAIN_ORDER.map((domain) => {
                    const list = SKIRU_OPTIONS.filter((s) => s.domain === domain);
                    if (list.length === 0) return null;
                    return (
                      <div key={`dmg-${domain}`} className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)]">
                          {DOMAIN_LABEL[domain]}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {list.map((s) => {
                            const on = draft.damageSkiruIds.includes(s.id);
                            return (
                              <button
                                key={`damage-${s.id}`}
                                type="button"
                                onClick={() => toggleDamageSkiru(s.id)}
                                className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                  on
                                    ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
                                    : "border-[var(--border-color)] text-gray-400 hover:border-[var(--accent-violet)]"
                                }`}
                                title={s.id}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-3">
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Costo EXP</span>
                  <input
                    type="number"
                    min={0}
                    value={draft.costExp}
                    onChange={(e) =>
                      setDraft({ ...draft, costExp: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={saving || !draft.name.trim()}
                onClick={() => void save()}
                className="w-full py-2.5 rounded font-display text-sm uppercase tracking-wider bg-[var(--button-bg)] border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:shadow-[var(--shadow-gold)] disabled:opacity-50"
              >
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center text-gray-500 text-sm border border-[var(--border-color)] rounded">
              Seleziona una waza dall&apos;elenco
            </div>
          )}
        </div>
      )}
    </div>
  );
}
