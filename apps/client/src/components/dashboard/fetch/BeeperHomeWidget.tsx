"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import "./fetch-pager.css";

type FetchItem = {
  id: string;
  title: string;
  assignedTo: string | null;
};

type Props = {
  onOpen: () => void;
};

function truncateTitle(title: string, max = 28): string {
  const t = title.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function BeeperHomeWidget({ onOpen }: Props) {
  const [list, setList] = useState<FetchItem[]>([]);
  const [myFetchId, setMyFetchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/fetches").then((d) => (Array.isArray(d) ? d : []) as FetchItem[]),
      api.get("/fetches/my").then((d) => d as FetchItem | { assigned: false }),
    ])
      .then(([arr, my]) => {
        setList(Array.isArray(arr) ? arr : []);
        setMyFetchId(my && "id" in my && my.id ? my.id : null);
      })
      .catch(() => {
        setList([]);
        setMyFetchId(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const incomingCount = useMemo(
    () => list.filter((f) => !f.assignedTo && f.id !== myFetchId).length,
    [list, myFetchId],
  );

  const previewItems = useMemo(() => {
    const mine = myFetchId ? list.find((f) => f.id === myFetchId) : null;
    const others = list.filter((f) => f.id !== myFetchId).slice(0, mine ? 3 : 4);
    return mine ? [mine, ...others] : others;
  }, [list, myFetchId]);

  return (
    <section className="beeper-home" aria-label="Beeper — trasmissioni fetch">
      <div className="fetch-pager fetch-pager--home">
        <div className="fetch-pager__device beeper-home__device">
          <span className="fetch-pager__antenna" aria-hidden />
          <span className="fetch-pager__screw fetch-pager__screw--tl" aria-hidden />
          <span className="fetch-pager__screw fetch-pager__screw--tr" aria-hidden />
          <span className="fetch-pager__screw fetch-pager__screw--bl" aria-hidden />
          <span className="fetch-pager__screw fetch-pager__screw--br" aria-hidden />

          <div className="fetch-pager__top">
            <span className="fetch-pager__brand">OYASUMI · BEEPER</span>
            <div className="fetch-pager__status">
              <span
                className={`fetch-pager__led ${incomingCount > 0 ? "fetch-pager__led--live" : ""}`}
                aria-hidden
              />
              <span>
                {loading ? "SYNC…" : incomingCount > 0 ? `${incomingCount} NUOVI` : "IN ASCOLTO"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="fetch-pager__lcd beeper-home__lcd"
            onClick={onOpen}
            aria-label="Apri Beeper"
          >
            <div className="fetch-pager__lcd-scroll beeper-home__lcd-scroll">
              {loading ? (
                <p className="fetch-pager__empty beeper-home__empty">SINCRONIZZAZIONE…</p>
              ) : previewItems.length === 0 ? (
                <p className="fetch-pager__empty beeper-home__empty">— NESSUN SEGNALE —</p>
              ) : (
                previewItems.map((f) => {
                  const isMine = f.id === myFetchId;
                  const taken = Boolean(f.assignedTo) && !isMine;
                  return (
                    <div
                      key={f.id}
                      className={`beeper-home__line ${isMine ? "beeper-home__line--mine" : taken ? "beeper-home__line--taken" : "beeper-home__line--incoming"}`}
                    >
                      <span className="beeper-home__line-tag">
                        {isMine ? "TX" : taken ? "—" : "▼"}
                      </span>
                      <span className="beeper-home__line-title">{truncateTitle(f.title)}</span>
                    </div>
                  );
                })
              )}
              {!loading && list.length > previewItems.length && (
                <p className="beeper-home__more">+{list.length - previewItems.length} IN CODA</p>
              )}
            </div>
          </button>

          <div className="beeper-home__footer">
            <div className="fetch-pager__keys beeper-home__keys" aria-hidden>
              <span className="fetch-pager__key beeper-home__key" />
              <span className="fetch-pager__key beeper-home__key" />
            </div>
            <button type="button" className="beeper-home__open" onClick={onOpen}>
              <FontAwesomeIcon icon={icons.beeper} className="w-3 h-3" aria-hidden />
              APRI
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
