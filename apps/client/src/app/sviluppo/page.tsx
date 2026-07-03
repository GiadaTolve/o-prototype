"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GestioneWazaPanel } from "@/components/gestione/GestioneWazaPanel";
import { BestiarioManagement } from "@/components/gestione/BestiarioManagement";
import { GestioneWazaCreatePanel } from "@/components/gestione/GestioneWazaCreatePanel";
import { GestioneStatusPanel } from "@/components/gestione/GestioneStatusPanel";
import { GestioneTaxonomyPanel } from "@/components/gestione/GestioneTaxonomyPanel";
import { api } from "@/lib/api";

export default function SviluppoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "waza-generiche"
    | "waza-do"
    | "waza-madosho"
    | "waza-ordine"
    | "waza-premi"
    | "waza-create"
    | "taxonomy"
    | "status"
    | "bestiario"
  >("waza-generiche");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }
    api
      .get("/characters/me")
      .then((char) => {
        const access = Boolean((char as { canAccessSviluppo?: boolean })?.canAccessSviluppo);
        setCanAccess(access);
      })
      .catch(() => {
        setCanAccess(false);
      })
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
            { id: "waza-generiche" as const, label: "Generiche" },
            { id: "waza-do" as const, label: "Dō" },
            { id: "waza-madosho" as const, label: "Madosho" },
            { id: "waza-ordine" as const, label: "Ordine" },
            { id: "waza-premi" as const, label: "Premi" },
            { id: "waza-create" as const, label: "Crea Nuovo" },
            { id: "taxonomy" as const, label: "Tassonomie" },
            { id: "status" as const, label: "Status" },
            { id: "bestiario" as const, label: "Bestiario" },
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
          {activeTab === "waza-generiche" && (
            <GestioneWazaPanel scope="generiche" title="Waza Generiche" />
          )}
          {activeTab === "waza-do" && <GestioneWazaPanel scope="do" title="Waza Dō" />}
          {activeTab === "waza-madosho" && (
            <GestioneWazaPanel scope="madosho" title="Waza Madosho" />
          )}
          {activeTab === "waza-ordine" && (
            <GestioneWazaPanel scope="ordine" title="Waza Ordine" />
          )}
          {activeTab === "waza-premi" && (
            <GestioneWazaPanel scope="premi" title="Waza Premi" />
          )}
          {activeTab === "waza-create" && (
            <div className="space-y-4 animate__animated animate__fadeIn">
              <div>
                <h2 className="text-lg font-display text-[var(--accent-gold)]">Crea Nuovo</h2>
                <p className="text-xs text-[var(--accent-violet-light)] mt-1">
                  Sezione unificata per creare nuove Waza in modo ordinato per area.
                </p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <GestioneWazaCreatePanel preset="base" />
                <GestioneWazaCreatePanel preset="ordine" />
                <GestioneWazaCreatePanel preset="madosho" />
                <GestioneWazaCreatePanel preset="premio" />
              </div>
            </div>
          )}
          {activeTab === "taxonomy" && <GestioneTaxonomyPanel />}
          {activeTab === "status" && <GestioneStatusPanel />}
          {activeTab === "bestiario" && <BestiarioManagement />}
        </div>
      </div>
    </div>
  );
}
