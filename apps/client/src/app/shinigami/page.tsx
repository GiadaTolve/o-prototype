"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Skeleton, SkeletonList, SkeletonTable } from "@/components/ui/Skeleton";

type Quest = {
  id: string;
  creatorName: string;
  title: string;
  description: string | null;
  status: string;
  participantCount: number;
  createdAt: string;
};

type FetchItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  requirements: {
    levelMin?: number;
    levelMax?: number;
    gradeIds?: string[];
    order?: string[];
  };
};

type MasterStat = {
  masterId: string;
  masterName: string;
  totalQuests: number;
  totalActions: number;
  uniqueParticipantsCount: number;
  participantNames: string[];
  shinePoints: number;
  score: number;
};

type MasterStats = {
  month: number;
  year: number;
  masters: MasterStat[];
  bestMaster: MasterStat | null;
};

type UserShineRanking = Array<{
  characterId: string;
  characterName: string;
  shinePoints: number;
}>;

type Plot = {
  id: string;
  title: string;
  description: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  estimatedDuration: number | null;
  actualDuration: number | null;
  questCount: number;
  relatedFetchesCount: number;
  creator?: { id: string; name: string };
  createdAt: string;
};

type PlotProposal = {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  proposer?: { id: string; name: string };
  reviewedBy?: { id: string; name: string } | null;
  reviewComment: string | null;
  plotId: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export default function ShinigamiPage() {
  const router = useRouter();
  const [list, setList] = useState<Quest[]>([]);
  const [pausedQuests, setPausedQuests] = useState<Quest[]>([]);
  const [selectedPausedQuest, setSelectedPausedQuest] = useState<Quest | null>(null);
  const [fetches, setFetches] = useState<FetchItem[]>([]);
  const [masterStats, setMasterStats] = useState<MasterStats | null>(null);
  const [userShineRanking, setUserShineRanking] = useState<UserShineRanking>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [proposals, setProposals] = useState<PlotProposal[]>([]);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canAccessGestione, setCanAccessGestione] = useState(false);
  const [canAccessShinigami, setCanAccessShinigami] = useState(false);
  const [pendingFetches, setPendingFetches] = useState<FetchItem[]>([]);
  const [showFetchForm, setShowFetchForm] = useState(false);
  const [fetchTitle, setFetchTitle] = useState("");
  const [fetchDescription, setFetchDescription] = useState("");
  const [submittingFetch, setSubmittingFetch] = useState(false);
  const [activeTab, setActiveTab] = useState<"quest" | "paused" | "lore" | "fetches" | "master">("quest");

  const load = useCallback(async () => {
    try {
      const [q, paused, f, charData] = await Promise.all([
        api.get("/quests").then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
        api.get("/quests/paused").then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
        api.get("/fetches").then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
        api.get("/characters/me").then((c: { canAccessGestione?: boolean; canAccessShinigami?: boolean; id?: string }) => {
          setCanAccessGestione(c?.canAccessGestione ?? false);
          setCanAccessShinigami(c?.canAccessShinigami ?? false);
          return c;
        }).catch(() => ({ canAccessGestione: false, canAccessShinigami: false })),
      ]);
      
      setList(q);
      setPausedQuests(paused);
      setFetches(f);
      
      const canAccessGest = charData?.canAccessGestione ?? false;
      
      // Carica statistiche master solo se ha accesso
      if (canAccessGest) {
        try {
          const [stats, ranking] = await Promise.all([
            api.get("/master-stats/masters").then((d) => d as MasterStats | null).catch(() => null),
            api.get("/master-stats/user-shine-ranking").then((d) => (Array.isArray(d) ? d : []) as UserShineRanking).catch(() => []),
          ]);
          setMasterStats(stats);
          setUserShineRanking(ranking);
        } catch (e) {
          console.error("Errore caricamento statistiche master:", e);
        }
      }

      // Carica trame e proposte
      try {
        const [plotsData, proposalsData] = await Promise.all([
          api.get("/lore/plots").then((d) => (Array.isArray(d) ? d : []) as Plot[]).catch(() => []),
          api.get("/lore/proposals").then((d) => (Array.isArray(d) ? d : []) as PlotProposal[]).catch(() => []),
        ]);
        setPlots(plotsData);
        setProposals(proposalsData);
      } catch (e) {
        console.error("Errore caricamento lore:", e);
      }

      // Carica fetch pending se può approvare
      if (canAccessGest) {
        try {
          const pending = await api.get("/fetches/pending").then((d) => (Array.isArray(d) ? d : []) as FetchItem[]).catch(() => []);
          setPendingFetches(pending);
        } catch (e) {
          console.error("Errore caricamento fetch pending:", e);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/auth");
      return;
    }
    load();
  }, [router, load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation Skeleton */}
          <div className="flex items-center gap-1 border-b border-[var(--border-color)] mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={40} width={120} className="mb-[-2px]" />
            ))}
          </div>
          {/* Content Skeleton */}
          <SkeletonList items={5} />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--panel-bg)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-[var(--border-color)] mb-6 flex-wrap">
          {[
            { id: "quest" as const, label: "Quest" },
            { id: "paused" as const, label: "Quest in Pausa", badge: pausedQuests.length > 0 ? pausedQuests.length : undefined },
            { id: "lore" as const, label: "Sezione Lore" },
            { id: "fetches" as const, label: "Fetch Quest" },
            ...(canAccessGestione ? [{ id: "master" as const, label: "Classifica Master" }] : []),
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
              {tab.badge && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] text-[10px]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Tab: Quest */}
          {activeTab === "quest" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display text-white">Quest</h2>
                <button
                  type="button"
                  onClick={load}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
                >
                  Aggiorna
                </button>
              </div>
              {list.length === 0 ? (
                <p className="text-sm text-gray-500">Nessuna quest.</p>
              ) : (
                <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-black/40">
                        <tr>
                          <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Titolo</th>
                          <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Creatore</th>
                          <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Status</th>
                          <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Partecipanti</th>
                          <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((q) => (
                          <tr key={q.id} className="border-t border-[var(--border-color)] hover:bg-black/20">
                            <td className="px-4 py-2">
                              <Link
                                href={`/shinigami/quest/${q.id}`}
                                className="font-display text-white hover:text-[var(--accent-gold)]"
                              >
                                {q.title}
                              </Link>
                            </td>
                            <td className="px-4 py-2 text-gray-400 text-xs">{q.creatorName}</td>
                            <td className="px-4 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                q.status === "OPEN" ? "bg-green-500/20 text-green-400" :
                                q.status === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-400" :
                                q.status === "CLOSED" ? "bg-gray-500/20 text-gray-400" :
                                "bg-yellow-500/20 text-yellow-400"
                              }`}>
                                {q.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-400 text-xs">{q.participantCount}</td>
                            <td className="px-4 py-2">
                              <Link
                                href={`/shinigami/quest/${q.id}`}
                                className="text-xs text-[var(--accent-gold)] hover:underline"
                              >
                                Dettagli
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Quest in Pausa */}
          {activeTab === "paused" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display text-white">Quest in Pausa</h2>
                <button
                  type="button"
                  onClick={load}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
                >
                  Aggiorna
                </button>
              </div>
              {pausedQuests.length === 0 ? (
                <p className="text-sm text-gray-500">Nessuna quest in pausa.</p>
              ) : (
                <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                  <div className="p-4 space-y-2">
                    {pausedQuests.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setSelectedPausedQuest(q)}
                        className={`w-full text-left px-4 py-3 rounded border transition-colors ${
                          selectedPausedQuest?.id === q.id
                            ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                            : "border-[var(--border-color)] hover:border-[var(--accent-gold)]/50 hover:bg-black/20"
                        }`}
                      >
                        <div className="font-display text-sm text-white">{q.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{q.participantCount} partecipanti</div>
                      </button>
                    ))}
                  </div>
                  {selectedPausedQuest && (
                    <div className="px-4 py-3 border-t border-[var(--border-color)] bg-black/20 flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!selectedPausedQuest) return;
                          try {
                            await api.patch(`/quests/${selectedPausedQuest.id}/status`, { status: "IN_PROGRESS" });
                            setSelectedPausedQuest(null);
                            load();
                          } catch (e) {
                            alert(e instanceof Error ? e.message : "Errore");
                          }
                        }}
                        className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10"
                      >
                        Riprendi
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!selectedPausedQuest || !confirm(`Concludere la quest "${selectedPausedQuest.title}"?`)) return;
                          try {
                            await api.patch(`/quests/${selectedPausedQuest.id}/status`, { status: "CLOSED" });
                            setSelectedPausedQuest(null);
                            load();
                          } catch (e) {
                            alert(e instanceof Error ? e.message : "Errore");
                          }
                        }}
                        className="px-3 py-1.5 rounded border border-yellow-500/60 text-yellow-400 text-xs hover:bg-yellow-500/10"
                      >
                        Concludi
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!selectedPausedQuest || !confirm(`Eliminare la quest "${selectedPausedQuest.title}"?`)) return;
                          try {
                            await api.delete(`/quests/${selectedPausedQuest.id}`);
                            setSelectedPausedQuest(null);
                            load();
                          } catch (e) {
                            alert(e instanceof Error ? e.message : "Errore");
                          }
                        }}
                        className="px-3 py-1.5 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10"
                      >
                        Elimina
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Sezione Lore */}
          {activeTab === "lore" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display text-white">Sezione Lore</h2>
                <button
                  type="button"
                  onClick={() => setShowProposalForm(!showProposalForm)}
                  className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10"
                >
                  {showProposalForm ? "Annulla" : "Nuova Proposta"}
                </button>
              </div>

              {/* Form nuova proposta */}
              {showProposalForm && (
                <div className="border border-[var(--border-color)] rounded-lg p-4 bg-black/20">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!proposalTitle.trim()) return;
                      setSubmittingProposal(true);
                      try {
                        await api.post("/lore/proposals", {
                          title: proposalTitle,
                          description: proposalDescription || undefined,
                        });
                        setProposalTitle("");
                        setProposalDescription("");
                        setShowProposalForm(false);
                        const updated = await api.get("/lore/proposals").then((d) => (Array.isArray(d) ? d : []) as PlotProposal[]).catch(() => []);
                        setProposals(updated);
                      } catch (e: unknown) {
                        alert(e instanceof Error ? e.message : "Errore durante l'invio");
                      } finally {
                        setSubmittingProposal(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      value={proposalTitle}
                      onChange={(e) => setProposalTitle(e.target.value)}
                      placeholder="Titolo proposta"
                      className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm"
                      required
                    />
                    <textarea
                      value={proposalDescription}
                      onChange={(e) => setProposalDescription(e.target.value)}
                      placeholder="Descrizione (opzionale)"
                      className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingProposal}
                        className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                      >
                        {submittingProposal ? "…" : "Invia Proposta"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Proposte Pending (solo Admin/Mod/Capo) */}
              {canAccessGestione && (
                <div className="border border-[var(--border-color)] rounded-lg p-4">
                  <h3 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-3">Proposte in Attesa</h3>
                  {proposals.filter((p) => p.status === "PENDING").length === 0 ? (
                    <p className="text-sm text-gray-500">Nessuna proposta in attesa.</p>
                  ) : (
                    <div className="space-y-2">
                      {proposals
                        .filter((p) => p.status === "PENDING")
                        .map((proposal) => (
                          <div key={proposal.id} className="p-3 rounded border border-[var(--border-color)] bg-black/20">
                            <p className="font-display text-sm text-white">{proposal.title}</p>
                            {proposal.description && <p className="text-xs text-gray-500 mt-1">{proposal.description}</p>}
                            <p className="text-[10px] text-gray-600 mt-1">Proposta da: {proposal.proposer?.name || "Unknown"}</p>
                            <div className="flex gap-2 mt-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm("Approvare questa proposta? Verrà creata una nuova trama.")) return;
                                  try {
                                    await api.post(`/lore/proposals/${proposal.id}/approve`, {});
                                    const updated = await api.get("/lore/proposals").then((d) => (Array.isArray(d) ? d : []) as PlotProposal[]).catch(() => []);
                                    setProposals(updated);
                                    const plotsUpdated = await api.get("/lore/plots").then((d) => (Array.isArray(d) ? d : []) as Plot[]).catch(() => []);
                                    setPlots(plotsUpdated);
                                  } catch (e: unknown) {
                                    alert(e instanceof Error ? e.message : "Errore");
                                  }
                                }}
                                className="px-2 py-1 rounded border border-green-500/60 text-green-400 hover:bg-green-500/10 text-xs"
                              >
                                Approva
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const comment = prompt("Commento (opzionale):");
                                  try {
                                    await api.post(`/lore/proposals/${proposal.id}/reject`, {
                                      reviewComment: comment || undefined,
                                    });
                                    const updated = await api.get("/lore/proposals").then((d) => (Array.isArray(d) ? d : []) as PlotProposal[]).catch(() => []);
                                    setProposals(updated);
                                  } catch (e: unknown) {
                                    alert(e instanceof Error ? e.message : "Errore");
                                  }
                                }}
                                className="px-2 py-1 rounded border border-red-500/60 text-red-400 hover:bg-red-500/10 text-xs"
                              >
                                Rifiuta
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Trame */}
              <div className="border border-[var(--border-color)] rounded-lg p-4">
                <h3 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-3">Trame</h3>
                {plots.length === 0 ? (
                  <p className="text-sm text-gray-500">Nessuna trama.</p>
                ) : (
                  <div className="space-y-2">
                    {plots.map((plot) => (
                      <div key={plot.id} className="p-3 rounded border border-[var(--border-color)] bg-black/20">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-display text-sm text-white">{plot.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            plot.status === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                            plot.status === "COMPLETED" ? "bg-blue-500/20 text-blue-400" :
                            "bg-gray-500/20 text-gray-400"
                          }`}>
                            {plot.status}
                          </span>
                        </div>
                        {plot.description && <p className="text-xs text-gray-500 mt-1">{plot.description}</p>}
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                          <span>{plot.questCount} quest</span>
                          <span>{plot.relatedFetchesCount} fetch</span>
                          {plot.actualDuration && <span>Durata: {plot.actualDuration} giorni</span>}
                          {plot.estimatedDuration && !plot.actualDuration && <span>Stimata: {plot.estimatedDuration} giorni</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Fetch Quest */}
          {activeTab === "fetches" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display text-white">Fetch Quest (Bacheca interna)</h2>
                <button
                  type="button"
                  onClick={load}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
                >
                  Aggiorna
                </button>
              </div>

              {/* Form creazione fetch (solo Shinigami) */}
              {canAccessShinigami && (
                <div className="border border-[var(--border-color)] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-display text-white">Nuova Fetch</h3>
                    <button
                      type="button"
                      onClick={() => setShowFetchForm(!showFetchForm)}
                      className="px-2 py-1 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
                    >
                      {showFetchForm ? "Annulla" : "Crea Fetch"}
                    </button>
                  </div>
                  {showFetchForm && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!fetchTitle.trim()) return;
                        setSubmittingFetch(true);
                        try {
                          await api.post("/fetches", {
                            title: fetchTitle,
                            description: fetchDescription || undefined,
                          });
                          setFetchTitle("");
                          setFetchDescription("");
                          setShowFetchForm(false);
                          await load();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Errore creazione fetch");
                        } finally {
                          setSubmittingFetch(false);
                        }
                      }}
                      className="space-y-3"
                    >
                      <input
                        type="text"
                        value={fetchTitle}
                        onChange={(e) => setFetchTitle(e.target.value)}
                        placeholder="Titolo fetch"
                        className="w-full px-3 py-2 bg-black/30 border border-[var(--border-color)] rounded text-sm text-white placeholder-gray-500"
                        required
                      />
                      <textarea
                        value={fetchDescription}
                        onChange={(e) => setFetchDescription(e.target.value)}
                        placeholder="Descrizione (opzionale)"
                        className="w-full px-3 py-2 bg-black/30 border border-[var(--border-color)] rounded text-sm text-white placeholder-gray-500 resize-y min-h-[80px]"
                      />
                      <button
                        type="submit"
                        disabled={submittingFetch}
                        className="px-4 py-2 rounded border border-[var(--accent-gold)] text-sm text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                      >
                        {submittingFetch ? "Creazione..." : "Crea Fetch"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Lista fetch in attesa di approvazione (solo Admin/Mod/Capo) */}
              {canAccessGestione && pendingFetches.length > 0 && (
                <div className="border border-[var(--accent-violet)]/50 rounded-lg p-4">
                  <h3 className="text-sm font-display text-[var(--accent-violet)] mb-3">Fetch in attesa di approvazione</h3>
                  <div className="space-y-2">
                    {pendingFetches.map((f) => (
                      <div key={f.id} className="p-3 rounded border border-[var(--accent-violet)]/30 bg-black/20">
                        <p className="font-display text-sm text-white">{f.title}</p>
                        {f.description && <p className="text-xs text-gray-500 mt-1">{f.description}</p>}
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.post(`/fetches/${f.id}/approve`, {});
                                await load();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Errore approvazione");
                              }
                            }}
                            className="px-2 py-1 rounded border border-green-500/50 text-xs text-green-400 hover:bg-green-500/10"
                          >
                            Approva
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.post(`/fetches/${f.id}/reject`, {});
                                await load();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Errore rifiuto");
                              }
                            }}
                            className="px-2 py-1 rounded border border-red-500/50 text-xs text-red-400 hover:bg-red-500/10"
                          >
                            Rifiuta
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista fetch approvate */}
              <div>
                <h3 className="text-sm font-display text-white mb-3">Fetch Approvate</h3>
                {fetches.length === 0 ? (
                  <p className="text-sm text-gray-500">Nessuna fetch approvata.</p>
                ) : (
                  <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                    <div className="p-4 space-y-2">
                      {fetches.map((f) => (
                        <div key={f.id} className="p-3 rounded border border-[var(--border-color)] bg-black/20">
                          <p className="font-display text-sm text-white">{f.title}</p>
                          {f.description && <p className="text-xs text-gray-500 mt-1">{f.description}</p>}
                          <p className="text-xs text-gray-600 mt-1">
                            Requisiti: {f.requirements.levelMin ? `Liv. ${f.requirements.levelMin}` : "Nessuno"}
                            {f.requirements.order && f.requirements.order.length > 0 && ` · ${f.requirements.order.join(", ")}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Classifica Master (solo Admin/Mod) */}
          {activeTab === "master" && canAccessGestione && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display text-white">Classifica Master</h2>
                <button
                  type="button"
                  onClick={load}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
                >
                  Aggiorna
                </button>
              </div>
              {masterStats ? (
                <div className="space-y-4">
                  {/* Miglior Master del Mese */}
                  {masterStats.bestMaster && (
                    <div className="border border-[var(--border-color)] rounded-lg p-4 bg-[var(--accent-gold)]/10 border-[var(--accent-gold)]/50">
                      <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-1">
                        Miglior Master del Mese ({masterStats.month}/{masterStats.year})
                      </p>
                      <p className="text-sm font-display text-white">{masterStats.bestMaster.masterName}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>{masterStats.bestMaster.totalQuests} quest</span>
                        <span>{masterStats.bestMaster.totalActions} azioni</span>
                        <span>{masterStats.bestMaster.uniqueParticipantsCount} partecipanti</span>
                        <span>{masterStats.bestMaster.shinePoints} shine</span>
                      </div>
                    </div>
                  )}

                  {/* Lista Master */}
                  {masterStats.masters.length > 0 ? (
                    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                      <div className="p-4 space-y-2">
                        {masterStats.masters.map((master, idx) => (
                          <div key={master.masterId} className="p-3 rounded border border-[var(--border-color)] bg-black/20">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[var(--accent-gold)] font-bold">#{idx + 1}</span>
                              <p className="font-display text-sm text-white">{master.masterName}</p>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                              <span>{master.totalQuests} quest</span>
                              <span>{master.totalActions} azioni</span>
                              <span>{master.uniqueParticipantsCount} part.</span>
                              <span>{master.shinePoints} shine</span>
                              <span className="text-[var(--accent-gold)]">Score: {master.score}</span>
                            </div>
                            {master.participantNames.length > 0 && (
                              <p className="text-[10px] text-gray-600 mt-1">
                                Partecipanti: {master.participantNames.slice(0, 5).join(", ")}
                                {master.participantNames.length > 5 && ` +${master.participantNames.length - 5}`}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nessuna quest chiusa questo mese.</p>
                  )}

                  {/* Classifica Utenti (Shine) */}
                  {userShineRanking.length > 0 && (
                    <div className="border border-[var(--border-color)] rounded-lg p-4">
                      <h3 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-3">Classifica Utenti (Punti Shine)</h3>
                      <div className="space-y-1">
                        {userShineRanking.slice(0, 10).map((user, idx) => (
                          <div key={user.characterId} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-black/20">
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--accent-gold)] font-bold w-6">#{idx + 1}</span>
                              <span className="text-white">{user.characterName}</span>
                            </div>
                            <span className="text-[var(--accent-violet)]">{user.shinePoints} shine</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Caricamento statistiche...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
