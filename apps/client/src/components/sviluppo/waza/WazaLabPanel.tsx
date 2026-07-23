"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildFullWazaLaunchLine } from "@domain/combat/waza-launch";
import { invalidateWazaCatalogCache, useWazaCatalog } from "@/hooks/useWazaCatalog";
import { wazaApi } from "@/components/sviluppo/waza/editor/waza-api";
import { PannelloSandbox } from "@/components/sviluppo/waza/editor/PannelloSandbox";
import { PannelloRenderMeccanico } from "@/components/sviluppo/waza/editor/PannelloRenderMeccanico";
import {
  buildWazaLabTree,
  type WazaLabItem,
  type WazaLabTreeNode,
} from "@/lib/waza-lab-grouping";
import {
  buildWazaLabBulletin,
  formatBulletinLine,
  type WazaLabBulletinCounts,
} from "@/lib/waza-lab-bulletin";
import { resolveDefaultWazaCostCs, resolveDefaultWazaCostExp } from "@domain/progression/waza-cost-exp";
import {
  resolveWazaLabPoolId,
  WAZA_LAB_FAMILY_LABELS,
  WAZA_LAB_MADOSHO_OPTIONS,
  WAZA_LAB_ORDINE_OPTIONS,
  WAZA_LAB_STYLE_OPTIONS,
  type WazaLabFamily,
} from "@/lib/waza-lab-pool-id";

type WazaLabDraft = WazaLabItem;
type MobileTab = "albero" | "editor" | "bollettino" | "struttura";
type WazaLabTaxonomyItem = {
  id: string;
  categoria: "genitore_do" | "genitore_madosho" | "lab_categoria_macro" | "lab_categoria_micro";
  valore: string;
  attivo: boolean;
};

function BulletinCountChips({ counts }: { counts: WazaLabBulletinCounts }) {
  const chips: Array<{ label: string; value: number; accent?: boolean }> = [
    { label: "Tot", value: counts.total, accent: true },
    { label: "Pass", value: counts.passive },
    { label: "T1", value: counts.t1 },
    { label: "T2", value: counts.t2 },
    { label: "T3", value: counts.t3 },
    { label: "T4", value: counts.t4 },
    { label: "T5", value: counts.t5 },
  ];
  if (counts.other > 0) chips.push({ label: "?", value: counts.other });

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span
          key={c.label}
          className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] tabular-nums min-h-[32px] ${
            c.accent
              ? "border-[var(--accent-gold)]/40 text-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
              : "border-[var(--border-color)] text-gray-300 bg-black/20"
          }`}
        >
          <span className="uppercase tracking-wider text-gray-500">{c.label}</span>
          <span className="font-display text-sm">{c.value}</span>
        </span>
      ))}
    </div>
  );
}

function TreeBranch({
  node,
  depth,
  openIds,
  onToggle,
  selectedPoolId,
  onSelect,
}: {
  node: WazaLabTreeNode;
  depth: number;
  openIds: Set<string>;
  onToggle: (id: string) => void;
  selectedPoolId: string | null;
  onSelect: (item: WazaLabItem) => void;
}) {
  const isOpen = openIds.has(node.id);
  const hasChildren = Boolean(node.children?.length);
  const hasItems = Boolean(node.items?.length);

  if (hasItems && !hasChildren) {
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs text-[var(--accent-violet-light)] hover:text-[var(--accent-gold)]"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="w-3 text-[10px] text-gray-500">{isOpen ? "▾" : "▸"}</span>
          <span className="font-display">{node.label}</span>
          <span className="ml-auto text-[10px] text-gray-500 tabular-nums">{node.count ?? 0}</span>
        </button>
        {isOpen &&
          node.items!.map((item) => (
            <button
              key={item.poolId}
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full text-left px-2 py-2 text-xs border-l-2 transition-colors ${
                selectedPoolId === item.poolId
                  ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                  : "border-transparent text-gray-300 hover:bg-white/5"
              }`}
              style={{ paddingLeft: `${depth * 12 + 28}px` }}
            >
              <span className="block truncate">{item.name}</span>
              <span className="block text-[10px] text-gray-500 mt-0.5">
                {item.isPassive ? "Passiva" : item.isNarrativa ? `Narr. ${item.rank ?? ""}` : item.rank ?? "Attiva"}
                {item.cs != null ? ` · CS ${item.cs}` : ""}
                {item.costExp > 0 ? ` · ${item.costExp} EXP` : ""}
              </span>
            </button>
          ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(node.id)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-white/5"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="w-3 text-[10px] text-gray-500">{isOpen ? "▾" : "▸"}</span>
        <span
          className={`text-xs font-display ${
            depth === 0 ? "text-[var(--accent-gold)]" : "text-[var(--accent-violet-light)]"
          }`}
        >
          {node.label}
        </span>
        <span className="ml-auto text-[10px] text-gray-500 tabular-nums">{node.count ?? 0}</span>
      </button>
      {isOpen &&
        node.children?.map((child) => (
          <TreeBranch
            key={child.id}
            node={child}
            depth={depth + 1}
            openIds={openIds}
            onToggle={onToggle}
            selectedPoolId={selectedPoolId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function CostBadge({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded border px-3 py-2 text-center min-w-[72px] ${
        accent
          ? "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10"
          : "border-[var(--border-color)] bg-black/20"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div
        className={`text-lg font-display tabular-nums ${
          accent ? "text-[var(--accent-gold)]" : "text-[var(--accent-violet-light)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function WazaLabPanel() {
  const { index: wazaTagIndex, refresh: refreshCatalog } = useWazaCatalog();
  const [items, setItems] = useState<WazaLabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(["do", "madosho", "ordine"]));
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WazaLabDraft | null>(null);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("albero");
  const [taxonomy, setTaxonomy] = useState<WazaLabTaxonomyItem[]>([]);
  const [newTaxCategory, setNewTaxCategory] = useState<WazaLabTaxonomyItem["categoria"]>("genitore_do");
  const [newTaxValue, setNewTaxValue] = useState("");
  const [newWaza, setNewWaza] = useState({
    name: "",
    family: "do" as WazaLabFamily,
    styleId: "toka",
    madoshoId: "gokaon",
    ordineSubgroup: "",
    rank: "T1",
    isPassive: false,
    description: "",
    effect: "",
    cs: String(resolveDefaultWazaCostCs({ rank: "T1" })),
    costExp: resolveDefaultWazaCostExp({ rank: "T1" }),
  });

  const previewPoolId = useMemo(
    () =>
      resolveWazaLabPoolId({
        name: newWaza.name,
        family: newWaza.family,
        styleId: newWaza.family === "do" ? newWaza.styleId : null,
        madoshoId: newWaza.family === "madosho" ? newWaza.madoshoId : null,
        ordineSubgroup: newWaza.family === "ordine" ? newWaza.ordineSubgroup : null,
      }),
    [newWaza],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await wazaApi.get<{ items: WazaLabItem[] }>("/admin/waza/lab");
      const list = Array.isArray(res.items) ? res.items : [];
      setItems(list);
      await refreshCatalog();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Errore caricamento lab");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [refreshCatalog]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadTaxonomy = useCallback(async () => {
    try {
      const res = await wazaApi.get<{ items: WazaLabTaxonomyItem[] }>("/admin/waza/lab/taxonomy");
      setTaxonomy(Array.isArray(res.items) ? res.items : []);
    } catch {
      setTaxonomy([]);
    }
  }, []);

  useEffect(() => {
    void loadTaxonomy();
  }, [loadTaxonomy]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.poolId.toLowerCase().includes(q) ||
        (w.effect ?? "").toLowerCase().includes(q) ||
        (w.genitore ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const tree = useMemo(() => buildWazaLabTree(filteredItems), [filteredItems]);

  const bulletin = useMemo(() => {
    const extraParents = taxonomy
      .filter((t) => t.attivo !== false)
      .flatMap((t) => {
        if (t.categoria === "genitore_do") {
          return [{ family: "do" as const, label: t.valore }];
        }
        if (t.categoria === "genitore_madosho") {
          return [{ family: "madosho" as const, label: t.valore }];
        }
        if (t.categoria === "lab_categoria_macro" || t.categoria === "lab_categoria_micro") {
          return [{ family: "generiche" as const, label: t.valore }];
        }
        return [];
      });
    // Bollettino su catalogo intero (non filtrato dalla ricerca)
    return buildWazaLabBulletin(items, extraParents);
  }, [items, taxonomy]);

  const bulletinText = useMemo(() => {
    const lines: string[] = [
      `Bollettino Waza Lab · totale ${formatBulletinLine(bulletin.totals)}`,
      "",
    ];
    for (const fam of bulletin.families) {
      lines.push(`${fam.label} — ${formatBulletinLine(fam.counts)}`);
      for (const p of fam.parents) {
        lines.push(`  · ${p.label}: ${formatBulletinLine(p.counts)}`);
      }
      lines.push("");
    }
    return lines.join("\n").trim();
  }, [bulletin]);

  const copyBulletin = async () => {
    try {
      await navigator.clipboard.writeText(bulletinText);
      setMessage("Bollettino copiato negli appunti.");
    } catch {
      setMessage("Impossibile copiare il bollettino.");
    }
  };

  const selectItem = useCallback((item: WazaLabItem) => {
    setSelectedPoolId(item.poolId);
    const defaultCs = resolveDefaultWazaCostCs({
      isPassive: item.isPassive,
      isNarrativa: item.isNarrativa ?? false,
      rank: item.rank,
    });
    setDraft({
      ...item,
      launchSkiruIds: [...item.launchSkiruIds],
      damageSkiruIds: [...item.damageSkiruIds],
      cs: item.cs ?? defaultCs,
    });
    setMessage(null);
    setSandboxOpen(false);
    setMobileTab("editor");
  }, []);

  const toggleNode = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const chatLine = useMemo(() => {
    if (!draft) return "";
    try {
      return buildFullWazaLaunchLine(draft.chatName, wazaTagIndex, {
        csOverride: draft.cs,
        declareHit: !draft.isPassive && !draft.isNarrativa && Boolean(draft.rank),
        poolId: draft.poolId,
      });
    } catch {
      return `[waza:${draft.chatName}]`;
    }
  }, [draft, wazaTagIndex]);

  const save = async () => {
    if (!draft?.poolId) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await wazaApi.patch<{ item: WazaLabItem }>(
        `/admin/waza/lab/${encodeURIComponent(draft.poolId)}`,
        {
          name: draft.name,
          description: draft.description,
          effect: draft.effect,
          rank: draft.rank,
          isPassive: draft.isPassive,
          isNarrativa: draft.isNarrativa,
          styleId: draft.styleId,
          madoshoId: draft.madoshoId,
          costExp: draft.costExp,
          cs: draft.cs ?? undefined,
        },
      );
      const saved = res.item;
      setItems((prev) => prev.map((w) => (w.poolId === saved.poolId ? saved : w)));
      setDraft({
        ...saved,
        launchSkiruIds: [...saved.launchSkiruIds],
        damageSkiruIds: [...saved.damageSkiruIds],
      });
      invalidateWazaCatalogCache();
      await refreshCatalog();
      setMessage("Salvato su Neon — il catalogo chat si aggiorna al prossimo reload.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Errore salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const addTaxonomy = async () => {
    if (!newTaxValue.trim()) return;
    try {
      await wazaApi.post("/admin/waza/lab/taxonomy", {
        categoria: newTaxCategory,
        valore: newTaxValue.trim(),
      });
      setNewTaxValue("");
      await loadTaxonomy();
      setMessage("Struttura aggiornata.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Errore salvataggio struttura");
    }
  };

  const createWaza = async () => {
    if (!newWaza.name.trim()) return;
    try {
      const res = await wazaApi.post<{ item: WazaLabItem }>("/admin/waza/lab/create", {
        name: newWaza.name.trim(),
        family: newWaza.family,
        styleId: newWaza.family === "do" ? newWaza.styleId : null,
        madoshoId: newWaza.family === "madosho" ? newWaza.madoshoId : null,
        ordineSubgroup: newWaza.family === "ordine" ? newWaza.ordineSubgroup || null : null,
        rank: newWaza.isPassive ? null : newWaza.rank,
        isPassive: newWaza.isPassive,
        description: newWaza.description || null,
        effect: newWaza.effect || null,
        cs: newWaza.cs === "" ? null : Math.max(0, Number(newWaza.cs) || 0),
        costExp: Math.max(0, Number(newWaza.costExp) || 0),
      });
      setNewWaza({
        name: "",
        family: "do",
        styleId: "toka",
        madoshoId: "gokaon",
        ordineSubgroup: "",
        rank: "T1",
        isPassive: false,
        description: "",
        effect: "",
        cs: String(resolveDefaultWazaCostCs({ rank: "T1" })),
        costExp: resolveDefaultWazaCostExp({ rank: "T1" }),
      });
      await load();
      if (res.item) selectItem(res.item);
      setMessage(`Nuova waza creata: ${res.item.poolId}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Errore creazione waza");
    }
  };

  return (
    <div className="space-y-4 animate__animated animate__fadeIn motion-reduce:animate-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-display text-[var(--accent-gold)]">Waza Lab</h2>
          <p className="text-xs text-[var(--accent-violet-light)] mt-1 max-w-2xl">
            Tutte le waza da Neon, raggruppate per genitore. Modifica rapida EXP/CS e testo
            meccanico; anteprima riga chat, sandbox e struttura macro/micro.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)] min-h-[44px]"
          >
            Ricarica da Neon
          </button>
          <Link
            href="/sviluppo/waza"
            className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-violet-light)] min-h-[44px] inline-flex items-center"
          >
            Catalogo authoring
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca nome, poolId, effetto…"
          className="flex-1 min-w-[200px] rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm text-gray-200 min-h-[44px]"
        />
        <span className="text-xs text-gray-500 tabular-nums">
          {filteredItems.length} / {items.length} waza
        </span>
      </div>

      <div className="xl:hidden sticky top-0 z-10 bg-[var(--panel-bg)]/95 backdrop-blur-sm rounded border border-[var(--border-color)] p-1 flex gap-1">
        {[
          { id: "albero" as const, label: "Albero" },
          { id: "editor" as const, label: "Editor" },
          { id: "bollettino" as const, label: "Bollett." },
          { id: "struttura" as const, label: "Strutt." },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 min-h-[44px] text-xs rounded ${
              mobileTab === tab.id
                ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border border-[var(--accent-gold)]/40"
                : "text-gray-400 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <p
          className={`text-xs px-3 py-2 rounded border ${
            message.includes("Errore") || message.includes("errore")
              ? "border-red-500/40 text-red-300 bg-red-950/20"
              : "border-[var(--accent-gold)]/30 text-[var(--accent-gold)] bg-[var(--accent-gold)]/5"
          }`}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Caricamento waza da Neon…</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,320px)_1fr] gap-4 items-start">
          <aside className={`rounded border border-[var(--border-color)] bg-[var(--panel-bg)]/50 overflow-hidden max-h-[70vh] overflow-y-auto ${mobileTab !== "albero" ? "hidden xl:block" : ""}`}>
            <div className="px-3 py-2 border-b border-[var(--border-color)] text-[10px] uppercase tracking-wider text-gray-500">
              Albero per genitore
            </div>
            <div className="py-1">
              {tree.map((node) => (
                <TreeBranch
                  key={node.id}
                  node={node}
                  depth={0}
                  openIds={openIds}
                  onToggle={toggleNode}
                  selectedPoolId={selectedPoolId}
                  onSelect={selectItem}
                />
              ))}
            </div>
          </aside>

          <section className={`space-y-4 min-w-0 ${mobileTab !== "editor" ? "hidden xl:block" : ""}`}>
            {!draft ? (
              <p className="text-sm text-gray-500 p-6 rounded border border-dashed border-[var(--border-color)]">
                Seleziona una waza dall&apos;albero a sinistra.
              </p>
            ) : (
              <>
                <div className="rounded border border-[var(--border-color)] bg-[var(--panel-bg)]/40 p-4 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-display text-[var(--accent-gold)] truncate">
                        {draft.name}
                      </h3>
                      <p className="text-[10px] font-mono text-gray-500 mt-0.5 break-all">{draft.poolId}</p>
                      {draft.genitore && (
                        <p className="text-[10px] text-[var(--accent-violet-light)] mt-1">
                          Genitore: {draft.genitore}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {draft.wazaId && (
                        <Link
                          href={`/sviluppo/waza/${draft.wazaId}`}
                          className="text-[10px] px-2 py-1 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)] hover:text-[var(--accent-gold)]"
                        >
                          Editor completo →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <CostBadge label="EXP" value={String(draft.costExp)} accent />
                    <CostBadge label="CS" value={draft.cs != null ? String(draft.cs) : "—"} accent />
                    <CostBadge
                      label="Tier"
                      value={draft.isPassive ? "Passiva" : draft.isNarrativa ? "Narrativa" : draft.rank ?? "—"}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">Tipo</span>
                      <select
                        value={draft.isPassive ? "passiva" : draft.isNarrativa ? "narrativa" : "attiva"}
                        onChange={(e) => {
                          const v = e.target.value;
                          const isPassive = v === "passiva";
                          const isNarrativa = v === "narrativa";
                          const rank = isPassive ? null : draft.rank ?? "T1";
                          setDraft({
                            ...draft,
                            isPassive,
                            isNarrativa,
                            rank,
                            costExp: resolveDefaultWazaCostExp({ isPassive, rank }),
                            cs: resolveDefaultWazaCostCs({ isPassive, rank }),
                          });
                        }}
                        className="w-full rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
                      >
                        <option value="attiva">Attiva</option>
                        <option value="narrativa">Attiva narrativa</option>
                        <option value="passiva">Passiva</option>
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">Tier</span>
                      <select
                        value={draft.isPassive ? "" : draft.rank ?? "T1"}
                        disabled={draft.isPassive}
                        onChange={(e) => {
                          const rank = e.target.value || "T1";
                          setDraft({
                            ...draft,
                            rank,
                            costExp: resolveDefaultWazaCostExp({
                              isPassive: false,
                              rank,
                            }),
                            cs: resolveDefaultWazaCostCs({
                              isPassive: false,
                              rank,
                            }),
                          });
                        }}
                        className="w-full rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px] disabled:opacity-50"
                      >
                        {draft.isPassive ? (
                          <option value="">— (passiva)</option>
                        ) : (
                          <>
                            <option value="T1">T1</option>
                            <option value="T2">T2</option>
                            <option value="T3">T3</option>
                            <option value="T4">T4</option>
                            <option value="T5">T5</option>
                          </>
                        )}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">EXP</span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={draft.costExp}
                          onChange={(e) =>
                            setDraft({ ...draft, costExp: Math.max(0, Number(e.target.value) || 0) })
                          }
                          className="flex-1 rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              costExp: resolveDefaultWazaCostExp({
                                isPassive: draft.isPassive,
                                rank: draft.rank,
                              }),
                            })
                          }
                          className="px-2 rounded border border-[var(--border-color)] text-[10px] text-gray-400 hover:text-[var(--accent-gold)] min-h-[44px]"
                        >
                          Std
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        Default:{" "}
                        {resolveDefaultWazaCostExp({
                          isPassive: draft.isPassive,
                          rank: draft.rank,
                        })}{" "}
                        EXP
                      </span>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">CS</span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={draft.cs ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              cs: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className="flex-1 rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
                          disabled={!draft.hasAuthoring}
                          title={
                            draft.hasAuthoring
                              ? "Costo CS (override; default da tier)"
                              : "CS modificabile dopo authoring"
                          }
                        />
                        <button
                          type="button"
                          disabled={!draft.hasAuthoring}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              cs: resolveDefaultWazaCostCs({
                                isPassive: draft.isPassive,
                                rank: draft.rank,
                              }),
                            })
                          }
                          className="px-2 rounded border border-[var(--border-color)] text-[10px] text-gray-400 hover:text-[var(--accent-gold)] min-h-[44px] disabled:opacity-40"
                        >
                          Std
                        </button>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        Default:{" "}
                        {resolveDefaultWazaCostCs({
                          isPassive: draft.isPassive,
                          rank: draft.rank,
                        })}{" "}
                        CS
                      </span>
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">Nome</span>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">
                      Descrizione narrativa (senza tag auto)
                    </span>
                    <textarea
                      value={draft.description ?? ""}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
                      rows={3}
                      className="w-full rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm"
                    />
                    <span className="text-[10px] text-gray-500">
                      I tag "Passiva/Attiva · CS…" e "[Categoria]" vengono gestiti automaticamente dal sistema.
                    </span>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">
                      Effetto meccanico (chat / catalogo tag)
                    </span>
                    <textarea
                      value={draft.effect ?? ""}
                      onChange={(e) => setDraft({ ...draft, effect: e.target.value || null })}
                      rows={5}
                      className="w-full rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm font-mono text-[var(--accent-violet-light)]/90"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2 sticky bottom-0 py-2 bg-[var(--panel-bg)]/90 backdrop-blur-sm -mx-1 px-1">
                    <button
                      type="button"
                      onClick={() => void save()}
                      disabled={saving}
                      className="px-4 py-2 rounded bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/50 text-sm text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/30 disabled:opacity-50 min-h-[44px]"
                    >
                      {saving ? "Salvataggio…" : "Salva su Neon"}
                    </button>
                    {!draft.hasDbRow && (
                      <span className="text-[10px] text-amber-400/90 self-center">
                        Nessuna riga skills — salva crea/aggiorna solo se poolId esiste in DB.
                      </span>
                    )}
                    {draft.hasAuthoring && draft.versioneStato && (
                      <span className="text-[10px] text-gray-500 self-center">
                        v{draft.versioneNumero} · {draft.versioneStato}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded border border-[var(--accent-gold)]/30 bg-black/30 p-4 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-sm font-display text-[var(--accent-gold)]">
                      Anteprima riga chat
                    </h4>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500">
                      come in LancioWazaPanel
                    </span>
                  </div>
                  <pre className="text-xs text-[var(--accent-violet-light)] whitespace-pre-wrap break-all font-mono leading-relaxed p-3 rounded bg-black/40 border border-[var(--border-color)]">
                    {chatLine || "—"}
                  </pre>
                </div>

                {draft.effetti.length > 0 && (
                  <>
                    <PannelloRenderMeccanico
                      effetti={draft.effetti as Record<string, unknown>[]}
                      tierFlatDamage={draft.tier}
                    />
                    <PannelloSandbox
                      effetti={draft.effetti as Record<string, unknown>[]}
                      tier={draft.tier}
                      skiruIr={draft.skiruIr}
                      collapsed={!sandboxOpen}
                      onToggle={() => setSandboxOpen((v) => !v)}
                    />
                  </>
                )}

                {draft.hasAuthoring && draft.effetti.length === 0 && (
                  <p className="text-xs text-gray-500 rounded border border-dashed border-[var(--border-color)] p-4">
                    Waza in authoring senza blocchi effetti — usa l&apos;
                    <Link href={`/sviluppo/waza/${draft.wazaId}`} className="text-[var(--accent-gold)]">
                      editor completo
                    </Link>{" "}
                    per codificare i blocchi e abilitare la sandbox.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {!loading && (
        <section
          className={`space-y-3 rounded border border-[var(--accent-gold)]/25 bg-[var(--panel-bg)]/40 p-4 ${
            mobileTab !== "bollettino" ? "hidden xl:block" : ""
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-display text-[var(--accent-gold)]">Bollettino per genitore</h3>
              <p className="text-[10px] text-gray-500 mt-1">
                Passiva e T1–T5 per ogni Via / lignaggio / famiglia. Include genitori futuri da Struttura.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyBulletin()}
              className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)] min-h-[44px]"
            >
              Copia testo
            </button>
          </div>

          <div className="rounded border border-[var(--border-color)] bg-black/20 p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Totale catalogo</div>
            <BulletinCountChips counts={bulletin.totals} />
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {bulletin.families.map((fam) => (
              <div
                key={fam.family}
                className="rounded border border-[var(--border-color)] bg-black/15 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-display text-[var(--accent-violet-light)]">{fam.label}</span>
                  <BulletinCountChips counts={fam.counts} />
                </div>
                <ul className="divide-y divide-[var(--border-color)]/60">
                  {fam.parents.map((p) => (
                    <li
                      key={p.id}
                      className="px-3 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-xs text-gray-200">{p.label}</span>
                      <BulletinCountChips counts={p.counts} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={`space-y-3 rounded border border-[var(--border-color)] bg-[var(--panel-bg)]/40 p-4 ${mobileTab !== "struttura" ? "hidden xl:block" : ""}`}>
        <h3 className="text-sm font-display text-[var(--accent-gold)]">Struttura Lab (macro/micro + genitori)</h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2">
          <select
            value={newTaxCategory}
            onChange={(e) => setNewTaxCategory(e.target.value as WazaLabTaxonomyItem["categoria"])}
            className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="genitore_do">Genitore Dō</option>
            <option value="genitore_madosho">Genitore Madoshō</option>
            <option value="lab_categoria_macro">Categoria macro</option>
            <option value="lab_categoria_micro">Categoria micro</option>
          </select>
          <input
            value={newTaxValue}
            onChange={(e) => setNewTaxValue(e.target.value)}
            placeholder="Nuovo valore..."
            className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => void addTaxonomy()}
            className="rounded border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] min-h-[44px] px-3"
          >
            Aggiungi
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto rounded border border-[var(--border-color)] p-2 text-xs text-gray-300">
          {taxonomy.length === 0 ? "Nessuna voce." : taxonomy.map((t) => <div key={t.id}>{t.categoria} · {t.valore}</div>)}
        </div>

        <h4 className="text-xs uppercase tracking-wider text-[var(--accent-violet-light)] pt-2">Nuova waza rapida</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            value={newWaza.name}
            onChange={(e) => setNewWaza((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nome Waza"
            className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px] md:col-span-2"
          />
          <select
            value={newWaza.family}
            onChange={(e) => setNewWaza((p) => ({ ...p, family: e.target.value as WazaLabFamily }))}
            className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
          >
            {Object.entries(WAZA_LAB_FAMILY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          {newWaza.family === "do" && (
            <select
              value={newWaza.styleId}
              onChange={(e) => setNewWaza((p) => ({ ...p, styleId: e.target.value }))}
              className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
            >
              {WAZA_LAB_STYLE_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
          {newWaza.family === "madosho" && (
            <select
              value={newWaza.madoshoId}
              onChange={(e) => setNewWaza((p) => ({ ...p, madoshoId: e.target.value }))}
              className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
            >
              {WAZA_LAB_MADOSHO_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
          {newWaza.family === "ordine" && (
            <select
              value={newWaza.ordineSubgroup}
              onChange={(e) => setNewWaza((p) => ({ ...p, ordineSubgroup: e.target.value }))}
              className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
            >
              {WAZA_LAB_ORDINE_OPTIONS.map((o) => (
                <option key={o.id || "comune"} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
          <select
            value={newWaza.rank}
            onChange={(e) =>
              setNewWaza((p) => ({
                ...p,
                rank: e.target.value,
                costExp: resolveDefaultWazaCostExp({ rank: e.target.value, isPassive: p.isPassive }),
                cs: String(resolveDefaultWazaCostCs({ rank: e.target.value, isPassive: p.isPassive })),
              }))
            }
            className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
            disabled={newWaza.isPassive}
          >
            <option value="T1">T1</option>
            <option value="T2">T2</option>
            <option value="T3">T3</option>
            <option value="T4">T4</option>
            <option value="T5">T5</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-gray-300 min-h-[44px]">
            <input
              type="checkbox"
              checked={newWaza.isPassive}
              onChange={(e) =>
                setNewWaza((p) => ({
                  ...p,
                  isPassive: e.target.checked,
                  costExp: resolveDefaultWazaCostExp({ isPassive: e.target.checked, rank: p.rank }),
                  cs: String(resolveDefaultWazaCostCs({ isPassive: e.target.checked, rank: p.rank })),
                }))
              }
            />
            Passiva
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={newWaza.costExp}
            onChange={(e) => setNewWaza((p) => ({ ...p, costExp: Math.max(0, Number(e.target.value) || 0) }))}
            placeholder="EXP"
            className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
          />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={newWaza.cs}
            onChange={(e) => setNewWaza((p) => ({ ...p, cs: e.target.value }))}
            placeholder="CS (opzionale)"
            className="rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm min-h-[44px]"
          />
        </div>
        <p className="text-[10px] text-gray-500 font-mono break-all">
          poolId automatico:{" "}
          <span className="text-[var(--accent-gold)]">{previewPoolId || "—"}</span>
        </p>
        <textarea
          value={newWaza.description}
          onChange={(e) => setNewWaza((p) => ({ ...p, description: e.target.value }))}
          placeholder="Descrizione narrativa (senza tag auto)"
          rows={2}
          className="w-full rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm"
        />
        <textarea
          value={newWaza.effect}
          onChange={(e) => setNewWaza((p) => ({ ...p, effect: e.target.value }))}
          placeholder="Effetto meccanico"
          rows={3}
          className="w-full rounded border border-[var(--border-color)] bg-black/30 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void createWaza()}
          className="min-h-[44px] px-4 rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] bg-[var(--accent-gold)]/15"
        >
          Crea nuova waza
        </button>
      </section>
    </div>
  );
}
