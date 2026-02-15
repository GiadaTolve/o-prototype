"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { icons } from "@/lib/icons";
import { PixelIcons } from "./PixelIcons";
import { api } from "@/lib/api";
import type { Presente, PrefetturaId, MeteoPrefettura } from "./types";
import {
  PREFETTURE_OGON,
  MOCK_METEO,
  getMockEventInProgress,
} from "./types";

const METEO_ICONS: Record<MeteoPrefettura["icon"], IconDefinition> = {
  sun: icons.sun,
  cloud: icons.cloud,
  "cloud-sun": icons.weather,
  rain: icons.rain,
};

type FetchItem = { id: string; title: string; assignedTo: string | null };

type Props = {
  presenti: Presente[];
  prefettura: PrefetturaId | null;
  onOpenPresenti: () => void;
  onOpenFetch?: () => void;
};

export function DashboardRightCol({ presenti, prefettura, onOpenPresenti, onOpenFetch }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [fetches, setFetches] = useState<FetchItem[]>([]);
  const [meteo, setMeteo] = useState<MeteoPrefettura | null>(null);

  const loadFetches = useCallback(() => {
    api.get("/fetches")
      .then((d: unknown) => setFetches(Array.isArray(d) ? (d as FetchItem[]) : []))
      .catch(() => setFetches([]));
  }, []);

  const loadMeteo = useCallback(() => {
    if (!prefettura) {
      setMeteo(null);
      return;
    }
    api.get(`/meteo/${prefettura}`)
      .then((d: unknown) => {
        const x = d as { temp?: number; condition?: string; icon?: MeteoPrefettura["icon"] } | undefined;
        if (x && typeof x.temp === "number" && x.condition && x.icon) {
          setMeteo({ temp: x.temp, condition: x.condition, icon: x.icon });
        } else {
          // Fallback a mock se non esiste nel DB
          setMeteo(MOCK_METEO[prefettura] ?? null);
        }
      })
      .catch(() => {
        // Fallback a mock in caso di errore
        setMeteo(prefettura ? MOCK_METEO[prefettura] ?? null : null);
      });
  }, [prefettura]);

  useEffect(() => {
    loadFetches();
  }, [loadFetches]);

  useEffect(() => {
    loadMeteo();
  }, [loadMeteo]);
  const pre = prefettura ? PREFETTURE_OGON.find((p) => p.id === prefettura)! : null;
  const eventInProgress = getMockEventInProgress();

  return (
    <aside className="flex flex-col gap-4 w-full lg:max-w-[260px] shrink-0 order-3 min-h-0 overflow-y-auto">
      {/* Meteo — collegato automaticamente alla zona (Edo/Kessen/Kotowari). Sogno/Limbo/Altrove: N/D. */}
      <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-3 font-display flex items-center gap-2">
          <FontAwesomeIcon icon={icons.weather} className="w-3 h-3" />
          Prefettura
        </h3>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {meteo && pre ? (
              <>
                <FontAwesomeIcon
                  icon={METEO_ICONS[meteo.icon]}
                  className="w-8 h-8 text-[var(--accent-gold)]/80 shrink-0"
                />
                <div>
                  <p className="font-display text-lg text-white">{meteo.temp}°C</p>
                  <p className="text-xs text-gray-500 truncate">
                    {pre.name} ({pre.cityLabel}) · {meteo.condition}
                  </p>
                </div>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={icons.map} className="w-8 h-8 text-gray-600 shrink-0" />
                <div>
                  <p className="font-display text-sm text-gray-500">—</p>
                  <p className="text-xs text-gray-500">Zona onirica · meteo N/D</p>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCalendarOpen((o) => !o)}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded border border-[var(--border-color)] text-gray-500 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
            title="Calendario eventi"
            aria-expanded={calendarOpen}
            aria-label="Mostra eventi in corso"
          >
            <FontAwesomeIcon icon={icons.calendar} className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-gray-600">
          Meteo = zona attuale (mappa). Edo → Edo, Kessen → Kessen, Kotowari → Kotowari.
        </p>
        {calendarOpen && (
          <div className="mt-3 p-3 rounded border border-[var(--border-color)] bg-black/40">
            {eventInProgress?.inProgress ? (
              <p className="text-sm text-[var(--accent-gold)] font-display">
                {eventInProgress.title}
              </p>
            ) : (
              <p className="text-xs text-gray-500">Nessun evento in corso.</p>
            )}
            <p className="text-[10px] text-gray-600 mt-1">
              Eventi e calendario gestiti da mod/admin (pannello gestionale).
            </p>
          </div>
        )}
      </section>

      {/* Fetch (Missioni) — sotto al calendario; a scorrimento; click apre finestra Fetch */}
      {onOpenFetch && (
        <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display flex items-center gap-2">
              <FontAwesomeIcon icon={icons.trophy} className="w-3 h-3" />
              Fetch (Missioni)
            </h3>
            <button
              type="button"
              onClick={onOpenFetch}
              className="text-[10px] uppercase tracking-wider text-[var(--accent-gold)] hover:underline"
            >
              Apri
            </button>
          </div>
          <div className="max-h-28 overflow-y-auto space-y-1.5">
            {fetches.length === 0 ? (
              <p className="text-xs text-gray-500">Nessuna missione.</p>
            ) : (
              fetches.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={onOpenFetch}
                  className="w-full text-left px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/20 text-xs text-gray-300 hover:border-[var(--accent-gold)]/50 hover:text-[var(--accent-gold)] truncate block"
                >
                  {f.title}
                  {f.assignedTo && <span className="text-gray-500 ml-1">· Assegnata</span>}
                </button>
              ))
            )}
          </div>
        </section>
      )}

      {/* Lista Presenti — mock; click apre Presenti Estesi */}
      <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-3 font-display flex items-center gap-2">
          <FontAwesomeIcon icon={icons.presenti} className="w-3 h-3" />
          Lista Presenti
        </h3>
        <ul className="space-y-1.5 mb-3">
          {presenti.map((p) => (
            <li
              key={p.id}
              className="text-xs text-gray-400 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
              {p.isMe && <span className="text-[var(--accent-gold)]">Tu</span>}
              <button
                type="button"
                className={`flex items-center gap-1.5 flex-1 min-w-0 text-left ${
                  p.isMe ? "text-[var(--accent-gold)]" : ""
                } hover:text-[var(--accent-gold)]`}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("openProfileWindow", {
                      detail: { characterId: p.id },
                    })
                  )
                }
              >
                <span className="truncate min-w-0">{p.name}</span>
                <PixelIcons pixelIcons={p.pixelIcons} className="shrink-0" />
              </button>
              {p.zone && <span className="text-gray-500 shrink-0">{p.zone}</span>}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onOpenPresenti}
          className="w-full text-left text-xs text-gray-500 hover:text-[var(--accent-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/50 rounded py-1 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={icons.presenti} className="w-3.5 h-3.5" />
          Apri Presenti Estesi
        </button>
      </section>
    </aside>
  );
}
