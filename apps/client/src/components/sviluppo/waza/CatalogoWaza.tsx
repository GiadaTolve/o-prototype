"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import {
  vocabolarioGenitoreKey,
  WAZA_ATOMI_FILTRO,
  WAZA_CATEGORIA_LABELS,
  WAZA_STATO_CODIFICA_META,
  WAZA_VERSIONE_STATO_LABELS,
  type WazaCategoria,
} from "./waza-admin-ui";
import { CreazioneWazaModal } from "./CreazioneWazaModal";

export type WazaCatalogItem = {
  id: string;
  slug: string;
  categoria: WazaCategoria;
  genitore: string | null;
  tipo: "passiva" | "attiva";
  tier: number | null;
  archiviata: boolean;
  versioneNumero: number;
  stato: "bozza" | "validata" | "pubblicata" | "superata";
  statoCodifica: keyof typeof WAZA_STATO_CODIFICA_META;
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string | null;
  kanjiVerificato: boolean;
  cs: number;
  tags: string[];
  atomiUsati: string[];
};

type VocabolarioItem = {
  categoria: string;
  valore: string;
};

type Filters = {
  categoria: "" | WazaCategoria;
  genitore: string;
  tipo: "" | "passiva" | "attiva";
  tier: string;
  atomo: string;
  statoCodifica: "" | keyof typeof WAZA_STATO_CODIFICA_META;
  q: string;
  archiviate: boolean;
};

const FILTERS_STORAGE_KEY = "sviluppo:waza-catalog:filters:v1";

const EMPTY_FILTERS: Filters = {
  categoria: "",
  genitore: "",
  tipo: "",
  tier: "",
  atomo: "",
  statoCodifica: "",
  q: "",
  archiviate: false,
};

function buildQuery(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.genitore) params.set("genitore", filters.genitore);
  if (filters.tipo) params.set("tipo", filters.tipo);
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.atomo) params.set("atomo", filters.atomo);
  if (filters.statoCodifica) params.set("stato_codifica", filters.statoCodifica);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  params.set("archiviata", filters.archiviate ? "true" : "false");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function ContatoriCodifica({ items }: { items: WazaCatalogItem[] }) {
  const counts = useMemo(() => {
    const tally = { automatica: 0, ibrida: 0, manuale: 0, da_codificare: 0 };
    for (const item of items) tally[item.statoCodifica] += 1;
    return tally;
  }, [items]);

  const chip = (n: number, label: string) => (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--background)]/40">
      <span className="text-[var(--accent-gold)] font-display">{n}</span>
      <span className="text-[var(--accent-violet-light)]">{label}</span>
    </span>
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {chip(counts.automatica, "codificate")}
      {chip(counts.ibrida, "ibride")}
      {chip(counts.manuale, "manuali")}
      {chip(counts.da_codificare, "da fare")}
    </div>
  );
}

function WazaCard({
  item,
  busy,
  onDuplicate,
  onArchiveToggle,
}: {
  item: WazaCatalogItem;
  busy: boolean;
  onDuplicate: () => void;
  onArchiveToggle: () => void;
}) {
  const codifica = WAZA_STATO_CODIFICA_META[item.statoCodifica];
  const badge =
    "text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-color)] text-gray-400";

  return (
    <article className="rounded border border-[var(--border-color)] bg-[var(--panel-bg)]/50 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display text-[var(--foreground)] truncate">{item.nomeItaliano}</div>
          <div className="text-xs text-gray-500 truncate">
            {item.nomeRomaji}
            {item.kanji ? ` · ${item.kanji}` : ""}
            {item.kanji && !item.kanjiVerificato && (
              <span className="ml-1 text-[var(--accent-gold)]" title="Kanji non verificato">
                「?」
              </span>
            )}
          </div>
        </div>
        {item.tier && (
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded border border-[var(--accent-gold)]/40 text-[var(--accent-gold)]">
            T{item.tier}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        <span className={badge}>{WAZA_CATEGORIA_LABELS[item.categoria]}</span>
        {item.genitore && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)]">
            {item.genitore}
          </span>
        )}
        <span className={`${badge} capitalize`}>{item.tipo}</span>
        <span className={badge}>CS {item.cs}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)]">
          {WAZA_VERSIONE_STATO_LABELS[item.stato] ?? item.stato}
        </span>
        <span className={badge} title={codifica.label}>
          {codifica.emoji} {codifica.label}
        </span>
      </div>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span key={tag} className={badge}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href={`/sviluppo/waza/${item.id}`}
          className="col-span-2 text-center text-xs px-3 py-2.5 rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)]"
        >
          Apri
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={onDuplicate}
          className="text-xs px-3 py-2.5 rounded border border-[var(--border-color)] text-gray-400 disabled:opacity-50"
        >
          Duplica
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onArchiveToggle}
          className="text-xs px-3 py-2.5 rounded border border-[var(--border-color)] text-gray-400 disabled:opacity-50"
        >
          {item.archiviata ? "Ripristina" : "Archivia"}
        </button>
      </div>
    </article>
  );
}

function countActiveFilters(filters: Filters): number {
  let n = 0;
  if (filters.categoria) n += 1;
  if (filters.genitore) n += 1;
  if (filters.tipo) n += 1;
  if (filters.tier) n += 1;
  if (filters.atomo) n += 1;
  if (filters.statoCodifica) n += 1;
  if (filters.q.trim()) n += 1;
  if (filters.archiviate) n += 1;
  return n;
}

export function CatalogoWaza() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [items, setItems] = useState<WazaCatalogItem[]>([]);
  const [vocabolari, setVocabolari] = useState<VocabolarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
      if (!raw) {
        setFiltersHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<Filters>;
      setFilters({
        ...EMPTY_FILTERS,
        ...parsed,
        categoria: (parsed.categoria as Filters["categoria"]) ?? "",
        tipo: (parsed.tipo as Filters["tipo"]) ?? "",
        statoCodifica: (parsed.statoCodifica as Filters["statoCodifica"]) ?? "",
        archiviate: parsed.archiviate === true,
      });
    } catch {
      // Se il payload salvato è invalido, ripartiamo da filtri vuoti.
      setFilters(EMPTY_FILTERS);
    } finally {
      setFiltersHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!filtersHydrated) return;
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  }, [filters, filtersHydrated]);

  const genitoriOptions = useMemo(() => {
    if (!filters.categoria || filters.categoria === "generica") return [];
    const key = vocabolarioGenitoreKey(filters.categoria);
    if (!key) return [];
    return vocabolari.filter((v) => v.categoria === key).map((v) => v.valore);
  }, [filters.categoria, vocabolari]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [listRes, vocabRes] = await Promise.all([
        api.get(`/admin/waza${buildQuery(filters)}`) as Promise<{ items: WazaCatalogItem[] }>,
        api.get("/admin/waza/vocabolari") as Promise<{ items: VocabolarioItem[] }>,
      ]);
      setItems(Array.isArray(listRes.items) ? listRes.items : []);
      setVocabolari(Array.isArray(vocabRes.items) ? vocabRes.items : []);
    } catch (e) {
      setItems([]);
      setMessage(e instanceof Error ? e.message : "Errore caricamento catalogo waza");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "categoria") next.genitore = "";
      return next;
    });
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    window.localStorage.removeItem(FILTERS_STORAGE_KEY);
  };

  const handleDuplicate = async (item: WazaCatalogItem) => {
    if (!confirm(`Duplicare «${item.nomeItaliano}» in una nuova waza in bozza?`)) return;
    setBusyId(item.id);
    setMessage(null);
    try {
      const res = (await api.post(`/admin/waza/${item.id}/duplica`)) as {
        waza: { id: string };
      };
      router.push(`/sviluppo/waza/${res.waza.id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Errore duplicazione");
    } finally {
      setBusyId(null);
    }
  };

  const handleArchiveToggle = async (item: WazaCatalogItem) => {
    const verb = item.archiviata ? "ripristinare" : "archiviare";
    if (!confirm(`Confermi di ${verb} «${item.nomeItaliano}»?`)) return;
    setBusyId(item.id);
    setMessage(null);
    try {
      await api.post(`/admin/waza/${item.id}/${item.archiviata ? "ripristina" : "archivia"}`);
      await load();
      setMessage(item.archiviata ? "Waza ripristinata." : "Waza archiviata.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Errore aggiornamento archivio");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 animate__animated animate__fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display text-[var(--accent-gold)]">Catalogo Waza</h1>
          <p className="text-xs text-[var(--accent-violet-light)] mt-1 max-w-3xl">
            Authoring a blocchi per il manuale di gioco. Le Sei Vie e le Madoshō hanno un genitore
            specifico; le generiche non ne hanno.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
          >
            ← Torna Indietro
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="px-3 py-1.5 rounded border border-[var(--accent-gold)]/50 text-xs text-[var(--accent-gold)]"
          >
            + Crea
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
          >
            <FontAwesomeIcon icon={icons.refresh} className="w-3 h-3 mr-1" />
            Aggiorna
          </button>
        </div>
      </div>

      <ContatoriCodifica items={items} />

      {!loading && items.length === 0 && !message && (
        <p className="text-xs text-[var(--accent-violet-light)] border border-[var(--accent-gold)]/30 rounded px-3 py-2 bg-black/20">
          Catalogo vuoto — esegui la sincronizzazione dal sistema legacy (
          <code className="text-[var(--accent-gold)]">bun scripts/sync-waza-from-legacy.ts --execute</code>
          ) oppure crea una nuova waza.
        </p>
      )}

      <CreazioneWazaModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        vocabolari={vocabolari}
      />

      <button
        type="button"
        onClick={() => setShowFilters((o) => !o)}
        className="md:hidden w-full flex items-center justify-between px-3 py-2.5 rounded border border-[var(--border-color)] text-sm text-[var(--accent-violet-light)]"
      >
        <span>
          <FontAwesomeIcon icon={icons.search} className="w-3 h-3 mr-2" />
          Filtri
          {activeFilterCount > 0 && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--accent-gold)]/50 text-[var(--accent-gold)]">
              {activeFilterCount}
            </span>
          )}
        </span>
        <span className="text-xs text-gray-500">{showFilters ? "Nascondi" : "Mostra"}</span>
      </button>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs px-3 py-1.5 rounded border border-[var(--border-color)] text-gray-400 hover:text-[var(--accent-gold)]"
        >
          Reset filtri
        </button>
      </div>

      <div
        className={`${showFilters ? "grid" : "hidden"} md:grid rounded border border-[var(--border-color)] bg-[var(--background)]/40 p-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3`}
      >
        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Categoria</span>
          <select
            value={filters.categoria}
            onChange={(e) => updateFilter("categoria", e.target.value as Filters["categoria"])}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          >
            <option value="">Tutte</option>
            {(Object.keys(WAZA_CATEGORIA_LABELS) as WazaCategoria[]).map((cat) => (
              <option key={cat} value={cat}>
                {WAZA_CATEGORIA_LABELS[cat]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Genitore</span>
          <select
            value={filters.genitore}
            onChange={(e) => updateFilter("genitore", e.target.value)}
            disabled={!filters.categoria || filters.categoria === "generica"}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm disabled:opacity-50"
          >
            <option value="">Tutti</option>
            {genitoriOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Tipo</span>
          <select
            value={filters.tipo}
            onChange={(e) => updateFilter("tipo", e.target.value as Filters["tipo"])}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          >
            <option value="">Tutti</option>
            <option value="attiva">Attiva</option>
            <option value="passiva">Passiva</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Tier</span>
          <select
            value={filters.tier}
            onChange={(e) => updateFilter("tier", e.target.value)}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          >
            <option value="">Tutti</option>
            {[1, 2, 3, 4, 5].map((t) => (
              <option key={t} value={String(t)}>
                T{t}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Atomo</span>
          <select
            value={filters.atomo}
            onChange={(e) => updateFilter("atomo", e.target.value)}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          >
            <option value="">Tutti</option>
            {WAZA_ATOMI_FILTRO.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Stato codifica</span>
          <select
            value={filters.statoCodifica}
            onChange={(e) =>
              updateFilter("statoCodifica", e.target.value as Filters["statoCodifica"])
            }
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          >
            <option value="">Tutti</option>
            {(Object.keys(WAZA_STATO_CODIFICA_META) as Array<keyof typeof WAZA_STATO_CODIFICA_META>).map(
              (key) => (
                <option key={key} value={key}>
                  {WAZA_STATO_CODIFICA_META[key].emoji} {WAZA_STATO_CODIFICA_META[key].label}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Ricerca</span>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => updateFilter("q", e.target.value)}
            placeholder="Nome rōmaji, italiano o kanji…"
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          />
        </label>

        <label className="flex items-end gap-2 pb-2 text-sm text-[var(--accent-violet-light)]">
          <input
            type="checkbox"
            checked={filters.archiviate}
            onChange={(e) => updateFilter("archiviate", e.target.checked)}
            className="rounded border-[var(--border-color)]"
          />
          Mostra archiviate
        </label>
      </div>

      {message && (
        <p className="text-xs text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-3 py-2">
          {message}
        </p>
      )}

      <div className="md:hidden space-y-2">
        {loading ? (
          <p className="text-center text-gray-500 text-sm py-8">Caricamento catalogo…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">
            Nessuna waza corrisponde ai filtri.
          </p>
        ) : (
          items.map((item) => (
            <WazaCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onDuplicate={() => void handleDuplicate(item)}
              onArchiveToggle={() => void handleArchiveToggle(item)}
            />
          ))
        )}
      </div>

      <div className="hidden md:block rounded border border-[var(--border-color)] overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-black/30 text-[10px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="text-left px-3 py-2">Nome</th>
              <th className="text-left px-3 py-2">Categoria</th>
              <th className="text-left px-3 py-2">Genitore</th>
              <th className="text-left px-3 py-2">Tipo</th>
              <th className="text-left px-3 py-2">Tier</th>
              <th className="text-left px-3 py-2">CS</th>
              <th className="text-left px-3 py-2">Tags</th>
              <th className="text-left px-3 py-2">Stato</th>
              <th className="text-left px-3 py-2">Codifica</th>
              <th className="text-right px-3 py-2">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                  Caricamento catalogo…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                  Nessuna waza corrisponde ai filtri.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const codifica = WAZA_STATO_CODIFICA_META[item.statoCodifica];
                const busy = busyId === item.id;
                return (
                  <tr
                    key={item.id}
                    className="border-t border-[var(--border-color)]/60 hover:bg-[var(--panel-bg)]/40"
                  >
                    <td className="px-3 py-2 align-top">
                      <div className="font-display text-[var(--foreground)]">{item.nomeItaliano}</div>
                      <div className="text-xs text-gray-500">{item.nomeRomaji}</div>
                      {item.kanji && (
                        <div className="text-xs text-[var(--accent-violet-light)] mt-0.5">
                          {item.kanji}
                          {!item.kanjiVerificato && (
                            <span
                              className="ml-1 text-[var(--accent-gold)]"
                              title="Kanji non verificato"
                            >
                              「?」
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">{WAZA_CATEGORIA_LABELS[item.categoria]}</td>
                    <td className="px-3 py-2 align-top text-[var(--accent-violet-light)]">
                      {item.genitore ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-top capitalize">{item.tipo}</td>
                    <td className="px-3 py-2 align-top">{item.tier ? `T${item.tier}` : "—"}</td>
                    <td className="px-3 py-2 align-top">{item.cs}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-color)] text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)]">
                        {WAZA_VERSIONE_STATO_LABELS[item.stato] ?? item.stato}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span title={codifica.label}>
                        {codifica.emoji} {codifica.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Link
                          href={`/sviluppo/waza/${item.id}`}
                          className="text-[10px] px-2 py-1 rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:shadow-[var(--shadow-gold)]"
                        >
                          Apri
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDuplicate(item)}
                          className="text-[10px] px-2 py-1 rounded border border-[var(--border-color)] text-gray-400 hover:text-[var(--accent-gold)] disabled:opacity-50"
                        >
                          Duplica
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleArchiveToggle(item)}
                          className="text-[10px] px-2 py-1 rounded border border-[var(--border-color)] text-gray-400 hover:text-[var(--accent-violet-light)] disabled:opacity-50"
                        >
                          {item.archiviata ? "Ripristina" : "Archivia"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
