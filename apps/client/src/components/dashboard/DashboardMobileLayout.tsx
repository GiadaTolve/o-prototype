"use client";

import { useCallback, useEffect, useState } from "react";
import { logoutPresence } from "@/lib/presence-logout";
import { SmsPanel } from "./sms/SmsPanel";
import { FetchPanel } from "./fetch/FetchPanel";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { DashboardCenter } from "./DashboardCenter";
import { DashboardWindowPanel } from "./DashboardWindowPanel";
import { PixelIcons } from "./PixelIcons";
import { DashboardBrand } from "./DashboardBrand";
import { MiniSkiruStatsHud } from "./MiniSkiruStatsHud";
import { resolveCharacterComputed } from "./character-computed";
import { api } from "@/lib/api";
import type { WindowId, CharacterSummary, Presente } from "./types";

export type MobileTab = "scheda" | "sms" | "mappa" | "fetch" | "altro";

type Props = {
  char: CharacterSummary;
  presenti: Presente[];
  presentiAreMock?: boolean;
  roomId: string | null;
  mapTrigger: number;
  shinigamiTrigger: number;
  guidaTrigger: number;
  ambientazioneTrigger: number;
  forumTrigger: number;
  gestioneTrigger: number;
  sviluppoTrigger: number;
  dojoTrigger: number;
  sokaijuTrigger: number;
  sokaijuTab?: string;
  messages: Array<{ id: string; zone: string; characterId: string; name: string; surname?: string | null; content: string; createdAt: string }>;
  sendMessage: (text: string, locationTag?: string | null) => void;
  chatConnected: boolean;
  chatConnectionFailed?: boolean;
  usersInRoom: Presente[];
  openWindow: WindowId | null;
  smsUnread: number;
  notificheUnread: number;
  profileCharacterId: string | null;
  smsTargetCharacterId: { id: string; name: string } | null;
  onRoomChange: (roomId: string | null) => void;
  onOpen: (id: WindowId) => void;
  onClose: (id: WindowId) => void;
  openCharacterSheet: (id: string) => void;
  fetchSmsUnread: () => void;
  fetchNotificationsUnread: () => void;
  onCharUpdate?: () => Promise<void>;
  onOpenGestione: () => void;
  onOpenSviluppo: () => void;
  onOpenDojo: () => void;
  onOpenSokaiju: (tab?: string) => void;
};

export function DashboardMobileLayout({
  char,
  presenti,
  roomId,
  mapTrigger,
  shinigamiTrigger,
  guidaTrigger,
  ambientazioneTrigger,
  forumTrigger,
  gestioneTrigger,
  sviluppoTrigger,
  dojoTrigger,
  sokaijuTrigger,
  sokaijuTab,
  messages,
  sendMessage,
  chatConnected,
  chatConnectionFailed,
  usersInRoom,
  openWindow,
  smsUnread,
  notificheUnread,
  profileCharacterId,
  smsTargetCharacterId,
  onRoomChange,
  onOpen,
  onClose,
  openCharacterSheet,
  fetchSmsUnread,
  fetchNotificationsUnread,
  onCharUpdate,
  onOpenGestione,
  onOpenSviluppo,
  onOpenDojo,
  onOpenSokaiju,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MobileTab>("mappa");
  const [mapImmersive, setMapImmersive] = useState(false);
  const [housingChatRoomId, setHousingChatRoomId] = useState<string | null>(null);
  const [fetchIncoming, setFetchIncoming] = useState(0);

  const loadFetchIncoming = useCallback(async () => {
    try {
      const [list, my] = await Promise.all([
        api.get("/fetches").then((d) => (Array.isArray(d) ? d : []) as Array<{ id: string; assignedTo: string | null }>),
        api.get("/fetches/my").then((d) => d as { id?: string; assigned?: boolean }),
      ]);
      const myId = my && "id" in my && my.id ? my.id : null;
      const count = list.filter((f) => !f.assignedTo && f.id !== myId).length;
      setFetchIncoming(count);
    } catch {
      setFetchIncoming(0);
    }
  }, []);

  useEffect(() => {
    api
      .get("/housing/me")
      .then((d) => setHousingChatRoomId((d as { chatRoomId?: string | null })?.chatRoomId ?? null))
      .catch(() => setHousingChatRoomId(null));
  }, [char?.id]);

  useEffect(() => {
    loadFetchIncoming();
    const interval = setInterval(loadFetchIncoming, 30_000);
    return () => clearInterval(interval);
  }, [loadFetchIncoming]);

  useEffect(() => {
    const onHousingChat = () => setActiveTab("mappa");
    window.addEventListener("openHousingChat", onHousingChat);
    return () => window.removeEventListener("openHousingChat", onHousingChat);
  }, []);

  // SMS inline nel tab: se qualcosa apre la finestra SMS, vai al tab invece del modal
  useEffect(() => {
    if (openWindow === "sms") {
      setActiveTab("sms");
      onClose("sms");
    }
    if (openWindow === "fetch") {
      setActiveTab("fetch");
      onClose("fetch");
    }
  }, [openWindow, onClose]);

  useEffect(() => {
    if (smsTargetCharacterId) {
      setActiveTab("sms");
    }
  }, [smsTargetCharacterId?.id]);

  useEffect(() => {
    if (activeTab !== "mappa") {
      setMapImmersive(false);
    }
  }, [activeTab]);

  const avatarSrc = (char?.miniAvatar ?? char?.avatarUrl ?? char?.avatar) as string | undefined;
  const nome = (char?.name ?? "Nome PG") as string;
  const cognome = (char?.surname ?? "") as string;
  const skiruStats = resolveCharacterComputed(char?.computed);

  const tabButtons: { id: MobileTab; label: string; icon: typeof icons.user }[] = [
    { id: "scheda", label: "Scheda", icon: icons.user },
    { id: "sms", label: "SMS", icon: icons.message },
    { id: "mappa", label: "Mappa", icon: icons.map },
    { id: "fetch", label: "Beeper", icon: icons.beeper },
    { id: "altro", label: "Altro", icon: icons.news },
  ];

  const handleEntraInCasa = () => {
    if (!housingChatRoomId) return;
    setActiveTab("mappa");
    window.dispatchEvent(new CustomEvent("openHousingChat", { detail: { roomId: housingChatRoomId } }));
  };

  const handleLogout = async () => {
    await logoutPresence();
    localStorage.removeItem("token");
    router.push("/auth");
  };

  const handleOpenGestione = () => {
    setActiveTab("mappa");
    onOpenGestione();
  };

  const handleOpenSviluppo = () => {
    setActiveTab("mappa");
    onOpenSviluppo();
  };

  const handleOpenDojo = () => {
    setActiveTab("mappa");
    onOpenDojo();
  };

  const handleOpenSokaiju = () => {
    setActiveTab("mappa");
    onOpenSokaiju();
  };

  return (
    <div className="mobile-app-shell md:h-screen md:max-h-none">
      {/* Header globale nascosto in chat immersiva (più spazio, meno scroll) */}
      {!mapImmersive && (
      <header className="mobile-top-bar shrink-0 border-b border-[var(--border-color)] bg-[var(--panel-bg)] px-3 py-2 flex items-center justify-between mobile-safe-top gap-2">
        <DashboardBrand compact />
        <button
          type="button"
          onClick={handleLogout}
          className="p-2 -m-2 text-[var(--accent-violet-light)]/80 hover:text-[var(--accent-gold)]"
          aria-label="Logout"
        >
          <FontAwesomeIcon icon={icons.logout} className="w-4 h-4" />
        </button>
      </header>
      )}

      {/* Contenuto in base al tab — un solo scroll interno per tab */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {activeTab === "scheda" && (
          <div className="mobile-scroll-pane p-4">
            <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => char?.id && openCharacterSheet(char.id)}
              >
                <div className="w-14 h-14 rounded-full bg-black/40 border border-[var(--border-color)] shrink-0 overflow-hidden flex items-center justify-center">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={nome} className="w-full h-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={icons.user} className="w-6 h-6 text-[var(--accent-gold)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base text-white flex items-center gap-1.5">
                    {nome} {cognome}
                    <PixelIcons pixelIcons={char?.pixelIcons} />
                  </p>
                  <p className="text-xs text-[var(--accent-violet-light)]/75">
                    REM: {char?.rem ?? 0} · EXP: {char?.experienceSpendable ?? 0}
                  </p>
                  <MiniSkiruStatsHud stats={skiruStats} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => char?.id && openCharacterSheet(char.id)}
                  className="py-2 px-3 rounded border border-[var(--border-color)] text-xs text-[var(--accent-gold)] hover:bg-[color-mix(in_srgb,var(--panel-bg)_80%,black)]"
                >
                  Scheda completa
                </button>
                {housingChatRoomId ? (
                  <button
                    type="button"
                    onClick={handleEntraInCasa}
                    className="py-2 px-3 rounded border border-[var(--accent-gold)]/60 text-xs text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 flex items-center justify-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={icons.home} className="w-3.5 h-3.5" />
                    Entra in Casa
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpen("housing")}
                    className="py-2 px-3 rounded border border-[var(--border-color)] text-xs text-[var(--accent-violet-light)] hover:bg-[color-mix(in_srgb,var(--panel-bg)_80%,black)]"
                  >
                    Housing
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "sms" && (
          <div className="flex-1 min-h-0 flex flex-col bg-[var(--panel-bg)]">
            <SmsPanel
              variant="stack"
              onUnreadChange={fetchSmsUnread}
              initialTargetCharacterId={smsTargetCharacterId ?? undefined}
            />
          </div>
        )}

        {activeTab === "mappa" && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <DashboardCenter
              variant="mobile"
              onImmersiveChange={setMapImmersive}
              mapTrigger={mapTrigger}
              shinigamiTrigger={shinigamiTrigger}
              guidaTrigger={guidaTrigger}
              ambientazioneTrigger={ambientazioneTrigger}
              forumTrigger={forumTrigger}
              gestioneTrigger={gestioneTrigger}
              sviluppoTrigger={sviluppoTrigger}
              dojoTrigger={dojoTrigger}
              sokaijuTrigger={sokaijuTrigger}
              sokaijuTab={sokaijuTab}
              onRoomChange={onRoomChange}
              messages={messages}
              sendMessage={sendMessage}
              chatConnected={chatConnected}
              chatConnectionFailed={chatConnectionFailed}
              usersInRoom={usersInRoom}
              canAccessShinigami={char?.canAccessShinigami}
              canAccessGestione={char?.canAccessGestione}
              canAccessSviluppo={char?.canAccessSviluppo}
              char={char}
            />
          </div>
        )}

        {activeTab === "fetch" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <FetchPanel variant="mobile" onListChange={loadFetchIncoming} />
          </div>
        )}

        {activeTab === "altro" && (
          <div className="mobile-scroll-pane p-4 flex flex-col gap-4">
          {(char?.canAccessGestione || char?.canAccessSviluppo) && (
            <div className="grid grid-cols-2 gap-3">
              {char?.canAccessGestione && (
                <button
                  type="button"
                  onClick={handleOpenGestione}
                  className="py-4 px-3 rounded-lg border border-[var(--accent-gold)]/45 bg-[var(--panel-bg)] flex flex-col items-center gap-2 hover:border-[var(--accent-gold)]/80 hover:bg-[color-mix(in_srgb,var(--panel-bg)_85%,black)] transition-colors"
                >
                  <FontAwesomeIcon icon={icons.gear} className="w-6 h-6 text-[var(--accent-gold)]" />
                  <span className="text-xs text-[var(--accent-violet-light)]">Gestionale</span>
                </button>
              )}
              {char?.canAccessSviluppo && (
                <button
                  type="button"
                  onClick={handleOpenSviluppo}
                  className="py-4 px-3 rounded-lg border border-[var(--accent-violet)]/45 bg-[var(--panel-bg)] flex flex-col items-center gap-2 hover:border-[var(--accent-violet)]/80 hover:bg-[color-mix(in_srgb,var(--panel-bg)_85%,black)] transition-colors"
                >
                  <FontAwesomeIcon icon={icons.pencil} className="w-6 h-6 text-[var(--accent-violet-light)]" />
                  <span className="text-xs text-[var(--accent-violet-light)]">Sviluppo</span>
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleOpenSokaiju}
              className="py-4 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)] flex flex-col items-center gap-2 hover:border-[var(--accent-gold)]/50 hover:bg-[color-mix(in_srgb,var(--panel-bg)_85%,black)] transition-colors"
            >
              <FontAwesomeIcon icon={icons.sokaiju} className="w-6 h-6 text-[var(--accent-gold)]" />
              <span className="text-xs text-[var(--accent-violet-light)]">Sōkaiju</span>
            </button>
            <button
              type="button"
              onClick={handleOpenDojo}
              className="py-4 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)] flex flex-col items-center gap-2 hover:border-[var(--accent-gold)]/50 hover:bg-[color-mix(in_srgb,var(--panel-bg)_85%,black)] transition-colors"
            >
              <FontAwesomeIcon icon={icons.waza} className="w-6 h-6 text-[var(--accent-gold)]" />
              <span className="text-xs text-[var(--accent-violet-light)] uppercase tracking-wide">Dōjō</span>
            </button>
            {[
              { id: "mercato" as WindowId, label: "Mercato", icon: icons.mercato },
              { id: "banca" as WindowId, label: "Banca", icon: icons.banca },
              { id: "ordine" as WindowId, label: "Ordine", icon: icons.ordine },
              { id: "bestiario" as WindowId, label: "Bestiario", icon: icons.trophy },
              { id: "presenti" as WindowId, label: "Presenti", icon: icons.presenti },
              { id: "spazioEventi" as WindowId, label: "Spazio Eventi", icon: icons.gamepad },
              { id: "notifiche" as WindowId, label: "Notifiche", icon: icons.bell },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onOpen(id)}
                className="py-4 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)] flex flex-col items-center gap-2 hover:border-[var(--accent-gold)]/50 hover:bg-[color-mix(in_srgb,var(--panel-bg)_85%,black)] relative transition-colors"
              >
                <FontAwesomeIcon icon={icon} className="w-6 h-6 text-[var(--accent-gold)]" />
                <span className="text-xs text-[var(--accent-violet-light)]">{label}</span>
                {id === "notifiche" && notificheUnread > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full px-1 bg-[var(--accent-violet)] text-[10px] flex items-center justify-center text-white">
                    {notificheUnread > 9 ? "9+" : notificheUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 rounded-lg border border-[var(--border-color)] text-sm text-[var(--accent-violet-light)]/80 hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)]/50 flex items-center justify-center gap-2 shrink-0"
          >
            <FontAwesomeIcon icon={icons.logout} className="w-4 h-4" />
            Esci
          </button>
          </div>
        )}
      </main>

      {/* Bottom navigation nel flusso (no fixed — evita doppio scroll in PWA) */}
      {!mapImmersive && (
      <nav className="mobile-bottom-nav md:hidden">
        {tabButtons.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[56px] rounded-md transition-colors ${
              activeTab === id
                ? "text-[var(--accent-gold)] bg-[color-mix(in_srgb,var(--panel-bg)_75%,black)] border border-[color-mix(in_srgb,var(--accent-gold)_35%,var(--border-color))]"
                : "text-[var(--accent-violet-light)]/70"
            }`}
          >
            {id === "sms" && smsUnread > 0 && (
              <span className="absolute top-0 right-1/4 min-w-[17px] h-[17px] rounded-full px-1 bg-[var(--accent-violet)] text-[9px] flex items-center justify-center text-white">
                {smsUnread > 9 ? "9+" : smsUnread}
              </span>
            )}
            {id === "fetch" && fetchIncoming > 0 && (
              <span className="absolute top-0 right-1/4 min-w-[17px] h-[17px] rounded-full px-1 bg-[var(--accent-gold)] text-[9px] flex items-center justify-center text-[var(--background)] font-bold">
                {fetchIncoming > 9 ? "9+" : fetchIncoming}
              </span>
            )}
            <FontAwesomeIcon icon={icon} className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </nav>
      )}

      {/* Finestre modali full-screen su mobile */}
      {openWindow && openWindow !== "sms" && openWindow !== "fetch" && (
        <div className="fixed inset-0 z-40 bg-[var(--background)] mobile-app-shell">
          <DashboardWindowPanel
            windowId={openWindow}
            onLower={(id) => onClose(id)}
            onClose={(id) => onClose(id)}
            char={
              openWindow === "scheda" ||
              openWindow === "mercato" ||
              openWindow === "banca"
                ? char
                : undefined
            }
            presenti={openWindow === "presenti" ? presenti : undefined}
            profileCharacterId={openWindow === "scheda" ? profileCharacterId ?? undefined : undefined}
            smsTargetCharacterId={undefined}
            onCharUpdate={onCharUpdate}
            onUnreadChange={undefined}
            onNotificationsUnreadChange={fetchNotificationsUnread}
            canAccessGestione={char?.canAccessGestione}
          />
          <button
            type="button"
            onClick={() => onClose(openWindow)}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white z-50"
            aria-label="Chiudi"
          >
            <FontAwesomeIcon icon={icons.close} className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
