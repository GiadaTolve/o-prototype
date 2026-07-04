"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLeftCol } from "@/components/dashboard/DashboardLeftCol";
import { DashboardCenter } from "@/components/dashboard/DashboardCenter";
import { DashboardRightCol } from "@/components/dashboard/DashboardRightCol";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { DashboardWindowPanel } from "@/components/dashboard/DashboardWindowPanel";
import { DashboardMobileLayout } from "@/components/dashboard/DashboardMobileLayout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { WindowId, CharacterSummary, Presente } from "@/components/dashboard/types";
import { getMockPresenti } from "@/components/dashboard/types";
import { roomToPrefettura, getChatLocationByRoomId, GAME_MAPS } from "@/config/map-config";
import { useRealtime } from "@/hooks/useRealtime";
import { useSmsRealtime } from "@/hooks/useSmsRealtime";
import { api } from "@/lib/api";
import { isCharacterMeFound, characterMeToSummary } from "@/lib/character-me";
import { toast } from "@/components/ui/Toast";
import { LevelUpOverlay } from "@/components/dashboard/LevelUpOverlay";
import type { LevelUpWsPayload } from "@/hooks/useRealtime";

export default function DashboardPage() {
  const router = useRouter();
  const [char, setChar] = useState<CharacterSummary>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openWindow, setOpenWindow] = useState<WindowId | null>(null);
  const [loweredWindows, setLoweredWindows] = useState<WindowId[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mapTrigger, setMapTrigger] = useState(0);
  const [shinigamiTrigger, setShinigamiTrigger] = useState(0);
  const [guidaTrigger, setGuidaTrigger] = useState(0);
  const [ambientazioneTrigger, setAmbientazioneTrigger] = useState(0);
  const [forumTrigger, setForumTrigger] = useState(0);
  const [gestioneTrigger, setGestioneTrigger] = useState(0);
  const [sviluppoTrigger, setSviluppoTrigger] = useState(0);
  const [smsUnread, setSmsUnread] = useState(0);
  const [smsNotificationVisible, setSmsNotificationVisible] = useState(false);
  const [notificheUnread, setNotificheUnread] = useState(0);
  const [profileCharacterId, setProfileCharacterId] = useState<string | null>(null);
  /** Target per apertura diretta SMS da Presenti: { id, name }. Usato solo all'apertura. */
  const [smsTargetCharacterId, setSmsTargetCharacterId] = useState<{ id: string; name: string } | null>(null);
  const [levelUpDismissed, setLevelUpDismissed] = useState(false);

  const isMobile = useIsMobile();

  const reloadChar = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const data = await api.get("/characters/me");
      if (isCharacterMeFound(data)) setChar(characterMeToSummary(data));
    } catch (e) {
      console.error("Errore ricarica personaggio:", e);
    }
  }, []);

  const fetchSmsUnread = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const d = (await api.get("/sms/unread-count")) as { count?: number };
      const count = typeof d.count === "number" ? d.count : 0;
      setSmsUnread(count);
      console.debug("[SMS] Unread count updated:", count);
    } catch (e) {
      console.error("[SMS] Error fetching unread count:", e);
    }
  }, []);

  const fetchNotificationsUnread = useCallback(async () => {
    try {
      const d = (await api.get("/notifications/unread-count")) as { count?: number };
      setNotificheUnread(typeof d.count === "number" ? d.count : 0);
    } catch {
      /* ignore */
    }
  }, []);

  // Carica i badge all'avvio
  useEffect(() => {
    fetchSmsUnread();
    fetchNotificationsUnread();
  }, [fetchSmsUnread, fetchNotificationsUnread]);

  // Aggiorna i badge quando char viene caricato
  useEffect(() => {
    if (char?.id) {
      fetchSmsUnread();
      fetchNotificationsUnread();
    }
  }, [char?.id, fetchSmsUnread, fetchNotificationsUnread]);

  useEffect(() => {
    const onHp = (e: Event) => {
      const d = (e as CustomEvent<{ characterId: string; hpCurrent: number; hpMax: number }>).detail;
      if (!d?.characterId || d.characterId !== char?.id) return;
      setChar((prev) =>
        prev
          ? {
              ...prev,
              computed: {
                ...(prev.computed ?? {}),
                hpMax: d.hpMax,
                hpCurrent: d.hpCurrent,
                body: d.hpMax,
              },
            }
          : prev,
      );
    };
    window.addEventListener("characterHpUpdated", onHp);
    return () => window.removeEventListener("characterHpUpdated", onHp);
  }, [char?.id]);

  useEffect(() => {
    const onCs = (e: Event) => {
      const d = (e as CustomEvent<{
        characterId: string;
        csCurrent: number;
        csCapacity: number;
        accumulating: boolean;
      }>).detail;
      if (!d?.characterId || d.characterId !== char?.id) return;
      setChar((prev) =>
        prev
          ? {
              ...prev,
              computed: {
                ...(prev.computed ?? {}),
                csCurrent: d.csCurrent,
                csCapacity: d.csCapacity,
                csAccumulating: d.accumulating,
              },
            }
          : prev,
      );
    };
    window.addEventListener("characterChronoUpdated", onCs);
    return () => window.removeEventListener("characterChronoUpdated", onCs);
  }, [char?.id]);

  // WebSocket per SMS real-time (sempre attivo per notifiche sonore e badge)
  // Passa myCharacterId se disponibile, altrimenti sarà ottenuto dal welcome message o da /characters/me
  useSmsRealtime({
    onUnreadUpdate: fetchSmsUnread,
    myCharacterId: char?.id ?? null,
    onNewMessage: (msg) => {
      console.debug("[SMS] New message received in DashboardPage", msg);
      fetchSmsUnread();
      // Mostra "*drin drin!*" solo se il messaggio è per noi (ricevuto, non inviato)
      if (char?.id && msg.recipientId === char.id && msg.senderId !== char.id) {
        setSmsNotificationVisible(true);
        setTimeout(() => setSmsNotificationVisible(false), 4000);
      }
    },
    onFetchResponso: (p) => {
      const msg = p.comment
        ? `Responso per "${p.fetchTitle}": ${p.comment}`
        : `Il Master ha completato il responso per "${p.fetchTitle}". Consulta la Scheda → Registrazioni.`;
      toast.success(msg, 8000);
      fetchNotificationsUnread();
      setOpenWindow((prev) => (prev === "fetch" ? prev : "notifiche"));
      setLoweredWindows((l) => l.filter((w) => w !== "fetch" && w !== "notifiche"));
    },
  });

  const open = useCallback((id: WindowId) => {
    setOpenWindow(id);
    setLoweredWindows((prev) => prev.filter((w) => w !== id));
  }, []);

  /** Unico punto di ingresso: apri scheda personaggio (propria o altrui). */
  const openCharacterSheet = useCallback(
    (characterId: string) => {
      setProfileCharacterId(characterId);
      open("scheda");
    },
    [open],
  );

  const lower = useCallback((id: WindowId) => {
    setOpenWindow((prev) => (prev === id ? null : prev));
    setLoweredWindows((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const raiseFromDock = useCallback((id: WindowId) => {
    setLoweredWindows((prev) => prev.filter((w) => w !== id));
    setOpenWindow(id);
  }, []);

  const close = useCallback((id: WindowId) => {
    setOpenWindow((prev) => (prev === id ? null : prev));
    setLoweredWindows((prev) => prev.filter((w) => w !== id));
    if (id === "sms") setSmsTargetCharacterId(null);
    if (id === "scheda") setProfileCharacterId(null);
  }, []);

  const handleLevelUpFromWs = useCallback((payload: LevelUpWsPayload) => {
    const gained = payload.pendingLevelUp.expGained;
    setChar((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pendingLevelUp: payload.pendingLevelUp,
        keys: payload.newKeys ?? prev.keys,
        experienceTotal: payload.newExpTotal ?? (prev.experienceTotal ?? 0) + gained,
        experienceSpendable: (prev.experienceSpendable ?? 0) + gained,
      };
    });
    setLevelUpDismissed(false);
  }, []);

  const handleLevelUpSkiru = useCallback(async () => {
    try {
      await api.patch("/characters/me/level-up-banner", { action: "ack" });
      setChar((prev) => (prev ? { ...prev, pendingLevelUp: null } : prev));
      setLevelUpDismissed(true);
      open("waza");
      await reloadChar();
    } catch (e) {
      console.error("Errore acknowledge level-up:", e);
      toast.error("Impossibile confermare il level-up.");
    }
  }, [open, reloadChar]);

  const handleLevelUpSalta = useCallback(async () => {
    try {
      await api.patch("/characters/me/level-up-banner", { action: "dismiss" });
    } catch {
      /* ignore */
    }
    setLevelUpDismissed(true);
  }, []);

  useEffect(() => {
    if (char?.pendingLevelUp) setLevelUpDismissed(false);
  }, [char?.pendingLevelUp]);

  const showLevelUpOverlay = Boolean(char?.pendingLevelUp) && !levelUpDismissed;

  const { users: usersInRoom, messages, sendMessage, connected: chatConnected, connectionFailed } = useRealtime(
    roomId,
    { onLevelUp: handleLevelUpFromWs },
  );
  const [presenti, setPresenti] = useState<Presente[]>([]);
  /** true se la lista viene da fallback locale (API assente / token / errore). */
  const [presentiAreMock, setPresentiAreMock] = useState(false);
  const prefettura = useMemo(() => roomToPrefettura(roomId ?? ""), [roomId]);

  // Carica lista presenti (tutti gli utenti online) periodicamente
  useEffect(() => {
    const getZoneLabel = (roomId: string | null): string | undefined => {
      if (!roomId) return undefined;
      const location = getChatLocationByRoomId(roomId);
      if (location) {
        // Cerca la zona nella configurazione
        const ogon = GAME_MAPS.ogon;
        for (const zone of ogon.zones) {
          for (const loc of zone.locations) {
            if ("roomId" in loc && loc.roomId === roomId) {
              return `${zone.label} · ${loc.label}`;
            } else if ("children" in loc && Array.isArray(loc.children)) {
              const found = loc.children.find((c) => c && "roomId" in c && c.roomId === roomId);
              if (found && "label" in found) {
                return `${zone.label} · ${loc.label} · ${found.label}`;
              }
            }
          }
        }
      }
      // Se è una housing chat
      if (roomId.startsWith("housing_")) {
        return "Casa";
      }
      return undefined;
    };

    const loadPresenti = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          const mockPresenti = getMockPresenti(typeof char?.name === "string" ? char.name : undefined);
          setPresenti(mockPresenti);
          setPresentiAreMock(true);
          return;
        }

        const data = (await api.get("/presence/all")) as Array<{
          id: string;
          name: string;
          room: string | null;
          isShadow?: boolean;
          level?: number;
          paragon?: number;
        }>;
        if (!Array.isArray(data)) {
          console.warn("[Presenti] Risposta non è un array:", data);
          const mockPresenti = getMockPresenti(typeof char?.name === "string" ? char.name : undefined);
          setPresenti(mockPresenti);
          setPresentiAreMock(true);
          return;
        }

        const myId = char?.id;
        const presentiList: Presente[] = data.map((u) => ({
          id: u.id,
          name: u.name,
          zone: getZoneLabel(u.room),
          room: u.room ?? undefined,
          isMe: myId !== undefined && u.id === myId,
          isShadow: u.isShadow ?? false,
          level: u.level,
          paragon: u.paragon ?? 0,
        }));
        setPresenti(presentiList);
        setPresentiAreMock(false);
      } catch (e) {
        if (e instanceof Error && e.message.includes("non raggiungibile")) {
          console.warn("[Presenti] Server non raggiungibile, uso mock");
        } else {
          console.error("[Presenti] Errore caricamento:", e);
        }
        const mockPresenti = getMockPresenti(typeof char?.name === "string" ? char.name : undefined);
        setPresenti(mockPresenti);
        setPresentiAreMock(true);
      }
    };

    loadPresenti();
    // Aggiorna ogni 5 secondi
    const interval = setInterval(loadPresenti, 5000);
    return () => clearInterval(interval);
  }, [char?.id, char?.name]);

  // Ascolta evento globale: clic su nome in Presenti → apri SMS con target; altrimenti apri scheda personaggio
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ characterId?: string; openSms?: boolean; name?: string }>;
      const id = custom.detail?.characterId;
      if (!id) return;
      if (custom.detail?.openSms) {
        setSmsTargetCharacterId({ id, name: custom.detail.name ?? "Utente" });
        open("sms");
      } else {
        openCharacterSheet(id);
      }
    };
    window.addEventListener("openProfileWindow", handler as EventListener);
    return () => {
      window.removeEventListener("openProfileWindow", handler as EventListener);
    };
  }, [openCharacterSheet, open]);

  // Ascolta eventi per aprire finestra housing dalla scheda
  useEffect(() => {
    const handleOpenHousingWindow = () => {
      open("housing");
    };
    window.addEventListener('openHousingWindow', handleOpenHousingWindow);
    return () => {
      window.removeEventListener('openHousingWindow', handleOpenHousingWindow);
    };
  }, []);

  // Chiudi Scheda automaticamente quando si apre la chat di casa (Entra in Casa)
  useEffect(() => {
    const handleOpenHousingChat = () => {
      close("scheda");
    };
    window.addEventListener('openHousingChat', handleOpenHousingChat as EventListener);
    return () => {
      window.removeEventListener('openHousingChat', handleOpenHousingChat as EventListener);
    };
  }, [close]);

  // Chiudi finestra su evento closeWindow (es. Entra nel Circus → chiudi Spazio Eventi)
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ windowId?: string }>;
      const id = ev.detail?.windowId;
      if (id) close(id as WindowId);
    };
    window.addEventListener("closeWindow", handler as EventListener);
    return () => window.removeEventListener("closeWindow", handler as EventListener);
  }, [close]);

  // Ascolta postMessage da iframe (es. gestione) per aprire profilo personaggio
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "openCharacterProfile" && event.data?.characterId) {
        openCharacterSheet(event.data.characterId);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [openCharacterSheet]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Sessione non trovata. Effettua l'accesso.");
      setLoading(false);
      return;
    }
    api.get("/characters/me")
      .then((data) => {
        if (isCharacterMeFound(data)) {
          const charData = characterMeToSummary(data);
          setChar(charData);
          if (charData.id) {
            fetchSmsUnread();
          }
          return;
        }
        setError("Personaggio non trovato. Contatta lo staff.");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="mobile-app-shell md:h-screen md:max-h-none">
        {/* Header Skeleton */}
        <div className="border-b border-[var(--border-color)] bg-[var(--panel-bg)]/80 p-4">
          <div className="flex items-center justify-between max-w-[1800px] mx-auto">
            <Skeleton variant="rounded" height={32} width={200} />
            <div className="flex gap-4">
              <Skeleton variant="rounded" height={24} width={80} />
              <Skeleton variant="rounded" height={24} width={80} />
              <Skeleton variant="rounded" height={24} width={80} />
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-[1800px] w-full mx-auto">
          {/* Left Col Skeleton */}
          <div className="w-full lg:w-[360px] space-y-4">
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={200} />
            <Skeleton variant="rounded" height={150} />
          </div>
          {/* Center Skeleton */}
          <div className="flex-1">
            <Skeleton variant="rounded" height={400} />
          </div>
          {/* Right Col Skeleton */}
          <div className="w-full lg:w-[340px] space-y-4">
            <Skeleton variant="rounded" height={150} />
            <Skeleton variant="rounded" height={200} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const logout = () => {
      localStorage.removeItem("token");
      router.push("/auth");
    };
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-red-400 mb-4">{error}</p>
        <div className="flex gap-4">
          <Button onClick={logout}>Esci</Button>
          <Link href="/auth">
            <Button variant="secondary">Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
      <DashboardMobileLayout
        char={char}
        presenti={presenti}
        presentiAreMock={presentiAreMock}
        roomId={roomId}
        mapTrigger={mapTrigger}
        shinigamiTrigger={shinigamiTrigger}
        guidaTrigger={guidaTrigger}
        ambientazioneTrigger={ambientazioneTrigger}
        forumTrigger={forumTrigger}
        gestioneTrigger={gestioneTrigger}
        sviluppoTrigger={sviluppoTrigger}
        messages={messages}
        sendMessage={sendMessage}
        chatConnected={chatConnected}
        chatConnectionFailed={connectionFailed}
        usersInRoom={roomId ? usersInRoom : []}
        openWindow={openWindow}
        smsUnread={smsUnread}
        notificheUnread={notificheUnread}
        profileCharacterId={profileCharacterId}
        smsTargetCharacterId={smsTargetCharacterId}
        onRoomChange={setRoomId}
        onOpen={open}
        onClose={close}
        openCharacterSheet={openCharacterSheet}
        fetchSmsUnread={fetchSmsUnread}
        fetchNotificationsUnread={fetchNotificationsUnread}
        onCharUpdate={reloadChar}
      />
      {char?.pendingLevelUp && (
        <LevelUpOverlay
          pending={char.pendingLevelUp}
          visible={showLevelUpOverlay}
          onSkiru={handleLevelUpSkiru}
          onSalta={handleLevelUpSalta}
        />
      )}
      </>
    );
  }

  return (
    <div className="h-screen md:h-screen flex flex-col overflow-hidden">
      <DashboardHeader
          onGoToMap={() => setMapTrigger((t) => t + 1)}
          onOpenShinigami={() => setShinigamiTrigger((t) => t + 1)}
          onOpenGuida={() => setGuidaTrigger((t) => t + 1)}
          onOpenAmbientazione={() => setAmbientazioneTrigger((t) => t + 1)}
          onOpenForum={() => setForumTrigger((t) => t + 1)}
          onOpenGestione={() => setGestioneTrigger((t) => t + 1)}
          onOpenSviluppo={() => setSviluppoTrigger((t) => t + 1)}
          canAccessGestione={char?.canAccessGestione}
          canAccessSviluppo={char?.canAccessSviluppo}
          canAccessShinigami={char?.canAccessShinigami}
          smsNotification={smsNotificationVisible}
        />
      <div className="dashboard-main-row flex-1 flex flex-col lg:flex-row lg:items-stretch gap-4 p-4 max-w-[1800px] w-full mx-auto min-h-0 overflow-y-auto lg:overflow-hidden overscroll-y-contain">
        <DashboardLeftCol
          char={char}
          onOpenScheda={() => char?.id && openCharacterSheet(char.id)}
          onOpenMercato={() => open("mercato")}
          onOpenSms={() => open("sms")}
          onOpenBanca={() => open("banca")}
          onOpenWaza={() => open("waza")}
          onOpenOrdine={() => open("ordine")}
          onOpenBestiario={() => open("bestiario")}
          smsUnread={smsUnread}
        />
        <DashboardCenter
          mapTrigger={mapTrigger}
          shinigamiTrigger={shinigamiTrigger}
          guidaTrigger={guidaTrigger}
          ambientazioneTrigger={ambientazioneTrigger}
          forumTrigger={forumTrigger}
          gestioneTrigger={gestioneTrigger}
          sviluppoTrigger={sviluppoTrigger}
          onRoomChange={setRoomId}
          messages={messages}
          sendMessage={sendMessage}
          chatConnected={chatConnected}
          chatConnectionFailed={connectionFailed}
          usersInRoom={roomId ? usersInRoom : []}
          canAccessShinigami={char?.canAccessShinigami}
          canAccessGestione={char?.canAccessGestione}
          canAccessSviluppo={char?.canAccessSviluppo}
          char={char}
        />
        <DashboardRightCol
          presenti={presenti}
          presentiAreMock={presentiAreMock}
          prefettura={prefettura}
          onOpenPresenti={() => open("presenti")}
          onOpenFetch={() => open("fetch")}
          onOpenSpazioEventi={() => open("spazioEventi")}
          onOpenCharacterSheet={openCharacterSheet}
          onOpenSmsWith={(target) => {
            setSmsTargetCharacterId(target);
            open("sms");
          }}
        />
      </div>
      <DashboardFooter loweredWindows={loweredWindows} onRaiseFromDock={raiseFromDock} />
      {openWindow && (
        <DashboardWindowPanel
          windowId={openWindow}
          onLower={lower}
          onClose={close}
          char={
            openWindow === "scheda" ||
            openWindow === "mercato" ||
            openWindow === "banca" ||
            openWindow === "waza"
              ? char
              : undefined
          }
          presenti={openWindow === "presenti" ? presenti : undefined}
          presentiAreMock={openWindow === "presenti" ? presentiAreMock : undefined}
          profileCharacterId={openWindow === "scheda" ? profileCharacterId ?? undefined : undefined}
          smsTargetCharacterId={openWindow === "sms" ? smsTargetCharacterId : undefined}
          onCharUpdate={reloadChar}
          onUnreadChange={openWindow === "sms" ? fetchSmsUnread : undefined}
          onNotificationsUnreadChange={fetchNotificationsUnread}
          canAccessGestione={char?.canAccessGestione}
        />
      )}
      {char?.pendingLevelUp && (
        <LevelUpOverlay
          pending={char.pendingLevelUp}
          visible={showLevelUpOverlay}
          onSkiru={handleLevelUpSkiru}
          onSalta={handleLevelUpSalta}
        />
      )}
    </div>
  );
}
