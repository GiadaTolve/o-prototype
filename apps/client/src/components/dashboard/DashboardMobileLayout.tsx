"use client";

import { useEffect, useState } from "react";
import { SmsPanel } from "./sms/SmsPanel";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { DashboardCenter } from "./DashboardCenter";
import { DashboardRightCol } from "./DashboardRightCol";
import { DashboardWindowPanel } from "./DashboardWindowPanel";
import { PixelIcons } from "./PixelIcons";
import { MiniSkiruStatsHud } from "./MiniSkiruStatsHud";
import { resolveCharacterComputed } from "./character-computed";
import type { WindowId, CharacterSummary, Presente } from "./types";
import { roomToPrefettura } from "@/config/map-config";

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
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MobileTab>("mappa");

  // SMS inline nel tab: se qualcosa apre la finestra SMS, vai al tab invece del modal
  useEffect(() => {
    if (openWindow === "sms") {
      setActiveTab("sms");
      onClose("sms");
    }
  }, [openWindow, onClose]);

  useEffect(() => {
    if (smsTargetCharacterId) {
      setActiveTab("sms");
    }
  }, [smsTargetCharacterId?.id]);

  const prefettura = roomToPrefettura(roomId ?? "");
  const avatarSrc = (char?.avatarUrl ?? char?.avatar ?? char?.miniAvatar) as string | undefined;
  const nome = (char?.name ?? "Nome PG") as string;
  const cognome = (char?.surname ?? "") as string;
  const skiruStats = resolveCharacterComputed(char?.computed);

  const tabButtons: { id: MobileTab; label: string; icon: typeof icons.user }[] = [
    { id: "scheda", label: "Scheda", icon: icons.user },
    { id: "sms", label: "SMS", icon: icons.message },
    { id: "mappa", label: "Mappa", icon: icons.map },
    { id: "fetch", label: "Assegnazioni", icon: icons.trophy },
    { id: "altro", label: "Altro", icon: icons.news },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden pb-16 md:pb-0">
      {/* Header compatto mobile */}
      <header className="shrink-0 border-b border-[var(--border-color)] bg-[var(--panel-bg)] px-3 py-2 flex items-center justify-between">
        <h1 className="font-display text-sm text-[var(--accent-gold)] truncate">Oyasumi</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="p-2 -m-2 text-gray-400 hover:text-[var(--accent-gold)]"
          aria-label="Logout"
        >
          <FontAwesomeIcon icon={icons.logout} className="w-4 h-4" />
        </button>
      </header>

      {/* Contenuto in base al tab */}
      <main className={`flex-1 min-h-0 ${activeTab === "sms" ? "overflow-hidden flex flex-col" : "overflow-auto"}`}>
        {activeTab === "scheda" && (
          <div className="p-4">
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
                  <p className="text-xs text-gray-500">
                    REM: {char?.rem ?? 0} · EXP: {char?.experienceSpendable ?? 0}
                  </p>
                  <MiniSkiruStatsHud stats={skiruStats} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => char?.id && openCharacterSheet(char.id)}
                  className="py-2 px-3 rounded border border-[var(--border-color)] text-xs text-[var(--accent-gold)] hover:bg-white/5"
                >
                  Scheda completa
                </button>
                <button
                  type="button"
                  onClick={() => onOpen("housing")}
                  className="py-2 px-3 rounded border border-[var(--border-color)] text-xs text-gray-300 hover:bg-white/5"
                >
                  Casa
                </button>
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
          <div className="h-full min-h-[60vh]">
            <DashboardCenter
              mapTrigger={mapTrigger}
              shinigamiTrigger={shinigamiTrigger}
              guidaTrigger={guidaTrigger}
              ambientazioneTrigger={ambientazioneTrigger}
              forumTrigger={forumTrigger}
              gestioneTrigger={gestioneTrigger}
              sviluppoTrigger={sviluppoTrigger}
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
          <div className="h-full">
            <DashboardRightCol
              presenti={presenti}
              prefettura={prefettura}
              onOpenPresenti={() => onOpen("presenti")}
              onOpenFetch={() => onOpen("fetch")}
              onOpenSpazioEventi={() => onOpen("spazioEventi")}
            />
            <div className="p-4">
              <button
                type="button"
                onClick={() => onOpen("fetch")}
                className="w-full py-3 rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] text-sm font-display"
              >
                Apri Assegnazioni
              </button>
            </div>
          </div>
        )}

        {activeTab === "altro" && (
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { id: "mercato" as WindowId, label: "Mercato", icon: icons.mercato },
              { id: "banca" as WindowId, label: "Banca", icon: icons.banca },
              { id: "waza" as WindowId, label: "Skiru & Waza", icon: icons.waza },
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
                className="py-4 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)] flex flex-col items-center gap-2 hover:border-[var(--accent-gold)]/50 relative"
              >
                <FontAwesomeIcon icon={icon} className="w-6 h-6 text-[var(--accent-gold)]" />
                <span className="text-xs text-gray-300">{label}</span>
                {id === "notifiche" && notificheUnread > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--accent-violet)] text-[10px] flex items-center justify-center text-white">
                    {notificheUnread > 9 ? "9+" : notificheUnread}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Bottom navigation - solo su mobile (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 border-t border-[var(--border-color)] bg-[var(--panel-bg)] flex items-center justify-around z-30">
        {tabButtons.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[56px] transition-colors ${
              activeTab === id ? "text-[var(--accent-gold)]" : "text-gray-500"
            }`}
          >
            {id === "sms" && smsUnread > 0 && (
              <span className="absolute top-0 right-1/4 w-4 h-4 rounded-full bg-[var(--accent-violet)] text-[9px] flex items-center justify-center text-white">
                {smsUnread > 9 ? "9+" : smsUnread}
              </span>
            )}
            <FontAwesomeIcon icon={icon} className="w-5 h-5" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </nav>

      {/* Finestre modali full-screen su mobile */}
      {openWindow && openWindow !== "sms" && (
        <div className="fixed inset-0 z-40 bg-[var(--background)]">
          <DashboardWindowPanel
            windowId={openWindow}
            onLower={(id) => onClose(id)}
            onClose={(id) => onClose(id)}
            char={
              openWindow === "scheda" ||
              openWindow === "mercato" ||
              openWindow === "banca" ||
              openWindow === "waza"
                ? char
                : undefined
            }
            presenti={openWindow === "presenti" ? presenti : undefined}
            profileCharacterId={openWindow === "scheda" ? profileCharacterId ?? undefined : undefined}
            smsTargetCharacterId={openWindow === "sms" ? smsTargetCharacterId : undefined}
            onCharUpdate={onCharUpdate}
            onUnreadChange={openWindow === "sms" ? fetchSmsUnread : undefined}
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
