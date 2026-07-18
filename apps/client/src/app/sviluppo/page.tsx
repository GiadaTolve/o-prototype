"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CatalogoWaza } from "@/components/sviluppo/waza/CatalogoWaza";
import { BestiarioManagement } from "@/components/gestione/BestiarioManagement";
import { GestioneStatusPanel } from "@/components/gestione/GestioneStatusPanel";
import { GestioneTaxonomyPanel } from "@/components/gestione/GestioneTaxonomyPanel";
import { MarketSviluppoPanel } from "@/components/sviluppo/MarketSviluppoPanel";
import { api } from "@/lib/api";
import { canManageWaza } from "@/lib/waza-authoring-access";

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

export default function SviluppoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [canAuthoring, setCanAuthoring] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "catalogo-waza"
    | "statuti"
    | "status"
    | "bestiario"
    | "market"
    | "statistica"
  >("catalogo-waza");

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
            { id: "statuti" as const, label: "Statuti" },
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

          {activeTab === "statuti" && <GestioneTaxonomyPanel />}

          {activeTab === "status" && <GestioneStatusPanel />}
          {activeTab === "bestiario" && <BestiarioManagement />}
          {activeTab === "market" && <MarketSviluppoPanel />}
          {activeTab === "statistica" && <PannelloStatistica />}
        </div>
      </div>
    </div>
  );
}
