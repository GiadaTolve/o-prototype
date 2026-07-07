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
import { BeeperHomeWidget } from "./fetch/BeeperHomeWidget";

type TodayEvent = { id: string; title: string; eventDate: string };

const METEO_ICONS: Record<MeteoPrefettura["icon"], IconDefinition> = {
  sun: icons.sun,
  cloud: icons.cloud,
  "cloud-sun": icons.weather,
  rain: icons.rain,
};

type Props = {
  presenti: Presente[];
  /** true se la lista è fallback locale (server offline, errore API, sessione assente). */
  presentiAreMock?: boolean;
  prefettura: PrefetturaId | null;
  onOpenPresenti: () => void;
  onOpenFetch?: () => void;
  onOpenSpazioEventi?: () => void;
  onOpenCharacterSheet: (characterId: string) => void;
  onOpenSmsWith?: (target: { id: string; name: string }) => void;
};

export function DashboardRightCol({
  presenti,
  presentiAreMock = false,
  prefettura,
  onOpenPresenti,
  onOpenFetch,
  onOpenSpazioEventi,
  onOpenCharacterSheet,
  onOpenSmsWith,
}: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [meteo, setMeteo] = useState<MeteoPrefettura | null>(null);
  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);

  const loadTodayEvents = useCallback(() => {
    api
      .get("/admin/daily-events/today")
      .then((d: unknown) => setTodayEvents(Array.isArray(d) ? (d as TodayEvent[]) : []))
      .catch(() => setTodayEvents([]));
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
    loadMeteo();
  }, [loadMeteo]);

  useEffect(() => {
    loadTodayEvents();
  }, [loadTodayEvents]);

  const pre = PREFETTURE_OGON.find((p) => p.id === (prefettura ?? "edo")) ?? null;
  const firstEventToday = todayEvents[0];

  return (
    <aside className="dashboard-right-col flex flex-col gap-4 w-full lg:w-auto lg:basis-[clamp(190px,14vw,300px)] lg:shrink lg:grow-0 order-3 min-h-0 lg:h-full lg:max-h-full lg:overflow-hidden overflow-x-hidden min-w-0">
      {/* Meteo — stile come MusicPlayer: cloudy.png, bordo viola, box-shadow */}
      <section className="dashboard-side-panel dashboard-meteo-panel shrink-0 p-2.5 rounded-lg border border-[var(--accent-violet)]/20 flex flex-col gap-2" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url('/backgrounds/cloudy.png')", backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 4px 10px color-mix(in srgb, var(--panel-bg) 72%, black)" }}>
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
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded border border-[var(--border-color)] text-[var(--accent-violet-light)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors bg-black/30"
            title="Calendario eventi"
            aria-expanded={calendarOpen}
            aria-label="Mostra eventi in corso"
          >
            <FontAwesomeIcon icon={icons.calendar} className="w-4 h-4" />
          </button>
        </div>
        {calendarOpen && (
          <div className="mt-1 p-2 rounded border border-[var(--border-color)] bg-black/50">
            {firstEventToday ? (
              <div className="space-y-1.5">
                {todayEvents.map((e) => (
                  <p key={e.id} className="text-sm text-[var(--accent-gold)] font-display">
                    {e.title}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--accent-violet-light)]/70">Nessun evento in corso.</p>
            )}
            <p className="text-[10px] text-[var(--accent-violet-light)]/55 mt-1">
              Perchè non vai a farti una passeggiata? La FOMO è pericolosa di sti tempi...
            </p>
          </div>
        )}
      </section>

      {/* Beeper — mini pager Dark Arcane in home */}
      {onOpenFetch && (
        <div className="dashboard-beeper-slot shrink-0 min-h-0">
          <BeeperHomeWidget onOpen={onOpenFetch} />
        </div>
      )}

      {/* Spazio Eventi — Paradise */}
      {onOpenSpazioEventi && (
        <div className="dashboard-paradise-slot shrink-0 w-full">
          <button
            type="button"
            onClick={onOpenSpazioEventi}
            className="dashboard-paradise-btn group w-full"
          >
            <span
              className="dashboard-paradise-btn__spark dashboard-paradise-btn__spark--left"
              aria-hidden
            />
            <span className="dashboard-paradise-btn__label">Paradise</span>
            <span
              className="dashboard-paradise-btn__spark dashboard-paradise-btn__spark--right"
              aria-hidden
            />
          </button>
        </div>
      )}

      {/* Lista Presenti — mock; click apre Presenti Estesi */}
      <section className="dashboard-side-panel dashboard-presenti-section flex-1 min-h-0 flex flex-col bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-3 font-display flex items-center gap-2 shrink-0">
          <FontAwesomeIcon icon={icons.presenti} className="w-3 h-3" />
          Lista Presenti
        </h3>
        <ul className="dashboard-presenti-list space-y-1.5 mb-3 min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          {presenti.map((p) => (
            <li
              key={p.id}
              className="text-xs text-[var(--accent-violet-light)] flex items-center gap-2"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.isShadow ? "bg-[var(--accent-violet)]" : "bg-[var(--accent-gold)]"}`}
                aria-hidden
              />
              {p.isMe && <span className="text-[var(--accent-gold)]">Tu</span>}
              <button
                type="button"
                className={`flex items-center gap-1.5 flex-1 min-w-0 text-left ${presentiNameClass({
                  isMe: p.isMe,
                  isShadow: p.isShadow,
                  paragon: p.paragon,
                })} hover:text-[var(--accent-gold)]`}
                onClick={() => {
                  if (p.isMe) {
                    onOpenCharacterSheet(p.id);
                  } else {
                    onOpenSmsWith?.({ id: p.id, name: p.name });
                  }
                }}
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
                  onClick={() => onOpenCharacterSheet(p.id)}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[var(--accent-violet-light)]/70 hover:text-[var(--accent-gold)] hover:bg-[color-mix(in_srgb,var(--panel-bg)_80%,black)]"
                  title="Vedi scheda"
                  aria-label="Vedi scheda"
                >
                  <FontAwesomeIcon icon={icons.user} className="w-3 h-3" />
                </button>
              )}
              {p.zone && <span className="text-[var(--accent-violet-light)]/60 shrink-0">{p.zone}</span>}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onOpenPresenti}
          className="shrink-0 w-full text-left text-xs text-[var(--accent-violet-light)]/70 hover:text-[var(--accent-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/50 rounded py-1 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={icons.presenti} className="w-3.5 h-3.5" />
          Apri Presenti Estesi
        </button>
      </section>
    </aside>
  );
}
