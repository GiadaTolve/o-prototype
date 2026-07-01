"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { icons } from "@/lib/icons";
import { PixelIcons } from "./PixelIcons";
import { api } from "@/lib/api";
import { presentiNameClass } from "@/lib/leveling";
import type { Presente, PrefetturaId, MeteoPrefettura } from "./types";
import { PREFETTURE_OGON, MOCK_METEO } from "./types";

type TodayEvent = { id: string; title: string; eventDate: string };

const METEO_ICONS: Record<MeteoPrefettura["icon"], IconDefinition> = {
  sun: icons.sun,
  cloud: icons.cloud,
  "cloud-sun": icons.weather,
  rain: icons.rain,
};

type FetchItem = { id: string; title: string; assignedTo: string | null };

type Props = {
  presenti: Presente[];
  /** true se la lista è fallback locale (server offline, errore API, sessione assente). */
  presentiAreMock?: boolean;
  prefettura: PrefetturaId | null;
  onOpenPresenti: () => void;
  onOpenFetch?: () => void;
  onOpenSpazioEventi?: () => void;
};

export function DashboardRightCol({
  presenti,
  presentiAreMock = false,
  prefettura,
  onOpenPresenti,
  onOpenFetch,
  onOpenSpazioEventi,
}: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [fetches, setFetches] = useState<FetchItem[]>([]);
  const [meteo, setMeteo] = useState<MeteoPrefettura | null>(null);
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);

  const loadTodayEvents = useCallback(() => {
    api
      .get("/admin/daily-events/today")
      .then((d: unknown) => setTodayEvents(Array.isArray(d) ? (d as TodayEvent[]) : []))
      .catch(() => setTodayEvents([]));
  }, []);

  const loadFetches = useCallback(() => {
    api.get("/fetches")
      .then((d: unknown) => setFetches(Array.isArray(d) ? (d as FetchItem[]) : []))
      .catch(() => setFetches([]));
  }, []);

  const loadMeteo = useCallback(() => {
    const pref = prefettura ?? "edo";
    api.get(`/meteo/${pref}`)
      .then((d: unknown) => {
        const x = d as { temp?: number; condition?: string; icon?: MeteoPrefettura["icon"] } | undefined;
        if (x && typeof x.temp === "number" && x.condition && x.icon) {
          setMeteo({ temp: x.temp, condition: x.condition, icon: x.icon });
        } else {
          setMeteo(MOCK_METEO[pref] ?? null);
        }
      })
      .catch(() => {
        setMeteo(MOCK_METEO[pref] ?? null);
      });
  }, [prefettura]);

  useEffect(() => {
    loadFetches();
  }, [loadFetches]);

  useEffect(() => {
    loadMeteo();
  }, [loadMeteo]);

  useEffect(() => {
    loadTodayEvents();
  }, [loadTodayEvents]);

  const pre = PREFETTURE_OGON.find((p) => p.id === (prefettura ?? "edo")) ?? null;
  const firstEventToday = todayEvents[0];

  return (
    <aside className="flex flex-col gap-4 w-full lg:max-w-[260px] shrink-0 order-3 min-h-0 overflow-y-auto overflow-x-hidden min-w-0">
      {/* Meteo — stile come MusicPlayer: cloudy.png, bordo viola, box-shadow */}
      <section className="p-2.5 rounded-lg border border-[var(--accent-violet)]/20 flex flex-col gap-2" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url('/backgrounds/cloudy.png')", backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
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
                    {pre.name} · {meteo.condition}
                  </p>
                </div>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={icons.weather} className="w-8 h-8 text-gray-600 shrink-0" />
                <div>
                  <p className="font-display text-sm text-gray-500">—</p>
                  <p className="text-xs text-gray-500">Caricamento meteo…</p>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCalendarOpen((o) => !o)}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded border border-white/10 text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors bg-black/30"
            title="Calendario eventi"
            aria-expanded={calendarOpen}
            aria-label="Mostra eventi in corso"
          >
            <FontAwesomeIcon icon={icons.calendar} className="w-4 h-4" />
          </button>
        </div>
        {calendarOpen && (
          <div className="mt-1 p-2 rounded border border-white/10 bg-black/50">
            {firstEventToday ? (
              <div className="space-y-1.5">
                {todayEvents.map((e) => (
                  <p key={e.id} className="text-sm text-[var(--accent-gold)] font-display">
                    {e.title}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Nessun evento in corso.</p>
            )}
            <p className="text-[10px] text-gray-600 mt-1">
              Perchè non vai a farti una passeggiata? La FOMO è pericolosa di sti tempi...
            </p>
          </div>
        )}
      </section>

      {/* Assegnazioni — sotto al calendario; a scorrimento; click apre finestra */}
      {onOpenFetch && (
        <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display flex items-center gap-2">
              <FontAwesomeIcon icon={icons.trophy} className="w-3 h-3" />
              Assegnazioni
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
                  className={`w-full text-left px-2 py-1.5 rounded border truncate block text-xs ${
                    f.assignedTo
                      ? "border-[var(--border-color)]/50 bg-black/30 text-gray-500 opacity-60"
                      : "border-[var(--border-color)] bg-black/20 text-gray-300 hover:border-[var(--accent-gold)]/50 hover:text-[var(--accent-gold)]"
                  }`}
                >
                  {f.title}
                  {f.assignedTo && <span className="ml-1">· Assegnata</span>}
                </button>
              ))
            )}
          </div>
        </section>
      )}

      {/* Spazio Eventi — stile O Primary (sweep); sopra Lista Presenti */}
      {onOpenSpazioEventi && (
        <div className="btn-primary-sweep-borders">
          <button
            type="button"
            onClick={onOpenSpazioEventi}
            className="btn-primary-sweep w-full flex items-center justify-center relative"
          >
            <span className="btn-primary-sweep-sweep" aria-hidden />
            <span className="relative z-10">PARADISE</span>
          </button>
        </div>
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
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.isShadow ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden />
              {p.isMe && <span className="text-[var(--accent-gold)]">Tu</span>}
              <button
                type="button"
                className={`flex items-center gap-1.5 flex-1 min-w-0 text-left ${presentiNameClass({
                  isMe: p.isMe,
                  isShadow: p.isShadow,
                  paragon: p.paragon,
                })} hover:text-[var(--accent-gold)]`}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("openProfileWindow", {
                      detail: p.isMe ? { characterId: p.id } : { characterId: p.id, openSms: true, name: p.name },
                    })
                  )
                }
              >
                <span className="truncate min-w-0">
                  {p.name}
                  {(p.paragon ?? 0) > 0 && (
                    <span className="text-[var(--accent-violet-light)]/90"> ★{p.paragon}</span>
                  )}
                </span>
                {p.isShadow && (
                  <FontAwesomeIcon icon={icons.eyeSlash} className="w-3 h-3 text-amber-400/80 shrink-0" title="Shadowban" aria-hidden />
                )}
                <PixelIcons pixelIcons={p.pixelIcons} className="shrink-0" />
              </button>
              {!p.isMe && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent("openProfileWindow", { detail: { characterId: p.id } }));
                  }}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-[var(--accent-gold)] hover:bg-white/5"
                  title="Vedi scheda"
                  aria-label="Vedi scheda"
                >
                  <FontAwesomeIcon icon={icons.user} className="w-3 h-3" />
                </button>
              )}
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
