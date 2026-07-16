"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CatalogoWaza } from "@/components/sviluppo/waza/CatalogoWaza";
import { BestiarioManagement } from "@/components/gestione/BestiarioManagement";
import { GestioneStatusPanel } from "@/components/gestione/GestioneStatusPanel";
import { MarketCatalogManagement } from "@/components/gestione/MarketCatalogManagement";
import { api } from "@/lib/api";
import { canManageWaza } from "@/lib/waza-authoring-access";
import { useSviluppoTaxonomy, type TaxonomyEntry } from "@/hooks/useSviluppoTaxonomy";

/* ─── Pannello dropdown + campi editabili per Do/Madosho/Premi ─── */

function PannelloTassonomia({
  titolo,
  voci,
  onUpdate,
  onAdd,
  placeholderNuovo,
}: {
  titolo: string;
  voci: TaxonomyEntry[];
  onUpdate: (id: string, patch: Partial<TaxonomyEntry>) => void;
  onAdd: (nome: string) => void;
  placeholderNuovo?: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(voci[0]?.id ?? "");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const selected = voci.find((v) => v.id === selectedId) ?? voci[0];

  return (
    <div className="space-y-4 animate__animated animate__fadeIn">
      <h2 className="text-lg font-display text-[var(--accent-gold)]">{titolo}</h2>

      {/* Dropdown selezione */}
      {voci.length > 0 ? (
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full max-w-xs px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
        >
          {voci.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      ) : (
        <p className="text-xs text-gray-500">Nessuna voce. Aggiungine una.</p>
      )}

      {/* Campi editabili per la voce selezionata */}
      {selected && (
        <div className="rounded border border-[var(--border-color)] bg-[var(--panel-bg)]/40 p-4 space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--accent-violet-light)] mb-1">Nome</label>
            <input
              value={selected.name}
              onChange={(e) => onUpdate(selected.id, { name: e.target.value })}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--accent-violet-light)] mb-1">Spiegazione meccanica</label>
            <textarea
              value={selected.descrizione_meccanica ?? ""}
              onChange={(e) => onUpdate(selected.id, { descrizione_meccanica: e.target.value })}
              rows={4}
              placeholder="Descrivi la meccanica di questa Dō/scuola..."
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm resize-y"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[var(--accent-violet-light)] mb-1">Statuto</label>
            <textarea
              value={selected.statute}
              onChange={(e) => onUpdate(selected.id, { statute: e.target.value })}
              rows={4}
              placeholder="Statuto..."
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm resize-y"
            />
          </div>
        </div>
      )}

      {/* Aggiungi nuova voce (solo per Premi che non hanno lista fissa) */}
      {placeholderNuovo && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="px-3 py-1.5 rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] text-[10px] uppercase tracking-wider hover:bg-[var(--accent-violet)]/10"
          >
            {showNew ? "Annulla" : "Aggiungi voce"}
          </button>
          {showNew && (
            <div className="mt-2 flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={placeholderNuovo}
                className="flex-1 px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (newName.trim()) {
                    onAdd(newName.trim());
                    setNewName("");
                    setShowNew(false);
                  }
                }}
                className="px-3 py-2 rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] text-xs uppercase tracking-wider"
              >
                Crea
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Statistica ─── */

function PannelloStatistica() {
  const [stats, setStats] = useState<{
    totale: number;
    perCategoria: Record<string, number>;
    perFamiglia: Record<string, number>;
    perTier: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/waza/catalog?limit=2000")
      .then((res) => {
        const items = (res as { items?: unknown[] }).items ?? (Array.isArray(res) ? res : []);
        const perCategoria: Record<string, number> = {};
        const perFamiglia: Record<string, number> = {};
        const perTier: Record<string, number> = {};
        for (const w of items as Record<string, unknown>[]) {
          const cat = String(w.categoria ?? "—");
          perCategoria[cat] = (perCategoria[cat] ?? 0) + 1;
          const fam = String(w.famiglia ?? "—");
          perFamiglia[fam] = (perFamiglia[fam] ?? 0) + 1;
          const tier = w.tier != null ? `T${w.tier}` : "—";
          perTier[tier] = (perTier[tier] ?? 0) + 1;
        }
        setStats({ totale: items.length, perCategoria, perFamiglia, perTier });
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const BarChart = ({ data, label }: { data: Record<string, number>; label: string }) => {
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const max = Math.max(...sorted.map(([, v]) => v), 1);
    return (
      <div className="rounded border border-[var(--border-color)] bg-[var(--panel-bg)]/40 p-4">
        <h3 className="text-xs font-display uppercase tracking-wider text-[var(--accent-violet-light)] mb-3">{label}</h3>
        <div className="space-y-1.5">
          {sorted.map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 w-32 shrink-0 truncate">{key}</span>
              <div className="flex-1 bg-black/30 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-gold)]/60 rounded-full"
                  style={{ width: `${Math.round((val / max) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 tabular-nums w-6 text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <p className="text-xs text-gray-500">Caricamento statistiche...</p>;
  if (!stats) return <p className="text-xs text-red-400">Impossibile caricare le statistiche.</p>;

  return (
    <div className="space-y-4 animate__animated animate__fadeIn">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-display text-[var(--accent-gold)]">Statistica Waza</h2>
        <span className="text-xs text-[var(--accent-violet-light)] bg-[var(--accent-violet)]/10 px-2 py-0.5 rounded">
          {stats.totale} waza totali
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <BarChart data={stats.perCategoria} label="Per categoria" />
        <BarChart data={stats.perTier} label="Per tier" />
        <BarChart data={stats.perFamiglia} label="Per famiglia" />
      </div>
    </div>
  );
}

/* ─── Pagina principale ─── */

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function SviluppoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [canAuthoring, setCanAuthoring] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "catalogo-waza"
    | "waza-do"
    | "waza-madosho"
    | "waza-premi"
    | "status"
    | "bestiario"
    | "market"
    | "statistica"
  >("catalogo-waza");

  const { state, setState } = useSviluppoTaxonomy();

  const updateEntry = (kind: "do" | "madosho" | "ordine" | "premio", id: string, patch: Partial<TaxonomyEntry>) => {
    setState((prev) => ({
      ...prev,
      [kind]: prev[kind].map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const addEntry = (kind: "do" | "madosho" | "ordine" | "premio", nome: string) => {
    const idBase = slugify(nome);
    if (!idBase) return;
    let id = idBase;
    let n = 2;
    while (state[kind].some((e) => e.id === id)) { id = `${idBase}-${n}`; n += 1; }
    setState((prev) => ({
      ...prev,
      [kind]: [...prev[kind], { id, name: nome, statute: "", descrizione_meccanica: "" }],
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth"); return; }
    api
      .get("/characters/me")
      .then((char) => {
        const data = char as Parameters<typeof canManageWaza>[0] & { canAccessSviluppo?: boolean };
        setCanAccess(Boolean(data?.canAccessSviluppo));
        setCanAuthoring(canManageWaza(data));
      })
      .catch(() => { setCanAccess(false); setCanAuthoring(false); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] flex items-center justify-center">
        <p className="text-gray-400">Caricamento...</p>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-full bg-[var(--panel-bg)] flex items-center justify-center p-6">
        <p className="text-gray-400 text-sm">Accesso riservato allo staff Sviluppo.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full h-full bg-[var(--panel-bg)] p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-1 border-b border-[var(--border-color)] mb-6 flex-wrap">
          {[
            { id: "catalogo-waza" as const, label: "Catalogo Waza" },
            { id: "waza-do" as const, label: "Dō" },
            { id: "waza-madosho" as const, label: "Madoshō" },
            { id: "waza-premi" as const, label: "Oni no Mori" },
            { id: "status" as const, label: "Status" },
            { id: "bestiario" as const, label: "Bestiario" },
            { id: "market" as const, label: "Market" },
            { id: "statistica" as const, label: "Statistica" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-display transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "text-[var(--accent-gold)] border-[var(--accent-gold)]"
                  : "text-gray-500 border-transparent hover:text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "catalogo-waza" &&
            (canAuthoring ? (
              <CatalogoWaza />
            ) : (
              <p className="text-sm text-gray-400">Accesso al Catalogo Waza non disponibile.</p>
            ))}

          {activeTab === "waza-do" && (
            <PannelloTassonomia
              titolo="Sei Vie (Dō)"
              voci={state.do}
              onUpdate={(id, patch) => updateEntry("do", id, patch)}
              onAdd={(nome) => addEntry("do", nome)}
            />
          )}

          {activeTab === "waza-madosho" && (
            <PannelloTassonomia
              titolo="Madoshō"
              voci={state.madosho}
              onUpdate={(id, patch) => updateEntry("madosho", id, patch)}
              onAdd={(nome) => addEntry("madosho", nome)}
              placeholderNuovo="Nuova Madoshō"
            />
          )}

          {activeTab === "waza-premi" && (
            <PannelloTassonomia
              titolo="Oni no Mori (Premi)"
              voci={state.premio}
              onUpdate={(id, patch) => updateEntry("premio", id, patch)}
              onAdd={(nome) => addEntry("premio", nome)}
              placeholderNuovo="Nuovo premio"
            />
          )}

          {activeTab === "status" && <GestioneStatusPanel />}
          {activeTab === "bestiario" && <BestiarioManagement />}
          {activeTab === "market" && <MarketCatalogManagement />}
          {activeTab === "statistica" && <PannelloStatistica />}
        </div>
      </div>
    </div>
  );
}
