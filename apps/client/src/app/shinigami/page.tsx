"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import { formatNarrativeText } from "@/lib/narrative-parser";
import { getPixelIconUrlRuolo, getPixelIconUrlOrdine, PIXEL_ICON_SIZE, PIXEL_ICON_DISPLAY_CLASS, type PixelIconRuolo, type PixelIconOrdine } from "@/components/dashboard/pixel-icons";
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
  completionStatus?: "AWAITING_REWARD" | "COMPLETED" | null;
  requirements: {
    levelMin?: number;
    levelMax?: number;
    gradeIds?: string[];
    order?: string[];
  };
};

type GiocataMessage = {
  id: string;
  zone: string;
  characterId: string;
  name: string;
  surname: string | null;
  miniAvatar: string | null;
  content: string;
  locationTag: string | null;
  createdAt: string;
  pixelIcons?: { ruolo?: string[]; ordine?: string[] };
  /** Messaggio Master (creatore sessione): mantiene formattazione masterscreen */
  isMasterscreen?: boolean;
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
  const [awaitingRewardFetches, setAwaitingRewardFetches] = useState<FetchItem[]>([]);
  const [completingFetchId, setCompletingFetchId] = useState<string | null>(null);
  const [responsoComments, setResponsoComments] = useState<Record<string, string>>({});
  const [showGiocataModal, setShowGiocataModal] = useState(false);
  const [giocataFetch, setGiocataFetch] = useState<FetchItem | null>(null);
  const [giocataMessages, setGiocataMessages] = useState<GiocataMessage[]>([]);
  const [loadingGiocata, setLoadingGiocata] = useState(false);
  const [giocataError, setGiocataError] = useState<string | null>(null);
  const [showFetchForm, setShowFetchForm] = useState(false);
  const [fetchTitle, setFetchTitle] = useState("");
  const [fetchDescription, setFetchDescription] = useState("");
  const [fetchLevelMin, setFetchLevelMin] = useState("");
  const [fetchLevelMax, setFetchLevelMax] = useState("");
  const [fetchOrder, setFetchOrder] = useState<string[]>([]);
  const [fetchLimitPerDay, setFetchLimitPerDay] = useState("");
  const [fetchLimitPerWeek, setFetchLimitPerWeek] = useState("");
  const [fetchMinActions, setFetchMinActions] = useState("");
  const [fetchRemReward, setFetchRemReward] = useState("");
  const [fetchExpReward, setFetchExpReward] = useState("");
  const [fetchGradeIds, setFetchGradeIds] = useState<string[]>([]);
  const [fetchPlotIds, setFetchPlotIds] = useState<string[]>([]);
  const [grades, setGrades] = useState<Array<{ id: string; name: string }>>([]);
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
      
      const canAccessShin = charData?.canAccessShinigami ?? false;
      
      // Carica statistiche master solo per Shinigami
      if (canAccessShin) {
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

      // Carica fetch pending e awaiting-reward (Shinigami)
      if (canAccessShin) {
        try {
          const [pending, awaiting] = await Promise.all([
            api.get("/fetches/pending").then((d) => (Array.isArray(d) ? d : []) as FetchItem[]).catch(() => []),
            api.get("/fetches/awaiting-reward").then((d) => (Array.isArray(d) ? d : []) as FetchItem[]).catch(() => []),
          ]);
          setPendingFetches(pending);
          setAwaitingRewardFetches(awaiting);
        } catch (e) {
          console.error("Errore caricamento fetch pending/awaiting:", e);
        }
      }

      // Carica gradi per form creazione fetch (requisiti gradeIds)
      try {
        const gradesData = await api.get("/fetches/grades").then((d) => (Array.isArray(d) ? d : []) as Array<{ id: string; name: string }>).catch(() => []);
        setGrades(gradesData);
      } catch {
        /* ignore */
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
            ...(canAccessShinigami ? [{ id: "master" as const, label: "Classifica Master" }] : []),
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
              {(canAccessShinigami || canAccessGestione) && (
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
                          {plot.actualDuration != null && (
                            <span>Durata: {plot.actualDuration} giorni</span>
                          )}
                          {plot.estimatedDuration != null && plot.actualDuration == null && (
                            <span>Stimata: {plot.estimatedDuration} giorni</span>
                          )}
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
                          const requirements: Record<string, unknown> = {};
                          if (fetchLevelMin) requirements.levelMin = Number(fetchLevelMin);
                          if (fetchLevelMax) requirements.levelMax = Number(fetchLevelMax);
                          if (fetchOrder.length > 0) requirements.order = fetchOrder as ("MUGEN-TAI" | "CHISEN-TAI")[];
                          if (fetchLimitPerDay) requirements.limitPerDay = Number(fetchLimitPerDay);
                          if (fetchLimitPerWeek) requirements.limitPerWeek = Number(fetchLimitPerWeek);
                          if (fetchGradeIds.length > 0) requirements.gradeIds = fetchGradeIds;
                          if (fetchPlotIds.length > 0) requirements.plotIds = fetchPlotIds;
                          const rewardConfig: Record<string, number> = {};
                          if (fetchMinActions) rewardConfig.minActions = Number(fetchMinActions);
                          if (fetchRemReward) rewardConfig.remReward = Number(fetchRemReward);
                          if (fetchExpReward) rewardConfig.expReward = Number(fetchExpReward);
                          await api.post("/fetches", {
                            title: fetchTitle,
                            description: fetchDescription || undefined,
                            requirements: Object.keys(requirements).length > 0 ? requirements : undefined,
                            rewardConfig: Object.keys(rewardConfig).length > 0 ? rewardConfig : undefined,
                          });
                          setFetchTitle("");
                          setFetchDescription("");
                          setFetchLevelMin("");
                          setFetchLevelMax("");
                          setFetchOrder([]);
                          setFetchLimitPerDay("");
                          setFetchLimitPerWeek("");
                          setFetchGradeIds([]);
                          setFetchPlotIds([]);
                          setFetchMinActions("");
                          setFetchRemReward("");
                          setFetchExpReward("");
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
                      <div className="p-3 rounded border border-[var(--border-color)]/50 bg-black/20 space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)]">Requisiti (opzionale)</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <input
                            type="number"
                            value={fetchLevelMin}
                            onChange={(e) => setFetchLevelMin(e.target.value)}
                            placeholder="Liv. min"
                            className="px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/40 text-xs text-white"
                            min="1"
                          />
                          <input
                            type="number"
                            value={fetchLevelMax}
                            onChange={(e) => setFetchLevelMax(e.target.value)}
                            placeholder="Liv. max"
                            className="px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/40 text-xs text-white"
                            min="1"
                          />
                          <input
                            type="number"
                            value={fetchLimitPerDay}
                            onChange={(e) => setFetchLimitPerDay(e.target.value)}
                            placeholder="Max/giorno"
                            className="px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/40 text-xs text-white"
                            min="1"
                          />
                          <input
                            type="number"
                            value={fetchLimitPerWeek}
                            onChange={(e) => setFetchLimitPerWeek(e.target.value)}
                            placeholder="Max/settimana"
                            className="px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/40 text-xs text-white"
                            min="1"
                          />
                        </div>
                        <div className="flex gap-4 flex-wrap mb-2">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fetchOrder.includes("MUGEN-TAI")}
                              onChange={(e) => setFetchOrder((o) => (e.target.checked ? [...o, "MUGEN-TAI"] : o.filter((x) => x !== "MUGEN-TAI")))}
                              className="rounded"
                            />
                            Mugen-Tai
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fetchOrder.includes("CHISEN-TAI")}
                              onChange={(e) => setFetchOrder((o) => (e.target.checked ? [...o, "CHISEN-TAI"] : o.filter((x) => x !== "CHISEN-TAI")))}
                              className="rounded"
                            />
                            Chisen-Tai
                          </label>
                        </div>
                        {grades.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-gray-500">Grado richiesto (opzionale):</p>
                            <div className="flex flex-wrap gap-2">
                              {grades.map((g) => (
                                <label key={g.id} className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={fetchGradeIds.includes(g.id)}
                                    onChange={(e) => setFetchGradeIds((o) => (e.target.checked ? [...o, g.id] : o.filter((x) => x !== g.id)))}
                                    className="rounded"
                                  />
                                  {g.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                        {plots.length > 0 && (
                          <div className="space-y-1 mt-2">
                            <p className="text-[10px] text-gray-500">Partecipazione a trama (opzionale):</p>
                            <div className="flex flex-wrap gap-2">
                              {plots.filter((p) => p.status === "ACTIVE" || p.status === "COMPLETED").map((p) => (
                                <label key={p.id} className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={fetchPlotIds.includes(p.id)}
                                    onChange={(e) => setFetchPlotIds((o) => (e.target.checked ? [...o, p.id] : o.filter((x) => x !== p.id)))}
                                    className="rounded"
                                  />
                                  {p.title}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3 rounded border border-[var(--border-color)]/50 bg-black/20 space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)]">Premi automatici (opzionale)</p>
                        <p className="text-[10px] text-gray-500">Default: 4 azioni min, 50 REM. Lascia vuoto per usare i valori di default.</p>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            value={fetchMinActions}
                            onChange={(e) => setFetchMinActions(e.target.value)}
                            placeholder="Min azioni (4)"
                            className="px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/40 text-xs text-white"
                            min="1"
                          />
                          <input
                            type="number"
                            value={fetchRemReward}
                            onChange={(e) => setFetchRemReward(e.target.value)}
                            placeholder="REM (50)"
                            className="px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/40 text-xs text-white"
                            min="0"
                          />
                          <input
                            type="number"
                            value={fetchExpReward}
                            onChange={(e) => setFetchExpReward(e.target.value)}
                            placeholder="EXP (0)"
                            className="px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/40 text-xs text-white"
                            min="0"
                          />
                        </div>
                      </div>
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

              {/* Lista fetch in attesa di responso (solo Admin/Mod/Capo) */}
              {canAccessShinigami && awaitingRewardFetches.length > 0 && (
                <div className="border border-amber-500/50 rounded-lg p-4">
                  <h3 className="text-sm font-display text-amber-400 mb-3">Fetch in attesa di responso</h3>
                  <p className="text-xs text-gray-500 mb-3">Giocata chiusa, premi assegnati. Leggi la giocata e completa con eventuale commento.</p>
                  <div className="space-y-2">
                    {awaitingRewardFetches.map((f) => (
                      <div key={f.id} className="p-3 rounded border border-amber-500/30 bg-black/20">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-display text-sm text-white">{f.title}</p>
                          <button
                            type="button"
                            onClick={async () => {
                              setGiocataFetch(f);
                              setShowGiocataModal(true);
                              setLoadingGiocata(true);
                              setGiocataMessages([]);
                              setGiocataError(null);
                              try {
                                const res = await api.get(`/fetches/${f.id}/session`) as { session?: unknown; messages?: GiocataMessage[] };
                                setGiocataMessages(res?.messages ?? []);
                              } catch (err) {
                                const msg = err instanceof Error ? err.message : "Errore caricamento giocata";
                                setGiocataError(msg);
                                setError(msg);
                              } finally {
                                setLoadingGiocata(false);
                              }
                            }}
                            className="px-2 py-1 rounded border border-[var(--accent-gold)]/50 text-xs text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 shrink-0"
                          >
                            Leggi giocata
                          </button>
                        </div>
                        {f.description && <p className="text-xs text-gray-500 mt-1">{f.description}</p>}
                        <div className="mt-2 space-y-2">
                          <textarea
                            placeholder="Commento responso (opzionale)"
                            value={responsoComments[f.id] ?? ""}
                            onChange={(e) => setResponsoComments((prev) => ({ ...prev, [f.id]: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/40 text-xs text-white placeholder-gray-600 resize-none min-h-[60px]"
                            rows={2}
                          />
                          <button
                            type="button"
                            disabled={completingFetchId !== null}
                            onClick={async () => {
                              setCompletingFetchId(f.id);
                              try {
                                await api.post(`/fetches/${f.id}/complete`, {
                                  comment: (responsoComments[f.id] ?? "").trim() || undefined,
                                });
                                setResponsoComments((prev) => {
                                  const next = { ...prev };
                                  delete next[f.id];
                                  return next;
                                });
                                setCompletingFetchId(null);
                                await load();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Errore completamento");
                                setCompletingFetchId(null);
                              }
                            }}
                            className="px-2 py-1 rounded border border-green-500/50 text-xs text-green-400 hover:bg-green-500/10 disabled:opacity-50"
                          >
                            {completingFetchId === f.id ? "…" : "Completa"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista fetch in attesa di approvazione (solo Admin/Mod/Capo) */}
              {canAccessShinigami && pendingFetches.length > 0 && (
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
          {activeTab === "master" && canAccessShinigami && (
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

      {/* Modal Leggi giocata (fetch in attesa responso) */}
      {showGiocataModal && giocataFetch && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <h2 className="font-display text-lg text-[var(--accent-gold)]">Giocata registrata: {giocataFetch.title}</h2>
              <button
                onClick={() => {
                  setShowGiocataModal(false);
                  setGiocataFetch(null);
                  setGiocataMessages([]);
                  setGiocataError(null);
                }}
                className="text-gray-400 hover:text-[var(--accent-gold)]"
              >
                ✕
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-10"
              style={{
                backgroundImage: "url('/backgrounds/darkstone.png')",
                backgroundRepeat: "repeat",
                backgroundBlendMode: "overlay",
                backgroundColor: "rgba(0,0,0,0.6)",
              }}
            >
              {loadingGiocata ? (
                <p className="text-gray-400 text-center">Caricamento messaggi...</p>
              ) : giocataError ? (
                <p className="text-amber-400 text-center py-8">{giocataError}</p>
              ) : giocataMessages.length === 0 ? (
                <div className="text-gray-400 text-center space-y-1 py-4">
                  <p>Nessun messaggio disponibile in questo periodo.</p>
                  <p className="text-xs text-gray-500">I messaggi vengono registrati dalla chat durante la giocata (tra avvio e chiusura).</p>
                </div>
              ) : (
                giocataMessages.map((m) => <GiocataMessageBlock key={m.id} message={m} />)
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function GiocataMessageBlock({ message }: { message: GiocataMessage }) {
  const formattedContent = formatNarrativeText(message.content);
  const isGlobal = message.zone === "GLOBAL" || message.name?.startsWith("[GLOBAL]");
  if (isGlobal) {
    return (
      <div className="border border-[var(--accent-violet)] bg-gradient-to-r from-[var(--accent-violet)]/20 via-transparent to-[var(--accent-violet)]/20 py-4 px-4 text-center my-5">
        <strong className="block text-[var(--accent-violet)] mb-2 text-sm font-display">✦ MESSAGGIO GLOBALE ✦</strong>
        <p className="m-0 font-normal text-sm text-gray-200" dangerouslySetInnerHTML={{ __html: formattedContent }} />
      </div>
    );
  }
  if (message.isMasterscreen) {
    return (
      <div className="w-full mb-6 p-5 bg-black/40 border border-[var(--accent-gold)]/30 rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
        <div className="masterscreen-format font-sans text-[13px] leading-relaxed whitespace-pre-wrap mb-4">
          <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
        </div>
        <div className="text-right font-display text-[11px] font-bold text-[var(--accent-gold)] uppercase tracking-wider opacity-80">
          — Shinigami ({message.name}{message.surname ? ` ${message.surname}` : ""})
        </div>
      </div>
    );
  }
  const formatTimestamp = (iso: string) => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="w-full mb-5 text-[#b3b3c0] relative pl-2.5">
      <div className="flex items-center mb-1.5 text-xs border-b border-white/5 pb-1">
        <span className="mr-3 text-[10px] text-gray-600 font-sans">{formatTimestamp(message.createdAt)}</span>
        <span className="font-display font-bold text-[#c9a84a] mr-2.5 tracking-wide text-[13px]">
          {message.name}{message.surname ? ` ${message.surname}` : ""}
        </span>
        {message.pixelIcons && (
          <div className="flex items-center gap-1 mr-2">
            {message.pixelIcons.ruolo?.map((r) => {
              const url = getPixelIconUrlRuolo(r as PixelIconRuolo);
              return url ? <Image key={`ruolo-${r}`} src={url} alt={r} width={PIXEL_ICON_SIZE} height={PIXEL_ICON_SIZE} className={PIXEL_ICON_DISPLAY_CLASS} /> : null;
            })}
            {message.pixelIcons.ordine?.map((o) => {
              const url = getPixelIconUrlOrdine(o as PixelIconOrdine);
              return url ? <img key={`ordine-${o}`} src={url} alt={o} width={PIXEL_ICON_SIZE} height={PIXEL_ICON_SIZE} className={PIXEL_ICON_DISPLAY_CLASS} /> : null;
            })}
          </div>
        )}
        {message.locationTag && <span className="text-[10px] text-[#60519b]">[{message.locationTag}]</span>}
      </div>
      <p className="text-sm text-justify leading-relaxed m-0" style={{ textIndent: "1.5em" }} dangerouslySetInnerHTML={{ __html: formattedContent }} />
    </div>
  );
}
