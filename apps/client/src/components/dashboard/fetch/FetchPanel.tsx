"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import "./fetch-pager.css";

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
  if (req.levelMin != null) parts.push(`LV${req.levelMin}+`);
  if (req.levelMax != null) parts.push(`MAX${req.levelMax}`);
  if (req.order?.length) parts.push(req.order.join("/"));
  if (req.gradeIds?.length) parts.push("GRADO");
  if (req.plotIds?.length) parts.push("TRAMA");
  if (req.limitPerDay != null) parts.push(`${req.limitPerDay}/D`);
  if (req.limitPerWeek != null) parts.push(`${req.limitPerWeek}/S`);
  return parts.join(" ");
}

function formatRewards(rc: FetchRewardConfig | null | undefined): string {
  if (!rc) return "4 AZ · 50 REM";
  const min = rc.minActions ?? 4;
  const rem = rc.remReward ?? 50;
  const exp = rc.expReward ?? 0;
  const parts = [`${min} AZ`, `${rem} REM`];
  if (exp > 0) parts.push(`${exp} EXP`);
  return parts.join(" · ");
}

function truncatePager(text: string | null | undefined, max = 120): string {
  if (!text?.trim()) return "";
  const t = text.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

type Props = {
  /** mobile = stesso device, padding ridotto */
  variant?: "default" | "mobile";
};

export function FetchPanel({ variant = "default" }: Props) {
  const isMobile = variant === "mobile";

  const [list, setList] = useState<FetchItem[]>([]);
  const [concluded, setConcluded] = useState<ConcludedFetch[]>([]);
  const [myFetch, setMyFetch] = useState<FetchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SelectedFetchDetail | null>(null);
  const [showConcluded, setShowConcluded] = useState(false);
  const [passedIds, setPassedIds] = useState<Set<string>>(() => new Set());

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

  const availableList = useMemo(
    () => list.filter((f) => !myFetch || f.id !== myFetch.id),
    [list, myFetch],
  );

  const incomingCount = useMemo(
    () => availableList.filter((f) => !f.assignedTo && !passedIds.has(f.id)).length,
    [availableList, passedIds],
  );

  const assign = async (id: string) => {
    setAssigningId(id);
    try {
      await api.post(`/fetches/${id}/assign`, {});
      setPassedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      load();
    } catch {
      /* ignore */
    } finally {
      setAssigningId(null);
    }
  };

  const passMessage = (id: string) => {
    setPassedIds((prev) => new Set(prev).add(id));
  };

  if (loading) {
    return (
      <div className={`fetch-pager ${isMobile ? "fetch-pager--mobile" : ""}`}>
        <p className="fetch-pager-loading">SINCRONIZZAZIONE SEGNALE…</p>
      </div>
    );
  }

  return (
    <div className={`fetch-pager ${isMobile ? "fetch-pager--mobile" : ""}`}>
      <div className="fetch-pager__device">
        <div className="fetch-pager__top">
          <span className="fetch-pager__brand">OYASUMI · CERCA-PERSONE</span>
          <div className="fetch-pager__status">
            <span className={`fetch-pager__led ${incomingCount > 0 ? "fetch-pager__led--live" : ""}`} aria-hidden />
            <span>{incomingCount > 0 ? `${incomingCount} NUOVI` : "IN ASCOLTO"}</span>
          </div>
        </div>

        <div className="fetch-pager__lcd">
          <div className="fetch-pager__lcd-scroll">
            <p className="fetch-pager__hint">
              Trasmissioni da Ordine e Paradise. Accetta per rispondere al cercapersone — altrimenti resta in coda per altri.
            </p>

            {!myFetch && availableList.length === 0 ? (
              <p className="fetch-pager__empty">— NESSUN MESSAGGIO IN CODA —</p>
            ) : (
              <>
                {myFetch && (
                  <article className="fetch-pager__msg fetch-pager__msg--mine">
                    <div className="fetch-pager__msg-head">
                      <span className="fetch-pager__msg-tag fetch-pager__msg-tag--mine">CONFERMATO</span>
                      <span>TX OK</span>
                    </div>
                    <h3 className="fetch-pager__msg-title">{myFetch.title}</h3>
                    {myFetch.description && <p className="fetch-pager__msg-body">{truncatePager(myFetch.description, 200)}</p>}
                    <p className="fetch-pager__msg-meta">
                      <strong>STATO:</strong> ASSEGNATA A TE
                    </p>
                    <div className="fetch-pager__actions">
                      <button type="button" className="fetch-pager__btn fetch-pager__btn--ghost" onClick={() => setSelectedDetail({ type: "assigned", item: myFetch })}>
                        LEGGI
                      </button>
                    </div>
                  </article>
                )}

                {availableList.map((f) => {
                  const taken = Boolean(f.assignedTo);
                  const passed = passedIds.has(f.id);
                  return (
                    <article
                      key={f.id}
                      className={`fetch-pager__msg ${taken ? "fetch-pager__msg--taken" : passed ? "fetch-pager__msg--taken" : "fetch-pager__msg--incoming"}`}
                    >
                      <div className="fetch-pager__msg-head">
                        <span className="fetch-pager__msg-tag">
                          {taken ? "OCCUPATO" : passed ? "IN CODA" : "▼ IN ARRIVO"}
                        </span>
                        <span>{taken ? "ALTRO PG" : passed ? "PASSATO" : "NUOVO"}</span>
                      </div>
                      <h3 className="fetch-pager__msg-title">{f.title}</h3>
                      {f.description && !passed && (
                        <p className="fetch-pager__msg-body">{truncatePager(f.description)}</p>
                      )}
                      {!passed && (
                        <p className="fetch-pager__msg-meta">
                          {formatRequirements(f.requirements) && (
                            <>
                              <strong>RIC:</strong> {formatRequirements(f.requirements)}
                              <br />
                            </>
                          )}
                          <strong>PREMIO:</strong> {formatRewards(f.rewardConfig)}
                        </p>
                      )}
                      {!taken && !passed && (
                        <div className="fetch-pager__actions">
                          <button
                            type="button"
                            className="fetch-pager__btn fetch-pager__btn--accept"
                            disabled={assigningId !== null}
                            onClick={() => assign(f.id)}
                          >
                            {assigningId === f.id ? "TX…" : "ACCETTA"}
                          </button>
                          <button type="button" className="fetch-pager__btn fetch-pager__btn--ghost" onClick={() => passMessage(f.id)}>
                            PASSA
                          </button>
                          <button type="button" className="fetch-pager__btn fetch-pager__btn--ghost" onClick={() => setSelectedDetail({ type: "available", item: f })}>
                            LEGGI
                          </button>
                        </div>
                      )}
                      {passed && !taken && (
                        <div className="fetch-pager__actions">
                          <button
                            type="button"
                            className="fetch-pager__btn fetch-pager__btn--accept"
                            disabled={assigningId !== null}
                            onClick={() => assign(f.id)}
                          >
                            ACCETTA ORA
                          </button>
                          <button type="button" className="fetch-pager__btn fetch-pager__btn--ghost" onClick={() => setPassedIds((p) => { const n = new Set(p); n.delete(f.id); return n; })}>
                            RIPRISTINA
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </>
            )}

            {concluded.length > 0 && (
              <>
                <button type="button" className="fetch-pager__archive-toggle" onClick={() => setShowConcluded((v) => !v)}>
                  ARCHIVIO TRASMISSIONI · {concluded.length} {showConcluded ? "▲" : "▼"}
                </button>
                {showConcluded &&
                  concluded.map((c) => (
                    <article key={c.id} className="fetch-pager__msg fetch-pager__archive-item">
                      <div className="fetch-pager__msg-head">
                        <span className="fetch-pager__msg-tag">ARCHIVIO</span>
                        <span>OK</span>
                      </div>
                      <h3 className="fetch-pager__msg-title">{c.title}</h3>
                      {c.responsoComment && <p className="fetch-pager__msg-body">{truncatePager(c.responsoComment, 80)}</p>}
                      <p className="fetch-pager__msg-meta">
                        {c.participantNames.length > 0 ? c.participantNames.join(", ") : "—"}
                      </p>
                      <button type="button" className="fetch-pager__btn fetch-pager__btn--ghost" onClick={() => setSelectedDetail({ type: "concluded", item: c })}>
                        DETTAGLI
                      </button>
                    </article>
                  ))}
              </>
            )}
          </div>
        </div>

        <div className="fetch-pager__keys" aria-hidden>
          <span className="fetch-pager__key" />
          <span className="fetch-pager__key" />
          <span className="fetch-pager__key" />
        </div>
      </div>

      {selectedDetail &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
            onClick={() => setSelectedDetail(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fetch-pager-detail-title"
          >
            <div className="fetch-pager-modal" onClick={(e) => e.stopPropagation()}>
              <div className="fetch-pager-modal__bar">
                <span>MESSAGGIO COMPLETO</span>
                <button type="button" className="fetch-pager-modal__close" onClick={() => setSelectedDetail(null)}>
                  CHIUDI
                </button>
              </div>
              <div className="fetch-pager-modal__lcd">
                <h2 id="fetch-pager-detail-title" className="fetch-pager-modal__title">
                  {selectedDetail.item.title}
                </h2>
                {selectedDetail.type === "assigned" && (
                  <p className="fetch-pager__msg-meta">
                    <strong>STATO:</strong> CONFERMATO · ASSEGNATA A TE
                  </p>
                )}
                {selectedDetail.type === "concluded" ? (
                  <>
                    {selectedDetail.item.description && (
                      <>
                        <p className="fetch-pager-modal__label">Testo</p>
                        <p>{selectedDetail.item.description}</p>
                      </>
                    )}
                    {selectedDetail.item.responsoComment && (
                      <>
                        <p className="fetch-pager-modal__label">Responso Master</p>
                        <p>{selectedDetail.item.responsoComment}</p>
                      </>
                    )}
                    <p className="fetch-pager-modal__label">Conclusa da</p>
                    <p>{selectedDetail.item.participantNames.length > 0 ? selectedDetail.item.participantNames.join(", ") : "—"}</p>
                  </>
                ) : (
                  <>
                    {selectedDetail.item.description && (
                      <>
                        <p className="fetch-pager-modal__label">Testo</p>
                        <p>{selectedDetail.item.description}</p>
                      </>
                    )}
                    {formatRequirements(selectedDetail.item.requirements) && (
                      <>
                        <p className="fetch-pager-modal__label">Requisiti</p>
                        <p>{formatRequirements(selectedDetail.item.requirements)}</p>
                      </>
                    )}
                    <p className="fetch-pager-modal__label">Premio</p>
                    <p>{formatRewards(selectedDetail.item.rewardConfig)}</p>
                    {selectedDetail.type === "available" && !selectedDetail.item.assignedTo && (
                      <div className="fetch-pager__actions" style={{ marginTop: "1rem" }}>
                        <button
                          type="button"
                          className="fetch-pager__btn fetch-pager__btn--accept"
                          disabled={assigningId !== null}
                          onClick={() => {
                            assign(selectedDetail.item.id);
                            setSelectedDetail(null);
                          }}
                        >
                          {assigningId === selectedDetail.item.id ? "TX…" : "ACCETTA"}
                        </button>
                        <button type="button" className="fetch-pager__btn fetch-pager__btn--ghost" onClick={() => setSelectedDetail(null)}>
                          PASSA
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
