"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import { SmsPanel } from "./sms/SmsPanel";
import { FetchPanel } from "./fetch/FetchPanel";
import { PixelIcons } from "./PixelIcons";
import { formatNarrativeText } from "@/lib/narrative-parser";
import { getPixelIconUrlRuolo, getPixelIconUrlOrdine, type PixelIconRuolo, type PixelIconOrdine } from "./pixel-icons";
import type { WindowId, CharacterSummary, Presente } from "./types";
import { WINDOW_LABELS } from "./types";
import { SchedaSkiruPage } from "./SchedaSkiruPage";
import { SchedaWazaPage } from "./SchedaWazaPage";
import { SchedaRichiestePage } from "./SchedaRichiestePage";
import { InventorySection } from "./inventory/InventorySection";
import { SkiruWazaPanel } from "./SkiruWazaPanel";
import { MercatoPanel } from "./mercato/MercatoPanel";
import { resolveCharacterComputed, formatMovementMeters } from "./character-computed";
import { getMadoshoDef } from "@domain/progression/madosho";
import { resolveLevelFromExp, presentiNameClass } from "@/lib/leveling";

const PANEL_ICONS: Record<WindowId, (typeof icons)[keyof typeof icons]> = {
  scheda: icons.user,
  presenti: icons.presenti,
  sms: icons.message,
  fetch: icons.beeper,
  banca: icons.banca,
  mercato: icons.mercato,
  housing: icons.home,
  profilo: icons.user,
  waza: icons.waza,
  ordine: icons.ordine,
  bestiario: icons.trophy,
  notifiche: icons.bell,
  spazioEventi: icons.gamepad,
};

const STAT_LABELS: Record<string, string> = {
  f: "Forza",
  c: "Costituzione",
  d: "Destrezza",
  m: "Mente",
  e: "Empatia",
};

type Props = {
  windowId: WindowId;
  onLower: (id: WindowId) => void;
  onClose: (id: WindowId) => void;
  char?: CharacterSummary;
  presenti?: Presente[];
  /** ID personaggio per finestra profilo pubblico (aperta da "Presenti"). */
  profileCharacterId?: string;
  /** Target per apertura diretta SMS da Presenti: { id, name }. */
  smsTargetCharacterId?: { id: string; name: string } | null;
  /** Chiamato quando SMS segna thread come letti (per aggiornare badge). */
  onUnreadChange?: () => void;
  /** Chiamato quando le notifiche di sistema vengono lette (per aggiornare badge). */
  onNotificationsUnreadChange?: () => void;
  /** Chiamato quando il personaggio viene aggiornato (es. dopo transazione al mercato). */
  onCharUpdate?: () => void;
  /** Admin/master: può attivare/disattivare Circus (partychat). */
  canAccessGestione?: boolean;
};

/** Finestre con dimensione unificata: 80% della zona centrale */
const UNIFIED_PANEL_IDS = ["sms", "banca", "mercato", "ordine", "bestiario", "notifiche", "spazioEventi", "fetch"] as const;

/** Stesse dimensioni della colonna centrale (chat / main area) */
const MAIN_AREA_PANEL_IDS = ["scheda", "profilo", "waza"] as const;

export function DashboardWindowPanel({ windowId, onLower, onClose, char, presenti = [], profileCharacterId, smsTargetCharacterId, onUnreadChange, onNotificationsUnreadChange, onCharUpdate, canAccessGestione }: Props) {
  const isSms = windowId === "sms";
  const isFetch = windowId === "fetch";
  const isScheda = windowId === "scheda";
  const isProfilo = windowId === "profilo";
  const isSchedaLike = isScheda || isProfilo;
  const isMainAreaPanel = (MAIN_AREA_PANEL_IDS as readonly string[]).includes(windowId);
  const isUnifiedPanel = (UNIFIED_PANEL_IDS as readonly string[]).includes(windowId);
  return (
    <div
      className={`fixed inset-0 z-30 pointer-events-none ${
        isMainAreaPanel
          ? ""
          : "flex items-center justify-center p-4"
      }`}
      role="dialog"
      aria-label={WINDOW_LABELS[windowId]}
      aria-modal="true"
    >
      <div
        className={`relative flex flex-col overflow-hidden pointer-events-auto ${
          isFetch
            ? "w-full max-w-4xl h-[calc(80vh-5rem)]"
            : isMainAreaPanel
            ? "w-full max-w-full h-full md:w-[calc(100vw-37.75rem)] md:h-[calc(100vh-8rem)] md:absolute md:top-[calc(50%+5px)] md:left-[calc(50vw+0.625rem)] md:-translate-x-[50%] md:-translate-y-[50%] md:max-w-[calc(1800px-37.75rem)] bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg shadow-2xl"
            : isUnifiedPanel
            ? "w-full max-w-4xl h-[calc(80vh-5rem)] bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg shadow-2xl"
            : "w-full max-w-2xl max-h-[75vh] bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg shadow-2xl"
        }`}
      >
        {!isFetch && (
        <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-[var(--border-color)] bg-black/30">
          <h3 className="font-display text-sm uppercase tracking-widest text-[var(--accent-gold)] flex items-center gap-2">
            <FontAwesomeIcon icon={PANEL_ICONS[windowId]} className="w-4 h-4" />
            {WINDOW_LABELS[windowId]}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onLower(windowId)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[var(--accent-gold)] hover:bg-white/10 rounded transition-colors"
              title="Abbassa (in dock)"
              aria-label="Abbassa"
            >
              <FontAwesomeIcon icon={icons.minimize} className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onClose(windowId)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
              title="Chiudi"
              aria-label="Chiudi"
            >
              <FontAwesomeIcon icon={icons.close} className="w-4 h-4" />
            </button>
          </div>
        </div>
        )}
        {/* Contenuto scrollabile */}
        {isFetch ? (
          <FetchPanel
            variant="window"
            onLower={() => onLower(windowId)}
            onClose={() => onClose(windowId)}
          />
        ) : (
        <div
          className={`flex-1 min-h-0 overflow-hidden ${
            isSms
              ? "flex flex-col"
              : isMainAreaPanel
                ? "h-full"
                : windowId === "ordine"
                    ? "overflow-y-auto px-4 pt-0 pb-4"
                    : "overflow-y-auto px-4 py-4"
          }`}
        >
          {windowId === "scheda" && (
            <div className="h-full">
              <SchedaContent char={char} characterId={profileCharacterId} onCharUpdate={onCharUpdate} />
            </div>
          )}
          {windowId === "presenti" && <PresentiEstesiContent presenti={presenti} />}
          {windowId === "sms" && (
            <SmsPanel onUnreadChange={onUnreadChange} initialTargetCharacterId={smsTargetCharacterId ?? undefined} />
          )}
          {windowId === "banca" && <BancaContent char={char} onCharUpdate={onCharUpdate} />}
          {windowId === "mercato" && <MercatoPanel char={char} onCharUpdate={onCharUpdate} />}
          {windowId === "housing" && <HousingContent char={char} onCharUpdate={onCharUpdate} />}
          {windowId === "waza" && (
            <div className="h-full">
              <SkiruWazaPanel char={char} onCharUpdate={onCharUpdate} />
            </div>
          )}
          {windowId === "ordine" && <OrdineContent char={char} />}
          {windowId === "bestiario" && <BestiarioContent char={char} />}
          {windowId === "notifiche" && <NotificheContent onUnreadChange={onNotificationsUnreadChange} />}
          {windowId === "spazioEventi" && <SpazioEventiContent canAccessGestione={canAccessGestione} />}
        </div>
        )}
      </div>
    </div>
  );
}

type SystemNotification = {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  readAt: string | null;
  createdAt: string;
};

/** Room ID partychat (Circus) — chat anonima, regole a sé. */
const PARTYCHAT_ROOM_ID = "edo__paradise";

function SpazioEventiContent({ canAccessGestione }: { canAccessGestione?: boolean }) {
  const [state, setState] = useState<{ isOpen: boolean; sessionTitle?: string } | null>(null);
  const [sessionTitleInput, setSessionTitleInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchState = useCallback(() => {
    api
      .get(`/anonymous-room/${PARTYCHAT_ROOM_ID}/state`)
      .then((d) => (typeof d === "object" && d && "isOpen" in d ? { isOpen: !!d.isOpen, sessionTitle: (d as { sessionTitle?: string }).sessionTitle } : { isOpen: false }))
      .then(setState)
      .catch(() => setState({ isOpen: false }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleToggle = async () => {
    if (!canAccessGestione || state === null) return;
    if (state.isOpen) {
      setToggleError(null);
      setToggleLoading(true);
      try {
        await api.post("/paradise-toggle", { isOpen: false, roomId: PARTYCHAT_ROOM_ID });
        setState({ isOpen: false });
        setSessionTitleInput("");
      } catch (e: unknown) {
        const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Errore";
        setToggleError(msg);
      } finally {
        setToggleLoading(false);
      }
    } else {
      const title = sessionTitleInput.trim();
      if (!title) {
        setToggleError("Inserisci il nome della sessione per aprire il Circus");
        return;
      }
      setToggleError(null);
      setToggleLoading(true);
      try {
        await api.post("/paradise-toggle", { isOpen: true, roomId: PARTYCHAT_ROOM_ID, sessionTitle: title });
        setState({ isOpen: true, sessionTitle: title });
      } catch (e: unknown) {
        const res = e && typeof e === "object" && "response" in e ? (e as { response?: { data?: { error?: string } } }).response : null;
        const msg = res?.data?.error || (e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Errore");
        setToggleError(msg);
      } finally {
        setToggleLoading(false);
      }
    }
  };

  const handleEntraCircus = async () => {
    try {
      await api.post(`/anonymous-room/${PARTYCHAT_ROOM_ID}/join`, {});
      window.dispatchEvent(new CustomEvent("openChatRoom", { detail: { roomId: PARTYCHAT_ROOM_ID } }));
      window.dispatchEvent(new CustomEvent("closeWindow", { detail: { windowId: "spazioEventi" } }));
    } catch {
      // Errore: stanza chiusa o altro
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4">
        <p className="text-sm text-gray-500">Caricamento…</p>
      </div>
    );
  }

  const header = (
    <>
      <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-3 font-display">
        Circus — Spazio Eventi
      </p>
      <p className="text-sm text-gray-400 mb-4">
        Il <strong className="text-gray-300">Circus</strong> è uno spazio speciale a Edo: chat anonima, momenti di sorteggio e eventi gestiti da mod/admin.
      </p>
    </>
  );

  if (!state?.isOpen) {
    return (
      <div className="flex flex-col h-full p-4">
        {header}
        {canAccessGestione && (
          <div className="space-y-3 mb-4 p-3 rounded-lg border border-[var(--border-color)] bg-black/20">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 font-display">
                Nome sessione (obbligatorio per aprire)
              </label>
              <input
                type="text"
                value={sessionTitleInput}
                onChange={(e) => setSessionTitleInput(e.target.value)}
                placeholder="Es. Serata Cinema, Torneo Dicembre..."
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-white text-sm placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-display">Sessione</span>
              <button
                type="button"
                role="switch"
                aria-checked={false}
                onClick={handleToggle}
                disabled={toggleLoading}
                className="relative w-11 h-6 rounded-full bg-gray-700 border border-gray-600 transition-colors disabled:opacity-50"
              >
                <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-gray-500 transition-transform" />
              </button>
              <span className="text-xs text-amber-200/70">Chiusa — sezione interdetta</span>
            </div>
            {toggleError && <p className="text-xs text-red-400">{toggleError}</p>}
          </div>
        )}
        <div className="flex items-center justify-center gap-2 py-6 px-4 bg-black/30 border border-amber-900/50 rounded text-amber-200/80">
          <FontAwesomeIcon icon={icons.lock} className="w-5 h-5 shrink-0" />
          <span className="font-display text-sm">Area interdetta</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-4 italic">
          {canAccessGestione ? "Inserisci il nome della sessione e attiva il toggle per aprire. La sessione resterà aperta finché non la chiudi manualmente." : "L'admin/mod deve aprire la stanza per permettere l'accesso."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      {header}
      {canAccessGestione && (
        <div className="space-y-2 mb-4 p-3 rounded-lg border border-[var(--border-color)] bg-black/20">
          {state?.sessionTitle && (
            <p className="text-xs text-gray-400">
              Sessione: <span className="text-[var(--accent-gold)]">{state.sessionTitle}</span>
            </p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-display">Sessione</span>
            <button
              type="button"
              role="switch"
              aria-checked={true}
              onClick={handleToggle}
              disabled={toggleLoading}
              className="relative w-11 h-6 rounded-full bg-amber-900/60 border border-amber-700/50 transition-colors disabled:opacity-50"
            >
              <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-amber-400 transition-transform translate-x-0" />
            </button>
            <span className="text-xs text-emerald-400/80">Aperta — chiudi per registrare l&apos;evento</span>
          </div>
          {toggleError && <p className="text-xs text-red-400">{toggleError}</p>}
        </div>
      )}
      <div className="btn-primary-sweep-borders w-full">
        <button
          type="button"
          onClick={handleEntraCircus}
          className="btn-primary-sweep w-full flex items-center justify-center relative py-3"
        >
          <span className="btn-primary-sweep-sweep" aria-hidden />
          <span className="relative z-10 font-display">Entra nel Circus</span>
        </button>
      </div>
      <p className="text-[10px] text-gray-500 mt-4 italic">
        Chat anonima: nome animale e maschera per tutta la sessione.
      </p>
    </div>
  );
}

function NotificheContent({ onUnreadChange }: { onUnreadChange?: () => void }) {
  const [list, setList] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/notifications")
      .then((d) => (Array.isArray(d) ? d : []) as SystemNotification[])
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`, {});
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
      onUnreadChange?.();
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-widest text-gray-500">Messaggi di sistema (responso Fetch, ecc.)</p>
      {list.length === 0 ? (
        <p className="text-sm text-gray-500">Nessuna notifica.</p>
      ) : (
        <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
          {list.map((n) => (
            <li
              key={n.id}
              className={`p-3 rounded border bg-black/20 ${
                n.readAt ? "border-[var(--border-color)]" : "border-[var(--accent-gold)]/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {n.title && (
                    <p className="text-sm font-display text-[var(--accent-gold)]">{n.title}</p>
                  )}
                  {n.content && (
                    <p className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{n.content}</p>
                  )}
                  <p className="text-[10px] text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString("it-IT")}
                    {n.type === "fetch_responso" && " · Responso Fetch"}
                  </p>
                </div>
                {!n.readAt && (
                  <button
                    type="button"
                    onClick={() => markAsRead(n.id)}
                    className="shrink-0 px-2 py-1 rounded border border-[var(--accent-gold)]/50 text-[10px] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10"
                  >
                    Segna letto
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PresentiEstesiContent({ presenti }: { presenti: Presente[] }) {
  if (presenti.length === 0) {
    return <p className="text-sm text-gray-500">Nessun presente al momento.</p>;
  }

  const openProfile = (p: Presente) => {
    window.dispatchEvent(
      new CustomEvent("openProfileWindow", {
        detail: p.isMe ? { characterId: p.id } : { characterId: p.id, openSms: true, name: p.name },
      })
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-display mb-4">
        Chi è online
      </p>
      <ul className="divide-y divide-[var(--border-color)]">
        {presenti.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-4 py-3 first:pt-0 cursor-pointer hover:bg-white/5"
            onClick={() => openProfile(p)}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${p.isShadow ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <span className={`font-display text-sm flex items-center gap-1.5 flex-wrap ${presentiNameClass({ isMe: p.isMe, isShadow: p.isShadow, paragon: p.paragon })}`}>
                {p.name}
                {(p.paragon ?? 0) > 0 && (
                  <span className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)]/80">
                    ★{p.paragon}
                  </span>
                )}
                {p.isShadow && (
                  <FontAwesomeIcon icon={icons.eyeSlash} className="w-3.5 h-3.5 text-amber-400/80" title="Shadowban" aria-hidden />
                )}
                <PixelIcons pixelIcons={p.pixelIcons} />
                {p.isMe && " (Tu)"}
              </span>
              {p.zone && (
                <p className="text-xs text-gray-500 truncate">{p.zone}</p>
              )}
            </div>
            {!p.isMe && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent("openProfileWindow", { detail: { characterId: p.id } }));
                }}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:text-[var(--accent-gold)] hover:bg-white/5"
                title="Vedi scheda"
                aria-label="Vedi scheda"
              >
                <FontAwesomeIcon icon={icons.user} className="w-4 h-4" />
              </button>
            )}
            <span className={`text-[10px] uppercase shrink-0 ${p.isShadow ? "text-amber-500/80" : "text-emerald-500/80"}`}>Online</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Finestra Profilo Personaggio (pubblico) ───

function ProfiloPersonaggioWindow({ characterId }: { characterId?: string }) {
  const [data, setData] = useState<any | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profilo" | "journal">("profilo");

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(`/characters/${characterId}/public`).catch((e) => {
        console.error("Errore caricamento profilo pubblico:", e);
        return null;
      }),
      api
        .get(`/game-sessions/character/${characterId}?status=CLOSED`)
        .catch((e) => {
          console.error("Errore caricamento registrazioni:", e);
          return [];
        }),
    ])
      .then(([prof, sessions]) => {
        setData(prof);
        setRegistrations(Array.isArray(sessions) ? sessions : []);
      })
      .catch(() => {
        setError("Errore nel caricamento del profilo.");
      })
      .finally(() => setLoading(false));
  }, [characterId]);

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento profilo…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-gray-500 p-4">{error ?? "Profilo non trovato."}</p>;
  }

  const visibility = (data as any).visibility ?? {};
  const canSeeBackground = visibility.canSeeBackground ?? true;
  const canSeeJournal = visibility.canSeeJournal ?? true;

  const stats = data.stats ?? { f: 0, c: 0, d: 0, m: 0, e: 0 };
  const skiruDomains = (data as CharacterSummary).skiruDomains ?? [];

  return (
    <div className="flex h-full min-h-0 bg-[var(--panel-bg)]">
      {/* Sidebar sinistra - segnalibri come faldone militare (solo 3 sezioni) */}
      <div className="w-14 shrink-0 border-r border-[var(--border-color)] bg-black/40 flex flex-col items-center py-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("profilo")}
          className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
            activeTab === "profilo"
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
          }`}
          title="Profilo"
        >
          <FontAwesomeIcon icon={icons.user} className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => canSeeJournal && setActiveTab("journal")}
          className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
            activeTab === "journal"
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
          } ${!canSeeJournal ? "opacity-40 cursor-not-allowed" : ""}`}
          title="Journal"
        >
          <FontAwesomeIcon icon={icons.trophy} className="w-4 h-4" />
        </button>
      </div>

      {/* Contenuto principale: layout a libro come scheda */}
      <div className="flex-1 min-h-0 flex">
        {/* Colonna sinistra: Avatar 300x400 e dati base */}
        <div className="w-[348px] shrink-0 border-r border-[var(--border-color)] p-6 bg-black/20 flex flex-col items-center gap-4">
          {data.avatar ? (
            <img
              src={data.avatar as string}
              alt={String(data.name)}
              className="rounded-lg border-2 border-[var(--accent-gold)] object-cover shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              style={{ width: AVATAR_MAIN_WIDTH, height: AVATAR_MAIN_HEIGHT }}
            />
          ) : (
            <div
              className="rounded-lg border-2 border-[var(--accent-gold)] bg-black/50 flex items-center justify-center"
              style={{ width: AVATAR_MAIN_WIDTH, height: AVATAR_MAIN_HEIGHT }}
            >
              <FontAwesomeIcon icon={icons.user} className="w-20 h-20 text-gray-600" />
            </div>
          )}

          {/* Nome + grado/ordine */}
          <div className="w-full text-center">
            <p className="font-display text-lg text-white">
              {data.name}{" "}
              {data.surname && <span className="text-[var(--accent-gold)]">{data.surname}</span>}
            </p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-[0.18em]">
              {data.order ?? "Ordine N/D"} · {data.grade ?? "Grado N/D"}
            </p>
          </div>

          {/* Domini Skiru o legacy stats */}
          <div className="w-full mt-2 space-y-2 text-[11px]">
            {skiruDomains.length > 0 ? (
              <>
                <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500 font-display mb-1">
                  Domini Skiru
                </p>
                <SkiruDomainRadarChart domains={skiruDomains} />
              </>
            ) : (
              <>
                <p className="text-[9px] uppercase tracking-[0.24em] text-gray-500 font-display mb-1">
                  Statistiche Base
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stats).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-2 py-1.5 flex items-center justify-between"
                    >
                      <span className="text-[10px] text-gray-400 uppercase tracking-[0.18em]">
                        {STAT_LABELS[key] ?? key.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-[var(--accent-gold)] font-display">{value as number}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Colonna destra: tab Profilo / Background / Journal */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          {activeTab === "profilo" && (
            <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
              <header className="px-4 py-2 border-b border-[var(--border-color)]/70 bg-black/60">
                <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">
                  Profilo Personaggio
                </p>
              </header>
              <div className="p-4 flex-1 flex flex-col">
                <div className="border border-[var(--border-color)] bg-black/80 rounded-lg overflow-hidden flex-1">
                  <iframe
                    srcDoc={data.bio ?? "<p style='color:#666;font-style:italic;'>Nessun contenuto inserito.</p>"}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin"
                    title="Background pubblico"
                  />
                </div>
              </div>
            </section>
          )}

          {activeTab === "journal" && canSeeJournal && (
            <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
              <header className="px-4 py-2 border-b border-[var(--border-color)]/70 bg-black/60 flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">
                  Journal / Registrazioni
                </p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-violet)] font-display">
                  {registrations.length} sessioni
                </p>
              </header>
              <div className="p-4">
                {registrations.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">
                    Nessuna sessione registrata per questo personaggio.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-color)]/70 bg-black/40">
                          <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                            Data
                          </th>
                          <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                            Titolo / Quest
                          </th>
                          <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                            Stato
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((r, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-[var(--border-color)]/40 last:border-0 hover:bg:white/5 transition-colors"
                          >
                            <td className="px-3 py-2 text-[11px] text-gray-300">
                              {r.startedAt ? new Date(r.startedAt).toLocaleDateString("it-IT") : "-"}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-gray-100 font-display">
                              {r.fetch?.title ?? "Sessione libera"}
                            </td>
                            <td className="px-3 py-2 text-[11px] text-[var(--accent-gold)] font-display">
                              {r.status ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Componenti Scheda Personaggio ───

/** Banner PG — dimensioni asset consigliate e altezza display fissa in scheda. */
const BANNER_PG_UPLOAD_WIDTH = 1200;
const BANNER_PG_UPLOAD_HEIGHT = 135;
const BANNER_PG_DISPLAY_HEIGHT = 135;

/** Avatar scheda (colonna sinistra) e avatar messaggi chat. */
const AVATAR_MAIN_WIDTH = 300;
const AVATAR_MAIN_HEIGHT = 400;
const AVATAR_CHAT_SIZE = 100;

function CharacterMainAvatarPreview({ url }: { url?: string | null }) {
  return (
    <div
      className="overflow-hidden rounded-lg border-2 border-[var(--accent-gold)]/50 bg-black/50 shadow-[var(--shadow-gold)]"
      style={{ width: AVATAR_MAIN_WIDTH, height: AVATAR_MAIN_HEIGHT }}
    >
      {url?.trim() ? (
        <img
          src={url.trim()}
          alt="Avatar principale"
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center border border-dashed border-[var(--border-color)] bg-[var(--panel-bg)]/80">
          <span className="font-display text-[10px] uppercase tracking-[0.22em] text-[var(--accent-violet-light)]/40">
            avatar
          </span>
        </div>
      )}
    </div>
  );
}

function CharacterChatAvatarPreview({ url }: { url?: string | null }) {
  return (
    <div
      className="overflow-hidden rounded-lg border-2 border-[var(--accent-gold)]/50 bg-black/50 shadow-[var(--shadow-gold)]"
      style={{ width: AVATAR_CHAT_SIZE, height: AVATAR_CHAT_SIZE }}
    >
      {url?.trim() ? (
        <img
          src={url.trim()}
          alt="Avatar chat"
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center border border-dashed border-[var(--border-color)] bg-[var(--panel-bg)]/80">
          <span className="font-display text-[8px] uppercase tracking-[0.18em] text-[var(--accent-violet-light)]/40">
            mini
          </span>
        </div>
      )}
    </div>
  );
}

function CharacterBannerPg({ url }: { url?: string | null }) {
  return (
    <div
      className="w-full overflow-hidden rounded-lg border-2 border-[var(--accent-gold)]/50 bg-black/50 shadow-[var(--shadow-gold)]"
      style={{ height: BANNER_PG_DISPLAY_HEIGHT }}
    >
      {url?.trim() ? (
        <img
          src={url.trim()}
          alt="Banner personaggio"
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center border border-dashed border-[var(--border-color)] bg-[var(--panel-bg)]/80">
          <span className="font-display text-[10px] uppercase tracking-[0.22em] text-[var(--accent-violet-light)]/40">
            banner_pg
          </span>
        </div>
      )}
    </div>
  );
}

// Barra HP — HUD videogame dark (palette oro / viola)
function GameHpBar({ value, max, embedded }: { value: number; max: number; embedded?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const segments = 16;
  const filled = max > 0 ? Math.round((value / max) * segments) : 0;

  return (
    <div
      className={
        embedded
          ? "relative rounded-md border border-[var(--border-color)] bg-black/50 px-3 py-3 shadow-[var(--shadow-violet)]"
          : "relative border-t border-[var(--accent-gold)]/20 bg-[var(--background)] px-4 py-3.5"
      }
    >
      {/* Angoli decorativi HUD */}
      <span className="pointer-events-none absolute left-3 top-2 h-2 w-2 border-l border-t border-[var(--accent-gold)]/50" aria-hidden />
      <span className="pointer-events-none absolute right-3 top-2 h-2 w-2 border-r border-t border-[var(--accent-gold)]/50" aria-hidden />
      <span className="pointer-events-none absolute bottom-2 left-3 h-2 w-2 border-b border-l border-[var(--accent-violet)]/40" aria-hidden />
      <span className="pointer-events-none absolute bottom-2 right-3 h-2 w-2 border-b border-r border-[var(--accent-violet)]/40" aria-hidden />

      <div className="flex items-end justify-between mb-2.5 gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[11px] uppercase tracking-[0.28em] text-[var(--accent-violet-light)]/80">
            HP
          </span>
          <span
            className="font-display text-xl leading-none tabular-nums text-[var(--accent-gold)]"
            style={{ textShadow: "0 0 12px var(--glow-gold), 0 0 24px var(--shadow-gold)" }}
          >
            {value}
          </span>
        </div>
        <span className="font-display text-[10px] tabular-nums tracking-widest text-[var(--accent-violet-light)]/45 uppercase">
          / {max}
        </span>
      </div>

      <div
        className={`relative flex gap-[2px] p-[2px] rounded-sm border border-[var(--border-color)] bg-black ${embedded ? "w-full" : "max-w-[280px]"}`}
        style={{
          boxShadow:
            "inset 0 3px 10px rgba(0,0,0,0.95), inset 0 -1px 0 var(--shadow-violet), 0 0 16px var(--shadow-violet)",
        }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label="Punti vita"
      >
        {Array.from({ length: segments }, (_, i) => {
          const active = i < filled;
          return (
            <div
              key={i}
              className="relative flex-1 h-[10px] min-w-0 overflow-hidden transition-all duration-500"
              style={{
                background: active ? "var(--panel-bg)" : "transparent",
                boxShadow: active
                  ? "inset 0 0 0 1px var(--accent-violet-light)"
                  : "inset 0 0 0 1px var(--border-color)",
              }}
            >
              {active ? (
                <>
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, var(--accent-violet-light) 0%, var(--accent-violet) 55%, color-mix(in srgb, var(--accent-violet) 40%, black) 100%)",
                      opacity: 0.95,
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-35"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, var(--accent-violet-light) 50%, transparent 100%)",
                    }}
                  />
                  <div
                    className="absolute inset-x-0 top-0 h-[40%]"
                    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.1), transparent)" }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ boxShadow: "inset 0 0 6px var(--glow-violet)" }}
                  />
                </>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(180deg, rgba(0,0,0,0.6), var(--panel-bg))",
                    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.9)",
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Scanline sottile */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--accent-violet-light) 2px, var(--accent-violet-light) 3px)",
          }}
        />
      </div>

      {/* Indicatore percentuale — whisper dark */}
      <div className="mt-1.5 flex justify-end">
        <span className="text-[8px] uppercase tracking-[0.2em] font-display text-[var(--accent-violet-light)]/35 tabular-nums">
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

// Pagina principale della scheda
function SchedaMainPage({
  char,
  level,
  levelLabel,
  paragon = 0,
  grade,
  housingChatRoomId,
  skiruDomains = [],
  themeMusicUrl,
  bannerPg,
}: {
  char: any;
  level: number;
  levelLabel: string;
  paragon?: number;
  grade: string;
  housingChatRoomId?: string | null;
  skiruDomains?: Array<{ label: string; points: number; percent: number }>;
  themeMusicUrl?: string;
  bannerPg?: string | null;
}) {
  const computed = char.computed ?? {};
  const madosho = getMadoshoDef(char.madoshoId);

  return (
    <div className="p-6 space-y-6">
      {/* Header con Nome, Cognome, Pixel-Icon */}
      <div className="border-b border-[var(--border-color)] pb-4">
        <div className="flex items-start justify-between mb-2">
          <h2 className="font-display text-2xl text-white flex items-center gap-2 flex-wrap">
            {char.name} {char.surname && <span className="text-[var(--accent-gold)]">{char.surname}</span>}
          </h2>
          <PixelIcons pixelIcons={char.pixelIcons} />
        </div>
        {madosho && (
          <p className="text-[11px] text-[var(--accent-violet-light)]/80 mt-1">
            Madoshō:{' '}
            <span className="text-[var(--accent-gold)] font-display">{madosho.name}</span>
            <span className="text-gray-500 ml-2">{madosho.tagline}</span>
          </p>
        )}
      </div>

      {/* Mostrina militare */}
      <div className="rounded-lg border-2 border-[var(--accent-gold)] overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2)]">
        <div className="bg-gradient-to-r from-[var(--panel-bg)] to-black p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
              {paragon > 0 ? 'Livello · Paragon' : 'Livello'}
            </p>
            <p
              className={`font-display text-3xl ${paragon > 0 ? 'text-[var(--accent-violet-light)]' : 'text-[var(--accent-gold)]'}`}
              style={{
                textShadow: paragon > 0
                  ? '0 0 12px var(--glow-violet)'
                  : '0 0 10px rgba(212,175,55,0.5)',
              }}
            >
              {levelLabel}
            </p>
          </div>
          <div className="h-12 w-px bg-[var(--accent-gold)]/30" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Grado</p>
            <p className="font-display text-xl text-white">{grade}</p>
          </div>
        </div>
      </div>

      {/* Domini Skiru + parametri derivati affiancati */}
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">
        <div className="shrink-0">
          <SkiruDomainRadarChart domains={skiruDomains} />
        </div>
        <div className="flex-1 min-w-[160px] w-full sm:w-auto">
          <DerivedStatsGrid computed={computed} stacked />
        </div>
      </div>

      {themeMusicUrl && (
        <div className="pt-2 border-t border-[var(--border-color)]">
          <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-display mb-2">
            Tema musicale
          </p>
          <audio controls loop className="w-full h-7 [&>button]:!text-[10px]">
            <source src={themeMusicUrl} type="audio/mpeg" />
            Il tuo browser non supporta l&apos;audio.
          </audio>
        </div>
      )}

      {/* Banner PG — sopra Ultima Posizione */}
      <CharacterBannerPg url={bannerPg} />

      {/* Ultima posizione e Entra in Casa (chat privata) — visibile solo se si ha un'abitazione */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ultima Posizione</p>
          <p className="text-sm text-gray-400">N/D</p>
        </div>
        {housingChatRoomId && (
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("openHousingChat", { detail: { roomId: housingChatRoomId } }));
              }
            }}
            className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 transition-colors flex items-center gap-2 text-xs uppercase tracking-wider"
            title="Accedi alla chat privata della tua abitazione"
          >
            <FontAwesomeIcon icon={icons.home} className="w-4 h-4" />
            <span>Entra in Casa</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Griglia parametri derivati Skiru v3 (HP + Mitigazione + Movimento)
function DerivedStatsGrid({ computed, stacked }: { computed: any; stacked?: boolean }) {
  const hpMax = computed.hpMax ?? computed.body;
  const hpCurrent = computed.hpCurrent ?? hpMax;
  const hasHp = typeof hpMax === "number" && hpMax > 0;

  const rows: Array<{ key: string; label: string; value: number; suffix?: string }> = [
    {
      key: "mitigationPercent",
      label: "Mitigazione Itami",
      value: computed.mitigationPercent,
      suffix: "%",
    },
    {
      key: "movementMetersPerQuarter",
      label: "Movimento (m/quarto)",
      value: computed.movementMetersPerQuarter ?? computed.movement,
    },
  ].filter((r): r is { key: string; label: string; value: number; suffix?: string } => typeof r.value === "number");

  if (!hasHp && rows.length === 0) return null;

  return (
    <div className={stacked ? "space-y-3" : "space-y-4"}>
      <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display">
        Parametri derivati
      </h3>
      <div className={stacked ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        {hasHp && <GameHpBar embedded value={hpCurrent} max={hpMax} />}
        {rows.map((row) => (
          <div
            key={row.key}
            className="bg-black/30 rounded-lg border border-[var(--border-color)]/80 px-3 py-2"
          >
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-display mb-1">
              {row.label}
            </p>
            <p className="font-display text-xl text-[var(--accent-gold)]">
              {row.value}
              {row.suffix ?? ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Radar domini Skiru — stile pannello RPG (triangolo Ten · Chi · Jin)
function skiruRadarAxisPoint(
  cx: number,
  cy: number,
  vx: number,
  vy: number,
  scale: number,
) {
  return { x: cx + (vx - cx) * scale, y: cy + (vy - cy) * scale };
}

function skiruRadarTrianglePolygon(
  cx: number,
  cy: number,
  top: { x: number; y: number },
  bl: { x: number; y: number },
  br: { x: number; y: number },
  scale: number,
) {
  const t = skiruRadarAxisPoint(cx, cy, top.x, top.y, scale);
  const l = skiruRadarAxisPoint(cx, cy, bl.x, bl.y, scale);
  const r = skiruRadarAxisPoint(cx, cy, br.x, br.y, scale);
  return `${t.x},${t.y} ${l.x},${l.y} ${r.x},${r.y}`;
}

function SkiruDomainRadarChart({
  domains,
}: {
  domains: Array<{ label: string; points: number; percent: number }>;
}) {
  const gradientId = useId().replace(/:/g, "");
  const vbW = 360;
  const vbH = 320;
  const cx = 180;
  const cy = 180;
  const apex = { x: 180, y: 40 };
  const bl = { x: 58.76, y: 250 };
  const br = { x: 301.24, y: 250 };

  const ordered =
    domains.length >= 3
      ? domains
      : [
          { label: "Ten", points: 0, percent: 0 },
          { label: "Chi", points: 0, percent: 0 },
          { label: "Jin", points: 0, percent: 0 },
        ];

  const ten = ordered[0] ?? { label: "Ten", points: 0, percent: 0 };
  const chi = ordered[1] ?? { label: "Chi", points: 0, percent: 0 };
  const jin = ordered[2] ?? { label: "Jin", points: 0, percent: 0 };

  const tenPt = skiruRadarAxisPoint(cx, cy, apex.x, apex.y, ten.percent / 100);
  const chiPt = skiruRadarAxisPoint(cx, cy, bl.x, bl.y, chi.percent / 100);
  const jinPt = skiruRadarAxisPoint(cx, cy, br.x, br.y, jin.percent / 100);
  const dataPolygon = `${tenPt.x},${tenPt.y} ${chiPt.x},${chiPt.y} ${jinPt.x},${jinPt.y}`;

  const toPct = (x: number, y: number) => ({
    left: `${(x / vbW) * 100}%`,
    top: `${(y / vbH) * 100}%`,
  });

  return (
    <div className="relative w-[min(100%,380px)] min-w-[300px] shrink-0 rounded-[10px] border-2 border-[var(--accent-gold)] bg-[var(--panel-bg)] px-5 py-5 shadow-[var(--shadow-gold)]">
      <div
        className="pointer-events-none absolute rounded-md border border-[var(--accent-violet)]/45"
        style={{ inset: "9px" }}
        aria-hidden
      />
      <span className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 border-l-2 border-t-2 border-[var(--accent-gold)]" aria-hidden />
      <span className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 border-r-2 border-t-2 border-[var(--accent-gold)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-4 w-4 border-b-2 border-l-2 border-[var(--accent-gold)]" aria-hidden />
      <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-4 w-4 border-b-2 border-r-2 border-[var(--accent-gold)]" aria-hidden />

      <div className="relative z-[1] mx-auto w-full" style={{ aspectRatio: `${vbW} / ${vbH}` }}>
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-violet-light)" stopOpacity={0.85} />
              <stop offset="100%" stopColor="var(--accent-violet)" stopOpacity={0.65} />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <polygon
              key={scale}
              points={skiruRadarTrianglePolygon(cx, cy, apex, bl, br, scale)}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={scale === 1 ? 1 : 0.75}
              strokeOpacity={scale === 1 ? 0.9 : 0.75}
            />
          ))}

          <line x1={cx} y1={cy} x2={apex.x} y2={apex.y} stroke="var(--accent-violet)" strokeOpacity={0.45} strokeWidth={0.75} />
          <line x1={cx} y1={cy} x2={bl.x} y2={bl.y} stroke="var(--accent-violet)" strokeOpacity={0.45} strokeWidth={0.75} />
          <line x1={cx} y1={cy} x2={br.x} y2={br.y} stroke="var(--accent-violet)" strokeOpacity={0.45} strokeWidth={0.75} />

          <polygon
            points={dataPolygon}
            fill={`url(#${gradientId})`}
            stroke="var(--accent-gold)"
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 8px var(--glow-violet))" }}
          />
        </svg>

        {[
          { pt: tenPt, delay: "0s" },
          { pt: chiPt, delay: "0.8s" },
          { pt: jinPt, delay: "1.6s" },
        ].map((item, i) => {
          const pos = toPct(item.pt.x, item.pt.y);
          return (
            <div
              key={i}
              className="skiru-radar-dot absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--accent-gold)] bg-[var(--accent-violet-light)]"
              style={{ ...pos, animationDelay: item.delay }}
            />
          );
        })}

        <div
          className="absolute -translate-x-1/2 text-center whitespace-nowrap"
          style={{ left: "50%", top: "0%" }}
        >
          <p className="font-display text-[13px] text-[var(--accent-violet-light)]" style={{ textShadow: "0 0 6px var(--glow-violet)" }}>
            {ten.points}
          </p>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--accent-gold)]" style={{ textShadow: "0 0 6px var(--shadow-gold)" }}>
            {ten.label}
          </p>
        </div>

        <div className="absolute -translate-x-1/2 text-center whitespace-nowrap" style={{ left: `${(bl.x / vbW) * 100}%`, top: `${((bl.y + 18) / vbH) * 100}%` }}>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--accent-gold)]" style={{ textShadow: "0 0 6px var(--shadow-gold)" }}>
            {chi.label}
          </p>
          <p className="font-display text-[13px] text-[var(--accent-violet-light)]" style={{ textShadow: "0 0 6px var(--glow-violet)" }}>
            {chi.points}
          </p>
        </div>

        <div className="absolute -translate-x-1/2 text-center whitespace-nowrap" style={{ left: `${(br.x / vbW) * 100}%`, top: `${((br.y + 18) / vbH) * 100}%` }}>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-[var(--accent-gold)]" style={{ textShadow: "0 0 6px var(--shadow-gold)" }}>
            {jin.label}
          </p>
          <p className="font-display text-[13px] text-[var(--accent-violet-light)]" style={{ textShadow: "0 0 6px var(--glow-violet)" }}>
            {jin.points}
          </p>
        </div>
      </div>
    </div>
  );
}

// Pagina Modifica
function SchedaModificaPage({ char, characterId, onCharUpdate }: { char: any; characterId?: string; onCharUpdate?: () => void }) {
  const [avatar, setAvatar] = useState(char.avatarUrl ?? char.avatar ?? "");
  const [miniAvatar, setMiniAvatar] = useState(char.miniAvatar ?? "");
  const [surname, setSurname] = useState(char.surname ?? "");
  const [music, setMusic] = useState((char as any)?.themeMusicUrl ?? "");
  const [bannerPg, setBannerPg] = useState((char as any)?.bannerPg ?? "");
  const [bio, setBio] = useState(char.bio ?? "");
  const [saving, setSaving] = useState(false);

  const isEditingOther = characterId && characterId !== char?.id;

  useEffect(() => {
    setAvatar(char.avatarUrl ?? char.avatar ?? "");
    setMiniAvatar(char.miniAvatar ?? "");
    setSurname(char.surname ?? "");
    setMusic((char as any)?.themeMusicUrl ?? "");
    setBannerPg((char as any)?.bannerPg ?? "");
    setBio(char.bio ?? "");
  }, [char]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = isEditingOther ? `/characters/${characterId}/profilo` : "/characters/me/profilo";
      await api.put(url, {
        avatar,
        miniAvatar,
        surname,
        bio,
        themeMusicUrl: music,
        bannerPg,
      });
      if (onCharUpdate) onCharUpdate();
      alert("Profilo aggiornato!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="font-display text-xl text-[var(--accent-gold)] border-b border-[var(--border-color)] pb-3 mb-4" style={{ textShadow: "0 0 10px rgba(212,175,55,0.3)" }}>
        Modifica Scheda
      </h2>
      <div className="space-y-5">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-display">Cognome</label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className="w-full px-4 py-2.5 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-display">Avatar Principale</label>
          <p className="text-[10px] text-[var(--accent-violet-light)]/70 mb-2 font-display">
            Dimensioni consigliate:{" "}
            <span className="text-[var(--accent-gold)]">
              {AVATAR_MAIN_WIDTH} × {AVATAR_MAIN_HEIGHT} px
            </span>
            {" "}(colonna sinistra scheda · rapporto verticale)
          </p>
          <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="URL immagine"
            className="w-full px-4 py-2.5 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 transition-colors"
          />
          <div className="mt-3 rounded-lg border border-[var(--border-color)] bg-black/40 overflow-hidden inline-block">
            <CharacterMainAvatarPreview url={avatar} />
            <p className="px-3 py-2 text-[10px] text-gray-500 uppercase tracking-[0.18em] font-display">
              Anteprima Avatar Principale ({AVATAR_MAIN_WIDTH}×{AVATAR_MAIN_HEIGHT})
            </p>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-display">Avatar Chat</label>
          <p className="text-[10px] text-[var(--accent-violet-light)]/70 mb-2 font-display">
            Dimensioni consigliate:{" "}
            <span className="text-[var(--accent-gold)]">
              {AVATAR_CHAT_SIZE} × {AVATAR_CHAT_SIZE} px
            </span>
            {" "}(quadrato accanto ai messaggi in chat)
          </p>
          <input
            type="text"
            value={miniAvatar}
            onChange={(e) => setMiniAvatar(e.target.value)}
            placeholder="URL immagine"
            className="w-full px-4 py-2.5 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 transition-colors"
          />
          <div className="mt-3 rounded-lg border border-[var(--border-color)] bg-black/40 overflow-hidden inline-block">
            <CharacterChatAvatarPreview url={miniAvatar} />
            <p className="px-3 py-2 text-[10px] text-gray-500 uppercase tracking-[0.18em] font-display">
              Anteprima Avatar Chat ({AVATAR_CHAT_SIZE}×{AVATAR_CHAT_SIZE})
            </p>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-display">
            Banner PG
          </label>
          <p className="text-[10px] text-[var(--accent-violet-light)]/70 mb-2 font-display">
            Dimensioni consigliate:{" "}
            <span className="text-[var(--accent-gold)]">
              {BANNER_PG_UPLOAD_WIDTH} × {BANNER_PG_UPLOAD_HEIGHT} px
            </span>
            {" "}(larghezza piena sezione · altezza fissa {BANNER_PG_DISPLAY_HEIGHT}px in scheda)
          </p>
          <input
            type="text"
            value={bannerPg}
            onChange={(e) => setBannerPg(e.target.value)}
            placeholder="URL immagine banner_pg"
            className="w-full px-4 py-2.5 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 transition-colors"
          />
          <div className="mt-3 rounded-lg border border-[var(--border-color)] bg-black/40 overflow-hidden">
            <CharacterBannerPg url={bannerPg} />
            <p className="px-3 py-2 text-[10px] text-gray-500 uppercase tracking-[0.18em] font-display">
              Anteprima Banner PG ({BANNER_PG_UPLOAD_WIDTH}×{BANNER_PG_UPLOAD_HEIGHT})
            </p>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-display">Musica (.mp3)</label>
          <input
            type="text"
            value={music}
            onChange={(e) => setMusic(e.target.value)}
            placeholder="URL file .mp3"
            className="w-full px-4 py-2.5 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 transition-colors"
          />
          {music && (
            <div className="mt-3 rounded-lg border border-[var(--border-color)] bg-black/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
                Anteprima Musica
              </p>
              <audio controls className="w-full">
                <source src={music} type="audio/mpeg" />
                Il tuo browser non supporta l'elemento audio.
              </audio>
            </div>
          )}
        </div>

        {/* Editor testo background / storia personaggio */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-display">
            Background / Storia (HTML/CSS)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Inserisci qui la storia del tuo personaggio. Puoi usare HTML e CSS personalizzato."
            className="w-full h-64 px-4 py-3 rounded border border-[var(--border-color)] bg-black/50 text-sm text-gray-200 font-mono focus:border-[var(--accent-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 transition-colors resize-none"
            spellCheck={false}
          />
          <p className="mt-2 text-[10px] text-gray-600 italic">
            Il risultato verrà mostrato nella sezione <span className="uppercase tracking-widest text-[var(--accent-violet)]">Background</span> della scheda.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50 transition-colors text-xs uppercase tracking-wider font-display shadow-[0_0_10px_rgba(212,175,55,0.2)]"
          >
            {saving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Pagina Background (contenuto diretto, tutta l'area disponibile)
function SchedaBackgroundPage({ char }: { char: any }) {
  const bio = char.bio ?? "";
  const hasHtml = /<[a-z][\s\S]*>/i.test(bio);

  return (
    <div className="p-6 min-h-full min-w-0 box-border flex flex-col">
      <h2
        className="font-display text-xl text-[var(--accent-gold)] border-b border-[var(--border-color)] pb-3 mb-4 shrink-0"
        style={{ textShadow: "0 0 10px rgba(212,175,55,0.3)" }}
      >
        Background Personaggio
      </h2>

      <section className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-auto bg-black/40 rounded-lg border border-[var(--border-color)] p-6">
        {bio ? (
          hasHtml ? (
            <div
              className="scheda-bio-host mx-auto w-fit max-w-full min-w-0 font-sans text-[var(--foreground)] leading-relaxed [&_a]:text-[var(--accent-gold)] [&_a]:hover:underline [&_p]:mb-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_#Scheda-BackBear]:mx-auto [&_#Scheda-BackBear]:max-w-full [&_.Scheda-shapeBox]:overflow-hidden [&_.Scheda-boxText]:box-border [&_.Scheda-boxText]:max-w-full"
              dangerouslySetInnerHTML={{ __html: bio }}
            />
          ) : (
            <p className="whitespace-pre-wrap text-[var(--foreground)] leading-relaxed max-w-full">{bio}</p>
          )
        ) : (
          <p className="text-gray-500 italic">Nessun contenuto inserito.</p>
        )}
      </section>
    </div>
  );
}

// Pagina Inventario
function SchedaInventarioPage({ characterId }: { characterId?: string }) {
  return (
    <div className="p-6 space-y-6 min-h-full box-border">
      <h2
        className="font-display text-xl text-[var(--accent-gold)] border-b border-[var(--border-color)] pb-3 mb-4"
        style={{ textShadow: "0 0 10px rgba(212,175,55,0.3)" }}
      >
        Inventario / Sistema Equipaggiamento
      </h2>
      <InventorySection characterId={characterId} />
    </div>
  );
}

// Pagina Waza — vedi SchedaWazaPage.tsx

// Bottone Leggi giocata (da Scheda → Registrazioni)
function RegistrazioneLeggiButton({ sessionId, title }: { sessionId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.get(`/game-sessions/${sessionId}/messages`)) as { session?: any; messages?: any[] };
      setMessages(res?.messages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore caricamento");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2 py-1 rounded text-[9px] uppercase tracking-wider border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10"
      >
        Leggi
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] shrink-0">
                <h2 className="font-display text-lg text-[var(--accent-gold)]">Giocata: {title}</h2>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-[var(--accent-gold)]">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-black/40">
                {loading ? (
                  <p className="text-gray-400 text-center">Caricamento...</p>
                ) : error ? (
                  <p className="text-amber-400 text-center">{error}</p>
                ) : messages.length === 0 ? (
                  <div className="text-gray-400 text-center space-y-1">
                  <p>Nessun messaggio disponibile.</p>
                  <p className="text-xs text-gray-500">I messaggi vengono registrati dalla chat durante la giocata. Assicurati di aver inviato messaggi nella chat corretta tra l&apos;avvio e la chiusura della registrazione.</p>
                </div>
                ) : (
                  messages.map((m: any) => (
                    <RegistrazioneMessageBlock key={m.id} message={m} />
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function RegistrazioneMessageBlock({ message }: { message: any }) {
  const formatted = formatNarrativeText(message.content ?? "");
  const isGlobal = message.zone === "GLOBAL" || message.name?.startsWith("[GLOBAL]");
  if (isGlobal) {
    return (
      <div className="border border-[var(--accent-violet)]/50 py-3 px-4 text-center my-4 rounded">
        <strong className="text-[var(--accent-violet)] text-xs">✦ GLOBALE ✦</strong>
        <p className="m-0 text-sm text-gray-200 mt-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      </div>
    );
  }
  if (message.isMasterscreen) {
    return (
      <div className="w-full mb-6 p-5 bg-black/40 border border-[var(--accent-gold)]/30 rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
        <div className="masterscreen-format font-sans text-[13px] leading-relaxed whitespace-pre-wrap mb-4">
          <div dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
        <div className="text-right font-display text-[11px] font-bold text-[var(--accent-gold)] uppercase tracking-wider opacity-80">
          — Shinigami ({message.name}{message.surname ? ` ${message.surname}` : ""})
        </div>
      </div>
    );
  }
  const fmt = (s: string) => new Date(s).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mb-4 pl-2 border-b border-white/5 pb-2">
      <div className="flex items-center gap-2 mb-1 text-xs">
        <span className="text-gray-500">{fmt(message.createdAt)}</span>
        <span className="font-display font-bold text-[var(--accent-gold)]">{message.name}{message.surname ? ` ${message.surname}` : ""}</span>
        {message.pixelIcons?.ruolo?.map((r: string) => {
          const url = getPixelIconUrlRuolo(r as PixelIconRuolo);
          return url ? <Image key={r} src={url} alt={r} width={14} height={14} className="object-contain" /> : null;
        })}
        {message.pixelIcons?.ordine?.map((o: string) => {
          const url = getPixelIconUrlOrdine(o as PixelIconOrdine);
          return url ? <Image key={o} src={url} alt={o} width={14} height={14} className="object-contain" /> : null;
        })}
      </div>
      <p className="text-sm text-gray-300 m-0 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
    </div>
  );
}

// Pagina Registrazioni
function SchedaRegistrazioniPage({ characterId }: { characterId?: string }) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "quest" | "free" | "evento">("all");

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    api
      .get(`/game-sessions/character/${characterId}?status=CLOSED`)
      .then((d) => {
        const sessions = Array.isArray(d) ? d : [];
        // Mappa i dati per renderli più leggibili
        const mapped = sessions.map((s: any) => {
          const fetch = s.fetch || null;
          const quest = s.quest || null;
          const isQuest = !!fetch || !!s.fetchId || !!quest || !!s.questId;
          const isEvento = s.sessionType === "EVENTO";
          const closedDate = s.closedAt || s.lastActiveAt || s.startedAt;
          const questTitle = quest?.title || fetch?.title;
          return {
            id: s.id,
            date: closedDate,
            type: isEvento ? "Evento" : isQuest ? "Quest" : "Sessione Libera",
            title: s.title || questTitle || (isQuest ? `Quest ${s.roomId}` : isEvento ? "Evento" : `Sessione ${s.roomId}`),
            questName: questTitle,
            outcome: s.status === "CLOSED" ? "Completata" : s.status === "CANCELLED" ? "Annullata" : s.status,
            isQuest,
            isEvento,
            fetchId: s.fetchId,
          };
        });
        setRegistrations(mapped);
      })
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, [characterId]);

  const filteredRegistrations = registrations.filter((r) => {
    if (filter === "quest") return r.isQuest;
    if (filter === "free") return !r.isQuest && !r.isEvento;
    if (filter === "evento") return r.isEvento;
    return true;
  });

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento…</p>;
  }

  return (
    <div className="p-6 space-y-6 min-h-full box-border">
      <h2
        className="font-display text-xl text-[var(--accent-gold)] border-b border-[var(--border-color)] pb-3 mb-4"
        style={{ textShadow: "0 0 10px rgba(212,175,55,0.3)" }}
      >
        Journal / Registrazioni
      </h2>

      <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
        <header className="px-4 py-2 border-b border-[var(--border-color)]/70 bg-black/60 flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">
            Archivio Sessioni
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider transition-colors ${
                  filter === "all"
                    ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border border-[var(--accent-gold)]/50"
                    : "bg-black/40 text-gray-400 border border-[var(--border-color)]/50 hover:border-gray-600"
                }`}
              >
                Tutte
              </button>
              <button
                type="button"
                onClick={() => setFilter("quest")}
                className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider transition-colors ${
                  filter === "quest"
                    ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border border-[var(--accent-gold)]/50"
                    : "bg-black/40 text-gray-400 border border-[var(--border-color)]/50 hover:border-gray-600"
                }`}
              >
                Quest
              </button>
              <button
                type="button"
                onClick={() => setFilter("free")}
                className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider transition-colors ${
                  filter === "free"
                    ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border border-[var(--accent-gold)]/50"
                    : "bg-black/40 text-gray-400 border border-[var(--border-color)]/50 hover:border-gray-600"
                }`}
              >
                Libere
              </button>
              <button
                type="button"
                onClick={() => setFilter("evento")}
                className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider transition-colors ${
                  filter === "evento"
                    ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] border border-[var(--accent-gold)]/50"
                    : "bg-black/40 text-gray-400 border border-[var(--border-color)]/50 hover:border-gray-600"
                }`}
              >
                Eventi
              </button>
            </div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-violet)] font-display">
              {loading ? "Caricamento..." : `${filteredRegistrations.length} sessioni`}
            </p>
          </div>
        </header>

        <div className="p-4">
          {loading ? (
            <p className="text-sm text-gray-500 italic">Caricamento sessioni...</p>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-sm text-gray-500 italic">
              Nessuna sessione registrata. Le giocate e le quest completate appariranno qui con data, titolo e
              stato.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)]/70 bg-black/40">
                    <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Data
                    </th>
                    <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Tipo
                    </th>
                    <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Titolo / Quest
                    </th>
                    <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Esito
                    </th>
                    <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((r: any) => (
                    <tr
                      key={r.id}
                      className="border-b border-[var(--border-color)]/40 last:border-0 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-3 py-2 text-[11px] text-gray-300">
                        {r.date ? new Date(r.date).toLocaleDateString("it-IT") : "-"}
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                          r.isEvento
                            ? "text-amber-400 bg-amber-500/20 border border-amber-500/40"
                            : r.isQuest
                            ? "text-[var(--accent-violet)] bg-[var(--accent-violet)]/20 border border-[var(--accent-violet)]/40"
                            : "text-gray-400 bg-gray-500/20 border border-gray-500/40"
                        }`}>
                          {r.type ?? "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-gray-100 font-display">{r.title ?? r.questName ?? "-"}</td>
                      <td className="px-3 py-2 text-[11px]">
                        <span className={`font-display ${
                          r.outcome === "Completata" 
                            ? "text-[var(--accent-gold)]" 
                            : r.outcome === "Annullata"
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}>
                          {r.outcome ?? "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {r.outcome === "Completata" && (
                          <RegistrazioneLeggiButton sessionId={r.id} title={r.title} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Pagina Log
function SchedaLogPage({ char, characterId, isRemoteCharacter }: { char: any; characterId?: string; isRemoteCharacter?: boolean }) {
  const [expLogs, setExpLogs] = useState<any[]>([]);
  const [expLast7Days, setExpLast7Days] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = isRemoteCharacter && characterId ? `/characters/${characterId}/exp-logs` : "/characters/me/exp-logs";
    api.get(url)
      .then((d: any) => {
        setExpLast7Days(d.expLast7Days ?? 0);
        setExpLogs(Array.isArray(d.expRewards) ? d.expRewards : []);
      })
      .catch(() => {
        setExpLast7Days(0);
        setExpLogs([]);
      })
      .finally(() => setLoading(false));
  }, [characterId, isRemoteCharacter]);

  // Calcola livello basandosi su EXP totale (curva LEVELING_DESIGN, cap 50)
  const levelProgress = resolveLevelFromExp(char.experienceTotal ?? 0);

  return (
    <div className="p-6 space-y-6">
      <h2
        className="font-display text-xl text-[var(--accent-gold)] border-b border-[var(--border-color)] pb-3 mb-4"
        style={{ textShadow: "0 0 10px rgba(212,175,55,0.3)" }}
      >
        Log Tecnici / Fascicolo EXP
      </h2>

      <div className="space-y-4">
        {/* Riquadro sintetico account */}
        <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
          <header className="px-4 py-2 border-b border-[var(--border-color)]/70 bg-black/60 flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">
              Dossier Personaggio
            </p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-violet)] font-display">
              Livello Operativo: {levelProgress.label}
              {(levelProgress.paragon ?? 0) > 0 && (
                <span className="ml-1 text-[var(--accent-violet-light)]">Paragon</span>
              )}
            </p>
          </header>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
                Data Registrazione
              </p>
              <p className="text-sm text-gray-300">
                {char.createdAt ? new Date(char.createdAt).toLocaleDateString("it-IT") : "N/D"}
              </p>
            </div>
            <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
                REM Totali
              </p>
              <p className="text-sm text-[var(--accent-gold)] font-display">{char.rem ?? 0}</p>
            </div>
            <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
                EXP Ultimi 7 Giorni
              </p>
              <p className="text-sm text-[var(--accent-gold)] font-display">{expLast7Days}</p>
            </div>
            <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
                EXP Totale
              </p>
              <p className="text-sm text-[var(--accent-gold)] font-display">{char.experienceTotal ?? 0}</p>
            </div>
            <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
                EXP Spendibile
              </p>
              <p className="text-sm text-[var(--accent-gold)] font-display">{char.experienceSpendable ?? 0}</p>
            </div>
            <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
                Grado Militare
              </p>
              <p className="text-sm text-[var(--accent-gold)] font-display">
                {(char as any)?.grade || "Nemuribito"}
              </p>
            </div>
          </div>
        </section>

        {/* Log premi EXP */}
        <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
          <header className="px-4 py-2 border-b border-[var(--border-color)]/70 bg-black/60 flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">
              Registro Premi EXP
            </p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-violet)] font-display">
              {loading ? "Caricamento..." : `Stato: ${expLogs.length > 0 ? "Operativo" : "Nessun premio"}`}
            </p>
          </header>

          <div className="p-4">
            {loading ? (
              <p className="text-sm text-gray-500 italic">Caricamento log premi...</p>
            ) : expLogs.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Nessun premio registrato. I premi EXP ricevuti dalle quest appariranno qui con data, quest, Shinigami e ricompensa.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]/70 bg-black/40">
                      <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        Data
                      </th>
                      <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        Quest
                      </th>
                      <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        Shinigami
                      </th>
                      <th className="px-3 py-2 text-right font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        Premio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expLogs.map((log, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border-color)]/40 last:border-0 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-3 py-2 text-[11px] text-gray-300">
                          {log.date ? new Date(log.date).toLocaleDateString("it-IT") : "-"}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-gray-100">{log.questName ?? "-"}</td>
                        <td className="px-3 py-2 text-[11px] text-gray-400">{log.shinigamiName ?? "-"}</td>
                        <td className="px-3 py-2 text-[11px] text-[var(--accent-gold)] font-display text-right">
                          +{log.reward ?? 0} EXP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

type Visibility = {
  canSeeBackground?: boolean;
  canSeeJournal?: boolean;
  canSeePrivateLog?: boolean;
  canSeeFullSheet?: boolean;
  canEdit?: boolean;
  showMasterNotes?: boolean;
};

// Alias staff + Note Master sotto l'avatar
function SchedaAvatarSidebar({
  characterId,
  staffAlias,
  masterNotes,
  canEditStaffAlias,
  canEditMasterNotes,
  showMasterNotes = true,
  onUpdate,
}: {
  characterId: string;
  staffAlias?: string | null;
  masterNotes?: string | null;
  canEditStaffAlias?: boolean;
  canEditMasterNotes?: boolean;
  showMasterNotes?: boolean;
  onUpdate?: () => void;
}) {
  const [alias, setAlias] = useState(staffAlias ?? "");
  const [notes, setNotes] = useState(masterNotes ?? "");
  const [editingAlias, setEditingAlias] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingAlias, setSavingAlias] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAlias(staffAlias ?? "");
  }, [staffAlias]);

  useEffect(() => {
    setNotes(masterNotes ?? "");
  }, [masterNotes]);

  const saveAlias = async () => {
    if (!canEditStaffAlias) return;
    setSavingAlias(true);
    setError("");
    try {
      await api.patch(`/characters/${characterId}/staff-meta`, {
        staffAlias: alias.trim() || null,
      });
      setEditingAlias(false);
      onUpdate?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore salvataggio alias");
    } finally {
      setSavingAlias(false);
    }
  };

  const saveNotes = async () => {
    if (!canEditMasterNotes) return;
    setSavingNotes(true);
    setError("");
    try {
      await api.patch(`/characters/${characterId}/staff-meta`, {
        masterNotes: notes.trim() || null,
      });
      setEditingNotes(false);
      onUpdate?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore salvataggio note");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="w-full mt-4 space-y-3">
      {/* Alias staff */}
      <div className="rounded-md border border-[var(--border-color)] bg-black/50 p-3 shadow-[var(--shadow-violet)]">
        <div className="flex items-center justify-between mb-2 gap-2">
          <p className="text-[9px] uppercase tracking-[0.24em] text-[var(--accent-violet-light)] font-display">
            Alias
          </p>
          {canEditStaffAlias && !editingAlias && (
            <button
              type="button"
              onClick={() => setEditingAlias(true)}
              className="text-[9px] uppercase tracking-wider text-[var(--accent-gold)] hover:underline shrink-0"
            >
              Modifica
            </button>
          )}
        </div>
        {editingAlias ? (
          <div className="space-y-2">
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Alias assegnato dallo staff…"
              maxLength={120}
              className="w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/60 text-sm text-[var(--accent-gold)] font-display placeholder:text-gray-600 focus:outline-none focus:border-[var(--accent-gold)]/50"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingAlias(false);
                  setAlias(staffAlias ?? "");
                  setError("");
                }}
                className="px-2 py-1 rounded border border-[var(--border-color)] text-[10px] text-gray-400"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={saveAlias}
                disabled={savingAlias}
                className="px-2 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-[10px] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
              >
                {savingAlias ? "…" : "Salva"}
              </button>
            </div>
          </div>
        ) : (
          <p className="font-display text-sm text-[var(--accent-gold)] min-h-[1.25rem]">
            {staffAlias?.trim() ? staffAlias : <span className="text-gray-600 italic text-xs">Nessun alias assegnato</span>}
          </p>
        )}
      </div>

      {/* Note Master */}
      {showMasterNotes && (
        <div className="rounded-md border border-[var(--border-color)] bg-black/50 p-3 min-h-[140px] flex flex-col shadow-[var(--shadow-violet)]">
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-[9px] uppercase tracking-[0.24em] text-[var(--accent-gold)] font-display">
              Note del Master
            </p>
            {canEditMasterNotes && !editingNotes && (
              <button
                type="button"
                onClick={() => setEditingNotes(true)}
                className="text-[9px] uppercase tracking-wider text-[var(--accent-gold)] hover:underline shrink-0"
              >
                Modifica
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="flex flex-col gap-2 flex-1">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note interne Master…"
                rows={5}
                maxLength={5000}
                className="flex-1 min-h-[100px] px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/60 text-xs text-gray-200 resize-none focus:outline-none focus:border-[var(--accent-violet)]/50"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditingNotes(false);
                    setNotes(masterNotes ?? "");
                    setError("");
                  }}
                  className="px-2 py-1 rounded border border-[var(--border-color)] text-[10px] text-gray-400"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="px-2 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-[10px] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                >
                  {savingNotes ? "…" : "Salva"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--accent-violet-light)]/80 whitespace-pre-wrap flex-1 leading-relaxed">
              {masterNotes?.trim() ? masterNotes : <span className="text-gray-600 italic">Nessuna nota.</span>}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-[var(--accent-red)]">{error}</p>}
    </div>
  );
}

function SchedaContent({ char, characterId, onCharUpdate }: { char?: CharacterSummary; characterId?: string; onCharUpdate?: () => void }) {
  const [activeSection, setActiveSection] = useState<
    "main" | "skiru" | "modifica" | "background" | "inventario" | "waza" | "registrazioni" | "log" | "richieste"
  >("main");
  const [charData, setCharData] = useState<any>(null);
  const [visibility, setVisibility] = useState<Visibility>({});
  const [loading, setLoading] = useState(true);
  const [housingChatRoomId, setHousingChatRoomId] = useState<string | null>(null);

  // Se characterId è presente e diverso da char.id, è una scheda remota (altrui = censurata, admin/mod possono editare)
  const isRemoteCharacter = characterId && characterId !== char?.id;

  const loadCharData = useCallback(() => {
    if (isRemoteCharacter && characterId) {
      setLoading(true);
      api
        .get(`/characters/${characterId}/public`)
        .then((publicData: any) => {
          setVisibility(publicData?.visibility ?? {});
          if (publicData?.visibility?.canEdit) {
            return api.get(`/characters/${characterId}/full`).then((full) => full).catch(() => publicData);
          }
          return publicData;
        })
        .then((d) => setCharData(d))
        .catch(() => setCharData(null))
        .finally(() => setLoading(false));
    } else if (char?.id) {
      setLoading(true);
      api.get(`/characters/me`)
        .then((d) => setCharData(d))
        .catch(() => setCharData(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [char?.id, characterId, isRemoteCharacter]);

  useEffect(() => {
    loadCharData();
  }, [loadCharData]);

  // Carica housing per "Entra in Casa" (solo scheda propria)
  useEffect(() => {
    if (isRemoteCharacter) {
      setHousingChatRoomId(null);
      return;
    }
    api
      .get("/housing/me")
      .then((d: any) => setHousingChatRoomId(d?.chatRoomId ?? null))
      .catch(() => setHousingChatRoomId(null));
  }, [isRemoteCharacter]);

  // Funzione che ricarica i dati e chiama onCharUpdate del parent
  const handleCharUpdate = useCallback(() => {
    loadCharData();
    if (onCharUpdate) onCharUpdate();
  }, [loadCharData, onCharUpdate]);

  if ((!char && !isRemoteCharacter) || loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento…</p>;
  }

  const displayChar = (charData || char) as CharacterSummary;
  if (!displayChar) {
    return <p className="text-sm text-gray-500 p-4">Errore: dati personaggio non disponibili.</p>;
  }

  const levelProgress = resolveLevelFromExp(displayChar.experienceTotal ?? char?.experienceTotal ?? 0);
  const level = levelProgress.level;
  const paragon = levelProgress.paragon;
  const grade = (displayChar as any)?.grade || "Nemuribito";

  // Radar domini Skiru (Ten · Chi · Jin) — mostrato in SchedaMainPage
  const skiruDomains = (displayChar as CharacterSummary & { skiruDomains?: Array<{ label: string; points: number; percent: number }> }).skiruDomains ?? [];

  // Background estetico e tema musicale
  const backgroundImage = (displayChar as any)?.backgroundImage ?? "";
  const themeMusicUrl = (displayChar as any)?.themeMusicUrl ?? "";
  const bannerPg = (displayChar as CharacterSummary)?.bannerPg ?? null;
  const staffAlias = (displayChar as CharacterSummary)?.staffAlias ?? null;
  const masterNotes = (displayChar as CharacterSummary)?.masterNotes ?? null;
  const canEditStaffAlias =
    (char as CharacterSummary)?.canEditStaffAlias ??
    (displayChar as CharacterSummary)?.canEditStaffAlias ??
    false;
  const canEditMasterNotes =
    (char as CharacterSummary)?.canEditMasterNotes ??
    (displayChar as CharacterSummary)?.canEditMasterNotes ??
    false;
  const showMasterNotes = isRemoteCharacter ? visibility.showMasterNotes === true : true;
  const schedaCharacterId = characterId || displayChar.id || "";

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row bg-[var(--panel-bg)]">
      {/* Segnalibri — orizzontali su mobile, verticali su desktop */}
      <div className="shrink-0 flex md:flex-col flex-row items-center gap-2 p-2 md:py-4 md:w-14 overflow-x-auto md:overflow-visible border-b md:border-b-0 md:border-r border-[var(--border-color)] bg-black/40">
        <button
          type="button"
          onClick={() => setActiveSection("main")}
          className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
            activeSection === "main"
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
          }`}
          title="Principale"
        >
          <FontAwesomeIcon icon={icons.user} className="w-4 h-4" />
        </button>
        {isRemoteCharacter && visibility.canSeeFullSheet && (
          <button
            type="button"
            onClick={() => setActiveSection("skiru")}
            className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
              activeSection === "skiru"
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title="Skiru"
          >
            <FontAwesomeIcon icon={icons.skiru} className="w-4 h-4" />
          </button>
        )}
        {(!isRemoteCharacter || visibility.canEdit) && (
          <button
            type="button"
            onClick={() => setActiveSection("modifica")}
            className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
              activeSection === "modifica"
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title="Modifica"
          >
            <FontAwesomeIcon icon={icons.pencil} className="w-4 h-4" />
          </button>
        )}
        {(!isRemoteCharacter || visibility.canSeeBackground !== false) && (
          <button
            type="button"
            onClick={() => setActiveSection("background")}
            className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
              activeSection === "background"
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title="Background"
          >
            <FontAwesomeIcon icon={icons.ordine} className="w-4 h-4" />
          </button>
        )}
        {(!isRemoteCharacter || visibility.canSeeFullSheet) && (
          <button
            type="button"
            onClick={() => setActiveSection("inventario")}
            className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
              activeSection === "inventario"
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title="Inventario"
          >
            <FontAwesomeIcon icon={icons.shop} className="w-4 h-4" />
          </button>
        )}
        {isRemoteCharacter && (
          <button
            type="button"
            onClick={() => setActiveSection("waza")}
            className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
              activeSection === "waza"
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title="Waza (sola lettura)"
          >
            <FontAwesomeIcon icon={icons.waza} className="w-4 h-4" />
          </button>
        )}
        {(!isRemoteCharacter || visibility.canSeeJournal !== false) && (
          <button
            type="button"
            onClick={() => setActiveSection("registrazioni")}
            className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
              activeSection === "registrazioni"
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title="Registrazioni"
          >
            <FontAwesomeIcon icon={icons.message} className="w-4 h-4" />
          </button>
        )}
        {(!isRemoteCharacter || visibility.canSeePrivateLog) && (
          <button
            type="button"
            onClick={() => setActiveSection("log")}
            className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
              activeSection === "log"
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title="Log Tecnici / Fascicolo EXP"
          >
            <FontAwesomeIcon icon={icons.gear} className="w-4 h-4" />
          </button>
        )}
        {!isRemoteCharacter && (
          <button
            type="button"
            onClick={() => setActiveSection("richieste")}
            className={`w-10 h-10 shrink-0 rounded border flex items-center justify-center transition-all ${
              activeSection === "richieste"
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title="Richieste — Madoshō, Ordine, Skiru, Premi, Tenkan"
          >
            <FontAwesomeIcon icon={icons.fire} className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Contenuto principale */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row min-w-0">
        {/* Avatar + alias / note Master */}
        <div className="shrink-0 md:w-[348px] border-b md:border-b-0 md:border-r border-[var(--border-color)] p-4 md:p-6 bg-black/20 flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-4 max-md:overflow-x-auto">
          {displayChar.avatarUrl || displayChar.avatar ? (
            <img
              src={(displayChar.avatarUrl || displayChar.avatar) as string}
              alt={String(displayChar.name)}
              className="rounded-lg border-2 border-[var(--accent-gold)] object-cover shadow-[var(--shadow-gold)] shrink-0 w-[90px] h-[120px] md:w-[300px] md:h-[400px]"
            />
          ) : (
            <div className="rounded-lg border-2 border-[var(--accent-gold)] bg-black/50 flex items-center justify-center shrink-0 w-[90px] h-[120px] md:w-[300px] md:h-[400px]">
              <FontAwesomeIcon icon={icons.user} className="w-10 h-10 md:w-20 md:h-20 text-gray-600" />
            </div>
          )}
          {schedaCharacterId && (
            <div className="min-w-0 flex-1 md:w-full">
            <SchedaAvatarSidebar
              characterId={schedaCharacterId}
              staffAlias={staffAlias}
              masterNotes={masterNotes}
              canEditStaffAlias={canEditStaffAlias}
              canEditMasterNotes={canEditMasterNotes}
              showMasterNotes={showMasterNotes}
              onUpdate={handleCharUpdate}
            />
            </div>
          )}
        </div>

        {/* Tab content */}
        <div
          className={`flex-1 min-h-0 min-w-0 ${activeSection === "skiru" ? "overflow-hidden" : "overflow-y-auto"}`}
          style={
            backgroundImage
              ? {
                  backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(10,0,25,0.9)), url(${backgroundImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }
              : undefined
          }
        >
          {activeSection === "skiru" && isRemoteCharacter && (
            <SchedaSkiruPage
              char={displayChar as CharacterSummary}
              canEdit={false}
              onCharUpdate={handleCharUpdate}
            />
          )}
          {activeSection === "main" && (
            <SchedaMainPage
              char={displayChar}
              level={level}
              levelLabel={levelProgress.label}
              paragon={paragon}
              grade={grade}
              housingChatRoomId={housingChatRoomId}
              skiruDomains={skiruDomains}
              themeMusicUrl={themeMusicUrl}
              bannerPg={bannerPg}
            />
          )}
          {activeSection === "modifica" && (!isRemoteCharacter || visibility.canEdit) && <SchedaModificaPage char={displayChar} characterId={characterId || displayChar.id} onCharUpdate={handleCharUpdate} />}
          {activeSection === "background" && <SchedaBackgroundPage char={displayChar} />}
          {activeSection === "inventario" && <SchedaInventarioPage characterId={characterId || displayChar.id} />}
          {activeSection === "waza" && isRemoteCharacter && (
            <SchedaWazaPage
              characterId={characterId || displayChar.id}
              isOwnCharacter={false}
            />
          )}
          {activeSection === "registrazioni" && <SchedaRegistrazioniPage characterId={characterId || displayChar.id} />}
          {activeSection === "log" && <SchedaLogPage char={displayChar} characterId={characterId || displayChar.id} isRemoteCharacter={!!isRemoteCharacter} />}
          {activeSection === "richieste" && !isRemoteCharacter && <SchedaRichiestePage />}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Profilo (Anagrafica e Profilo Pubblico) ───
function ProfiloTab({ char, onCharUpdate }: { char: NonNullable<CharacterSummary>; onCharUpdate?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(char.avatarUrl ?? char.avatar ?? "");
  const [miniAvatar, setMiniAvatar] = useState(char.miniAvatar ?? "");
  const [surname, setSurname] = useState(char.surname ?? "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/characters/me/profilo", {
        avatar,
        miniAvatar,
        surname,
        bio,
      });
      if (onCharUpdate) onCharUpdate();
      setEditing(false);
      alert("Profilo aggiornato!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        {(char.avatarUrl ?? char.avatar ?? char.miniAvatar) && (
          <img
            src={(char.avatarUrl ?? char.avatar ?? char.miniAvatar) as string}
            alt={String(char.name)}
            className="rounded-lg object-cover border border-[var(--border-color)] shrink-0"
            style={{ width: AVATAR_MAIN_WIDTH, height: AVATAR_MAIN_HEIGHT }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-white flex items-center gap-1.5 flex-wrap mb-2">
            {char.name} {char.surname && <span className="text-[var(--accent-gold)]">{char.surname}</span>}
            <PixelIcons pixelIcons={char.pixelIcons} />
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Livello: {resolveLevelFromExp(char.experienceTotal ?? 0).label}
          </p>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10"
            >
              Modifica Profilo
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Avatar Principale</label>
                <p className="text-[10px] text-[var(--accent-violet-light)]/60 mb-1.5">
                  Consigliato <span className="text-[var(--accent-gold)]">300 × 400 px</span>
                </p>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="URL immagine"
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Avatar Chat</label>
                <p className="text-[10px] text-[var(--accent-violet-light)]/60 mb-1.5">
                  Consigliato <span className="text-[var(--accent-gold)]">100 × 100 px</span>
                </p>
                <input
                  type="text"
                  value={miniAvatar}
                  onChange={(e) => setMiniAvatar(e.target.value)}
                  placeholder="URL immagine"
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Cognome</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Cognome"
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-gray-200"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 block">Background (Storia)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="La tua storia..."
                  rows={6}
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-gray-200 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                >
                  {saving ? "Salvataggio..." : "Salva"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 text-xs hover:bg-black/20"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Statistiche (Skiru v3 + valute) ───
function StatisticheTab({ char, onCharUpdate }: { char: NonNullable<CharacterSummary>; onCharUpdate?: () => void }) {
  const skiruDomains = char.skiruDomains ?? [];
  const derived = resolveCharacterComputed(char.computed);

  return (
    <div className="space-y-6">
      {skiruDomains.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
            Domini Skiru
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {skiruDomains.map((d) => (
              <div key={d.domain} className="bg-black/40 rounded p-2 border border-[var(--border-color)] text-center">
                <p className="text-[10px] text-gray-500 uppercase">{d.label}</p>
                <p className="font-display text-lg text-[var(--accent-gold)]">{d.points}</p>
                <p className="text-[9px] text-[var(--accent-violet-light)]">{d.percent}%</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[var(--accent-violet-light)]/50 mt-2">
            Investi punti nella tab <strong className="text-[var(--accent-gold)]">Skiru</strong> della scheda.
          </p>
        </div>
      )}

      {(derived.hpMax > 0 || derived.mitigationPercent > 0 || derived.movementMeters > 0) && (
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
            Parametri derivati
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {derived.hpMax > 0 && (
              <div className="bg-black/40 rounded p-3 border border-[var(--border-color)] text-center col-span-3 sm:col-span-1">
                <p className="text-[10px] text-gray-500 uppercase mb-1">HP</p>
                <p className="font-display text-xl text-[var(--accent-gold)] tabular-nums">
                  {derived.hpCurrent}/{derived.hpMax}
                </p>
              </div>
            )}
            {derived.mitigationPercent > 0 && (
              <div className="bg-black/40 rounded p-3 border border-[var(--border-color)] text-center">
                <p className="text-[10px] text-gray-500 uppercase mb-1">Mitigazione</p>
                <p className="font-display text-xl text-[var(--accent-gold)]">{derived.mitigationPercent}%</p>
              </div>
            )}
            {derived.movementMeters > 0 && (
              <div className="bg-black/40 rounded p-3 border border-[var(--border-color)] text-center">
                <p className="text-[10px] text-gray-500 uppercase mb-1">Movimento</p>
                <p className="font-display text-xl text-[var(--accent-gold)]">
                  {formatMovementMeters(derived.movementMeters)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Valute &amp; EXP
        </h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <span><strong className="text-[var(--accent-gold)]">REM</strong> {char.rem ?? 0}</span>
          <span><strong className="text-[var(--accent-gold)]">EXP tot.</strong> {char.experienceTotal ?? 0}</span>
          <span><strong className="text-[var(--accent-gold)]">EXP spend.</strong> {char.experienceSpendable ?? 0}</span>
          <span className="text-[var(--accent-violet-light)]/60 text-xs">(finestra Skiru &amp; Waza)</span>
          <span><strong className="text-[var(--accent-gold)]">Keys</strong> {char.keys ?? 0}</span>
        </div>
      </div>

      <details className="rounded border border-[var(--border-color)]/60 bg-black/20 px-3 py-2">
        <summary className="text-[10px] uppercase tracking-widest text-gray-500 cursor-pointer font-display">
          Sistema precedente F/C/D/M/E (solo migrazione)
        </summary>
        <div className="grid grid-cols-5 gap-2 mt-3 pb-1">
          {(["f", "c", "d", "m", "e"] as const).map((k) => (
            <div key={k} className="bg-black/40 rounded p-2 border border-[var(--border-color)] text-center opacity-60">
              <p className="text-[10px] text-gray-500 uppercase">{STAT_LABELS[k] ?? k}</p>
              <p className="font-display text-lg text-gray-400">{char.stats?.[k] ?? 0}</p>
            </div>
          ))}
        </div>
      </details>

      <InventorySection characterId={char.id} />
    </div>
  );
}

// ─── Tab Housing ───
function HousingTab({ characterId }: { characterId?: string }) {
  return <HousingSection characterId={characterId} />;
}

// ─── Tab Amministrazione (Solo Staff) ───
function AmministrazioneTab({ char }: { char: CharacterSummary }) {
  const [sanctions, setSanctions] = useState<Array<{
    id: string;
    type: string;
    reason: string | null;
    createdAt: string;
    adminName: string | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!char?.id) {
      setLoading(false);
      return;
    }
    // TODO: Implementare endpoint API per sanzioni
    // api.get(`/admin/sanctions/${char.id}`)
    //   .then((d) => setSanctions(Array.isArray(d) ? d : []))
    //   .catch(() => setSanctions([]))
    //   .finally(() => setLoading(false));
    setLoading(false);
  }, [char?.id]);

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Storico Sanzioni
        </h4>
        {sanctions.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna sanzione registrata.</p>
        ) : (
          <ul className="space-y-2">
            {sanctions.map((s) => (
              <li key={s.id} className="p-3 rounded border border-[var(--border-color)] bg-black/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white">{s.type}</p>
                    {s.reason && <p className="text-xs text-gray-500 mt-1">{s.reason}</p>}
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(s.createdAt).toLocaleDateString("it-IT")}
                      {s.adminName && ` · da ${s.adminName}`}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Azioni Amministrative
        </h4>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Vuoi resettare le statistiche di questo personaggio ai valori base?")) return;
              try {
                // TODO: Implementare endpoint API
                // await api.post(`/admin/reset-stats/${char.id}`);
                alert("Statistiche resettate (funzionalità in sviluppo)");
              } catch (e: unknown) {
                alert(e instanceof Error ? e.message : "Errore durante il reset");
              }
            }}
            className="px-4 py-2 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10 text-left"
          >
            Reset Statistiche
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sezione Housing ───
function HousingSection({ characterId }: { characterId?: string }) {
  const [housing, setHousing] = useState<{
    id: string;
    housingType: {
      id: string;
      name: string;
      code: string;
    };
    chatRoomId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    api.get("/housing/me")
      .then((d) => {
        setHousing(d as typeof housing);
      })
      .catch(() => setHousing(null))
      .finally(() => setLoading(false));
  }, [characterId]);

  const openHousingChat = () => {
    if (!housing?.chatRoomId) return;
    // Naviga alla chat della casa usando window.location o un trigger
    // Per ora, usiamo un evento custom che DashboardCenter può ascoltare
    window.dispatchEvent(new CustomEvent('openHousingChat', { detail: { roomId: housing.chatRoomId } }));
  };

  if (loading) {
    return (
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Abitazione
        </h4>
        <p className="text-sm text-gray-500">Caricamento…</p>
      </div>
    );
  }

  if (!housing) {
    return (
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Abitazione
        </h4>
        <p className="text-sm text-gray-500">Senzatetto (nessuna abitazione assegnata).</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
        Abitazione
      </h4>
      <div className="space-y-2">
        <p className="text-sm text-white">{housing.housingType.name}</p>
        <div className="flex gap-2 mt-2">
          {housing.chatRoomId && (
            <button
              type="button"
              onClick={openHousingChat}
              className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={icons.message} className="w-3 h-3" />
              Chat Casa
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              // Apri finestra housing - usa un evento custom che la pagina dashboard può ascoltare
              const event = new CustomEvent('openHousingWindow');
              window.dispatchEvent(event);
            }}
            className="px-3 py-1.5 rounded border border-[var(--border-color)] text-gray-400 text-xs hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
          >
            Gestisci
          </button>
        </div>
      </div>
    </div>
  );
}

function BancaContent({ char, onCharUpdate }: { char?: CharacterSummary; onCharUpdate?: () => void }) {
  type Job = { id: string; title: string; description: string | null; dailySalary: number };
  type LedgerEntry = {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  };

  const [activeTab, setActiveTab] = useState<"conto" | "bonifici" | "lavoro">("conto");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [canWithdraw, setCanWithdraw] = useState<{ canWithdraw: boolean; reason?: string }>({ canWithdraw: false });
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [changingJob, setChangingJob] = useState<string | null>(null);
  const [leavingJob, setLeavingJob] = useState(false);
  const [transferData, setTransferData] = useState({ receiverCharacterName: "", amount: "", reason: "" });
  const [transferring, setTransferring] = useState(false);

  const fetchData = useCallback(async () => {
    const [j, cj, cw, l] = await Promise.all([
      api.get("/banca/jobs").then((d) => (Array.isArray(d) ? d : []) as Job[]).catch(() => []),
      api.get("/banca/me/job").then((d) => d as Job | null).catch(() => null),
      api.get("/banca/me/can-withdraw").then((d) => d as typeof canWithdraw).catch(() => ({ canWithdraw: false })),
      api.get("/banca/me/ledger?limit=30").then((d) => (Array.isArray(d) ? d : []) as LedgerEntry[]).catch(() => []),
    ]);
    setJobs(j);
    setCurrentJob(cj);
    setCanWithdraw(cw);
    setLedger(l);
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    try {
      const result = (await api.post("/banca/me/withdraw-salary", {})) as { amount: number; newBalance: number; reason: string };
      alert(`Stipendio ritirato: ${result.amount} REM\nNuovo saldo: ${result.newBalance} REM`);
      setCanWithdraw({ canWithdraw: false, reason: "Stipendio già ritirato oggi" });
      onCharUpdate?.();
      const updated = await api.get("/banca/me/ledger?limit=30").then((d) => (Array.isArray(d) ? d : []) as LedgerEntry[]).catch(() => []);
      setLedger(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il ritiro");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleChangeJob = async (jobId: string) => {
    setChangingJob(jobId);
    try {
      await api.post("/banca/me/job", { jobId });
      const updated = await api.get("/banca/me/job").then((d) => d as Job | null).catch(() => null);
      setCurrentJob(updated);
      alert("Lavoro cambiato con successo!");
      onCharUpdate?.();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il cambio lavoro");
    } finally {
      setChangingJob(null);
    }
  };

  const handleLeaveJob = async () => {
    if (!confirm("Sei sicuro di voler rassegnare le dimissioni?")) return;
    setLeavingJob(true);
    try {
      await api.post("/banca/me/leave-job", {});
      setCurrentJob(null);
      alert("Hai lasciato il lavoro.");
      onCharUpdate?.();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Impossibile lasciare il lavoro.");
    } finally {
      setLeavingJob(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(transferData.amount, 10);
    if (!transferData.receiverCharacterName.trim() || !Number.isFinite(amount) || amount <= 0) {
      alert("Compila destinatario (nome PG) e importo valido.");
      return;
    }
    setTransferring(true);
    try {
      const result = (await api.post("/banca/me/transfer", {
        receiverCharacterName: transferData.receiverCharacterName.trim(),
        amount,
        reason: transferData.reason.trim() || "Bonifico",
      })) as { message: string; newBalance: number };
      alert(result.message);
      setTransferData({ receiverCharacterName: "", amount: "", reason: "" });
      onCharUpdate?.();
      const updated = await api.get("/banca/me/ledger?limit=30").then((d) => (Array.isArray(d) ? d : []) as LedgerEntry[]).catch(() => []);
      setLedger(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il bonifico");
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento…</p>;
  }

  const tabs = [
    { id: "conto" as const, label: "Conto corrente" },
    { id: "bonifici" as const, label: "Bonifici" },
    { id: "lavoro" as const, label: "Arubaito (Lavoro)" },
  ];

  return (
    <div className="space-y-4">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-[var(--border-color)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-display border-b-2 transition-colors ${
              activeTab === tab.id
                ? "text-[var(--accent-gold)] border-[var(--accent-gold)]"
                : "text-gray-500 border-transparent hover:text-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Saldo sempre visibile */}
      <div className="p-3 rounded border border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/10">
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-0.5">Saldo disponibile</p>
        <p className="text-xl font-display text-white">{char?.rem ?? 0} REM</p>
      </div>

      {activeTab === "conto" && (
        <section>
          <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
            Storico movimenti
          </h4>
          {ledger.length === 0 ? (
            <p className="text-sm text-gray-500">Nessun movimento recente.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 px-2 rounded border border-[var(--border-color)]/50 bg-black/20 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{entry.description || entry.type}</p>
                    <p className="text-gray-500 text-[10px]">{new Date(entry.createdAt).toLocaleString("it-IT")}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`font-display ${entry.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {entry.amount >= 0 ? "+" : ""}{entry.amount} REM
                    </p>
                    <p className="text-gray-500 text-[10px]">Saldo: {entry.balanceAfter} REM</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "bonifici" && (
        <section>
          <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
            Invia denaro
          </h4>
          <form onSubmit={handleTransfer} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase text-[var(--accent-gold)] mb-1 font-display">Destinatario (nome PG)</label>
              <input
                type="text"
                value={transferData.receiverCharacterName}
                onChange={(e) => setTransferData((p) => ({ ...p, receiverCharacterName: e.target.value }))}
                placeholder="Es. Kagetsu"
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white placeholder-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[var(--accent-gold)] mb-1 font-display">Importo (REM)</label>
              <input
                type="number"
                min={1}
                value={transferData.amount}
                onChange={(e) => setTransferData((p) => ({ ...p, amount: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white placeholder-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[var(--accent-gold)] mb-1 font-display">Causale</label>
              <input
                type="text"
                value={transferData.reason}
                onChange={(e) => setTransferData((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Es. Pagamento cena"
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white placeholder-gray-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={transferring}
              className="w-full py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
            >
              {transferring ? "Invio in corso…" : "Esegui bonifico"}
            </button>
          </form>
        </section>
      )}

      {activeTab === "lavoro" && (
        <section className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display">
            Arubaito & Stipendio
          </h4>
          {currentJob ? (
            <div className="p-4 rounded border border-[var(--accent-violet)]/50 bg-[var(--accent-violet)]/10">
              <p className="text-[10px] uppercase text-gray-500 mb-1">Attualmente impiegato come</p>
              <p className="font-display text-lg text-white">{currentJob.title}</p>
              <p className="text-xs text-[var(--accent-gold)] mt-1">Paga: {currentJob.dailySalary} REM/giorno</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={withdrawing || !canWithdraw.canWithdraw}
                  className="px-3 py-1.5 rounded border border-green-600 text-green-400 text-xs hover:bg-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canWithdraw.canWithdraw ? (withdrawing ? "Ritiro…" : "Ritira stipendio") : "Stipendio già ritirato"}
                </button>
                <button
                  type="button"
                  onClick={handleLeaveJob}
                  disabled={leavingJob}
                  className="px-3 py-1.5 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10 disabled:opacity-50"
                >
                  {leavingJob ? "…" : "Lascia impiego"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-2">Seleziona un impiego per iniziare a guadagnare REM.</p>
          )}
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500">Nessun lavoro disponibile.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-3 rounded border ${
                    currentJob?.id === job.id ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10" : "border-[var(--border-color)] bg-black/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-white">
                        {job.title}
                        {currentJob?.id === job.id && <span className="ml-2 text-[var(--accent-gold)] text-xs">[Attuale]</span>}
                      </p>
                      {job.description && <p className="text-xs text-gray-500 mt-0.5">{job.description}</p>}
                      <p className="text-xs text-[var(--accent-gold)] mt-1">{job.dailySalary} REM/giorno</p>
                    </div>
                    {currentJob?.id !== job.id && (
                      <button
                        type="button"
                        onClick={() => handleChangeJob(job.id)}
                        disabled={changingJob !== null}
                        className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                      >
                        {changingJob === job.id ? "…" : "Scegli"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function HousingContent({ char, onCharUpdate }: { char?: CharacterSummary; onCharUpdate?: () => void }) {
  const [housingTypes, setHousingTypes] = useState<Array<{
    id: string;
    code: string;
    name: string;
    squareMeters: number;
    dailyRent: number | null;
    monthlyRent: number | null;
    hpBonus: number;
    inventorySlotsBonus: number;
    requirements: { paradisePass?: boolean } | null;
  }>>([]);
  const [currentHousing, setCurrentHousing] = useState<{
    id: string;
    housingType: {
      id: string;
      code: string;
      name: string;
      dailyRent: number | null;
      monthlyRent: number | null;
    };
    nextDueDate: string | null;
    hasPaidCurrentMonth: boolean;
    daysOverdue: number;
    evicted: boolean;
    chatRoomId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rentingId, setRentingId] = useState<string | null>(null);
  const [payingRent, setPayingRent] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [guests, setGuests] = useState<Array<{ id: string; guest: { id: string; name: string; surname: string } }>>([]);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteResults, setInviteResults] = useState<Array<{ id: string; name: string; surname: string }>>([]);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [removingGuestId, setRemovingGuestId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/housing/types").then((d) => (Array.isArray(d) ? d : []) as typeof housingTypes).catch(() => []),
      api.get("/housing/me").then((d) => d as typeof currentHousing).catch(() => null),
    ])
      .then(([types, housing]) => {
        setHousingTypes(types);
        setCurrentHousing(housing);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRent = async (housingTypeId: string) => {
    if (!confirm("Vuoi affittare questa casa? Se hai già una casa, verrà sostituita.")) return;
    setRentingId(housingTypeId);
    try {
      await api.post("/housing/assign", { housingTypeId });
      const updated = await api.get("/housing/me").then((d) => d as typeof currentHousing).catch(() => null);
      setCurrentHousing(updated);
      if (onCharUpdate) {
        onCharUpdate();
      }
      alert("Casa affittata con successo!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'affitto");
    } finally {
      setRentingId(null);
    }
  };

  const handlePayRent = async () => {
    if (!confirm("Vuoi pagare l'affitto mensile ora?")) return;
    setPayingRent(true);
    try {
      await api.post("/housing/pay-rent", {});
      const updated = await api.get("/housing/me").then((d) => d as typeof currentHousing).catch(() => null);
      setCurrentHousing(updated);
      if (onCharUpdate) {
        onCharUpdate();
      }
      alert("Affitto pagato con successo!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il pagamento");
    } finally {
      setPayingRent(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Vuoi rimuovere questa casa? Diventerai senzatetto (-5pf).")) return;
    setRemoving(true);
    try {
      await api.post("/housing/remove", {});
      setCurrentHousing(null);
      if (onCharUpdate) {
        onCharUpdate();
      }
      alert("Casa rimossa. Sei ora senzatetto.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante la rimozione");
    } finally {
      setRemoving(false);
    }
  };

  const openHousingChat = () => {
    if (!currentHousing?.chatRoomId) return;
    window.dispatchEvent(new CustomEvent('openHousingChat', { detail: { roomId: currentHousing.chatRoomId } }));
  };

  // Carica ospiti quando c'è una casa con chat
  useEffect(() => {
    if (!currentHousing?.chatRoomId) return;
    api.get("/housing/guests").then((d) => (Array.isArray(d) ? d : []) as typeof guests).then(setGuests).catch(() => setGuests([]));
  }, [currentHousing?.chatRoomId]);

  // Live search per invito ospite (debounce)
  useEffect(() => {
    const q = inviteSearch.trim();
    if (q.length < 2) {
      setInviteResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get(`/characters/search${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((d) => {
        const arr = Array.isArray(d) ? d : [];
        setInviteResults(arr.slice(0, 6));
      }).catch(() => setInviteResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [inviteSearch]);

  const handleInviteGuest = async (guestCharacterId: string) => {
    setInvitingId(guestCharacterId);
    try {
      await api.post("/housing/guests", { guestCharacterId });
      const updated = await api.get("/housing/guests").then((d) => (Array.isArray(d) ? d : []) as typeof guests);
      setGuests(updated);
      setInviteSearch("");
      setInviteResults([]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore durante l'invito");
    } finally {
      setInvitingId(null);
    }
  };

  const handleRemoveGuest = async (guestCharacterId: string) => {
    setRemovingGuestId(guestCharacterId);
    try {
      await api.delete(`/housing/guests/${guestCharacterId}`);
      setGuests((prev) => prev.filter((g) => g.guest.id !== guestCharacterId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore durante la rimozione");
    } finally {
      setRemovingGuestId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Housing Corrente */}
      <section>
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Immobiliare — La tua abitazione
        </h4>
        {!currentHousing ? (
          <div className="p-3 rounded border border-red-500/50 bg-red-500/10">
            <p className="text-sm text-white">Senzatetto</p>
            <p className="text-xs text-gray-400 mt-1">Malus: -5pf, inventario limitato</p>
          </div>
        ) : currentHousing.evicted ? (
          <div className="p-3 rounded border border-red-500/50 bg-red-500/10">
            <p className="text-sm text-white">Sfrattato</p>
            <p className="text-xs text-gray-400 mt-1">Casa persa per mancato pagamento</p>
          </div>
        ) : (
          <div className="p-3 rounded border border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/10">
            <p className="text-sm font-display text-white">{currentHousing.housingType.name}</p>
            <div className="mt-2 space-y-1 text-xs text-gray-400">
              {currentHousing.housingType.code === "order_room" && "dailyRent" in currentHousing.housingType && currentHousing.housingType.dailyRent && (
                <p>Affitto giornaliero: -{currentHousing.housingType.dailyRent} REM/giorno</p>
              )}
              {"monthlyRent" in currentHousing.housingType && currentHousing.housingType.monthlyRent && (
                <>
                  <p>Affitto mensile: {currentHousing.housingType.monthlyRent} REM</p>
                  {currentHousing.nextDueDate && (
                    <p>
                      Scadenza: {new Date(currentHousing.nextDueDate).toLocaleDateString("it-IT")}
                      {currentHousing.daysOverdue > 0 && (
                        <span className="text-red-400 ml-2">({currentHousing.daysOverdue} giorni di ritardo)</span>
                      )}
                    </p>
                  )}
                  <p>Pagato questo mese: {currentHousing.hasPaidCurrentMonth ? "Sì" : "No"}</p>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              {"monthlyRent" in currentHousing.housingType && currentHousing.housingType.monthlyRent && !currentHousing.hasPaidCurrentMonth && (
                <button
                  type="button"
                  onClick={handlePayRent}
                  disabled={payingRent}
                  className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                >
                  {payingRent ? "…" : "Paga Affitto"}
                </button>
              )}
              {currentHousing.chatRoomId && (
                <button
                  type="button"
                  onClick={openHousingChat}
                  className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10"
                >
                  <FontAwesomeIcon icon={icons.message} className="w-3 h-3 mr-1" />
                  Chat Casa
                </button>
              )}
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="px-3 py-1.5 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10 disabled:opacity-50"
              >
                {removing ? "…" : "Rimuovi"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Gestione Ospiti (solo se ha casa con chat) */}
      {currentHousing?.chatRoomId && !currentHousing.evicted && (
        <section>
          <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
            Ospiti
          </h4>
          <p className="text-xs text-gray-400 mb-2">Gli ospiti possono accedere alla chat della tua casa.</p>
          <div className="space-y-2 mb-3">
            <input
              type="text"
              placeholder="Cerca personaggio da invitare (min 2 caratteri)"
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              className="w-full px-3 py-1.5 rounded border border-[var(--border-color)] bg-black/30 text-white text-sm placeholder-gray-500"
            />
            {inviteResults.length > 0 && (
              <ul className="rounded border border-[var(--border-color)] bg-black/40 divide-y divide-[var(--border-color)]">
                {inviteResults.map((c) => {
                  const alreadyGuest = guests.some((g) => g.guest.id === c.id);
                  return (
                    <li key={c.id} className="flex items-center justify-between px-2 py-1.5 text-sm">
                      <span className="text-white">{c.name} {c.surname || ""}</span>
                      <button
                        type="button"
                        onClick={() => handleInviteGuest(c.id)}
                        disabled={invitingId !== null || alreadyGuest}
                        className="px-2 py-0.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                      >
                        {alreadyGuest ? "Già ospite" : invitingId === c.id ? "…" : "Invita"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {guests.length > 0 ? (
            <ul className="space-y-1 rounded border border-[var(--border-color)] bg-black/20 divide-y divide-[var(--border-color)]">
              {guests.map((g) => (
                <li key={g.id} className="flex items-center justify-between px-2 py-1.5 text-sm">
                  <span className="text-white">{g.guest.name} {g.guest.surname || ""}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveGuest(g.guest.id)}
                    disabled={removingGuestId !== null}
                    className="px-2 py-0.5 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {removingGuestId === g.guest.id ? "…" : "Rimuovi"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">Nessun ospite invitato.</p>
          )}
        </section>
      )}

      {/* Case Disponibili */}
      <section>
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Case Disponibili
        </h4>
        {housingTypes.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna casa disponibile.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {housingTypes.map((type) => {
              const isCurrent = currentHousing?.housingType.id === type.id;
              return (
                <div
                  key={type.id}
                  className={`p-3 rounded border ${
                    isCurrent
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                      : "border-[var(--border-color)] bg-black/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm text-white">
                        {type.name}
                        {isCurrent && <span className="ml-2 text-[var(--accent-gold)] text-xs">[Attuale]</span>}
                      </p>
                      <div className="mt-1 space-y-0.5 text-xs text-gray-400">
                        <p>{type.squareMeters} m²</p>
                        {type.dailyRent && <p>Affitto giornaliero: -{type.dailyRent} REM/giorno</p>}
                        {type.monthlyRent && <p>Affitto mensile: {type.monthlyRent} REM</p>}
                        {type.hpBonus !== 0 && (
                          <p className="text-green-400">Bonus HP: {type.hpBonus > 0 ? "+" : ""}{type.hpBonus}pf</p>
                        )}
                        {type.inventorySlotsBonus > 0 && (
                          <p className="text-[var(--accent-gold)]">Bonus inventario: +{type.inventorySlotsBonus} slot</p>
                        )}
                        {type.requirements?.paradisePass && (
                          <p className="text-[var(--accent-violet)]">Richiede: Pass Paradise</p>
                        )}
                      </div>
                    </div>
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleRent(type.id)}
                        disabled={rentingId !== null}
                        className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                      >
                        {rentingId === type.id ? "…" : "Affitta"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Ordine Content ───
const ORDINE_CHISEN = { id: "chisen-tai", src: "/ordine/chisen.png", label: "Chisen-Tai" };
const ORDINE_MUGEN = { id: "mugen-tai", src: "/ordine/mugen.png", label: "Mugen-Tai" };

function OrdineStatutoBox({ ord, onClose }: { ord: typeof ORDINE_CHISEN; onClose: () => void }) {
  return (
    <div className="w-full max-w-md h-[70%] min-h-0 p-6 mt-2 mx-4 mb-4 bg-black/30 rounded border border-[var(--accent-gold)]/30 overflow-y-auto self-stretch flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display">
          {ord.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-white"
        >
          Chiudi
        </button>
      </div>
      <div className="space-y-6 text-sm flex-1 min-h-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)]/80 mb-2 font-display">Statuto</p>
          <p className="text-gray-400 italic">[Placeholder — Contenuto statuto]</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)]/80 mb-2 font-display">Regole</p>
          <p className="text-gray-400 italic">[Placeholder — Contenuto regole]</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)]/80 mb-2 font-display">Compendi</p>
          <p className="text-gray-400 italic">[Placeholder — Contenuto compendi]</p>
        </div>
      </div>
    </div>
  );
}

function OrdineContent({ char }: { char?: CharacterSummary }) {
  const [statutoOpen, setStatutoOpen] = useState<"chisen-tai" | "mugen-tai" | null>(null);

  return (
    <div className="flex flex-col h-full min-h-0 -mx-4 mt-7 -mb-4">
      {/* Split: click su un'immagine → l'altra sparisce, lo statuto prende il suo posto */}
      <div className="flex-1 flex min-h-[960px] items-stretch overflow-visible pt-6">
        {/* Slot sinistro: Chisen quando nulla/mugen aperto, Statuto quando chisen aperto */}
        <div
          className="flex-1 flex min-h-0 overflow-visible pr-0"
          style={{ justifyContent: statutoOpen === "mugen-tai" ? "center" : statutoOpen === "chisen-tai" ? "flex-start" : "flex-end", alignItems: statutoOpen === "mugen-tai" ? "center" : "flex-start" }}
        >
          {statutoOpen === "mugen-tai" ? (
            <OrdineStatutoBox ord={ORDINE_MUGEN} onClose={() => setStatutoOpen(null)} />
          ) : (
            <button
              type="button"
              onClick={() => setStatutoOpen("chisen-tai")}
              className="group relative flex items-start justify-center pt-0 px-2 pb-6 focus:outline-none overflow-visible pr-0"
            >
              <img
                src={ORDINE_CHISEN.src}
                alt={ORDINE_CHISEN.label}
                className={`max-w-full max-h-[800px] w-auto h-auto object-contain mt-6 ${statutoOpen === "chisen-tai" ? "-mr-4 -ml-12" : "-mr-20"}`}
              />
              <span className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 px-3 py-1.5 rounded">
                {ORDINE_CHISEN.label}
              </span>
            </button>
          )}
        </div>
        {/* Slot destro: Mugen quando nulla/chisen aperto, Statuto quando mugen aperto */}
        <div
          className="flex-1 flex min-h-0 overflow-visible pl-0"
          style={{ justifyContent: statutoOpen === "chisen-tai" ? "center" : statutoOpen === "mugen-tai" ? "flex-end" : "flex-start", alignItems: statutoOpen === "chisen-tai" ? "center" : "flex-start" }}
        >
          {statutoOpen === "chisen-tai" ? (
            <OrdineStatutoBox ord={ORDINE_CHISEN} onClose={() => setStatutoOpen(null)} />
          ) : (
            <button
              type="button"
              onClick={() => setStatutoOpen("mugen-tai")}
              className="group relative flex items-start justify-center pt-0 px-2 pb-6 focus:outline-none overflow-visible pl-0"
            >
              <img
                src={ORDINE_MUGEN.src}
                alt={ORDINE_MUGEN.label}
                className={`max-w-full max-h-[800px] w-auto h-auto object-contain -mt-6 ${statutoOpen === "mugen-tai" ? "-ml-4 -mr-12" : "-ml-20"}`}
              />
              <span className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 px-3 py-1.5 rounded">
                {ORDINE_MUGEN.label}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bestiario Content ───
type BestiaryEntry = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: "HOLIC" | "PHOBIAS" | "MUEN";
  stats: { hp?: number; attack?: number; defense?: number } | null;
};

type BestiaryByCategory = {
  HOLIC: BestiaryEntry[];
  PHOBIAS: BestiaryEntry[];
  MUEN: BestiaryEntry[];
};

const CATEGORY_LABELS: Record<string, string> = {
  HOLIC: "Holic",
  PHOBIAS: "Phobias",
  MUEN: "Muen",
};

function BestiarioContent({ char }: { char?: CharacterSummary }) {
  const [grouped, setGrouped] = useState<BestiaryByCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/bestiario")
      .then((d) => setGrouped(d as BestiaryByCategory))
      .catch(() => setGrouped({ HOLIC: [], PHOBIAS: [], MUEN: [] }))
      .finally(() => setLoading(false));
  }, []);

  const filterEntry = (e: BestiaryEntry) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q) ?? false)
    );
  };

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento…</p>;
  }

  const total = grouped ? grouped.HOLIC.length + grouped.PHOBIAS.length + grouped.MUEN.length : 0;

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Cerca PNG…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]"
      />

      {!grouped || total === 0 ? (
        <div className="text-sm text-gray-500 italic p-4 bg-black/20 rounded border border-[var(--border-color)]">
          Nessun PNG nel catalogo. Un Master o Admin può aggiungere voci da Gestione.
        </div>
      ) : (
        <div className="space-y-6">
          {(["HOLIC", "PHOBIAS", "MUEN"] as const).map((cat) => {
            const entries = (grouped[cat] ?? []).filter(filterEntry);
            if (entries.length === 0) return null;
            return (
              <section key={cat}>
                <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-3 font-display">
                  {CATEGORY_LABELS[cat]}
                </h4>
                <ul className="space-y-2">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="p-3 rounded border border-[var(--border-color)] bg-black/20 flex gap-3"
                    >
                      {entry.imageUrl && (
                        <div className="w-12 h-12 shrink-0 rounded border border-[var(--border-color)] overflow-hidden bg-black/40">
                          <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h5 className="font-display text-sm text-white">{entry.name}</h5>
                        {entry.stats && (entry.stats.hp ?? entry.stats.attack ?? entry.stats.defense) != null && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            HP {entry.stats.hp ?? "—"} · ATK {entry.stats.attack ?? "—"} · DEF {entry.stats.defense ?? "—"}
                          </p>
                        )}
                        {entry.description && (
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{entry.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
