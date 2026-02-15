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
import { Button } from "@/components/ui/Button";
import { ToastContainer } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import type { WindowId, CharacterSummary, Presente } from "@/components/dashboard/types";
import { getMockPresenti } from "@/components/dashboard/types";
import { roomToPrefettura, getChatLocationByRoomId, GAME_MAPS } from "@/config/map-config";
import { useRealtime } from "@/hooks/useRealtime";
import { useSmsRealtime } from "@/hooks/useSmsRealtime";
import { api } from "@/lib/api";

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
  const [smsUnread, setSmsUnread] = useState(0);
  const [profileCharacterId, setProfileCharacterId] = useState<string | null>(null);

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

  // Carica il badge all'avvio e quando cambia il character
  useEffect(() => {
    fetchSmsUnread();
  }, [fetchSmsUnread]);

  // Aggiorna il badge anche quando char viene caricato (potrebbe esserci un messaggio in arrivo)
  useEffect(() => {
    if (char?.id) {
      fetchSmsUnread();
    }
  }, [char?.id, fetchSmsUnread]);

  // WebSocket per SMS real-time (sempre attivo per notifiche sonore e badge)
  // Passa myCharacterId se disponibile, altrimenti sarà ottenuto dal welcome message o da /characters/me
  useSmsRealtime({
    onUnreadUpdate: fetchSmsUnread,
    myCharacterId: char?.id ?? null,
    onNewMessage: (msg) => {
      // Aggiorna il badge quando arriva un nuovo messaggio (anche se char non è ancora caricato)
      console.debug("[SMS] New message received in DashboardPage", msg);
      fetchSmsUnread();
    },
  });

  const open = useCallback((id: WindowId) => {
    setOpenWindow(id);
    setLoweredWindows((prev) => prev.filter((w) => w !== id));
  }, []);

  /** Unico punto di ingresso: apri scheda personaggio (la mia = scheda completa, altrui = profilo pubblico o completa se mod/admin). */
  const openCharacterSheet = useCallback(
    async (characterId: string) => {
      // Se è la mia scheda, apri direttamente la scheda completa
      if (char?.id && characterId === char.id) {
        open("scheda");
        return;
      }
      // Per altri personaggi, verifica i permessi di visibilità
      try {
        const publicData = (await api.get(`/characters/${characterId}/public`)) as { visibility?: { canSeeFullSheet?: boolean } };
        const canSeeFullSheet = publicData?.visibility?.canSeeFullSheet ?? false;
        setProfileCharacterId(characterId);
        // Se mod/admin, apri la scheda completa (non censurata); altrimenti profilo pubblico
        open(canSeeFullSheet ? "scheda" : "profilo");
      } catch (e) {
        // Fallback: apri profilo pubblico in caso di errore
        console.error("Errore verifica permessi:", e);
        setProfileCharacterId(characterId);
        open("profilo");
      }
    },
    [char?.id, open]
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
  }, []);

  const { users: usersInRoom, messages, sendMessage, connected: chatConnected } = useRealtime(roomId);
  const [presenti, setPresenti] = useState<Presente[]>([]);
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
          // Se non c'è token, usa mock
          const mockPresenti = getMockPresenti(typeof char?.name === "string" ? char.name : undefined);
          setPresenti(mockPresenti);
          return;
        }
        
        const data = (await api.get("/presence/all")) as Array<{ id: string; name: string; room: string | null }>;
        // Assicuriamoci che data sia un array
        if (!Array.isArray(data)) {
          console.warn("[Presenti] Risposta non è un array:", data);
          const mockPresenti = getMockPresenti(typeof char?.name === "string" ? char.name : undefined);
          setPresenti(mockPresenti);
          return;
        }
        
        const myId = char?.id;
        const presentiList: Presente[] = data.map((u) => ({
          id: u.id,
          name: u.name,
          zone: getZoneLabel(u.room),
          room: u.room ?? undefined,
          isMe: myId !== undefined && u.id === myId,
        }));
        setPresenti(presentiList);
      } catch (e) {
        // Se è un errore di rete (server non raggiungibile), usa mock silenziosamente
        if (e instanceof Error && e.message.includes("non raggiungibile")) {
          console.warn("[Presenti] Server non raggiungibile, uso mock");
        } else {
          console.error("[Presenti] Errore caricamento:", e);
        }
        // Fallback a mock in caso di errore
        const mockPresenti = getMockPresenti(typeof char?.name === "string" ? char.name : undefined);
        setPresenti(mockPresenti);
      }
    };

    loadPresenti();
    // Aggiorna ogni 5 secondi
    const interval = setInterval(loadPresenti, 5000);
    return () => clearInterval(interval);
  }, [char?.id, char?.name]);

  // Ascolta evento globale: clic su nome in Presenti / Presenti Estesi → stessa logica di "apri scheda personaggio"
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ characterId?: string }>;
      const id = custom.detail?.characterId;
      if (!id) return;
      openCharacterSheet(id);
    };
    window.addEventListener("openProfileWindow", handler as EventListener);
    return () => {
      window.removeEventListener("openProfileWindow", handler as EventListener);
    };
  }, [openCharacterSheet]);

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
        if (data.found && data.isOnboarded === false) {
          router.replace("/create-character");
          return;
        }
        const charData = data as CharacterSummary;
        setChar(charData);
        // Se abbiamo l'id, aggiorna subito il badge (potrebbe esserci un messaggio in arrivo)
        if (charData?.id) {
          fetchSmsUnread();
        }
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
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
          <div className="w-full lg:w-[280px] space-y-4">
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={200} />
            <Skeleton variant="rounded" height={150} />
          </div>
          {/* Center Skeleton */}
          <div className="flex-1">
            <Skeleton variant="rounded" height={400} />
          </div>
          {/* Right Col Skeleton */}
          <div className="w-full lg:w-[280px] space-y-4">
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <DashboardHeader
          onGoToMap={() => setMapTrigger((t) => t + 1)}
          onOpenShinigami={() => setShinigamiTrigger((t) => t + 1)}
          onOpenGuida={() => setGuidaTrigger((t) => t + 1)}
          onOpenAmbientazione={() => setAmbientazioneTrigger((t) => t + 1)}
          onOpenForum={() => setForumTrigger((t) => t + 1)}
          onOpenGestione={() => setGestioneTrigger((t) => t + 1)}
          canAccessGestione={char?.canAccessGestione}
          canAccessShinigami={char?.canAccessShinigami}
        />
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-[1800px] w-full mx-auto min-h-0 overflow-hidden">
        <DashboardLeftCol
          char={char}
          onOpenScheda={() => char?.id && openCharacterSheet(char.id)}
          onOpenShop={() => open("shop")}
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
          onRoomChange={setRoomId}
          messages={messages}
          sendMessage={sendMessage}
          chatConnected={chatConnected}
          usersInRoom={roomId ? usersInRoom : []}
          canAccessShinigami={char?.canAccessShinigami}
          canAccessGestione={char?.canAccessGestione}
          char={char}
        />
        <DashboardRightCol
          presenti={presenti}
          prefettura={prefettura}
          onOpenPresenti={() => open("presenti")}
          onOpenFetch={() => open("fetch")}
        />
      </div>
      <DashboardFooter loweredWindows={loweredWindows} onRaiseFromDock={raiseFromDock} />
      {openWindow && (
        <DashboardWindowPanel
          windowId={openWindow}
          onLower={lower}
          onClose={close}
          char={openWindow === "scheda" || openWindow === "shop" ? char : undefined}
          presenti={openWindow === "presenti" ? presenti : undefined}
          profileCharacterId={openWindow === "scheda" || openWindow === "profilo" ? profileCharacterId ?? undefined : undefined}
          onCharUpdate={async () => {
            // Ricarica il personaggio dopo l'acquisto
            const token = localStorage.getItem("token");
            if (token) {
              try {
                const data = await api.get("/characters/me");
                if (data.found) {
                  setChar(data as CharacterSummary);
                }
              } catch (e) {
                console.error("Errore nel ricaricare il personaggio:", e);
              }
            }
          }}
          onUnreadChange={openWindow === "sms" ? fetchSmsUnread : undefined}
        />
      )}
      <ToastContainer />
    </div>
  );
}
