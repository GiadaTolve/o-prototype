"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { formatNarrativeText } from "@/lib/narrative-parser";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import {
  getPixelIconUrlRuolo,
  getPixelIconUrlOrdine,
  type PixelIconRuolo,
  type PixelIconOrdine,
} from "./pixel-icons";
import {
  ROOT_PINS,
  ROOT_MAP_IMAGE,
  GAME_MAPS,
  type GameMapId,
  type ZoneConfig,
  type RoomId,
  getChatListForZone,
  getChatLocationByRoomId,
} from "@/config/map-config";
import type { ChatMessage, Presente, CharacterSummary } from "./types";
import { useIsMobile } from "@/hooks/useIsMobile";

type View = "root" | "game-map" | "zone-list" | "chat" | "shinigami" | "guida" | "ambientazione" | "forum" | "gestione";

type Props = {
  mapTrigger?: number;
  shinigamiTrigger?: number;
  guidaTrigger?: number;
  ambientazioneTrigger?: number;
  forumTrigger?: number;
  gestioneTrigger?: number;
  onRoomChange: (room: RoomId | null) => void;
  messages: ChatMessage[];
  sendMessage: (text: string, locationTag?: string | null) => void;
  chatConnected: boolean;
  /** Presenti in questa chat (solo quando roomId è impostato). */
  usersInRoom: Presente[];
  /** Solo Shinigami vedono "Registra Quest" in chat. */
  canAccessShinigami?: boolean;
  /** Solo Admin/Mod/Capo vedono "Global Message" in chat. */
  canAccessGestione?: boolean;
  /** Personaggio corrente (per ShinigamiContent). */
  char?: CharacterSummary;
};

export function DashboardCenter({
  mapTrigger = 0,
  shinigamiTrigger = 0,
  guidaTrigger = 0,
  ambientazioneTrigger = 0,
  forumTrigger = 0,
  gestioneTrigger = 0,
  onRoomChange,
  messages,
  sendMessage,
  chatConnected,
  usersInRoom,
  canAccessShinigami,
  canAccessGestione,
  char,
}: Props) {
  const [view, setView] = useState<View>("root");
  const [gameMapId, setGameMapId] = useState<GameMapId | null>(null);
  const [zone, setZone] = useState<ZoneConfig | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<RoomId | null>(null);
  /** Banner per mappa (da Gestione → Modifica mappa). Chiave = gameMapId. */
  const [mapBanners, setMapBanners] = useState<Record<string, { url: string; position?: string }>>({});

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tagLuogoRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  // Reagisce ai trigger per aprire le viste
  useEffect(() => {
    if (shinigamiTrigger > 0 && canAccessShinigami) {
      setView("shinigami");
    }
  }, [shinigamiTrigger, canAccessShinigami]);

  useEffect(() => {
    if (guidaTrigger > 0) {
      setView("guida");
    }
  }, [guidaTrigger]);

  useEffect(() => {
    if (ambientazioneTrigger > 0) {
      setView("ambientazione");
    }
  }, [ambientazioneTrigger]);

  useEffect(() => {
    if (forumTrigger > 0) {
      setView("forum");
    }
  }, [forumTrigger]);

  useEffect(() => {
    if (gestioneTrigger > 0 && canAccessGestione) {
      setView("gestione");
    }
  }, [gestioneTrigger, canAccessGestione]);

  const goRoot = () => {
    setView("root");
    setGameMapId(null);
    setZone(null);
    setSelectedRoomId(null);
    onRoomChange(null);
  };

  const goGameMap = (id: GameMapId) => {
    setView("game-map");
    setGameMapId(id);
    setZone(null);
    setSelectedRoomId(null);
    onRoomChange(null);
  };

  const goZoneList = (z: ZoneConfig) => {
    setView("zone-list");
    setZone(z);
    setSelectedRoomId(null);
    onRoomChange(null);
  };

  const goChat = (r: RoomId) => {
    setView("chat");
    setSelectedRoomId(r);
    onRoomChange(r);
  };

  const backFromChat = () => {
    setView("zone-list");
    setSelectedRoomId(null);
    onRoomChange(null);
  };

  const backFromZoneList = () => {
    setView("game-map");
    setZone(null);
  };

  const backFromGameMap = () => {
    goRoot();
  };

  useEffect(() => {
    if (mapTrigger > 0) goRoot();
  }, [mapTrigger]);

  // Carica banner mappe (modificabili in Gestione → Modifica mappa)
  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/map-banners")
      .then((data) => {
        if (!cancelled && data && typeof data === "object" && !("error" in data)) {
          setMapBanners(data as Record<string, { url: string; position?: string }>);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Ascolta eventi per aprire chat housing dalla scheda
  useEffect(() => {
    const handleOpenHousingChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ roomId: string }>;
      const roomId = customEvent.detail.roomId as RoomId;
      goChat(roomId);
    };

    window.addEventListener('openHousingChat', handleOpenHousingChat);
    return () => {
      window.removeEventListener('openHousingChat', handleOpenHousingChat);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    const tagInput = tagLuogoRef.current;
    if (!input?.value.trim() || !chatConnected) return;
    
    // Controllo limite mobile: 500 caratteri per azioni da smartphone
    const messageText = input.value.trim();
    if (isMobile && messageText.length > 500) {
      toast.warning("Limite mobile: le azioni da smartphone non possono superare i 500 caratteri.");
      return;
    }
    
    const tag = tagInput?.value.trim() || undefined;
    sendMessage(messageText, tag || undefined);
    input.value = "";
    if (tagInput) tagInput.value = "";
    // Reset altezza textarea
    if (input) {
      input.style.height = 'auto';
      input.style.height = '40px';
    }
  };

  const gameMap = gameMapId ? GAME_MAPS[gameMapId] : null;

  return (
    <main className="flex-[2.5] min-w-0 h-full bg-[var(--panel-bg)]/40 border border-[var(--border-color)] rounded-lg p-6 order-1 lg:order-2 flex flex-col overflow-hidden">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-display shrink-0">
        Area centrale — Mappe e chat
      </p>

      {view === "root" && (
        <div className="relative flex-1 min-h-0 overflow-hidden rounded-lg border border-[var(--border-color)]">
          <MapViewRoot onSelectGameMap={goGameMap} />
        </div>
      )}

      {view === "game-map" && gameMap && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <MapViewGameMap
            gameMap={gameMap}
            bannerUrl={gameMapId ? mapBanners[gameMapId]?.url : undefined}
            bannerPosition={gameMapId ? mapBanners[gameMapId]?.position : undefined}
            onSelectZone={goZoneList}
            onBack={backFromGameMap}
          />
        </div>
      )}

      {view === "zone-list" && zone && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <MapViewZoneList
          zone={zone}
          gameMapLabel={gameMap?.label ?? ""}
          onSelectRoom={goChat}
          onBack={backFromZoneList}
        />
        </div>
      )}

      {view === "shinigami" && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Shinigami</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Mappa
            </button>
          </div>
          <iframe
            src="/shinigami"
            className="w-full h-full min-h-[600px] border border-[var(--border-color)] rounded bg-[var(--panel-bg)]"
            title="Shinigami"
          />
        </div>
      )}

      {view === "guida" && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Guida</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Mappa
            </button>
          </div>
          <iframe
            src="/guida"
            className="w-full h-full min-h-[600px] border border-[var(--border-color)] rounded bg-[var(--panel-bg)]"
            title="Guida"
          />
        </div>
      )}

      {view === "ambientazione" && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Ambientazione</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Mappa
            </button>
          </div>
          <iframe
            src="/ambientazione"
            className="w-full h-full min-h-[600px] border border-[var(--border-color)] rounded bg-[var(--panel-bg)]"
            title="Ambientazione"
          />
        </div>
      )}

      {view === "forum" && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Forum</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Mappa
            </button>
          </div>
          <iframe
            src="/forum"
            className="w-full h-full min-h-[600px] border border-[var(--border-color)] rounded bg-[var(--panel-bg)]"
            title="Forum"
          />
        </div>
      )}

      {view === "gestione" && (
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Gestione</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Mappa
            </button>
          </div>
          <iframe
            src="/gestione"
            className="w-full h-full min-h-[600px] border border-[var(--border-color)] rounded bg-[var(--panel-bg)]"
            title="Gestione"
          />
        </div>
      )}

      {view === "chat" && selectedRoomId && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ChatView
          roomId={selectedRoomId}
          placeLabel={getChatLocationByRoomId(selectedRoomId)?.label ?? selectedRoomId}
          messages={messages}
          sendMessage={sendMessage}
          chatConnected={chatConnected}
          usersInRoom={usersInRoom}
          onSubmit={handleSubmit}
          inputRef={inputRef}
          tagLuogoRef={tagLuogoRef}
          listRef={listRef}
          onBack={backFromChat}
          canAccessShinigami={canAccessShinigami}
          canAccessGestione={canAccessGestione}
          char={char}
        />
        </div>
      )}
    </main>
  );
}

// ─── Root map (map.png + pins) ───
function MapViewRoot({ onSelectGameMap }: { onSelectGameMap: (id: GameMapId) => void }) {
  return (
    <div className="absolute inset-0 bg-black/40">
      <Image
        src={ROOT_MAP_IMAGE}
        alt="Mappa root"
        fill
        className="object-cover"
        sizes="(max-width: 900px) 100vw, 60vw"
      />
      {ROOT_PINS.map((pin) => (
        <button
          key={pin.gameMapId}
          type="button"
          onClick={() => onSelectGameMap(pin.gameMapId)}
          className="group absolute hover:scale-110 transition-transform z-10"
          style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -100%)" }}
        >
          {/* Nuvoletta con nome mappa al hover */}
          <span
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900/95 text-gray-100 text-sm font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg border border-gray-700/80 z-20"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
          >
            {pin.label}
            {/* Codino della nuvoletta verso il pin */}
            <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900/95" />
          </span>
          <img
            src="/icone/map-pin.png"
            alt={pin.label}
            className="w-10 h-auto drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] pointer-events-none"
          />
        </button>
      ))}
      <p className="absolute bottom-2 left-2 text-[10px] text-gray-500 z-10">
        Clicca un pin per aprire la mappa di gioco.
      </p>
    </div>
  );
}

// ─── Game map (Ogon: zone buttons) ───
function MapViewGameMap({
  gameMap,
  bannerUrl,
  bannerPosition,
  onSelectZone,
  onBack,
}: {
  gameMap: { id: GameMapId; label: string; image?: string; zones: ZoneConfig[] };
  /** URL banner nell'header (da Gestione → Modifica mappa). */
  bannerUrl?: string;
  /** Posizione immagine nel ritaglio: center, top, left top, ecc. o "x% y%" (da Gestione). */
  bannerPosition?: string;
  onSelectZone: (z: ZoneConfig) => void;
  onBack: () => void;
}) {
  const hasZones = gameMap.zones.length > 0;
  const objectPosition = bannerPosition && bannerPosition.trim() ? bannerPosition.trim() : "center";

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Header: 1/3 titolo (indietro + nome), 2/3 banner */}
      <div className="flex items-stretch gap-3 shrink-0 w-full min-h-0">
        <div className="w-1/3 min-w-0 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded border border-[var(--border-color)] text-gray-400 hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-colors shrink-0"
            title="Torna alla mappa root"
          >
            <FontAwesomeIcon icon={icons.back} className="w-4 h-4" />
          </button>
          <h2 className="font-display text-lg uppercase tracking-wider text-[var(--accent-gold)] truncate">
            {gameMap.label}
          </h2>
        </div>
        <div className="flex-1 min-w-0 relative overflow-hidden rounded border border-[var(--border-color)]/50 bg-black/20 h-24 min-h-[96px]">
          {bannerUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition }}
              />
              {/* Overlay che oscura leggermente il banner */}
              <div className="absolute inset-0 bg-black/35 pointer-events-none rounded-[inherit]" aria-hidden />
            </>
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-600 px-2 text-center">
              In Gestione → Modifica mappa: scegli la mappa e inserisci l’URL del banner.
            </span>
          )}
        </div>
      </div>
      {hasZones ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {gameMap.zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => onSelectZone(z)}
              className="flex flex-col items-center justify-center min-h-[80px] rounded-lg border border-[var(--border-color)] bg-black/40 text-gray-400 hover:border-[var(--accent-gold)]/50 hover:text-[var(--accent-gold)] transition-colors"
            >
              <FontAwesomeIcon icon={icons.map} className="w-5 h-5 mb-1 opacity-70" />
              <span className="font-display text-sm uppercase tracking-wider">{z.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-4">
          Nessuna sottomappa disponibile per {gameMap.label}.
        </p>
      )}
    </div>
  );
}

// ─── Zone list: [Nome zona] + lista chat ───
function MapViewZoneList({
  zone,
  gameMapLabel,
  onSelectRoom,
  onBack,
}: {
  zone: ZoneConfig;
  gameMapLabel: string;
  onSelectRoom: (r: RoomId) => void;
  onBack: () => void;
}) {
  const chats = getChatListForZone(zone);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded border border-[var(--border-color)] text-gray-400 hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-colors"
          title="Torna alla mappa"
        >
          <FontAwesomeIcon icon={icons.back} className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[10px] uppercase text-gray-500">{gameMapLabel}</p>
          <h2 className="font-display text-lg uppercase tracking-wider text-[var(--accent-gold)]">
            {zone.label}
          </h2>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest text-gray-500">Chat</p>
        {chats.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna chat in questa zona.</p>
        ) : (
          <ul className="space-y-1">
            {chats.map(({ roomId, label, containerLabel }) => (
              <li key={roomId}>
                <button
                  type="button"
                  onClick={() => onSelectRoom(roomId)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-[var(--border-color)] bg-black/40 text-gray-300 hover:border-[var(--accent-gold)]/50 hover:text-[var(--accent-gold)] transition-colors flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={icons.message} className="w-4 h-4 opacity-70" />
                  <span className="font-display">{label}</span>
                  {containerLabel && (
                    <span className="text-xs text-gray-500 ml-auto">{containerLabel}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type QuestItem = { id: string; title: string; status: string; participantCount: number };

type GameSession = {
  id: string;
  creatorId: string;
  roomId: string;
  title: string | null;
  fetchId: string | null;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'CANCELLED';
  startedAt: string;
  lastActiveAt: string;
  closedAt: string | null;
  cancelledAt: string | null;
  creator?: { id: string; name: string };
  fetch?: { id: string; title: string };
  participants?: Array<{
    id: string;
    characterId: string;
    actionCount: number;
    character?: { id: string; name: string };
  }>;
};

function RegistraGiocataButton({ roomId }: { roomId: RoomId | null }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<GameSession | null>(null);
  const [myFetchId, setMyFetchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [useFetch, setUseFetch] = useState(false);
  const [title, setTitle] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const loadData = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const [activeSession, myFetch] = await Promise.all([
        api.get(`/game-sessions/room/${roomId}/active`).then((d) => d as GameSession | null).catch(() => null),
        api.get("/fetches/my").then((d) => { const x = d as { id?: string; assigned?: boolean } | undefined; return x && "id" in x && x.id ? x.id : null; }).catch(() => null),
      ]);
      setSession(activeSession);
      setMyFetchId(myFetch);
      setUseFetch(!!myFetch);
    } catch (e) {
      console.error("Errore caricamento dati:", e);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (open && roomId) loadData();
    if (!open) {
      setTitle("");
    }
  }, [open, roomId, loadData]);


  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  const startSession = async () => {
    if (!roomId) return;
    setActionLoading('start');
    try {
      const newSession = await api.post("/game-sessions", {
        roomId,
        title: title.trim() || undefined,
        fetchId: useFetch && myFetchId ? myFetchId : undefined,
      }) as GameSession;
      setSession(newSession);
      setTitle("");
      toast.success("Registrazione avviata con successo!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'avvio della registrazione");
    } finally {
      setActionLoading(null);
    }
  };

  const refreshParticipants = async () => {
    if (!session) return;
    setActionLoading('refresh');
    try {
      const updated = await api.post(`/game-sessions/${session.id}/refresh-participants`, {}) as GameSession;
      setSession(updated);
      toast.success("Partecipanti aggiornati");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'aggiornamento");
    } finally {
      setActionLoading(null);
    }
  };

  const freezeSession = async () => {
    if (!session) return;
    setActionLoading('freeze');
    try {
      const updated = await api.post(`/game-sessions/${session.id}/freeze`, {}) as GameSession;
      setSession(updated);
      toast.info("Registrazione congelata");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore durante il congelamento");
    } finally {
      setActionLoading(null);
    }
  };

  const resumeSession = async () => {
    if (!session) return;
    setActionLoading('resume');
    try {
      const updated = await api.post(`/game-sessions/${session.id}/resume`, {}) as GameSession;
      setSession(updated);
      toast.success("Registrazione riavviata");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore durante il riavvio");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseSession = () => {
    setShowCloseConfirm(true);
  };

  const closeSession = async () => {
    if (!session) return;
    setShowCloseConfirm(false);
    setActionLoading('close');
    try {
      const updated = await api.post(`/game-sessions/${session.id}/close`, {}) as GameSession;
      setSession(updated);
      toast.success("Registrazione chiusa e conservata");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore durante la chiusura");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSession = () => {
    setShowCancelConfirm(true);
  };

  const cancelSession = async () => {
    if (!session) return;
    setShowCancelConfirm(false);
    setActionLoading('cancel');
    try {
      const updated = await api.post(`/game-sessions/${session.id}/cancel`, {}) as GameSession;
      setSession(updated);
      toast.warning("Registrazione annullata");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'annullamento");
    } finally {
      setActionLoading(null);
    }
  };

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!roomId) {
      toast.warning("Seleziona una chat per registrare una giocata");
      return;
    }
    setOpen((o) => !o);
  };

  const dropdown = open && typeof document !== "undefined" && createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="relative z-[9999] min-w-[320px] max-w-[90vw] max-h-[85vh] overflow-y-auto rounded border border-[var(--border-color)] bg-[var(--panel-bg)] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          margin: 'auto',
        }}
      >
        {loading ? (
          <div className="space-y-4">
            <Skeleton variant="rounded" height={24} width="60%" />
            <SkeletonList items={2} />
            <div className="flex gap-2 pt-2">
              <Skeleton variant="rounded" height={36} width="50%" />
              <Skeleton variant="rounded" height={36} width="30%" />
            </div>
          </div>
        ) : session ? (
          // Gestione sessione esistente
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--accent-gold)] mb-1">
                {session.title || 'Registrazione'} {session.status === 'ACTIVE' ? 'Attiva' : session.status === 'FROZEN' ? 'Congelata' : session.status === 'CLOSED' ? 'Chiusa' : 'Annullata'}
              </h3>
              {session.fetch && (
                <p className="text-[10px] text-[var(--accent-violet)] mb-2">
                  Fetch: {session.fetch.title}
                </p>
              )}
            </div>

            {session.participants && session.participants.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Partecipanti</h4>
                <ul className="space-y-1">
                  {session.participants.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-xs">
                      <span>{p.character?.name || p.characterId}</span>
                      <span className="text-[var(--accent-gold)]">{p.actionCount} azioni</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {session.status === 'ACTIVE' && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={refreshParticipants}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:bg-black/20 disabled:opacity-50"
                >
                  {actionLoading === 'refresh' ? "…" : "Aggiorna partecipanti"}
                </button>
                <button
                  type="button"
                  onClick={freezeSession}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-yellow-500/60 text-yellow-400 hover:bg-yellow-500/10 text-xs disabled:opacity-50"
                >
                  {actionLoading === 'freeze' ? "…" : "Congela registrazione"}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCloseSession}
                    disabled={actionLoading !== null}
                    className="flex-1 px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 text-xs disabled:opacity-50"
                  >
                    {actionLoading === 'close' ? "…" : "Chiudi"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSession}
                    disabled={actionLoading !== null}
                    className="flex-1 px-3 py-1.5 rounded border border-red-500/60 text-red-400 hover:bg-red-500/10 text-xs disabled:opacity-50"
                  >
                    {actionLoading === 'cancel' ? "…" : "Annulla"}
                  </button>
                </div>
              </div>
            )}

            {session.status === 'FROZEN' && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={resumeSession}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 text-xs disabled:opacity-50"
                >
                  {actionLoading === 'resume' ? "…" : "Riavvia registrazione"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelSession}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-red-500/60 text-red-400 hover:bg-red-500/10 text-xs disabled:opacity-50"
                >
                  {actionLoading === 'cancel' ? "…" : "Annulla"}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full mt-2 pt-2 border-t border-[var(--border-color)] text-[10px] text-gray-500 hover:text-gray-400"
            >
              Chiudi
            </button>
          </div>
        ) : (
          // Creazione nuova registrazione
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-[var(--accent-gold)] mb-1">
              Avvia registrazione giocata
            </h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titolo (opzionale)"
              className="w-full px-3 py-2 bg-black/30 border border-[var(--border-color)] rounded text-sm text-white placeholder-gray-500"
            />
            {myFetchId && (
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={useFetch}
                  onChange={(e) => setUseFetch(e.target.checked)}
                  className="rounded"
                />
                <span>Associa Fetch assegnata</span>
              </label>
            )}
            <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={startSession}
                disabled={actionLoading !== null}
                className="flex-1 px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 text-xs disabled:opacity-50"
              >
                {actionLoading === 'start' ? "…" : "Avvia"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded border border-[var(--border-color)] text-[10px] text-gray-500 hover:text-gray-400"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--border-color)] text-[10px] uppercase tracking-wider text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
      >
        <FontAwesomeIcon icon={icons.gamepad} className="w-3 h-3" />
        Registra Giocata
      </button>
      {dropdown}
      <ConfirmDialog
        open={showCloseConfirm}
        title="Chiudi Registrazione"
        message="Chiudere definitivamente questa registrazione? Verrà conservata nella scheda del personaggio."
        confirmText="Chiudi"
        cancelText="Annulla"
        type="info"
        onConfirm={closeSession}
        onCancel={() => setShowCloseConfirm(false)}
      />
      <ConfirmDialog
        open={showCancelConfirm}
        title="Annulla Registrazione"
        message="Annullare questa registrazione? Non verrà conservata."
        confirmText="Annulla"
        cancelText="Mantieni"
        type="danger"
        onConfirm={cancelSession}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}

// ─── Note Master (modificabili solo da Shinigami) ───
function MasterNotesBox({ roomId, canAccessShinigami }: { roomId: RoomId; canAccessShinigami?: boolean }) {
  const [notes, setNotes] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roomId) {
      setNotes(null);
      return;
    }
    let done = false;
    api.get(`/master-notes/${roomId}`)
      .then((d) => {
        if (!done) {
          const x = d as { notes?: string | null } | undefined;
          setNotes(x?.notes ?? null);
        }
      })
      .catch(() => {
        if (!done) setNotes(null);
      });
    return () => { done = true; };
  }, [roomId]);

  const save = async () => {
    if (!roomId || !canAccessShinigami) return;
    setSaving(true);
    setError("");
    try {
      await api.patch(`/master-notes/${roomId}`, { notes });
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setSaving(false);
    }
  };

  if (!canAccessShinigami) {
    return (
      <div className="rounded border border-[var(--border-color)] bg-black/30 p-3">
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Note Master
        </p>
        {notes ? (
          <p className="text-xs text-gray-400 whitespace-pre-wrap">{notes}</p>
        ) : (
          <p className="text-xs text-gray-500">Nessuna nota.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded border border-[var(--border-color)] bg-black/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display">
          Note Master
        </p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[10px] uppercase tracking-wider text-[var(--accent-gold)] hover:underline"
          >
            Modifica
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note Master per questa chat..."
            className="px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/50 text-xs text-gray-200 resize-none"
            rows={4}
            maxLength={5000}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setEditing(false); setError(""); }}
              className="px-2 py-1 rounded border border-[var(--border-color)] text-[10px] text-gray-400"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-2 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-[10px] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
            >
              {saving ? "…" : "Salva"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 whitespace-pre-wrap">
          {notes || "Nessuna nota. Clicca Modifica per aggiungerne."}
        </p>
      )}
    </div>
  );
}

const QUEST_TYPES = ["AMBIENT", "TRAMA", "BATTLE", "ONE_SHOT", "GLOBALE"] as const;

function RegistraQuestButton({ 
  roomId, 
  activeQuest, 
  usersInRoom, 
  canAccessGestione,
  onQuestCreated,
}: { 
  roomId: RoomId; 
  activeQuest: { id: string; title?: string; creatorId?: string; createdAt?: string } | null;
  usersInRoom: Presente[];
  canAccessGestione?: boolean;
  onQuestCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<(typeof QUEST_TYPES)[number]>("AMBIENT");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [existingPlots, setExistingPlots] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedPlot, setSelectedPlot] = useState<string>("");
  const [newPlotName, setNewPlotName] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; plot?: string }>({});
  const [participants, setParticipants] = useState<{ id: string; characterId: string; characterName: string }[]>([]);
  const [rewards, setRewards] = useState<{ id: string; characterId: string; characterName: string; type: string; value: number | null; description: string | null }[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [addRewardChar, setAddRewardChar] = useState("");
  const [addRewardType, setAddRewardType] = useState<"EXP" | "REM" | "ITEM" | "CUSTOM" | "DROP">("EXP");
  const [addRewardVal, setAddRewardVal] = useState("");
  const [closing, setClosing] = useState(false);

  // Carica trame quando si seleziona tipo TRAMA
  useEffect(() => {
    if (type === "TRAMA" && open) {
      api.get("/lore/plots")
        .then((d) => {
          const plots = Array.isArray(d) ? d : [];
          setExistingPlots(plots.map((p: { id: string; title: string }) => ({ id: p.id, title: p.title })));
        })
        .catch(() => setExistingPlots([]));
    } else {
      setExistingPlots([]);
      setSelectedPlot("");
      setNewPlotName("");
    }
  }, [type, open]);

  // Carica partecipanti e rewards quando si apre il modal con una quest attiva
  useEffect(() => {
    if (!open || !activeQuest) return;
    setLoadingData(true);
    Promise.all([
      api.get(`/quests/${activeQuest.id}/participants`).then((d) => Array.isArray(d) ? d : []).catch(() => []),
      api.get(`/quests/${activeQuest.id}/rewards`).then((d) => Array.isArray(d) ? d : []).catch(() => []),
    ])
      .then(([p, r]) => {
        setParticipants(p);
        setRewards(r);
      })
      .finally(() => setLoadingData(false));
  }, [open, activeQuest]);

  // Reset form quando si chiude il modal
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setType("AMBIENT");
      setSelectedParticipants([]);
      setSelectedPlot("");
      setNewPlotName("");
      setError("");
      setFieldErrors({});
    }
  }, [open]);

  const handleParticipantToggle = (characterId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(characterId) 
        ? prev.filter(id => id !== characterId) 
        : [...prev, characterId]
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { title?: string; plot?: string } = {};
    
    if (!title.trim()) {
      errors.title = "Il titolo è obbligatorio";
    }
    
    if (type === "TRAMA" && !selectedPlot && !newPlotName.trim()) {
      errors.plot = "Seleziona un filone narrativo o inserisci un nuovo nome";
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setCreating(true);
    setError("");
    setFieldErrors({});
    try {
      const response = await api.post("/quests", {
        title: title.trim(),
        description: description.trim() || undefined,
        roomId: type === "GLOBALE" ? undefined : (roomId || undefined),
        type,
        plotId: type === "TRAMA" && selectedPlot !== "new" && selectedPlot ? selectedPlot : undefined,
        participantIds: selectedParticipants.length > 0 ? selectedParticipants : undefined,
      }) as { id?: string; title?: string };
      
      setTitle("");
      setDescription("");
      setType("AMBIENT");
      setSelectedParticipants([]);
      setSelectedPlot("");
      setNewPlotName("");
      setOpen(false);
      
      // Notifica che la quest è stata creata e forza l'aggiornamento con animazione
      if (onQuestCreated) {
        // Delay per assicurarsi che la quest sia stata salvata nel database
        setTimeout(() => {
          onQuestCreated();
        }, 1000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setCreating(false);
    }
  };

  const addReward = async () => {
    if (!activeQuest || !addRewardChar) return;
    setLoadingData(true);
    setError("");
    try {
      await api.post(`/quests/${activeQuest.id}/rewards`, {
        characterId: addRewardChar,
        type: addRewardType,
        value: addRewardType === "EXP" || addRewardType === "REM" ? Number(addRewardVal) || 0 : undefined,
        description: addRewardType === "CUSTOM" || addRewardType === "ITEM" || addRewardType === "DROP" ? addRewardVal : undefined,
      });
      setAddRewardChar("");
      setAddRewardVal("");
      const r = await api.get(`/quests/${activeQuest.id}/rewards`);
      setRewards(Array.isArray(r) ? r : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoadingData(false);
    }
  };

  const closeQuest = async () => {
    if (!activeQuest) return;
    setClosing(true);
    setError("");
    try {
      await api.patch(`/quests/${activeQuest.id}/status`, { status: "CLOSED" });
      setOpen(false);
      // Il polling aggiornerà automaticamente lo stato
      if (onQuestCreated) {
        onQuestCreated();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore");
    } finally {
      setClosing(false);
    }
  };

  const modal = open && typeof document !== "undefined" && createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          margin: 'auto',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] font-display">
            {activeQuest ? `Gestione Quest: ${activeQuest.title || activeQuest.id}` : "Registra Quest (da questa chat)"}
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={icons.close} className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded border border-red-500/50 bg-red-900/20">
            <p className="text-red-400 text-xs flex items-center gap-2">
              <FontAwesomeIcon icon={icons.exclamation} className="w-4 h-4" />
              {error}
            </p>
          </div>
        )}

        {activeQuest ? (
          // Gestione quest esistente
          <div className="flex flex-col gap-4">
            {/* Partecipanti */}
            <section>
              <h4 className="text-[10px] uppercase tracking-wider text-[var(--accent-gold)] mb-2">Partecipanti</h4>
              {loadingData ? (
                <p className="text-xs text-gray-500">Caricamento…</p>
              ) : participants.length === 0 ? (
                <p className="text-xs text-gray-500">Nessun partecipante.</p>
              ) : (
                <ul className="text-xs space-y-1">
                  {participants.map((p) => (
                    <li key={p.id}>{p.characterName}</li>
                  ))}
                </ul>
              )}
            </section>

            {/* Premi */}
            <section>
              <h4 className="text-[10px] uppercase tracking-wider text-[var(--accent-gold)] mb-2">Tabellario premi</h4>
              {loadingData ? (
                <p className="text-xs text-gray-500">Caricamento…</p>
              ) : rewards.length === 0 ? (
                <p className="text-xs text-gray-500">Nessun premio assegnato.</p>
              ) : (
                <ul className="text-xs space-y-1 mb-2">
                  {rewards.map((r) => (
                    <li key={r.id}>
                      {r.characterName}: {r.type}
                      {r.value != null ? ` +${r.value}` : ""}
                      {r.description ? ` — ${r.description}` : ""}
                    </li>
                  ))}
                </ul>
              )}
              {participants.length > 0 && (
                <form
                  onSubmit={(e) => { e.preventDefault(); addReward(); }}
                  className="flex flex-wrap gap-2"
                >
                  <select
                    value={addRewardChar}
                    onChange={(e) => setAddRewardChar(e.target.value)}
                    className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-xs"
                  >
                    <option value="">Personaggio</option>
                    {participants.map((p) => (
                      <option key={p.characterId} value={p.characterId}>{p.characterName}</option>
                    ))}
                  </select>
                  <select
                    value={addRewardType}
                    onChange={(e) => setAddRewardType(e.target.value as typeof addRewardType)}
                    className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-xs"
                  >
                    <option value="EXP">EXP</option>
                    <option value="REM">REM</option>
                    <option value="ITEM">ITEM</option>
                    <option value="CUSTOM">CUSTOM</option>
                    <option value="DROP">DROP</option>
                  </select>
                  <input
                    type="text"
                    value={addRewardVal}
                    onChange={(e) => setAddRewardVal(e.target.value)}
                    placeholder={addRewardType === "EXP" || addRewardType === "REM" ? "Valore" : "Descrizione"}
                    className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-xs w-24"
                  />
                  <button
                    type="submit"
                    disabled={loadingData || !addRewardChar}
                    className="px-2 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                  >
                    Aggiungi
                  </button>
                </form>
              )}
            </section>

            {/* Azioni quest */}
            <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400"
              >
                Chiudi
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!activeQuest) return;
                  setClosing(true);
                  setError("");
                  try {
                    await api.patch(`/quests/${activeQuest.id}/status`, { status: "PAUSED" });
                    setOpen(false);
                    // Il polling aggiornerà automaticamente lo stato
                    if (onQuestCreated) {
                      onQuestCreated();
                    }
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : "Errore");
                  } finally {
                    setClosing(false);
                  }
                }}
                disabled={closing}
                className="px-3 py-1.5 rounded border border-yellow-500/60 text-yellow-400 hover:bg-yellow-500/10 text-xs disabled:opacity-50"
              >
                {closing ? "…" : "Metti in pausa"}
              </button>
              <button
                type="button"
                onClick={closeQuest}
                disabled={closing}
                className="px-3 py-1.5 rounded border border-red-500/60 text-red-400 hover:bg-red-500/10 text-xs disabled:opacity-50"
              >
                {closing ? "…" : "Chiudi quest"}
              </button>
            </div>
          </div>
        ) : (
          // Creazione nuova quest
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-gray-400 font-display">
                Titolo Quest <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: undefined });
                }}
                placeholder="Titolo quest"
                className={`px-3 py-2 rounded border bg-black/40 text-sm transition-colors ${
                  fieldErrors.title 
                    ? "border-red-500/50 focus:border-red-500" 
                    : "border-[var(--border-color)] focus:border-[var(--accent-gold)]"
                }`}
                maxLength={200}
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <span>⚠</span>
                  {fieldErrors.title}
                </p>
              )}
            </div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as (typeof QUEST_TYPES)[number])}
              className="px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm"
            >
              {QUEST_TYPES.map((t) => (
                <option key={t} value={t} disabled={t === "GLOBALE" && !canAccessGestione}>
                  {t === "GLOBALE" && !canAccessGestione ? `${t} (Solo Admin)` : t}
                </option>
              ))}
            </select>
            
            {type === "TRAMA" && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-400 font-display">
                  Filone Narrativo <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedPlot}
                  onChange={(e) => {
                    setSelectedPlot(e.target.value);
                    if (fieldErrors.plot) setFieldErrors({ ...fieldErrors, plot: undefined });
                  }}
                  className={`px-3 py-2 rounded border bg-black/40 text-sm w-full transition-colors ${
                    fieldErrors.plot 
                      ? "border-red-500/50 focus:border-red-500" 
                      : "border-[var(--border-color)] focus:border-[var(--accent-gold)]"
                  }`}
                >
                  <option value="">Seleziona un filone...</option>
                  <option value="new">[ NUOVA TRAMA ]</option>
                  {existingPlots.map((plot) => (
                    <option key={plot.id} value={plot.id}>{plot.title}</option>
                  ))}
                </select>
                {selectedPlot === "new" && (
                  <input
                    type="text"
                    value={newPlotName}
                    onChange={(e) => {
                      setNewPlotName(e.target.value);
                      if (fieldErrors.plot) setFieldErrors({ ...fieldErrors, plot: undefined });
                    }}
                    placeholder="Nome del nuovo filone"
                    className={`px-3 py-2 rounded border bg-black/40 text-sm w-full transition-colors ${
                      fieldErrors.plot 
                        ? "border-red-500/50 focus:border-red-500" 
                        : "border-[var(--border-color)] focus:border-[var(--accent-gold)]"
                    }`}
                  />
                )}
                {fieldErrors.plot && (
                  <p className="text-xs text-red-400 flex items-center gap-1.5">
                    <span>⚠</span>
                    {fieldErrors.plot}
                  </p>
                )}
              </div>
            )}

            {usersInRoom.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500">Partecipanti</label>
                <div className="max-h-[150px] overflow-y-auto border border-[var(--border-color)] rounded p-2 bg-black/20">
                  {usersInRoom.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 text-xs cursor-pointer hover:text-[var(--accent-gold)] py-1">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(user.id)}
                        onChange={() => handleParticipantToggle(user.id)}
                        className="rounded border-[var(--border-color)]"
                      />
                      <span>{user.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione (opzionale)"
              className="px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm resize-none"
              rows={2}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
              >
                {creating ? "…" : "Crea quest"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(""); }}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--border-color)] text-[10px] uppercase tracking-wider text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
      >
        <FontAwesomeIcon icon={icons.ordine} className="w-3 h-3" />
        Registra Quest
      </button>
      {modal}
    </>
  );
}

// ─── Chat: layout split (immagine/desc/notes | messaggi) + strumenti ───
function ChatView({
  roomId,
  placeLabel,
  messages,
  sendMessage,
  chatConnected,
  usersInRoom,
  onSubmit,
  inputRef,
  tagLuogoRef,
  listRef,
  onBack,
  canAccessShinigami,
  canAccessGestione,
  char,
}: {
  roomId: RoomId;
  placeLabel: string;
  messages: ChatMessage[];
  sendMessage: (text: string, locationTag?: string | null) => void;
  chatConnected: boolean;
  usersInRoom: Presente[];
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  tagLuogoRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  canAccessShinigami?: boolean;
  canAccessGestione?: boolean;
  char?: CharacterSummary;
}) {
  const place = getChatLocationByRoomId(roomId);
  const [activeQuest, setActiveQuest] = useState<{ id: string; title?: string; creatorId?: string; createdAt?: string } | null>(null);
  const prevActiveQuestIdRef = useRef<string | null>(null);
  const [showQuestAnimation, setShowQuestAnimation] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [messageLength, setMessageLength] = useState(0);
  const isMobile: boolean = useIsMobile();

  // Scroll automatico quando viene mostrata l'animazione
  useEffect(() => {
    if (showQuestAnimation && listRef.current) {
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
        }
      }, 500);
    }
  }, [showQuestAnimation]);

  // Funzione per aggiornare la quest (chiamabile esternamente)
  const refreshQuest = useCallback((forceAnimation = false) => {
    api.get(`/quests/by-room/${roomId}`)
      .then((d) => { 
        const x = d as { id?: string; title?: string; creatorId?: string; createdAt?: string; active?: boolean } | undefined; 
        if (x && "id" in x && x.id) {
          const newQuest = { id: x.id, title: x.title, creatorId: x.creatorId, createdAt: x.createdAt };
          // Rileva se è una nuova quest (non era presente prima)
          const isNewQuest = prevActiveQuestIdRef.current !== x.id;
          
          // Aggiorna sempre lo stato della quest PRIMA di mostrare l'animazione
          setActiveQuest(newQuest);
          
          // Se deve mostrare l'animazione (forzata o nuova quest)
          if (forceAnimation || (isNewQuest && prevActiveQuestIdRef.current !== null)) {
            // Cancella eventuali timeout precedenti
            if (animationTimeoutRef.current) {
              clearTimeout(animationTimeoutRef.current);
            }
            // Piccolo delay per assicurarsi che activeQuest sia aggiornato nel DOM
            animationTimeoutRef.current = setTimeout(() => {
              setShowQuestAnimation(true);
              // Nascondi l'animazione dopo 4 secondi
              animationTimeoutRef.current = setTimeout(() => {
                setShowQuestAnimation(false);
                animationTimeoutRef.current = null;
              }, 4000); // Animazione dura 4 secondi
            }, 300);
          }
          
          // Aggiorna il ref dopo aver gestito l'animazione
          prevActiveQuestIdRef.current = x.id;
        } else {
          prevActiveQuestIdRef.current = null;
          setActiveQuest(null);
        }
      })
      .catch(() => { 
        prevActiveQuestIdRef.current = null; 
        setActiveQuest(null); 
      });
  }, [roomId]);

  useEffect(() => {
    let done = false;
    const intervalId = setInterval(() => {
      if (done) return;
      refreshQuest();
    }, 2000); // Controlla ogni 2 secondi
    
    // Carica immediatamente
    refreshQuest();
    
    return () => { 
      done = true; 
      clearInterval(intervalId);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [roomId, refreshQuest]);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div 
        className="h-[50px] flex-shrink-0 px-5 flex justify-between items-center border-b border-[var(--accent-violet)]/30"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)), url('/backgrounds/cloudy.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded border-none text-gray-400 hover:text-[var(--accent-gold)] transition-colors"
            title="Torna alla lista chat"
          >
            <FontAwesomeIcon icon={icons.back} className="w-4 h-4" />
          </button>
          <h2 className="font-display font-bold text-[#c9a84a] tracking-[2px] text-base uppercase flex items-center gap-2.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <span className="text-[#60519b]">💬</span> {placeLabel}
            {activeQuest && (
              <span className="text-[#ff4d4d] text-[10px] border border-[#ff4d4d] px-1.5 py-0.5 rounded">
                QUEST
              </span>
            )}
          </h2>
        </div>
        {!chatConnected && (
          <span className="text-xs text-gray-500">(connessione…)</span>
        )}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden gap-4">
        {/* Sinistra: immagine luogo, descrizione, note Master, presenti */}
        <aside className="w-[280px] flex-shrink-0 flex flex-col gap-3 min-h-0 overflow-y-auto pr-3 border-r border-white/5 bg-black/30 p-5">
          <div className="relative w-full h-[140px] rounded border border-[var(--accent-violet)]/30 overflow-hidden shrink-0">
            {place?.image ? (
              <Image 
                src={place.image} 
                alt={placeLabel} 
                fill 
                className="object-cover sepia-[0.2] brightness-90" 
                sizes="280px" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 bg-black/50">
                <FontAwesomeIcon icon={icons.map} className="w-12 h-12 opacity-50" />
              </div>
            )}
          </div>
          <div className="text-xs text-gray-300 flex-grow italic leading-relaxed mb-3">
            {place?.description ?? "Nessuna descrizione ambientale."}
          </div>
          <MasterNotesBox roomId={roomId} canAccessShinigami={canAccessShinigami} />
        </aside>

        {/* Destra: flusso messaggi + input */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto overflow-x-visible min-h-[120px] py-5 px-10"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: 'repeat',
              backgroundBlendMode: 'overlay',
              backgroundColor: 'rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            {messages.length === 0 && (
              <p className="text-xs text-gray-500 p-2">Nessun messaggio. Scrivi qualcosa per iniziare.</p>
            )}
            {messages.map((m) => (
              <ChatMessageBlock 
                key={m.id} 
                message={m} 
                placeLabel={placeLabel}
                activeQuest={activeQuest}
                currentCharacterId={char?.id}
              />
            ))}
            
            {/* Banner Animazione Quest - IN FONDO, DOPO TUTTI I MESSAGGI */}
            {showQuestAnimation && activeQuest && (
              <div 
                id="quest-animation-wrapper" 
                style={{ 
                  position: 'relative', 
                  zIndex: 1000,
                  width: '100%',
                  margin: '20px 0',
                }}
              >
                <QuestStartAnimation questTitle={activeQuest.title || "Quest"} />
              </div>
            )}
          </div>

          {/* Tag luogo (posizione nel luogo) + messaggio + strumenti */}
          <form onSubmit={onSubmit} className="flex flex-col gap-2 shrink-0 border-t border-[var(--accent-violet)]/20 bg-[rgba(15,15,20,0.95)] px-5 py-4">
            <div className="flex gap-2.5 items-start">
              <input
                ref={tagLuogoRef}
                type="text"
                placeholder="Luogo..."
                disabled={!chatConnected}
                maxLength={120}
                className="bg-white/5 border border-white/10 text-[#c9a84a] px-2.5 py-2.5 rounded text-xs font-display w-[150px] h-10 box-border text-center"
              />
              <textarea
                ref={inputRef}
                placeholder={chatConnected ? "Azione..." : "Connessione in corso…"}
                disabled={!chatConnected}
                onChange={(e) => setMessageLength(e.target.value.length)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 text-[#e6e0ff] px-2.5 py-2.5 rounded resize-none font-sans text-sm box-border h-10 leading-relaxed"
              />
              <button
                type="submit"
                disabled={!chatConnected}
                className="px-6 py-2 border-none rounded cursor-pointer bg-gradient-to-r from-[#60519b] to-[#a270ff] text-white font-display font-bold text-xs h-10 box-border transition-all uppercase tracking-wide shadow-[0_0_10px_rgba(162,112,255,0.3)] disabled:opacity-50"
                title="Invia"
                aria-label="Invia messaggio"
              >
                INVIA
              </button>
            </div>
            <div className="flex justify-between items-center mt-2.5 pl-[160px]">
              <div className="flex gap-2">
                {canAccessShinigami && <RegistraQuestButton roomId={roomId} activeQuest={activeQuest} usersInRoom={usersInRoom} canAccessGestione={canAccessGestione} onQuestCreated={() => refreshQuest(true)} />}
                <RegistraGiocataButton roomId={roomId} />
                {canAccessGestione && <GlobalMessageButton />}
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                {messageLength} CARATTERI
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Global Message Button (Admin) ───
function GlobalMessageButton() {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setError(null);
    try {
      await api.post("/chat/global-message", { content: message.trim() });
      setMessage("");
      setShowModal(false);
      toast.success("Messaggio globale inviato!");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore durante l'invio");
    } finally {
      setSending(false);
    }
  };

  const modal = showModal ? (
    createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-[#050508] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-4 font-display">
            Global Message (Admin)
          </h3>
          {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Messaggio globale (verrà inviato a tutte le chat)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-[var(--border-color)] rounded text-sm text-gray-200 resize-none"
                rows={4}
                placeholder="Inserisci il messaggio globale..."
                maxLength={2000}
              />
              <p className="text-[10px] text-gray-600 mt-1">
                {message.length}/2000 caratteri
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setMessage("");
                  setError(null);
                }}
                className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 hover:border-gray-600 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 transition-colors disabled:opacity-50"
              >
                {sending ? "Invio..." : "Invia Globale"}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 rounded border border-[var(--accent-violet)] text-[var(--accent-violet)] text-xs hover:bg-[var(--accent-violet)]/10 transition-colors"
        title="Invia messaggio globale (Admin)"
      >
        <FontAwesomeIcon icon={icons.bullhorn} className="w-3 h-3 mr-1" />
        Global Message
      </button>
      {modal}
    </>
  );
}

function ChatMessageBlock({ 
  message, 
  placeLabel,
  activeQuest,
  currentCharacterId,
}: { 
  message: ChatMessage; 
  placeLabel: string;
  activeQuest?: { id: string; title?: string; creatorId?: string; createdAt?: string } | null;
  currentCharacterId?: string;
}) {
  const formattedContent = formatNarrativeText(message.content);
  const isGlobal = message.zone === "GLOBAL" || message.name.startsWith("[GLOBAL]");
  
  // Verifica se è un messaggio masterscreen (Shinigami autore della quest attiva)
  // Solo se il messaggio è stato scritto DOPO la creazione della quest
  const isMasterscreen = activeQuest?.creatorId && 
    message.characterId === activeQuest.creatorId &&
    activeQuest.createdAt &&
    new Date(message.createdAt) >= new Date(activeQuest.createdAt);
  
  // Messaggio globale (Admin)
  if (isGlobal) {
    return (
      <div className="border border-[var(--accent-violet)] bg-gradient-to-r from-[var(--accent-violet)]/20 via-transparent to-[var(--accent-violet)]/20 py-4 px-4 text-center my-5">
        <strong className="block text-[var(--accent-violet)] mb-2 text-sm font-display">
          ✦ MESSAGGIO GLOBALE ✦
        </strong>
        <p className="m-0 font-normal text-sm text-gray-200" dangerouslySetInnerHTML={{ __html: formattedContent }} />
      </div>
    );
  }

  // Messaggio Masterscreen (Shinigami autore della quest)
  if (isMasterscreen) {
    return (
      <div className="w-full mb-6 p-5 bg-black/40 border border-[var(--accent-gold)]/30 rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
        <div className="font-sans italic text-[13px] text-[#ffe7a3] leading-relaxed whitespace-pre-wrap mb-4">
          <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
        </div>
        <div className="text-right font-display text-[11px] font-bold text-[var(--accent-gold)] uppercase tracking-wider opacity-80">
          — Shinigami ({message.name}{message.surname ? ` ${message.surname}` : ""})
        </div>
      </div>
    );
  }
  
  // Formatta timestamp
  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };
  
  return (
    <div className="w-full mb-5 text-[#b3b3c0] relative pl-2.5">
      {/* Header: Timestamp | Nome | Pixel-icons | Tag luogo (inserito dall'utente) */}
      <div className="flex items-center mb-1.5 text-xs border-b border-white/5 pb-1 w-full">
        <span className="mr-3 text-[10px] text-gray-600 font-sans">
          {formatTimestamp(message.createdAt)}
        </span>
        <span className="font-display font-bold text-[#c9a84a] mr-2.5 tracking-wide text-[13px]">
          {message.name}{message.surname ? ` ${message.surname}` : ""}
        </span>
        {/* Pixel-icons */}
        {message.pixelIcons && (
          <div className="flex items-center gap-1 mr-2">
            {message.pixelIcons.ruolo?.map((r) => {
              const url = getPixelIconUrlRuolo(r as PixelIconRuolo);
              return url ? (
                <Image
                  key={`ruolo-${r}`}
                  src={url}
                  alt={r}
                  width={16}
                  height={16}
                  className="w-4 h-4 object-contain"
                />
              ) : null;
            })}
            {message.pixelIcons.ordine?.map((o) => {
              const url = getPixelIconUrlOrdine(o as PixelIconOrdine);
              return url ? (
                <Image
                  key={`ordine-${o}`}
                  src={url}
                  alt={o}
                  width={16}
                  height={16}
                  className="w-4 h-4 object-contain"
                />
              ) : null;
            })}
          </div>
        )}
        {/* Location tag (posizione nel luogo - inserito dall'utente) */}
        {message.locationTag && (
          <span className="bg-[var(--accent-violet)]/10 border border-[var(--accent-violet)]/30 text-[var(--accent-violet)] px-1.5 py-0.5 rounded text-[10px] font-sans uppercase">
            [{message.locationTag}]
          </span>
        )}
      </div>
      
      {/* Contenuto: Avatar + Testo */}
      <div className="flow-root">
        {/* Avatar 100x100px float left */}
        {message.miniAvatar && (
          <div className="float-left mr-4 mb-1">
            <Image
              src={message.miniAvatar}
              alt={`${message.name}${message.surname ? ` ${message.surname}` : ""}`}
              width={100}
              height={100}
              className="w-[100px] h-[100px] rounded border border-[var(--accent-gold)] object-cover shadow-[0_0_5px_rgba(201,168,74,0.3)]"
            />
          </div>
        )}
        {/* Testo giustificato */}
        <p
          className="m-0 leading-relaxed whitespace-pre-wrap break-words font-sans text-[13px] text-[#7d7f7d] text-justify"
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
      </div>
    </div>
  );
}

// ─── Banner Animazione Inizio Quest ───
function QuestStartAnimation({ questTitle }: { questTitle: string }) {
  return (
    <div 
      className="relative w-full flex items-center justify-center quest-animation-container" 
      style={{ 
        height: '70px',
        backgroundColor: 'rgba(20, 15, 10, 0.95)',
        borderTop: '2px solid #d4af37',
        borderBottom: '2px solid #d4af37',
        position: 'relative',
        zIndex: 1000,
        boxShadow: '0 0 20px rgba(212, 175, 55, 0.4), inset 0 0 20px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
        overflow: 'hidden',
      }}
    >
      {/* Effetto glow pulsante orizzontale */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent-gold)]/20 to-transparent animate-pulse"
        style={{
          animation: 'quest-glow 2s ease-in-out infinite',
        }}
      />
      
      {/* Bordo superiore e inferiore animato */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent"
        style={{
          animation: 'quest-line 3s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent"
        style={{
          animation: 'quest-line 3s ease-in-out infinite 1.5s',
        }}
      />
      
      {/* Contenuto */}
      <div className="relative z-10 flex items-center gap-4 px-6">
        {/* Icona/Symbol */}
        <div className="quest-symbol-animation">
          <span 
            className="text-[var(--accent-gold)]" 
            style={{ 
              fontSize: '2rem', 
              display: 'inline-block',
              textShadow: '0 0 15px rgba(212, 175, 55, 0.8)',
              filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.6))',
            }}
          >
            ✦
          </span>
        </div>
        
        {/* Testo */}
        <div className="flex flex-col items-start">
          <span 
            className="font-display text-sm tracking-wider uppercase quest-text-fade-1" 
            style={{ 
              fontWeight: 'bold',
              color: '#d4af37',
              textShadow: '0 0 10px rgba(212, 175, 55, 0.6)',
              lineHeight: '1.2',
            }}
          >
            Quest Iniziata
          </span>
          <span 
            className="font-display text-xs italic quest-text-fade-2" 
            style={{ 
              color: '#ffe7a3',
              textShadow: '0 0 5px rgba(255, 231, 163, 0.4)',
              lineHeight: '1.2',
            }}
          >
            "{questTitle}"
          </span>
        </div>
      </div>
      
      {/* Particelle decorative laterali */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[var(--accent-gold)] rounded-full quest-particle"
            style={{
              left: `${10 + i * 25}%`,
              top: '50%',
              transform: 'translateY(-50%)',
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
