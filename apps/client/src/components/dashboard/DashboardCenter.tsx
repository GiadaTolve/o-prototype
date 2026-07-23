"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { resolveWazaTagPreview } from "@domain/combat/waza-tag-index";
import { useWazaCatalog } from "@/hooks/useWazaCatalog";
import {
  extractWazaTagNames,
  removeWazaTagsFromText,
} from "@domain/combat/waza-tag-preview";
import {
  expandWazaLaunchInMessage,
} from "@domain/combat/waza-launch";
import { normalizeWazaLookupKey } from "@domain/combat/waza-tag-preview";
import { formatNarrativeText } from "@/lib/narrative-parser";
import { useInventoryUpdatedListener } from "@/hooks/useInventoryUpdatedListener";
import {
  isDiceRollMessage,
  extractDiceResultLabels,
  formatDiceRollLine,
} from "@domain/chat/dice-display";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import {
  getPixelIconUrlRuolo,
  getPixelIconUrlOrdine,
  PIXEL_ICON_SIZE,
  PIXEL_ICON_DISPLAY_CLASS,
  type PixelIconRuolo,
  type PixelIconOrdine,
} from "./pixel-icons";
import {
  GAME_MAPS,
  type GameMapId,
  type ZoneConfig,
  type RoomId,
  getChatListForZone,
  getChatLocationByRoomId,
  isPartychat,
} from "@/config/map-config";
import dynamic from "next/dynamic";
import { readLastPlace, writeLastPlace, type MapScope } from "./map/map-place-memory";
import type { ChatMessage, Presente, CharacterSummary } from "./types";
import { QuarterTurnHud } from "./QuarterTurnHud";
import { ChatInfoPanel } from "./ChatInfoPanel";
import { ChatWazaResolutionPost } from "./chat-combat/ChatWazaResolutionPost";
import { ChatConstructResolutionPost } from "./chat-combat/ChatConstructResolutionPost";
import { buildChatWazaPostFromMessage } from "./chat-combat/buildChatWazaPostFromMessage";
import { buildConstructPostFromMessage, buildStandaloneConstructPostFromMessage, extractStandaloneConstructName } from "./chat-combat/buildConstructPostFromMessage";
import { ChatAttackCard, extractAttackData } from "./chat-combat/ChatAttackCard";
import { ChatItemUseCard, extractItemUseCard } from "./chat-combat/ChatItemUseCard";
import { ChatDropEventCard, extractDropEventData } from "./chat-loot/ChatDropEventCard";
import { ChatGroundLootPanel } from "./chat-loot/ChatGroundLootPanel";
import { OrdineContent } from "./OrdineContent";

const JapanInteractiveMap = dynamic(
  () =>
    import("./map/JapanInteractiveMap").then((m) => m.JapanInteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0d0b10] text-[var(--accent-gold)] text-[11px] font-display uppercase tracking-[0.14em]">
        Caricamento reticolo…
      </div>
    ),
  },
);

/** Limite caratteri messaggio chat da mobile. */
const MOBILE_CHAT_MAX_LENGTH = 800;

/** Bozza che invierà solo un tiro dado (nessun EXP). */
function isDiceOnlyDraft(draft: string): boolean {
  return /^\s*\/?(?:d|dado)\s+\d+\s*$/i.test(draft.trim());
}

type View = "root" | "game-map" | "zone-list" | "chat" | "shinigami" | "guida" | "ambientazione" | "forum" | "gestione" | "sviluppo" | "dojo" | "ordine" | "sokaiju";

type Props = {
  mapTrigger?: number;
  shinigamiTrigger?: number;
  guidaTrigger?: number;
  ambientazioneTrigger?: number;
  forumTrigger?: number;
  gestioneTrigger?: number;
  sviluppoTrigger?: number;
  dojoTrigger?: number;
  ordineTrigger?: number;
  sokaijuTrigger?: number;
  sokaijuTab?: string;
  onRoomChange: (room: RoomId | null) => void;
  messages: ChatMessage[];
  sendMessage: (text: string, locationTag?: string | null) => void;
  chatConnected: boolean;
  chatConnectionFailed?: boolean;
  /** Presenti in questa chat (solo quando roomId è impostato). */
  usersInRoom: Presente[];
  /** Solo Shinigami vedono "Registra Quest" in chat. */
  canAccessShinigami?: boolean;
  /** Solo Admin/Mod/Capo vedono "Global Message" in chat. */
  canAccessGestione?: boolean;
  /** Solo Admin/Mod/Fixer: pannello Sviluppo. */
  canAccessSviluppo?: boolean;
  /** Personaggio corrente (per ShinigamiContent). */
  char?: CharacterSummary;
  /** mobile = tab smartphone: layout compatto, chat full-width */
  variant?: "default" | "mobile";
  /** true quando la chat è a schermo intero (per nascondere bottom nav) */
  onImmersiveChange?: (immersive: boolean) => void;
  /** Apre la finestra Pannello Combattimento nel dock. */
  onOpenCombattimento?: () => void;
  /** Apre il pannello Shinigami (controllo scena Master). */
  onOpenTulpa?: () => void;
  /** Apre la finestra Cedi Drop (solo Master/staff). */
  onOpenCediDrop?: () => void;
  /** Apre il Blocco Note nel dock. */
  onOpenNote?: () => void;
  /** Ricarica personaggio (es. dopo acquisto waza d'ordine). */
  onCharUpdate?: () => void;
};

export function DashboardCenter({
  mapTrigger = 0,
  shinigamiTrigger = 0,
  guidaTrigger = 0,
  ambientazioneTrigger = 0,
  forumTrigger = 0,
  gestioneTrigger = 0,
  sviluppoTrigger = 0,
  dojoTrigger = 0,
  ordineTrigger = 0,
  sokaijuTrigger = 0,
  sokaijuTab,
  onRoomChange,
  messages,
  sendMessage,
  chatConnected,
  chatConnectionFailed = false,
  usersInRoom,
  canAccessShinigami,
  canAccessGestione,
  canAccessSviluppo,
  char,
  variant = "default",
  onImmersiveChange,
  onOpenCombattimento,
  onOpenTulpa,
  onOpenCediDrop,
  onOpenNote,
  onCharUpdate,
}: Props) {
  const compact = variant === "mobile";
  const { index: wazaTagIndex } = useWazaCatalog();
  const [view, setView] = useState<View>("root");
  const [gameMapId, setGameMapId] = useState<GameMapId | null>(null);
  const [zone, setZone] = useState<ZoneConfig | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<RoomId | null>(null);
  const [mapScope, setMapScope] = useState<MapScope>("ogon");
  const [placeRestored, setPlaceRestored] = useState(false);
  /** Banner per mappa (da Gestione → Modifica mappa). Chiave = gameMapId. */
  const [mapBanners, setMapBanners] = useState<Record<string, { url: string; position?: string }>>({});

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tagLuogoRef = useRef<HTMLInputElement>(null);
  const charId = char?.id ?? null;

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  // Ripristina ultimo luogo dopo login (stesso browser / personaggio)
  useEffect(() => {
    if (placeRestored) return;
    const mem = readLastPlace(charId);
    setPlaceRestored(true);
    if (!mem) return;

    if (mem.mapScope === "ogon" || mem.mapScope === "mondo") {
      setMapScope(mem.mapScope);
    }

    if (mem.view === "chat" && mem.roomId && mem.gameMapId && mem.zoneId) {
      const gm = GAME_MAPS[mem.gameMapId];
      const z = gm?.zones.find((zoneRow) => zoneRow.id === mem.zoneId) ?? null;
      if (gm && z) {
        setGameMapId(mem.gameMapId);
        setZone(z);
        setSelectedRoomId(mem.roomId);
        setView("chat");
        onRoomChange(mem.roomId);
        return;
      }
    }

    if (mem.view === "zone-list" && mem.gameMapId && mem.zoneId) {
      const gm = GAME_MAPS[mem.gameMapId];
      const z = gm?.zones.find((zoneRow) => zoneRow.id === mem.zoneId) ?? null;
      if (gm && z) {
        setGameMapId(mem.gameMapId);
        setZone(z);
        setView("zone-list");
        return;
      }
    }

    if (mem.view === "game-map" && mem.gameMapId && GAME_MAPS[mem.gameMapId]) {
      setGameMapId(mem.gameMapId);
      setView("game-map");
    }
  }, [charId, placeRestored, onRoomChange]);

  // Persiste ultimo luogo mentre navighi in mappa/chat
  useEffect(() => {
    if (!placeRestored) return;
    if (view !== "root" && view !== "game-map" && view !== "zone-list" && view !== "chat") {
      return;
    }
    writeLastPlace(charId, {
      view,
      mapScope,
      gameMapId,
      zoneId: zone?.id ?? null,
      roomId: selectedRoomId,
    });
  }, [view, mapScope, gameMapId, zone?.id, selectedRoomId, charId, placeRestored]);

  useEffect(() => {
    const onChatError = (event: Event) => {
      const msg = (event as CustomEvent<{ message?: string }>).detail?.message;
      if (msg) toast.error(msg);
    };
    window.addEventListener("chatSendError", onChatError as EventListener);
    return () => window.removeEventListener("chatSendError", onChatError as EventListener);
  }, []);

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

  useEffect(() => {
    if (sviluppoTrigger > 0 && canAccessSviluppo) {
      setView("sviluppo");
    }
  }, [sviluppoTrigger, canAccessSviluppo]);

  useEffect(() => {
    if (dojoTrigger > 0) {
      setView("dojo");
    }
  }, [dojoTrigger]);

  useEffect(() => {
    if (ordineTrigger > 0) {
      setView("ordine");
    }
  }, [ordineTrigger]);

  useEffect(() => {
    if (sokaijuTrigger > 0) {
      setView("sokaiju");
    }
  }, [sokaijuTrigger]);

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

  useEffect(() => {
    onImmersiveChange?.(view === "chat");
  }, [view, onImmersiveChange]);

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

  // Ascolta eventi per aprire chat (housing o partychat Circus / Spazio Eventi)
  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<{ roomId: string }>;
      const roomId = customEvent.detail?.roomId as RoomId;
      if (roomId) goChat(roomId);
    };

    window.addEventListener('openHousingChat', handleOpenChat);
    window.addEventListener('openChatRoom', handleOpenChat);
    return () => {
      window.removeEventListener('openHousingChat', handleOpenChat);
      window.removeEventListener('openChatRoom', handleOpenChat);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    const tagInput = tagLuogoRef.current;
    if (!input?.value.trim() || !chatConnected) return;
    
    const raw = input.value.trim();
    const messageText = expandWazaLaunchInMessage(raw, wazaTagIndex, {
      skiruSheet: char?.skiruSheet ?? null,
    });
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
    <main
      className={
        compact
          ? "flex-1 min-w-0 h-full flex flex-col overflow-hidden"
          : "flex-1 lg:flex-[2.5] min-w-0 lg:min-w-[320px] min-h-[min(50dvh,420px)] max-h-[58dvh] lg:max-h-none lg:h-full bg-[var(--panel-bg)]/40 border border-[var(--border-color)] rounded-lg p-4 sm:p-6 order-1 lg:order-2 flex flex-col overflow-hidden shrink-0 lg:shrink"
      }
    >
      {view === "root" && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden gap-0">
          {compact && (
            <div
              className="shrink-0 px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85)), url('/backgrounds/cloudy.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-gold)] font-display">
                Mappa mondiale
              </p>
              <p className="text-[10px] text-gray-500">Tocca un pin</p>
            </div>
          )}
          <div className={`relative flex-1 min-h-0 h-full overflow-hidden ${compact ? "" : "rounded-lg border border-[var(--border-color)]"}`}>
            {/* Attendi restore last-place così initialScope/mount Leaflet hanno size reale */}
            {placeRestored ? (
              <MapViewRoot
                onSelectGameMap={goGameMap}
                alwaysShowLabels={compact}
                mapScope={mapScope}
                onMapScopeChange={setMapScope}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[var(--accent-gold)] text-[11px] font-display uppercase tracking-[0.14em]">
                Sincronizzazione reticolo…
              </div>
            )}
          </div>
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
            compact={compact}
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
          compact={compact}
        />
        </div>
      )}

      {view === "shinigami" && (
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--accent-violet)]/30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Shinigami</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Torna alla Mappa
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-b border border-t-0 border-[var(--border-color)]"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <iframe
              src="/shinigami"
              className="w-full h-full min-h-[600px] border-0"
              title="Shinigami"
            />
          </div>
        </div>
      )}

      {view === "guida" && (
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--accent-violet)]/30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Guida</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Torna alla Mappa
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-b border border-t-0 border-[var(--border-color)]"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <iframe
              src="/guida"
              className="w-full h-full min-h-[600px] border-0"
              title="Guida"
            />
          </div>
        </div>
      )}

      {view === "ambientazione" && (
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--accent-violet)]/30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Ambientazione</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Mappa
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-b border border-t-0 border-[var(--border-color)]"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <iframe
              src="/ambientazione"
              className="w-full h-full min-h-[600px] border-0"
              title="Ambientazione"
            />
          </div>
        </div>
      )}

      {view === "forum" && (
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--accent-violet)]/30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Forum</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Mappa
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-b border border-t-0 border-[var(--border-color)]"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <iframe
              src="/forum"
              className="w-full h-full min-h-[600px] border-0"
              title="Forum"
            />
          </div>
        </div>
      )}

      {view === "gestione" && (
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--accent-violet)]/30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Gestione</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Mappa
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-b border border-t-0 border-[var(--border-color)]"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <iframe
              src="/gestione"
              className="w-full h-full min-h-[600px] border-0"
              title="Gestione"
            />
          </div>
        </div>
      )}

      {view === "sviluppo" && (
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--accent-violet)]/30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Sviluppo</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Torna alla Mappa
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-b border border-t-0 border-[var(--border-color)]"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <iframe
              src="/sviluppo"
              className="w-full h-full min-h-[600px] border-0"
              title="Sviluppo"
            />
          </div>
        </div>
      )}

      {view === "dojo" && (
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--accent-violet)]/30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 className="font-display text-lg text-[var(--accent-gold)] uppercase tracking-wide">Dōjō</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Torna alla Mappa
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-b border border-t-0 border-[var(--border-color)]"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <iframe
              src="/dojo"
              className="w-full h-full min-h-[600px] border-0"
              title="Dōjō"
            />
          </div>
        </div>
      )}

      {view === "ordine" && (
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--accent-violet)]/30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Ordine</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Torna alla Mappa
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-b border border-t-0 border-[var(--border-color)]"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <OrdineContent char={char} onCharUpdate={onCharUpdate} />
          </div>
        </div>
      )}

      {view === "sokaiju" && (
        <div className="flex-1 min-h-0 overflow-auto flex flex-col">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[var(--accent-violet)]/30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 className="font-display text-lg text-[var(--accent-gold)]">Sōkaiju</h2>
            <button
              type="button"
              onClick={goRoot}
              className="text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              ← Torna alla Mappa
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-b border border-t-0 border-[var(--border-color)]"
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <iframe
              src={sokaijuTab ? `/sokaiju?tab=${encodeURIComponent(sokaijuTab)}` : "/sokaiju"}
              className="w-full h-full min-h-[600px] border-0"
              title="Sōkaiju"
            />
          </div>
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
          chatConnectionFailed={chatConnectionFailed}
          usersInRoom={usersInRoom}
          onSubmit={handleSubmit}
          inputRef={inputRef}
          tagLuogoRef={tagLuogoRef}
          listRef={listRef}
          onBack={backFromChat}
          canAccessShinigami={canAccessShinigami}
          canAccessGestione={canAccessGestione}
          char={char}
          compact={compact}
          onOpenCombattimento={onOpenCombattimento}
          onOpenTulpa={onOpenTulpa}
          onOpenCediDrop={onOpenCediDrop}
          onOpenNote={onOpenNote}
        />
        </div>
      )}
    </main>
  );
}

// ─── Root map (Giappone interattivo) ───
function MapViewRoot({
  onSelectGameMap,
  alwaysShowLabels = false,
  mapScope = "ogon",
  onMapScopeChange,
}: {
  onSelectGameMap: (id: GameMapId) => void;
  alwaysShowLabels?: boolean;
  mapScope?: MapScope;
  onMapScopeChange?: (scope: MapScope) => void;
}) {
  void alwaysShowLabels;
  return (
    <JapanInteractiveMap
      onSelectGameMap={onSelectGameMap}
      initialScope={mapScope}
      onScopeChange={onMapScopeChange}
    />
  );
}

// ─── Game map (Ogon: zone buttons) ───
function MapViewGameMap({
  gameMap,
  bannerUrl,
  bannerPosition,
  onSelectZone,
  onBack,
  compact = false,
}: {
  gameMap: { id: GameMapId; label: string; image?: string; zones: ZoneConfig[] };
  /** URL banner nell'header (da Gestione → Modifica mappa). */
  bannerUrl?: string;
  /** Posizione immagine nel ritaglio: center, top, left top, ecc. o "x% y%" (da Gestione). */
  bannerPosition?: string;
  onSelectZone: (z: ZoneConfig) => void;
  onBack: () => void;
  compact?: boolean;
}) {
  const hasZones = gameMap.zones.length > 0;
  const objectPosition = bannerPosition && bannerPosition.trim() ? bannerPosition.trim() : "center";

  return (
    <div className="flex flex-col gap-0 flex-1 min-h-0">
      <div
        className={`flex items-stretch gap-2 shrink-0 w-full min-h-0 px-2 py-2 border border-b-0 border-[var(--border-color)] ${compact ? "" : "gap-3 px-3 py-3 rounded-t"}`}
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className={`${compact ? "flex-1" : "w-1/3"} min-w-0 flex items-center gap-2 shrink-0`}>
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded border border-[var(--border-color)] text-gray-400 hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-colors shrink-0"
            title="Torna alla mappa root"
            aria-label="Indietro"
          >
            <FontAwesomeIcon icon={icons.back} className="w-4 h-4" />
          </button>
          <h2 className={`font-display uppercase tracking-wider text-[var(--accent-gold)] truncate ${compact ? "text-sm" : "text-lg"}`}>
            {gameMap.label}
          </h2>
        </div>
        {!compact && (
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
        )}
      </div>
      {hasZones ? (
        <div
          className={`grid ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"} gap-2 ${compact ? "p-2" : "gap-3 p-4"} flex-1 min-h-0 overflow-auto rounded-b border border-[var(--border-color)]`}
          style={{
            backgroundImage: "url('/backgrounds/darkstone.png')",
            backgroundRepeat: "repeat",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          {gameMap.zones.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => onSelectZone(z)}
              className={`group flex flex-col items-center justify-center ${compact ? "min-h-[72px]" : "min-h-[88px]"} rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)]/80 text-[var(--accent-violet-light)]/90 shadow-[0_2px_8px_var(--shadow-dark)] hover:border-[var(--accent-gold)]/60 hover:text-[var(--accent-gold)] hover:shadow-[0_0_12px_var(--shadow-gold),inset_0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out`}
            >
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
  compact = false,
}: {
  zone: ZoneConfig;
  gameMapLabel: string;
  onSelectRoom: (r: RoomId) => void;
  onBack: () => void;
  compact?: boolean;
}) {
  const chats = getChatListForZone(zone);

  return (
    <div className="flex flex-col gap-0 flex-1 min-h-0">
      <div
        className={`flex items-center gap-2 shrink-0 px-3 py-2.5 border border-b-0 border-[var(--border-color)] ${compact ? "" : "gap-3 px-4 py-3 rounded-t"}`}
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('/backgrounds/cloudy.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded border border-[var(--border-color)] text-gray-400 hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-colors"
          title="Torna alla mappa"
          aria-label="Indietro"
        >
          <FontAwesomeIcon icon={icons.back} className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[10px] uppercase text-gray-500">{gameMapLabel}</p>
          <h2 className={`font-display uppercase tracking-wider text-[var(--accent-gold)] ${compact ? "text-base" : "text-lg"}`}>
            {zone.label}
          </h2>
        </div>
      </div>
      <div
        className={`flex flex-col gap-2 ${compact ? "p-2" : "p-4"} flex-1 min-h-0 overflow-auto rounded-b border border-[var(--border-color)]`}
        style={{
          backgroundImage: "url('/backgrounds/darkstone.png')",
          backgroundRepeat: "repeat",
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
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
  questId?: string | null;
  sessionType?: string | null;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'CANCELLED';
  startedAt: string;
  lastActiveAt: string;
  closedAt: string | null;
  cancelledAt: string | null;
  creator?: { id: string; name: string };
  fetch?: { id: string; title: string };
  quest?: { id: string; title: string };
  participants?: Array<{
    id: string;
    characterId: string;
    actionCount: number;
    character?: { id: string; name: string };
  }>;
};

function RegistraGiocataButton({
  roomId,
  activeQuest,
  usersInRoom,
  myCharacterId,
  iconOnly = false,
}: {
  roomId: RoomId | null;
  activeQuest?: { id: string; title?: string } | null;
  usersInRoom?: Presente[];
  myCharacterId?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<GameSession | null>(null);
  const [myFetchId, setMyFetchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [useFetch, setUseFetch] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const presentOthers = useMemo(
    () => (usersInRoom ?? []).filter((u) => u.id !== myCharacterId),
    [usersInRoom, myCharacterId],
  );

  const handleParticipantToggle = (characterId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(characterId) ? prev.filter((id) => id !== characterId) : [...prev, characterId],
    );
  };

  const syncDeclaredParticipants = useCallback(async (sessionId: string, participantIds: string[]) => {
    const updated = (await api.post(`/game-sessions/${sessionId}/participants`, {
      participantIds,
    })) as GameSession;
    setSession(updated);
    return updated;
  }, []);

  const loadData = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const [openSession, myFetch] = await Promise.all([
        api.get(`/game-sessions/room/${roomId}/open`).then((d) => d as GameSession | null).catch(() => null),
        api.get("/fetches/my").then((d) => { const x = d as { id?: string; assigned?: boolean } | undefined; return x && "id" in x && x.id ? x.id : null; }).catch(() => null),
      ]);
      setSession(openSession);
      setMyFetchId(myFetch);
      setUseFetch(!!myFetch);
      if (openSession?.participants?.length) {
        setSelectedParticipants(
          openSession.participants
            .map((p) => p.characterId)
            .filter((id) => id !== openSession.creatorId),
        );
      } else if (!openSession) {
        // Nuova registrazione: pre-seleziona tutti i presenti in chat
        setSelectedParticipants(
          (usersInRoom ?? []).filter((u) => u.id !== myCharacterId).map((u) => u.id),
        );
      } else {
        setSelectedParticipants([]);
      }
    } catch (e) {
      console.error("Errore caricamento dati:", e);
    } finally {
      setLoading(false);
    }
  }, [roomId, usersInRoom, myCharacterId]);

  useEffect(() => {
    if (open && roomId) loadData();
    if (!open) {
      setTitle("");
      setSelectedParticipants([]);
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
        questId: activeQuest?.id,
        participantIds: selectedParticipants.length > 0 ? selectedParticipants : undefined,
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

  const saveDeclaredParticipants = async () => {
    if (!session) return;
    setActionLoading('participants');
    try {
      await syncDeclaredParticipants(session.id, selectedParticipants);
      toast.success("Partecipanti salvati");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore salvataggio partecipanti");
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
      const updated = await api.post(`/game-sessions/${session.id}/freeze`, {
        participantIds: selectedParticipants,
      }) as GameSession;
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
      const updated = await api.post(`/game-sessions/${session.id}/close`, {
        participantIds: selectedParticipants,
      }) as GameSession;
      setSession(updated);
      toast.success("Registrazione chiusa e conservata nel Journal di tutti i partecipanti");
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

  const sessionKindLabel = session
    ? session.sessionType === "EVENTO"
      ? "Evento"
      : session.fetchId
        ? "Fetch"
        : session.questId
          ? "Quest"
          : "Libera"
    : null;

  const participantPicker = presentOthers.length > 0 ? (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-wider text-gray-500">Partecipanti dichiarati</label>
      <p className="text-[10px] text-gray-500">Chi selezioni vedrà la giocata nel Journal (salvati automaticamente a chiusura/congelamento).</p>
      <div className="max-h-[140px] overflow-y-auto border border-[var(--border-color)] rounded p-2 bg-black/20">
        {presentOthers.map((user) => (
          <label key={user.id} className={`flex items-center gap-2 text-xs cursor-pointer hover:text-[var(--accent-gold)] py-1 min-h-[44px] ${user.isShadow ? "text-[var(--accent-violet-light)]/90" : ""}`}>
            <input
              type="checkbox"
              checked={selectedParticipants.includes(user.id)}
              onChange={() => handleParticipantToggle(user.id)}
              className="rounded border-[var(--border-color)]"
            />
            <span className="flex items-center gap-1.5">
              {user.name}
              {user.isShadow && (
                <FontAwesomeIcon icon={icons.eyeSlash} className="w-3 h-3 text-[var(--accent-violet-light)]/80" title="Shadowban" aria-hidden />
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  ) : (
    <p className="text-[10px] text-gray-500 italic">Nessun altro presente in chat: verranno aggiunti anche i PG con azioni registrate.</p>
  );

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
                {session.title || 'Registrazione'} {session.status === 'ACTIVE' ? 'Attiva' : session.status === 'FROZEN' ? 'In attesa' : session.status === 'CLOSED' ? 'Chiusa' : 'Annullata'}
              </h3>
              {sessionKindLabel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] uppercase tracking-wider text-[var(--accent-violet-light)] bg-[var(--accent-violet)]/20 border border-[var(--accent-violet)]/40 mb-2">
                  {sessionKindLabel}
                </span>
              )}
              {session.fetch && (
                <p className="text-[10px] text-[var(--accent-violet)] mb-2">
                  Fetch: {session.fetch.title}
                </p>
              )}
              {session.quest?.title && !session.fetch && (
                <p className="text-[10px] text-[var(--accent-violet-light)] mb-2">
                  Quest: {session.quest.title}
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
                {participantPicker}
                <button
                  type="button"
                  onClick={saveDeclaredParticipants}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] hover:bg-[var(--accent-violet)]/10 text-xs disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading === 'participants' ? "…" : "Salva partecipanti dichiarati"}
                </button>
                <button
                  type="button"
                  onClick={refreshParticipants}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:bg-black/20 disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading === 'refresh' ? "…" : "Aggiorna da chat (azioni >500)"}
                </button>
                <button
                  type="button"
                  onClick={freezeSession}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-[var(--accent-violet)]/60 text-[var(--accent-violet-light)] hover:bg-[var(--accent-violet)]/10 text-xs disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading === 'freeze' ? "…" : "Congela (salva in attesa)"}
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
                <p className="text-[10px] text-gray-400">
                  Registrazione in attesa con titolo «{session.title || "Senza titolo"}». Scongela per continuare o chiudi per archiviarla nel Journal.
                </p>
                {participantPicker}
                <button
                  type="button"
                  onClick={saveDeclaredParticipants}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] hover:bg-[var(--accent-violet)]/10 text-xs disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading === 'participants' ? "…" : "Salva partecipanti dichiarati"}
                </button>
                <button
                  type="button"
                  onClick={resumeSession}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 text-xs disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading === 'resume' ? "…" : "Scongela e riprendi"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseSession}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-[var(--accent-gold)]/70 text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 text-xs disabled:opacity-50 min-h-[44px]"
                >
                  {actionLoading === 'close' ? "…" : "Chiudi e archivia"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelSession}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 rounded border border-red-500/60 text-red-400 hover:bg-red-500/10 text-xs disabled:opacity-50 min-h-[44px]"
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
              <label className="flex items-center gap-2 text-xs cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={useFetch}
                  onChange={(e) => setUseFetch(e.target.checked)}
                  className="rounded"
                />
                <span>Associa Fetch assegnata</span>
              </label>
            )}
            {participantPicker}
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
        className={
          iconOnly
            ? "inline-flex items-center justify-center p-2 rounded border border-[var(--border-color)] text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
            : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--border-color)] text-[10px] font-display tracking-wider uppercase text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
        }
        title="Registra giocata"
        aria-label="Registra giocata"
      >
        {iconOnly ? <FontAwesomeIcon icon={icons.gamepad} className="w-3.5 h-3.5" /> : "Registra Giocata"}
      </button>
      {dropdown}
      <ConfirmDialog
        open={showCloseConfirm}
        title="Chiudi Registrazione"
        message="Chiudere definitivamente questa registrazione? Verrà conservata nel Journal di tutti i partecipanti dichiarati."
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

// ─── Armadio Casa: inventario housing nella chat (propria casa: Prendi | casa altrui da ospite: Ruba) ───
function ArmadioCasa({ roomId, characterId }: { roomId: RoomId; characterId?: string }) {
  const [inventory, setInventory] = useState<{ items: Array<{ id: string; item: { name: string; type: string }; quantity: number; location: string }>; slots?: { housingOccupied?: number; housingSlots?: number } } | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const isHousingRoom = roomId.startsWith("housing_");
  const ownerId = useMemo(() => {
    if (!isHousingRoom) return null;
    const parts = roomId.split("_");
    const last = parts[parts.length - 1];
    return last && /^[a-f0-9-]{36}$/i.test(last) ? last : null;
  }, [roomId, isHousingRoom]);
  const isMyHouse = characterId && ownerId && characterId === ownerId;
  const isGuest = isHousingRoom && ownerId && characterId && !isMyHouse;

  const reloadArmadio = useCallback(async () => {
    if (!isHousingRoom || !characterId) {
      setInventory(null);
      return;
    }
    if (isMyHouse) {
      const d = await api.get("/inventory/me").catch(() => null);
      setInventory((d as typeof inventory) ?? null);
    } else if (isGuest) {
      const d = await api
        .get(`/housing/armadio?roomId=${encodeURIComponent(roomId)}`)
        .catch(() => null) as { items?: typeof inventory extends { items: infer I } ? I : never } | null;
      setInventory(d?.items ? { items: d.items } : null);
    }
  }, [isHousingRoom, characterId, isMyHouse, isGuest, roomId]);

  useEffect(() => {
    void reloadArmadio();
  }, [reloadArmadio]);

  useInventoryUpdatedListener(isMyHouse ? characterId : undefined, reloadArmadio);

  const moveToCarry = async (invId: string) => {
    if (!characterId || movingId) return;
    setMovingId(invId);
    try {
      if (isMyHouse) {
        await api.post(`/inventory/me/${invId}/move-to-carry`, {});
        const updated = (await api.get("/inventory/me")) as typeof inventory;
        setInventory(updated);
      } else if (isGuest) {
        await api.post("/housing/steal-item", { roomId, inventoryId: invId });
        const refreshed = (await api.get(`/housing/armadio?roomId=${encodeURIComponent(roomId)}`)) as { items: typeof inventory extends { items: infer I } ? I : never };
        setInventory(refreshed ? { items: refreshed.items } : null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante il prelievo");
    } finally {
      setMovingId(null);
    }
  };

  if (!isHousingRoom || (!isMyHouse && !isGuest)) return null;
  const housingItems = inventory?.items?.filter((i) => i.location === "HOUSING") ?? (inventory?.items ?? []);
  const slots = inventory?.slots;

  return (
    <div className="rounded border border-[var(--border-color)] bg-black/30 p-3 shrink-0">
      <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
        Armadio {isGuest && "(casa altrui)"}
      </p>
      {housingItems.length === 0 ? (
        <p className="text-xs text-gray-500">
          {isMyHouse ? "Nessun oggetto in casa." : "L'armadio è vuoto."}
        </p>
      ) : (
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
          {housingItems.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-2 py-1.5 px-2 rounded border border-[var(--border-color)]/50 bg-black/20"
            >
              <span className="text-xs text-gray-200 truncate flex-1 min-w-0">
                {inv.item?.name ?? "?"}
                {inv.quantity > 1 && ` ×${inv.quantity}`}
              </span>
              <button
                type="button"
                onClick={() => moveToCarry(inv.id)}
                disabled={!!movingId}
                className={`px-2 py-0.5 rounded text-[10px] shrink-0 disabled:opacity-50 ${
                  isGuest
                    ? "border border-red-500/60 text-red-400 hover:bg-red-500/10"
                    : "border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10"
                }`}
                title={isGuest ? "Ruba (solo ospiti)" : "Prendi (sposta nello zaino)"}
              >
                {movingId === inv.id ? "…" : isGuest ? "Ruba" : "Prendi"}
              </button>
            </div>
          ))}
        </div>
      )}
      {slots && isMyHouse && (slots.housingSlots != null || slots.housingOccupied != null) && (
        <p className="text-[10px] text-gray-600 mt-1.5">
          {slots.housingOccupied ?? housingItems.length}/{slots.housingSlots ?? "?"} slot
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
  iconOnly = false,
}: { 
  roomId: RoomId; 
  activeQuest: { id: string; title?: string; creatorId?: string; createdAt?: string } | null;
  usersInRoom: Presente[];
  canAccessGestione?: boolean;
  onQuestCreated?: () => void;
  iconOnly?: boolean;
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
      let plotId: string | undefined = type === "TRAMA" && selectedPlot && selectedPlot !== "new" ? selectedPlot : undefined;
      if (type === "TRAMA" && selectedPlot === "new" && newPlotName.trim()) {
        const newPlot = await api.post("/lore/plots", { title: newPlotName.trim() }) as { id?: string };
        plotId = newPlot?.id;
      }
      const response = await api.post("/quests", {
        title: title.trim(),
        description: description.trim() || undefined,
        roomId: type === "GLOBALE" ? undefined : (roomId || undefined),
        type,
        plotId,
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
                    <label key={user.id} className={`flex items-center gap-2 text-xs cursor-pointer hover:text-[var(--accent-gold)] py-1 ${user.isShadow ? "text-amber-400/90" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(user.id)}
                        onChange={() => handleParticipantToggle(user.id)}
                        className="rounded border-[var(--border-color)]"
                      />
                      <span className="flex items-center gap-1.5">
                        {user.name}
                        {user.isShadow && (
                          <FontAwesomeIcon icon={icons.eyeSlash} className="w-3 h-3 text-amber-400/80" title="Shadowban" aria-hidden />
                        )}
                      </span>
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
        className={
          iconOnly
            ? "inline-flex items-center justify-center p-2 rounded border border-[var(--border-color)] text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
            : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--border-color)] text-[10px] font-display tracking-wider uppercase text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
        }
        title="Registra Quest"
        aria-label="Registra Quest"
      >
        {iconOnly ? <FontAwesomeIcon icon={icons.ordine} className="w-3.5 h-3.5" /> : "Registra Quest"}
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
  chatConnectionFailed = false,
  usersInRoom,
  onSubmit,
  inputRef,
  tagLuogoRef,
  listRef,
  onBack,
  canAccessShinigami,
  canAccessGestione,
  char,
  compact = false,
  onOpenCombattimento,
  onOpenTulpa,
  onOpenCediDrop,
  onOpenNote,
}: {
  roomId: RoomId;
  placeLabel: string;
  messages: ChatMessage[];
  sendMessage: (text: string, locationTag?: string | null) => void;
  chatConnected: boolean;
  chatConnectionFailed?: boolean;
  usersInRoom: Presente[];
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  tagLuogoRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  canAccessShinigami?: boolean;
  canAccessGestione?: boolean;
  char?: CharacterSummary;
  compact?: boolean;
  onOpenCombattimento?: () => void;
  onOpenTulpa?: () => void;
  onOpenCediDrop?: () => void;
  onOpenNote?: () => void;
}) {
  const { index: wazaTagIndex } = useWazaCatalog();
  const [showMobileTools, setShowMobileTools] = useState(false);
  const place = getChatLocationByRoomId(roomId);
  const isPartychatRoom = isPartychat(roomId);
  const isHousingRoom = roomId.startsWith("housing_");
  const [housingChatInfo, setHousingChatInfo] = useState<{ name: string; image: string | null; description: string | null; isOwner: boolean } | null>(null);
  const [housingAccessDenied, setHousingAccessDenied] = useState(false);
  const [housingEditOpen, setHousingEditOpen] = useState(false);
  const [housingEditForm, setHousingEditForm] = useState({ name: "", image: "", description: "" });
  const [housingEditSaving, setHousingEditSaving] = useState(false);
  const [housingGuests, setHousingGuests] = useState<Array<{ id: string; guest: { id: string; name: string; surname: string } }>>([]);
  const [housingInviteSearch, setHousingInviteSearch] = useState("");
  const [housingInviteResults, setHousingInviteResults] = useState<Array<{ id: string; name: string; surname: string }>>([]);
  const [housingInvitingId, setHousingInvitingId] = useState<string | null>(null);
  const [housingRemovingGuestId, setHousingRemovingGuestId] = useState<string | null>(null);
  const [activeQuest, setActiveQuest] = useState<{ id: string; title?: string; creatorId?: string; createdAt?: string } | null>(null);
  const prevActiveQuestIdRef = useRef<string | null>(null);
  const [showQuestAnimation, setShowQuestAnimation] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [messageLength, setMessageLength] = useState(0);
  const [messageDraft, setMessageDraft] = useState("");

  const insertChatText = useCallback(
    (text: string) => {
      const ta = inputRef.current;
      if (!ta) return;
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? ta.value.length;
      const next = ta.value.substring(0, start) + text + ta.value.substring(end);
      ta.value = next;
      ta.selectionStart = ta.selectionEnd = start + text.length;
      ta.focus();
      setMessageDraft(next);
      setMessageLength(next.length);
    },
    [inputRef],
  );

  const sendLaunchFromPanel = useCallback(
    (text: string) => {
      const tag = tagLuogoRef.current?.value.trim() || undefined;
      const expanded = expandWazaLaunchInMessage(text, wazaTagIndex, {
        skiruSheet: char?.skiruSheet ?? null,
      });
      sendMessage(expanded, tag || undefined);
    },
    [sendMessage, char?.skiruSheet, tagLuogoRef, wazaTagIndex],
  );

  // Bridge eventi DOM → PannelloCombattimentoWindow (la finestra dock usa questi eventi)
  useEffect(() => {
    const handleInsert = (e: Event) => {
      insertChatText((e as CustomEvent<string>).detail);
    };
    const handleSend = (e: Event) => {
      sendLaunchFromPanel((e as CustomEvent<string>).detail);
    };
    window.addEventListener("oyasumi:chatInsert", handleInsert);
    window.addEventListener("oyasumi:chatSend", handleSend);
    return () => {
      window.removeEventListener("oyasumi:chatInsert", handleInsert);
      window.removeEventListener("oyasumi:chatSend", handleSend);
    };
  }, [insertChatText, sendLaunchFromPanel]);

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
    if (isPartychatRoom) return; // Circus: nessuna quest
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
  }, [roomId, refreshQuest, isPartychatRoom]);

  // Carica metadata chat housing (nome, immagine, descrizione)
  useEffect(() => {
    if (!isHousingRoom) {
      setHousingChatInfo(null);
      setHousingAccessDenied(false);
      return;
    }
    setHousingAccessDenied(false);
    api.get(`/housing/chat-info?roomId=${encodeURIComponent(roomId)}`)
      .then((d) => {
        if (d && typeof d === "object" && "name" in d && !("error" in d)) {
          setHousingChatInfo(d as { name: string; image: string | null; description: string | null; isOwner: boolean });
          setHousingAccessDenied(false);
          setHousingEditForm({
            name: (d as { name?: string }).name ?? "",
            image: (d as { image?: string | null }).image ?? "",
            description: (d as { description?: string | null }).description ?? "",
          });
        } else if (d && typeof d === "object" && "error" in d) {
          setHousingChatInfo(null);
          setHousingAccessDenied(true);
        } else {
          setHousingChatInfo(null);
          setHousingAccessDenied(false);
        }
      })
      .catch(() => {
        setHousingChatInfo(null);
        setHousingAccessDenied(true);
      });
  }, [roomId, isHousingRoom]);

  // Carica ospiti e search per invito (solo se proprietario housing)
  useEffect(() => {
    if (!isHousingRoom || !housingChatInfo?.isOwner) return;
    api.get("/housing/guests").then((d) => (Array.isArray(d) ? d : []) as typeof housingGuests).then(setHousingGuests).catch(() => setHousingGuests([]));
  }, [roomId, isHousingRoom, housingChatInfo?.isOwner]);

  useEffect(() => {
    const q = housingInviteSearch.trim();
    if (q.length < 2) {
      setHousingInviteResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get(`/characters/search?q=${encodeURIComponent(q)}`).then((d) => {
        setHousingInviteResults((Array.isArray(d) ? d : []).slice(0, 6));
      }).catch(() => setHousingInviteResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [housingInviteSearch]);

  const handleHousingInviteGuest = async (guestCharacterId: string) => {
    setHousingInvitingId(guestCharacterId);
    try {
      await api.post("/housing/guests", { guestCharacterId });
      const updated = await api.get("/housing/guests").then((d) => (Array.isArray(d) ? d : []) as typeof housingGuests);
      setHousingGuests(updated);
      setHousingInviteSearch("");
      setHousingInviteResults([]);
      toast.success("Ospite aggiunto");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'invito");
    } finally {
      setHousingInvitingId(null);
    }
  };

  const handleHousingRemoveGuest = async (guestCharacterId: string) => {
    setHousingRemovingGuestId(guestCharacterId);
    try {
      await api.delete(`/housing/guests/${guestCharacterId}`);
      setHousingGuests((prev) => prev.filter((g) => g.guest.id !== guestCharacterId));
      toast.success("Ospite rimosso");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante la rimozione");
    } finally {
      setHousingRemovingGuestId(null);
    }
  };

  const displayLabel = isHousingRoom && housingChatInfo ? housingChatInfo.name : (isHousingRoom && housingAccessDenied ? "Chat privata" : placeLabel);
  const displayImage = isHousingRoom && housingChatInfo?.image ? housingChatInfo.image : place?.image;
  const displayDescription = isHousingRoom && housingChatInfo
    ? (housingChatInfo.description ?? "La tua abitazione.")
    : (place?.description ?? (isHousingRoom ? "La tua abitazione." : "Nessuna descrizione ambientale."));

  const handleHousingEditSave = async () => {
    setHousingEditSaving(true);
    try {
      const res = await api.patch("/housing/chat-customization", {
        name: housingEditForm.name.trim() || null,
        image: housingEditForm.image.trim() || null,
        description: housingEditForm.description.trim() || null,
      }) as { name?: string; image?: string | null; description?: string | null; isOwner?: boolean };
      if (res && "name" in res) {
        setHousingChatInfo((prev) => prev ? { ...prev, ...res } : null);
        setHousingEditOpen(false);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore durante il salvataggio");
    } finally {
      setHousingEditSaving(false);
    }
  };

  return (
    <div className={compact ? "mobile-chat-shell" : "flex flex-col flex-1 min-h-0 overflow-hidden gap-4"}>
      <div 
        className={`${compact ? "h-10 px-2 shrink-0 mobile-safe-top" : "h-[50px] px-5"} flex-shrink-0 flex justify-between items-center border-b border-[var(--accent-violet)]/30`}
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
          <h2 className={`font-display font-bold text-[var(--accent-gold)] tracking-[2px] uppercase flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate min-w-0 ${compact ? "text-xs" : "text-base"}`}>
            <span className="text-[var(--accent-violet)] shrink-0">💬</span>
            <span className="truncate">{displayLabel}</span>
            {!isPartychatRoom && activeQuest && (
              <span className="text-[#ff4d4d] text-[10px] border border-[#ff4d4d] px-1.5 py-0.5 rounded">
                QUEST
              </span>
            )}
          </h2>
          {compact && (
            <button
              type="button"
              onClick={() => setShowMobileTools((v) => !v)}
              className="ml-1 px-2 py-1 rounded border border-[var(--border-color)] text-[10px] uppercase tracking-wider text-gray-400 hover:text-[var(--accent-gold)] shrink-0"
            >
              {showMobileTools ? "Chat" : "Luogo"}
            </button>
          )}
          {(canAccessShinigami || canAccessGestione) && <PulisciChatButton roomId={roomId} />}
        </div>
        {!chatConnected && !housingAccessDenied && (
          <span className="text-xs text-gray-500">(connessione…)</span>
        )}
      </div>

      {isHousingRoom && housingAccessDenied ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center border border-[var(--accent-violet)]/20 rounded-lg bg-black/40 m-4">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--accent-violet)]/50 flex items-center justify-center bg-[var(--accent-violet)]/10">
            <FontAwesomeIcon icon={icons.eye} className="w-8 h-8 text-[var(--accent-violet)]" />
          </div>
          <p className="font-display text-lg text-[var(--accent-gold)]">
            Hey, questa è una conversazione privata!
          </p>
        </div>
      ) : (
      <div className={compact ? "mobile-chat-shell__body" : "flex flex-1 min-h-0 overflow-hidden gap-4"}>
        {/* Sinistra: immagine luogo, descrizione, note Master, presenti */}
        {(!compact || showMobileTools) && (
        <aside
          className={`${
            compact
              ? "mobile-scroll-pane flex-1 border-b"
              : "w-[280px] border-r flex-shrink-0"
          } flex flex-col gap-3 min-h-0 bg-black/30 ${compact ? "p-3" : "pr-3 p-5"}`}
        >
          <div className={`relative w-full ${compact ? "h-[min(22dvh,180px)]" : "h-[140px]"} rounded border border-[var(--accent-violet)]/30 overflow-hidden shrink-0`}>
            {displayImage ? (
              <Image 
                src={displayImage} 
                alt={displayLabel} 
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
            {displayDescription}
          </div>
          {isHousingRoom && housingChatInfo?.isOwner && (
            <div className="mb-3">
              {!housingEditOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setHousingEditForm({
                      name: housingChatInfo.name,
                      image: housingChatInfo.image ?? "",
                      description: housingChatInfo.description ?? "",
                    });
                    setHousingEditOpen(true);
                  }}
                  className="w-full px-3 py-2 rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 transition-colors"
                >
                  <FontAwesomeIcon icon={icons.edit} className="w-3 h-3 mr-2" />
                  Personalizza chat
                </button>
              ) : (
                <div className="space-y-2 rounded border border-[var(--accent-gold)]/30 bg-black/30 p-3">
                  <label className="block text-[10px] uppercase text-[var(--accent-gold)]">Nome</label>
                  <input
                    type="text"
                    value={housingEditForm.name}
                    onChange={(e) => setHousingEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Es. Casa di Luna"
                    className="w-full px-2 py-1.5 rounded border border-white/20 bg-black/40 text-white text-sm"
                  />
                  <label className="block text-[10px] uppercase text-[var(--accent-gold)]">URL immagine</label>
                  <input
                    type="text"
                    value={housingEditForm.image}
                    onChange={(e) => setHousingEditForm((f) => ({ ...f, image: e.target.value }))}
                    placeholder="Es. /backgrounds/cloudy.png"
                    className="w-full px-2 py-1.5 rounded border border-white/20 bg-black/40 text-white text-sm"
                  />
                  <label className="block text-[10px] uppercase text-[var(--accent-gold)]">Descrizione</label>
                  <textarea
                    value={housingEditForm.description}
                    onChange={(e) => setHousingEditForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descrizione ambientale..."
                    rows={3}
                    className="w-full px-2 py-1.5 rounded border border-white/20 bg-black/40 text-white text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleHousingEditSave}
                      disabled={housingEditSaving}
                      className="flex-1 px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                    >
                      {housingEditSaving ? "…" : "Salva"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHousingEditOpen(false)}
                      className="px-3 py-1.5 rounded border border-white/30 text-gray-400 text-xs hover:bg-white/5"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {isHousingRoom && housingChatInfo?.isOwner && (
            <div className="mb-3 space-y-2">
              <h5 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display flex items-center gap-1.5">
                <FontAwesomeIcon icon={icons.presenti} className="w-3 h-3" />
                Ospiti
              </h5>
              <input
                type="text"
                placeholder="Cerca personaggio… (min 2 caratteri)"
                value={housingInviteSearch}
                onChange={(e) => setHousingInviteSearch(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-black/40 text-white text-xs placeholder-gray-500"
              />
              {housingInviteResults.length > 0 && (
                <ul className="rounded border border-[var(--border-color)] bg-black/40 divide-y divide-[var(--border-color)] max-h-28 overflow-y-auto">
                  {housingInviteResults.map((c) => {
                    const alreadyGuest = housingGuests.some((g) => g.guest.id === c.id);
                    return (
                      <li key={c.id} className="flex items-center justify-between px-2 py-1.5 text-xs">
                        <span className="text-white truncate">{c.name} {c.surname || ""}</span>
                        <button
                          type="button"
                          onClick={() => handleHousingInviteGuest(c.id)}
                          disabled={housingInvitingId !== null || alreadyGuest}
                          className="px-2 py-0.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-[10px] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50 shrink-0 ml-1"
                        >
                          {alreadyGuest ? "Già ospite" : housingInvitingId === c.id ? "…" : "Invita"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {housingGuests.length > 0 ? (
                <ul className="space-y-1 border border-[var(--border-color)] rounded bg-black/20 divide-y divide-[var(--border-color)] max-h-24 overflow-y-auto">
                  {housingGuests.map((g) => (
                    <li key={g.id} className="flex items-center justify-between px-2 py-1.5 text-xs">
                      <span className="text-white truncate">{g.guest.name} {g.guest.surname || ""}</span>
                      <button
                        type="button"
                        onClick={() => handleHousingRemoveGuest(g.guest.id)}
                        disabled={housingRemovingGuestId !== null}
                        className="px-2 py-0.5 rounded border border-red-500/60 text-red-400 text-[10px] hover:bg-red-500/10 disabled:opacity-50 shrink-0 ml-1"
                      >
                        {housingRemovingGuestId === g.guest.id ? "…" : "Rimuovi"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : housingInviteSearch.length < 2 && (
                <p className="text-[10px] text-gray-500">Nessun ospite invitato.</p>
              )}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("openHousingWindow"))}
                className="w-full px-2 py-1.5 rounded border border-[var(--border-color)]/60 text-gray-400 text-[10px] hover:border-[var(--accent-gold)]/50 hover:text-[var(--accent-gold)] transition-colors"
              >
                Affitto e dettagli casa
              </button>
            </div>
          )}
          {isPartychatRoom && (
            <div className="mb-3 space-y-2">
              <h5 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display flex items-center gap-1.5">
                <FontAwesomeIcon icon={icons.presenti} className="w-3 h-3" />
                Nel Circus ora
              </h5>
              {usersInRoom.length > 0 ? (
                <ul className="space-y-1.5">
                  {usersInRoom.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-2 px-2 py-1 rounded border border-[var(--accent-violet)]/20 bg-black/30"
                      style={u.anonymousColor ? { borderLeft: `3px solid ${u.anonymousColor}` } : undefined}
                    >
                      <span
                        className="font-display font-bold text-xs truncate"
                        style={{ color: u.anonymousColor ?? "#c9a84a" }}
                      >
                        {u.name}
                      </span>
                      {u.isMe && <span className="text-[9px] text-gray-500">(tu)</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] text-gray-500 italic">Nessuno al momento.</p>
              )}
            </div>
          )}
          <ArmadioCasa roomId={roomId} characterId={char?.id} />
          <ChatGroundLootPanel
            roomId={roomId}
            characterId={char?.id}
            sendMessage={sendMessage}
          />
          {(canAccessShinigami || canAccessGestione) && onOpenCediDrop && (
            <button
              type="button"
              onClick={onOpenCediDrop}
              className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded border border-[var(--border-color)] bg-black/30 hover:border-[var(--accent-gold)]/50 hover:bg-[color-mix(in_srgb,var(--panel-bg)_80%,black)] transition-colors text-[11px] font-display text-[var(--accent-gold)] uppercase tracking-wider"
            >
              <FontAwesomeIcon icon={icons.mercato} className="w-3.5 h-3.5" />
              Cedi Drop
            </button>
          )}
          {onOpenCombattimento && (
            <button
              type="button"
              onClick={onOpenCombattimento}
              className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded border border-[var(--border-color)] bg-black/30 hover:border-[var(--accent-gold)]/50 hover:bg-[color-mix(in_srgb,var(--panel-bg)_80%,black)] transition-colors text-[11px] font-display text-[var(--accent-gold)] uppercase tracking-wider"
            >
              <FontAwesomeIcon icon={icons.waza} className="w-3.5 h-3.5" />
              Pannello Combattimento
            </button>
          )}
          {canAccessShinigami && onOpenTulpa && (
            <button
              type="button"
              onClick={onOpenTulpa}
              className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] rounded border border-[var(--accent-violet)]/40 bg-black/30 hover:border-[var(--accent-violet)]/70 hover:bg-[color-mix(in_srgb,var(--panel-bg)_80%,black)] transition-colors text-[11px] font-display text-[var(--accent-violet-light)] uppercase tracking-wider"
            >
              <FontAwesomeIcon icon={icons.eye} className="w-3.5 h-3.5" />
              Shinigami
            </button>
          )}
          <MasterNotesBox roomId={roomId} canAccessShinigami={canAccessShinigami} />
        </aside>
        )}

        {/* Destra: flusso messaggi + input */}
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${compact && showMobileTools ? "hidden" : ""}`}>
          <div
            ref={listRef}
            className={`${compact ? "mobile-chat-messages py-2 px-3" : "flex-1 overflow-y-auto overflow-x-visible min-h-[120px] py-6 px-8"}`}
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: 'repeat',
              backgroundBlendMode: 'overlay',
              backgroundColor: 'rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            {messages.map((m) => (
              <ChatMessageBlock
                key={m.id}
                message={m}
                placeLabel={displayLabel}
                activeQuest={activeQuest}
                currentCharacterId={char?.id}
                currentCharacterName={char?.name ?? usersInRoom.find((u) => u.isMe || u.id === char?.id)?.name}
                currentCharacterSurname={char?.surname}
                actorSkiruSheet={
                  m.characterId === char?.id
                    ? (char?.skiruSheetEffective ?? char?.skiruSheet)
                    : undefined
                }
                actorEquipmentMods={
                  m.characterId === char?.id ? char?.equipmentMods : undefined
                }
                actorHpMax={
                  m.characterId === char?.id ? (char?.computed?.hpMax ?? null) : null
                }
                isPartychat={isPartychatRoom}
              />
            ))}
            
            {/* Banner Animazione Quest - IN FONDO, DOPO TUTTI I MESSAGGI (non in Circus) */}
            {!isPartychatRoom && showQuestAnimation && activeQuest && (
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
          <form
            onSubmit={(e) => {
              onSubmit(e);
              setMessageDraft("");
              setMessageLength(0);
            }}
            className={`flex flex-col gap-1 shrink-0 border-t border-[var(--accent-violet)]/20 ${compact ? "mobile-chat-compose px-2 py-1.5" : "px-5 py-4 gap-2"}`}
            style={{
              backgroundImage: "url('/backgrounds/darkstone.png')",
              backgroundRepeat: "repeat",
              backgroundColor: "rgba(0,0,0,0.75)",
            }}
          >
            <div className={compact ? "flex flex-col gap-1.5 w-full" : "flex gap-2 items-end flex-row gap-2.5"}>
              {compact ? (
                <>
                  <div className="flex items-center gap-1 w-full flex-wrap">
                    <ChatInfoPanel compact />
                    {!isPartychatRoom && canAccessShinigami && (
                      <RegistraQuestButton
                        roomId={roomId}
                        activeQuest={activeQuest}
                        usersInRoom={usersInRoom}
                        canAccessGestione={canAccessGestione}
                        onQuestCreated={() => refreshQuest(true)}
                        iconOnly
                      />
                    )}
                    {!isPartychatRoom && (
                      <RegistraGiocataButton roomId={roomId} activeQuest={activeQuest} usersInRoom={usersInRoom} myCharacterId={char?.id} iconOnly />
                    )}
                    {canAccessGestione && <GlobalMessageButton iconOnly />}
                  </div>
                  <input
                    ref={tagLuogoRef}
                    type="text"
                    placeholder={isPartychatRoom ? "Posizione..." : "Luogo..."}
                    disabled={!chatConnected}
                    maxLength={120}
                    className="bg-white/5 border border-white/10 text-[#c9a84a] px-2 py-1.5 rounded text-base font-display w-full h-9 box-border text-center"
                  />
                  <textarea
                    ref={inputRef}
                    placeholder={
                      chatConnected
                        ? "Azione..."
                        : chatConnectionFailed
                        ? "Connessione fallita. Ricarica la pagina."
                        : "Connessione in corso…"
                    }
                    disabled={!chatConnected}
                    maxLength={MOBILE_CHAT_MAX_LENGTH}
                    onChange={(e) => {
                      setMessageLength(e.target.value.length);
                      setMessageDraft(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit(e);
                      }
                    }}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 text-[#e6e0ff] px-2 py-1.5 rounded resize-none font-sans text-base box-border leading-snug min-h-[2.5rem] max-h-[5rem]"
                  />
                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="submit"
                      disabled={!chatConnected}
                      className="flex-1 py-2 border-none rounded cursor-pointer bg-gradient-to-r from-[#60519b] to-[#a270ff] text-white font-display font-bold text-xs box-border transition-all uppercase tracking-wide shadow-[0_0_10px_rgba(162,112,255,0.3)] disabled:opacity-50"
                      title="Invia"
                      aria-label="Invia messaggio"
                    >
                      INVIA
                    </button>
                    <span className={`text-[10px] font-mono shrink-0 tabular-nums ${messageLength >= MOBILE_CHAT_MAX_LENGTH ? "text-[var(--accent-gold)]" : "text-gray-500"}`}>
                      {messageLength}/{MOBILE_CHAT_MAX_LENGTH}
                    </span>
                  </div>
                </>
              ) : (
                <>
              <div className="flex flex-col items-start gap-1 shrink-0 w-[150px]">
                <ChatInfoPanel />
                <input
                  ref={tagLuogoRef}
                  type="text"
                  placeholder={isPartychatRoom ? "Posizione..." : "Luogo..."}
                  disabled={!chatConnected}
                  maxLength={120}
                  className="bg-white/5 border border-white/10 text-[#c9a84a] px-2.5 py-2.5 rounded text-xs font-display w-full h-10 box-border text-center shrink-0"
                />
              </div>
              <textarea
                ref={inputRef}
                placeholder={
                  chatConnected
                    ? "Azione..."
                    : chatConnectionFailed
                    ? "Connessione fallita. Ricarica la pagina. Verifica che il server sia avviato (localhost:4000) e di usare localhost:3000."
                    : "Connessione in corso…"
                }
                disabled={!chatConnected}
                onChange={(e) => {
                  setMessageLength(e.target.value.length);
                  setMessageDraft(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 text-[#e6e0ff] px-2.5 py-2.5 rounded resize-none font-sans text-sm box-border h-10 leading-relaxed shrink-0"
              />
              <button
                type="submit"
                disabled={!chatConnected}
                className="px-6 py-2 border-none rounded cursor-pointer bg-gradient-to-r from-[#60519b] to-[#a270ff] text-white font-display font-bold text-xs h-10 box-border shrink-0 transition-all uppercase tracking-wide shadow-[0_0_10px_rgba(162,112,255,0.3)] disabled:opacity-50"
                title="Invia"
                aria-label="Invia messaggio"
              >
                INVIA
              </button>
                </>
              )}
            </div>
            {!compact && (
            <div className="flex justify-between items-center mt-2.5 pl-[160px] gap-3 flex-wrap">
              <div className="flex gap-2 flex-wrap items-center">
                {!isPartychatRoom && canAccessShinigami && <RegistraQuestButton roomId={roomId} activeQuest={activeQuest} usersInRoom={usersInRoom} canAccessGestione={canAccessGestione} onQuestCreated={() => refreshQuest(true)} />}
                {onOpenNote && (
                  <button
                    type="button"
                    onClick={onOpenNote}
                    className="inline-flex items-center px-3 py-1.5 text-[10px] font-display tracking-wider uppercase rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] hover:bg-[var(--accent-violet)]/10 transition-colors"
                    title="Apri blocco note"
                  >
                    Note
                  </button>
                )}
                {!isPartychatRoom && <RegistraGiocataButton roomId={roomId} activeQuest={activeQuest} usersInRoom={usersInRoom} myCharacterId={char?.id} />}
                {canAccessGestione && <GlobalMessageButton />}
              </div>
              <div className="flex items-center gap-4 flex-wrap justify-end">
                <QuarterTurnHud draft={messageDraft} />
                <span className="text-[10px] text-gray-500 font-mono">
                  {messageLength} caratteri
                  {!isDiceOnlyDraft(messageDraft) && messageLength >= 500 && (
                    <span className="text-[var(--accent-gold)]/80 ml-2">
                      +{Math.floor(messageLength / 500)} EXP
                    </span>
                  )}
                </span>
              </div>
            </div>
            )}
          </form>
        </div>
      </div>
      )}
    </div>
  );
}

// ─── Pulisci Chat Button (Shinigami/Admin/Mod) ───
function PulisciChatButton({ roomId }: { roomId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!confirm("Vuoi pulire la chat? I messaggi resteranno nel Log ma non saranno più visibili nella vista chat.")) return;
    setLoading(true);
    try {
      await api.post("/chat/clear", { roomId });
      toast.success("Chat pulita.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="p-1.5 rounded border border-[var(--accent-violet)]/60 text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/10 transition-colors disabled:opacity-50"
      title="Pulisci chat (i messaggi restano nel Log)"
      aria-label="Pulisci chat"
    >
      <FontAwesomeIcon icon={icons.clearChat} className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Global Message Button (Admin) ───
function GlobalMessageButton({ iconOnly = false }: { iconOnly?: boolean }) {
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
              />
              <p className="text-[10px] text-gray-600 mt-1">
                {message.length} caratteri
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
        className={
          iconOnly
            ? "inline-flex items-center justify-center p-2 rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] hover:bg-[var(--accent-violet)]/10 transition-colors"
            : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--accent-violet)]/50 text-[10px] font-display tracking-wider uppercase text-[var(--accent-violet-light)] hover:bg-[var(--accent-violet)]/10 transition-colors"
        }
        title="Invia messaggio globale (Admin)"
        aria-label="Messaggio globale"
      >
        {iconOnly ? <FontAwesomeIcon icon={icons.bullhorn} className="w-3.5 h-3.5" /> : "Messaggio Globale"}
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
  currentCharacterName,
  currentCharacterSurname,
  actorSkiruSheet,
  actorEquipmentMods,
  actorHpMax,
  isPartychat = false,
}: {
  message: ChatMessage;
  placeLabel: string;
  activeQuest?: { id: string; title?: string; creatorId?: string; createdAt?: string } | null;
  currentCharacterId?: string;
  currentCharacterName?: string;
  currentCharacterSurname?: string | null;
  actorSkiruSheet?: Record<string, number>;
  actorEquipmentMods?: {
    damageFlat: number;
    mitigationFlat: number;
    skiruDeltas: Record<string, number>;
    lines: string[];
  };
  actorHpMax?: number | null;
  isPartychat?: boolean;
}) {
  const { index: wazaTagIndex } = useWazaCatalog();
  const highlightNames = useMemo(() => {
    if (!currentCharacterName?.trim()) return undefined;
    const names: string[] = [currentCharacterName.trim()];
    if (currentCharacterSurname?.trim()) {
      names.unshift(`${currentCharacterName.trim()} ${currentCharacterSurname.trim()}`);
    }
    return names;
  }, [currentCharacterName, currentCharacterSurname]);
  const wazaLaunches = useMemo(() => {
    const characterName = [message.name, message.surname].filter(Boolean).join(" ");
    return extractWazaTagNames(message.content).map((name) => {
      const entry = wazaTagIndex.get(normalizeWazaLookupKey(name));
      const preview = resolveWazaTagPreview(name, wazaTagIndex);
      return buildChatWazaPostFromMessage({
        messageContent: message.content,
        characterName,
        preview,
        entry: entry ?? null,
        actorSkiruSheet: actorSkiruSheet ?? null,
        equipmentMods: actorEquipmentMods ?? null,
      });
    });
  }, [message.content, message.name, message.surname, actorSkiruSheet, actorEquipmentMods, wazaTagIndex]);

  const characterName = [message.name, message.surname].filter(Boolean).join(" ");

  const constructPost = useMemo(() => {
    const wazaNames = extractWazaTagNames(message.content);
    for (const name of wazaNames) {
      const entry = wazaTagIndex.get(normalizeWazaLookupKey(name));
      const post = buildConstructPostFromMessage({
        messageContent: message.content,
        wazaName: name,
        wazaEffect: entry?.effect ?? entry?.description ?? null,
        actorSkiruSheet: actorSkiruSheet ?? null,
        actorHpMax: actorHpMax ?? null,
      });
      if (post) return post;
    }
    return buildStandaloneConstructPostFromMessage({
      messageContent: message.content,
      actorSkiruSheet: actorSkiruSheet ?? null,
      actorHpMax: actorHpMax ?? null,
      characterName: characterName || undefined,
      miniAvatar: message.miniAvatar ?? undefined,
    });
  }, [message.content, message.miniAvatar, actorSkiruSheet, actorHpMax, characterName]);
  const attackData = useMemo(() => extractAttackData(message.content), [message.content]);
  const itemUseData = useMemo(() => extractItemUseCard(message.content), [message.content]);
  const dropEventData = useMemo(() => extractDropEventData(message.content), [message.content]);

  const narrativeBody = useMemo(
    () => removeWazaTagsFromText(message.content),
    [message.content],
  );
  const formattedContent = formatNarrativeText(narrativeBody, highlightNames);
  const diceRollOnly = isDiceRollMessage(message.content);
  const diceBodyHtml = diceRollOnly
    ? formatNarrativeText(formatDiceRollLine(extractDiceResultLabels(message.content)), highlightNames)
    : null;
  const isGlobal = message.zone === "GLOBAL" || message.name.startsWith("[GLOBAL]");
  
  // Preferisco valore persistito; fallback: Shinigami autore quest attiva + messaggio dopo creazione
  const isMasterscreen = message.isMasterscreen ?? (
    activeQuest?.creatorId &&
    message.characterId === activeQuest.creatorId &&
    activeQuest.createdAt &&
    new Date(message.createdAt) >= new Date(activeQuest.createdAt)
  );
  
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

  // Evento loot (drop / prendi / a terra)
  if (dropEventData) {
    return (
      <div className="w-full mb-3">
        <ChatDropEventCard data={dropEventData} />
      </div>
    );
  }

  // Messaggio Masterscreen (Shinigami autore della quest)
  if (isMasterscreen) {
    return (
      <div className="w-full mb-6 p-5 bg-black/40 border border-[var(--accent-gold)]/30 rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative">
        <div className="masterscreen-format font-sans text-[13px] leading-relaxed whitespace-pre-wrap mb-4">
          {(wazaLaunches.length > 0 || constructPost) && (
            <div className="mb-3 space-y-2">
              {wazaLaunches.map((post, i) => (
                <ChatWazaResolutionPost key={`${post.wazaRomaji}-${i}`} data={post} />
              ))}
              {constructPost && <ChatConstructResolutionPost data={constructPost} />}
            </div>
          )}
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

  // Card attacco senza waza
  if (attackData) {
    return (
      <div className="w-full mb-3">
        <ChatAttackCard data={attackData} characterName={characterName} />
      </div>
    );
  }

  // Card uso oggetto (pannello combattimento)
  if (itemUseData) {
    return (
      <div className="w-full mb-3">
        <ChatItemUseCard data={itemUseData} characterName={characterName} />
      </div>
    );
  }

  const hasWazaAttack = wazaLaunches.length > 0 && !diceRollOnly;
  const hasStandaloneConstruct = !hasWazaAttack && constructPost != null && extractStandaloneConstructName(message.content) != null;
  const hasNarrativeAfterWaza = narrativeBody.trim().length > 0;

  if (hasWazaAttack) {
    return (
      <div className="chat-waza-attack-message w-full mb-3 space-y-2">
        {wazaLaunches.map((post, i) => (
          <ChatWazaResolutionPost key={`${post.wazaRomaji}-${i}`} data={post} />
        ))}
        {constructPost && <ChatConstructResolutionPost data={constructPost} />}
        {hasNarrativeAfterWaza && (
          <p
            className="m-0 leading-relaxed whitespace-pre-wrap break-words font-sans text-[13px] text-[#7d7f7d] text-justify"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        )}
      </div>
    );
  }

  if (hasStandaloneConstruct && constructPost) {
    return (
      <div className="chat-waza-attack-message w-full mb-3">
        <ChatConstructResolutionPost data={constructPost} />
      </div>
    );
  }
  
  return (
    <div className={`w-full text-[#b3b3c0] relative pl-3 ${diceRollOnly ? "mb-4 chat-dice-roll" : "mb-6"}`}>
      {/* Header: Timestamp | Nome | Pixel-icons | Tag luogo */}
      <div className="flex items-center mb-1.5 text-xs border-b border-white/5 pb-1 w-full">
        <span className="mr-3 text-[10px] text-gray-600 font-sans">
          {formatTimestamp(message.createdAt)}
        </span>
        <span
          className="font-display font-bold mr-2.5 tracking-wide text-[13px]"
          style={{ color: message.anonymousColor ?? "#c9a84a" }}
        >
          {message.name}{message.surname ? ` ${message.surname}` : ""}
        </span>
        {message.pixelIcons && (
          <div className="flex items-center gap-1 mr-2">
            {message.pixelIcons.ruolo?.map((r) => {
              const url = getPixelIconUrlRuolo(r as PixelIconRuolo);
              return url ? (
                <Image
                  key={`ruolo-${r}`}
                  src={url}
                  alt={r}
                  width={PIXEL_ICON_SIZE}
                  height={PIXEL_ICON_SIZE}
                  className={PIXEL_ICON_DISPLAY_CLASS}
                />
              ) : null;
            })}
            {message.pixelIcons.ordine?.map((o) => {
              const url = getPixelIconUrlOrdine(o as PixelIconOrdine);
              return url ? (
                <img
                  key={`ordine-${o}`}
                  src={url}
                  alt={o}
                  width={PIXEL_ICON_SIZE}
                  height={PIXEL_ICON_SIZE}
                  className={PIXEL_ICON_DISPLAY_CLASS}
                />
              ) : null;
            })}
          </div>
        )}
        {message.locationTag && (
          <span className="bg-[var(--accent-violet)]/10 border border-[var(--accent-violet)]/30 text-[var(--accent-violet)] px-1.5 py-0.5 rounded text-[10px] font-sans uppercase">
            [{message.locationTag}]
          </span>
        )}
      </div>

      {diceRollOnly ? (
        <p
          className="m-0 leading-relaxed whitespace-pre-wrap break-words font-sans text-[13px] text-[#7d7f7d]"
          dangerouslySetInnerHTML={{ __html: diceBodyHtml ?? "" }}
        />
      ) : (
      <>
        <div className="flow-root">
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
          <p
            className="m-0 leading-relaxed whitespace-pre-wrap break-words font-sans text-[13px] text-[#7d7f7d] text-justify"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        </div>
        {constructPost && (
          <div className="mt-2">
            <ChatConstructResolutionPost data={constructPost} />
          </div>
        )}
      </>
      )}
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
