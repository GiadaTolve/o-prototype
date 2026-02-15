"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { CharacterSummary } from "./types";

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

type Props = {
  char?: CharacterSummary;
};

export function ShinigamiContent({ char }: Props) {
  const [list, setList] = useState<Quest[]>([]);
  const [fetches, setFetches] = useState<FetchItem[]>([]);
  const [masterStats, setMasterStats] = useState<MasterStats | null>(null);
  const [userShineRanking, setUserShineRanking] = useState<UserShineRanking>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [proposals, setProposals] = useState<PlotProposal[]>([]);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [showFetchForm, setShowFetchForm] = useState(false);
  const [fetchTitle, setFetchTitle] = useState("");
  const [fetchDescription, setFetchDescription] = useState("");
  const [fetchMinActions, setFetchMinActions] = useState("");
  const [fetchRemReward, setFetchRemReward] = useState("");
  const [fetchExpReward, setFetchExpReward] = useState("");
  const [fetchRequirements, setFetchRequirements] = useState<FetchItem["requirements"] | undefined>(undefined);
  const [submittingFetch, setSubmittingFetch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canAccessGestione, setCanAccessGestione] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      api.get("/quests").then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
      api.get("/fetches").then((d) => (Array.isArray(d) ? d : [])).catch(() => []),
      api.get("/characters/me").then((c: { canAccessGestione?: boolean }) => {
        setCanAccessGestione(c?.canAccessGestione ?? false);
        return c?.canAccessGestione ?? false;
      }).catch(() => false),
    ])
      .then(async ([q, f, canAccess]) => {
        setList(q);
        setFetches(f);
        
        // Carica statistiche master solo se ha accesso
        if (canAccess) {
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
      })
      .catch((e) => setError(e?.message ?? "Errore"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="flex items-center justify-center py-8">Caricamento…</div>;
  if (error) return <div className="flex items-center justify-center py-8 text-red-400">{error}</div>;

  return (
    <div className="space-y-4">
      {/* Classifica Master (solo Admin/Mod) */}
      {canAccessGestione && (
        <section className="border border-[var(--border-color)] rounded-lg p-4">
          <h2 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-3">Classifica Master</h2>
          
          {masterStats ? (
            <div className="space-y-4">
              {/* Miglior Master del Mese */}
              {masterStats.bestMaster ? (
                <div className="p-3 rounded border border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/10">
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
              ) : (
                <p className="text-xs text-gray-500">Nessun master questo mese.</p>
              )}

              {/* Lista Master */}
              {masterStats.masters.length > 0 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Lista Master</p>
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {masterStats.masters.map((master, idx) => (
                      <li key={master.masterId} className="py-2 border-b border-[var(--border-color)] last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--accent-gold)] font-bold">#{idx + 1}</span>
                              <p className="font-display text-sm">{master.masterName}</p>
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
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nessuna quest chiusa questo mese.</p>
              )}

              {/* Classifica Utenti (Shine) */}
              {userShineRanking.length > 0 && (
                <div className="pt-4 border-t border-[var(--border-color)]">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Classifica Utenti (Punti Shine)</p>
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {userShineRanking.slice(0, 10).map((user, idx) => (
                      <li key={user.characterId} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--accent-gold)] font-bold w-6">#{idx + 1}</span>
                          <span>{user.characterName}</span>
                        </div>
                        <span className="text-[var(--accent-violet)]">{user.shinePoints} shine</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Caricamento statistiche…</p>
          )}
        </section>
      )}

      {/* Sezione Lore */}
      <section className="border border-[var(--border-color)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm uppercase tracking-wider text-[var(--accent-gold)]">Sezione Lore</h2>
          <button
            type="button"
            onClick={() => setShowProposalForm(!showProposalForm)}
            className="px-3 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10"
          >
            {showProposalForm ? "Annulla" : "Nuova Proposta"}
          </button>
        </div>

        {/* Form nuova proposta */}
        {showProposalForm && (
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
                // Ricarica proposte
                const updated = await api.get("/lore/proposals").then((d) => (Array.isArray(d) ? d : []) as PlotProposal[]).catch(() => []);
                setProposals(updated);
              } catch (e: unknown) {
                alert(e instanceof Error ? e.message : "Errore durante l'invio");
              } finally {
                setSubmittingProposal(false);
              }
            }}
            className="mb-4 p-3 rounded border border-[var(--border-color)] bg-black/20"
          >
            <input
              type="text"
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="Titolo proposta"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm mb-2"
              required
            />
            <textarea
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              placeholder="Descrizione (opzionale)"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={submittingProposal}
                className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
              >
                {submittingProposal ? "…" : "Invia Proposta"}
              </button>
            </div>
          </form>
        )}

        {/* Proposte Pending (solo Admin/Mod/Capo) */}
        {canAccessGestione && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Proposte in Attesa</p>
            {proposals.filter((p) => p.status === "PENDING").length === 0 ? (
              <p className="text-sm text-gray-500">Nessuna proposta in attesa.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {proposals
                  .filter((p) => p.status === "PENDING")
                  .map((proposal) => (
                    <li key={proposal.id} className="py-2 border-b border-[var(--border-color)] last:border-0">
                      <p className="font-display text-sm">{proposal.title}</p>
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
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        {/* Trame */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Trame</p>
          {plots.length === 0 ? (
            <p className="text-sm text-gray-500">Nessuna trama.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {plots.map((plot) => (
                <li key={plot.id} className="py-2 border-b border-[var(--border-color)] last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-sm">{plot.title}</p>
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Fetch Quest (Bacheca interna) */}
      <section className="border border-[var(--border-color)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm uppercase tracking-wider text-[var(--accent-gold)]">Fetch Quest (Bacheca interna)</h2>
          <button
            type="button"
            onClick={() => setShowFetchForm(!showFetchForm)}
            className="px-3 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10"
          >
            {showFetchForm ? "Annulla" : "Nuova Fetch"}
          </button>
        </div>

        {/* Form nuova fetch */}
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
                  requirements: fetchRequirements || undefined,
                  rewardConfig: {
                    minActions: fetchMinActions ? Number(fetchMinActions) : undefined,
                    remReward: fetchRemReward ? Number(fetchRemReward) : undefined,
                    expReward: fetchExpReward ? Number(fetchExpReward) : undefined,
                  },
                });
                setFetchTitle("");
                setFetchDescription("");
                setFetchMinActions("");
                setFetchRemReward("");
                setFetchExpReward("");
                setFetchRequirements(undefined);
                setShowFetchForm(false);
                // Ricarica fetch
                const updated = await api.get("/fetches").then((d) => (Array.isArray(d) ? d : []) as FetchItem[]).catch(() => []);
                setFetches(updated);
              } catch (e: unknown) {
                alert(e instanceof Error ? e.message : "Errore durante la creazione");
              } finally {
                setSubmittingFetch(false);
              }
            }}
            className="mb-4 p-3 rounded border border-[var(--border-color)] bg-black/20"
          >
            <input
              type="text"
              value={fetchTitle}
              onChange={(e) => setFetchTitle(e.target.value)}
              placeholder="Titolo fetch"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm mb-2"
              required
            />
            <textarea
              value={fetchDescription}
              onChange={(e) => setFetchDescription(e.target.value)}
              placeholder="Descrizione (opzionale)"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm resize-none mb-2"
              rows={2}
            />
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Configurazione Premi (opzionale)</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={fetchMinActions}
                  onChange={(e) => setFetchMinActions(e.target.value)}
                  placeholder="Min azioni (default: 4)"
                  className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-xs"
                  min="1"
                />
                <input
                  type="number"
                  value={fetchRemReward}
                  onChange={(e) => setFetchRemReward(e.target.value)}
                  placeholder="REM premio (default: 50)"
                  className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-xs"
                  min="0"
                />
                <input
                  type="number"
                  value={fetchExpReward}
                  onChange={(e) => setFetchExpReward(e.target.value)}
                  placeholder="EXP premio (default: 0)"
                  className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-xs"
                  min="0"
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-1">
                Lascia vuoto per usare i valori di default (4 azioni, 50 REM, 0 EXP)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submittingFetch}
                className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
              >
                {submittingFetch ? "…" : "Crea Fetch"}
              </button>
            </div>
          </form>
        )}

        {fetches.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna fetch.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {fetches.map((f) => (
              <li key={f.id} className="py-2 border-b border-[var(--border-color)] last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm">{f.title}</p>
                    {f.description && <p className="text-xs text-gray-500 mt-1">{f.description}</p>}
                    <p className="text-xs text-gray-600 mt-1">
                      Status: {f.status} · Requisiti: {f.requirements.levelMin ? `Liv. ${f.requirements.levelMin}` : ""}
                      {f.requirements.order && f.requirements.order.length > 0 && ` · ${f.requirements.order.join(", ")}`}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quest */}
      <section className="border border-[var(--border-color)] rounded-lg p-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-3">Quest</h2>
        {list.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna quest.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {list.map((q) => (
              <li key={q.id} className="py-2 border-b border-[var(--border-color)] last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm">{q.title}</span>
                  <span className="text-xs text-gray-500">{q.status} · {q.participantCount} part.</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
