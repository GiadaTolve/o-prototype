"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";

type FetchRequirements = {
  levelMin?: number;
  levelMax?: number;
  gradeIds?: string[];
  order?: string[];
  plotIds?: string[];
  limitPerDay?: number;
  limitPerWeek?: number;
};

type FetchRewardConfig = {
  minActions?: number;
  remReward?: number;
  expReward?: number;
};

type FetchItem = {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  requirements?: FetchRequirements;
  rewardConfig?: FetchRewardConfig | null;
};

type ConcludedFetch = {
  id: string;
  title: string;
  description: string | null;
  completedAt: string | null;
  responsoComment: string | null;
  participantNames: string[];
};

type SelectedFetchDetail =
  | { type: "available" | "assigned"; item: FetchItem }
  | { type: "concluded"; item: ConcludedFetch };

function formatRequirements(req: FetchRequirements | undefined): string {
  if (!req || Object.keys(req).length === 0) return "";
  const parts: string[] = [];
  if (req.levelMin != null) parts.push(`Liv. min ${req.levelMin}`);
  if (req.levelMax != null) parts.push(`Liv. max ${req.levelMax}`);
  if (req.order?.length) parts.push(req.order.join(", "));
  if (req.gradeIds?.length) parts.push("Grado richiesto");
  if (req.plotIds?.length) parts.push("Trama richiesta");
  if (req.limitPerDay != null) parts.push(`${req.limitPerDay}/giorno`);
  if (req.limitPerWeek != null) parts.push(`${req.limitPerWeek}/settimana`);
  return parts.join(" · ");
}

function formatRewards(rc: FetchRewardConfig | null | undefined): string {
  if (!rc) return "4 azioni min, 50 REM (default)";
  const min = rc.minActions ?? 4;
  const rem = rc.remReward ?? 50;
  const exp = rc.expReward ?? 0;
  const parts = [`≥${min} azioni`, `${rem} REM`];
  if (exp > 0) parts.push(`${exp} EXP`);
  return parts.join(", ");
}

type Props = {
  /** mobile = layout a colonna singola per tab smartphone */
  variant?: "default" | "mobile";
};

export function FetchPanel({ variant = "default" }: Props) {
  const isMobile = variant === "mobile";
  const gridClass = isMobile ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 sm:grid-cols-4 gap-4";
  const cardHeightClass = isMobile ? "min-h-[168px]" : "h-[200px]";
  const concludedGridClass = isMobile ? "grid grid-cols-1 gap-2 mt-3" : "grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto mt-3";

  const [list, setList] = useState<FetchItem[]>([]);
  const [concluded, setConcluded] = useState<ConcludedFetch[]>([]);
  const [myFetch, setMyFetch] = useState<FetchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SelectedFetchDetail | null>(null);
  const [showConcluded, setShowConcluded] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/fetches").then((d) => (Array.isArray(d) ? d : []) as FetchItem[]),
      api.get("/fetches/my").then((d) => d as FetchItem | { assigned: false }),
      api.get("/fetches/my/concluded").then((d) => (Array.isArray(d) ? d : []) as ConcludedFetch[]).catch(() => []),
    ])
      .then(([arr, my, concl]) => {
        setList(Array.isArray(arr) ? arr : []);
        setMyFetch(my && "id" in my && my.id ? (my as FetchItem) : null);
        setConcluded(Array.isArray(concl) ? concl : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async (id: string) => {
    setAssigningId(id);
    try {
      await api.post(`/fetches/${id}/assign`, {});
      load();
    } catch {
      /* ignore */
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento…</p>;
  }

  return (
    <div
      className={`min-h-0 flex flex-col ${isMobile ? "flex-1 h-full" : ""}`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(20, 15, 30, 0.95), rgba(10, 8, 15, 0.98)), url('/backgrounds/darkstone.png')",
        backgroundRepeat: "repeat",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="shrink-0 py-3 px-3 border-b border-[var(--accent-gold)]/30">
        <h2 className="text-center font-display text-sm uppercase tracking-[0.25em] text-[var(--accent-gold)]">
          Assegnazioni
        </h2>
        <p className="text-center text-[10px] text-gray-500 mt-0.5 tracking-wider px-2 max-w-md mx-auto">
          Notifiche disponibili dal cerca-persone: Le assegnazioni possono arrivare direttamente dal proprio Ordine, o da aristocratici del Paradise.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 min-h-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-display">
            {myFetch ? "Assegnata a te · Disponibili" : "Disponibili"}
          </p>
          {!myFetch && list.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Nessuna missione approvata disponibile.</p>
          ) : (
            <ul className={gridClass}>
              {myFetch && (
                <li key="my" className={`relative ${cardHeightClass}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedDetail({ type: "assigned", item: myFetch })}
                    className="absolute inset-0 flex flex-col rounded-lg border-2 border-[var(--accent-violet)]/60 bg-[var(--accent-violet)]/15 px-4 py-3 overflow-hidden text-left cursor-pointer hover:border-[var(--accent-violet)]/80 transition-colors"
                    style={{ boxShadow: "0 4px 12px var(--shadow-violet), inset 0 1px 0 rgba(255,255,255,0.05)" }}
                  >
                    <span
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-[var(--accent-violet)] bg-[var(--accent-violet)]/80 shrink-0"
                      aria-hidden
                    />
                    <p className="text-[9px] uppercase tracking-widest text-[var(--accent-violet-light)] text-center mt-1 flex-shrink-0">
                      Assegnata a te
                    </p>
                    <p className="font-display text-sm text-white text-center line-clamp-2 mt-1 flex-shrink-0">{myFetch.title}</p>
                    {myFetch.description && (
                      <p className="text-[10px] text-gray-400 text-center line-clamp-2 mt-1 flex-1 min-h-0">{myFetch.description}</p>
                    )}
                    <div className="flex-1 min-h-4" />
                    <span className="text-[9px] text-[var(--accent-violet-light)]/70 mt-auto">Clicca per leggere tutto</span>
                  </button>
                </li>
              )}
              {list
                .filter((f) => !myFetch || f.id !== myFetch.id)
                .map((f) => (
                  <li key={f.id} className={`relative ${cardHeightClass} ${f.assignedTo ? "opacity-50" : ""}`}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDetail({ type: "available", item: f })}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedDetail({ type: "available", item: f })}
                      className={`absolute inset-0 flex flex-col rounded-lg transition-colors px-4 py-3 overflow-hidden text-left cursor-pointer ${
                        f.assignedTo
                          ? "border border-[var(--border-color)]/50 bg-black/60"
                          : "border border-[var(--border-color)] bg-black/40 hover:border-[var(--accent-gold)]/40"
                      }`}
                      style={{
                        boxShadow: f.assignedTo ? "none" : "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
                      }}
                    >
                      <span
                        className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border shrink-0 ${
                          f.assignedTo ? "border-gray-600 bg-black/60" : "border-[var(--accent-gold)]/60 bg-[var(--panel-bg)]"
                        }`}
                        aria-hidden
                      />
                      <p
                        className={`font-display text-sm text-center line-clamp-2 mt-1 flex-shrink-0 ${f.assignedTo ? "text-gray-500" : "text-[var(--accent-gold)]"}`}
                      >
                        {f.title}
                      </p>
                      {f.description && (
                        <p className="text-[10px] text-center line-clamp-2 mt-0.5 flex-shrink-0 text-gray-600">{f.description}</p>
                      )}
                      <div className="mt-2 space-y-0.5 text-[9px] flex-shrink-0 min-h-0 overflow-hidden text-gray-500">
                        {formatRequirements(f.requirements) && (
                          <p className="truncate">
                            <span className="text-gray-600">Req:</span> {formatRequirements(f.requirements)}
                          </p>
                        )}
                        <p className={`truncate ${f.assignedTo ? "text-gray-500" : "text-[var(--accent-gold)]/90"}`}>
                          <span className="text-gray-600">Premi:</span> {formatRewards(f.rewardConfig)}
                        </p>
                      </div>
                      {!f.assignedTo ? (
                        <div className="mt-auto pt-2 border-t border-[var(--border-color)]/50 flex justify-center flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              assign(f.id);
                            }}
                            disabled={assigningId !== null}
                            className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[10px] uppercase tracking-wider text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50 transition-colors"
                          >
                            {assigningId === f.id ? "…" : "Assegna a me"}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-auto text-[10px] text-gray-500 text-center italic flex-shrink-0">Assegnata</p>
                      )}
                      <span className={`text-[9px] mt-1 flex-shrink-0 ${f.assignedTo ? "text-gray-600" : "text-gray-500/70"}`}>
                        Clicca per leggere tutto
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {concluded.length > 0 && (
          <div className="pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setShowConcluded((v) => !v)}
              className="w-full py-2.5 px-3 rounded border border-[var(--border-color)]/50 bg-black/20 text-left text-sm text-gray-400 hover:border-[var(--accent-gold)]/40 hover:text-[var(--accent-gold)] transition-colors flex items-center justify-between gap-2"
            >
              <span className="font-display text-[10px] uppercase tracking-widest">Le tue missioni concluse</span>
              <span className="text-[10px]">{concluded.length} · {showConcluded ? "▲ Nascondi" : "▼ Mostra"}</span>
            </button>
            {showConcluded && (
              <ul className={concludedGridClass}>
                {concluded.map((c) => (
                  <li key={c.id} className={`relative ${isMobile ? "min-h-[100px]" : "h-[100px]"}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedDetail({ type: "concluded", item: c })}
                      className="absolute inset-0 flex flex-col rounded border border-[var(--border-color)]/40 bg-black/20 px-3 py-2 overflow-hidden text-left cursor-pointer hover:border-[var(--border-color)]/60 transition-colors"
                    >
                      <span className="absolute -top-0.5 left-3 w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" aria-hidden />
                      <p className="font-display text-xs text-gray-400 line-clamp-2 mt-1 flex-shrink-0">{c.title}</p>
                      {c.responsoComment && (
                        <p className="text-[9px] text-gray-500 line-clamp-1 mt-0.5 flex-shrink-0">{c.responsoComment}</p>
                      )}
                      <p className="text-[9px] text-gray-600 mt-auto line-clamp-1 flex-shrink-0">
                        {c.participantNames.length > 0 ? c.participantNames.join(", ") : "—"}
                      </p>
                      <span className="text-[8px] text-gray-600 mt-0.5">Clicca per dettagli</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {selectedDetail &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedDetail(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fetch-detail-title"
          >
            <div
              className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 relative flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                <h2 id="fetch-detail-title" className="font-display text-lg text-[var(--accent-gold)] pr-10">
                  {selectedDetail.item.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-[var(--accent-gold)] p-1"
                  aria-label="Chiudi"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedDetail.type === "assigned" && (
                  <p className="text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)]">Assegnata a te</p>
                )}
                {selectedDetail.type === "concluded" ? (
                  <>
                    {selectedDetail.item.description && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Descrizione</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedDetail.item.description}</p>
                      </div>
                    )}
                    {selectedDetail.item.responsoComment && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Responso Master</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedDetail.item.responsoComment}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500">
                      Conclusa da:{" "}
                      {selectedDetail.item.participantNames.length > 0
                        ? selectedDetail.item.participantNames.join(", ")
                        : "—"}
                    </p>
                  </>
                ) : (
                  <>
                    {selectedDetail.item.description && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Descrizione</p>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedDetail.item.description}</p>
                      </div>
                    )}
                    {formatRequirements(selectedDetail.item.requirements) && (
                      <p className="text-sm text-gray-400">
                        <span className="text-gray-500">Requisiti:</span> {formatRequirements(selectedDetail.item.requirements)}
                      </p>
                    )}
                    <p className="text-sm text-[var(--accent-gold)]/90">
                      <span className="text-gray-500">Premi:</span> {formatRewards(selectedDetail.item.rewardConfig)}
                    </p>
                    {selectedDetail.type === "available" && !selectedDetail.item.assignedTo && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            assign(selectedDetail.item.id);
                            setSelectedDetail(null);
                          }}
                          disabled={assigningId !== null}
                          className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-sm hover:bg-[var(--accent-gold)]/10 disabled:opacity-50 transition-colors"
                        >
                          {assigningId === selectedDetail.item.id ? "…" : "Assegna a me"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
