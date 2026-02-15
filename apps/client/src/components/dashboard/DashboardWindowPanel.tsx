"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import { useSmsRealtime } from "@/hooks/useSmsRealtime";
import { PixelIcons } from "./PixelIcons";
import type { WindowId, CharacterSummary, Presente } from "./types";
import { WINDOW_LABELS } from "./types";

type Conversation = {
  otherId: string;
  otherName: string;
  otherMiniAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
};

type ThreadMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  isOutgoing: boolean;
};

type CharacterListItem = { id: string; name: string; miniAvatar: string | null };

const PANEL_ICONS: Record<WindowId, (typeof icons)[keyof typeof icons]> = {
  scheda: icons.user,
  presenti: icons.presenti,
  shop: icons.shop,
  sms: icons.message,
  fetch: icons.trophy,
  banca: icons.banca,
  housing: icons.home,
  profilo: icons.user,
  waza: icons.waza,
  ordine: icons.ordine,
  bestiario: icons.trophy,
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
  /** Chiamato quando SMS segna thread come letti (per aggiornare badge). */
  onUnreadChange?: () => void;
  /** Chiamato quando il personaggio viene aggiornato (es. dopo acquisto shop). */
  onCharUpdate?: () => void;
};

export function DashboardWindowPanel({ windowId, onLower, onClose, char, presenti = [], profileCharacterId, onUnreadChange, onCharUpdate }: Props) {
  const isSms = windowId === "sms";
  const isScheda = windowId === "scheda";
  const isProfilo = windowId === "profilo";
  const isSchedaLike = isScheda || isProfilo;
  return (
    <div
      className={`fixed inset-0 z-30 pointer-events-none ${
        isSchedaLike
          ? ""
          : "flex items-center justify-center p-4"
      }`}
      role="dialog"
      aria-label={WINDOW_LABELS[windowId]}
      aria-modal="true"
    >
      <div
        className={`relative flex flex-col bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg shadow-2xl overflow-hidden pointer-events-auto ${
          isSms
            ? "w-full max-w-4xl max-h-[80vh]"
            : isSchedaLike
            ? "w-[calc(100vw-37.75rem)] h-[calc(100vh-8rem)] absolute top-[calc(50%+5px)] left-[calc(50vw+0.625rem)] -translate-x-[50%] -translate-y-[50%] max-w-[calc(1800px-37.75rem)]"
            : "w-full max-w-2xl max-h-[75vh]"
        }`}
      >
        {/* Barra titolo: icona + label | _ (abbassa) | x (chiudi) */}
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
        {/* Contenuto scrollabile */}
        <div
          className={`flex-1 overflow-hidden ${
            isSms ? "flex flex-col" : isSchedaLike ? "h-full" : "overflow-auto px-4 py-4"
          }`}
        >
          {windowId === "scheda" && (
            <div className="h-full">
              <SchedaContent char={char} characterId={profileCharacterId} onCharUpdate={onCharUpdate} />
            </div>
          )}
          {windowId === "presenti" && <PresentiEstesiContent presenti={presenti} />}
          {windowId === "profilo" && <ProfiloPersonaggioWindow characterId={profileCharacterId} />}
          {windowId === "shop" && <ShopContent char={char} onCharUpdate={onCharUpdate} />}
          {windowId === "fetch" && <FetchContent />}
          {windowId === "sms" && <SmsContent onUnreadChange={onUnreadChange} />}
          {windowId === "banca" && <BancaContent char={char} onCharUpdate={onCharUpdate} />}
          {windowId === "housing" && <HousingContent char={char} onCharUpdate={onCharUpdate} />}
          {windowId === "waza" && <WazaContent char={char} />}
          {windowId === "ordine" && <OrdineContent char={char} />}
          {windowId === "bestiario" && <BestiarioContent char={char} />}
        </div>
      </div>
    </div>
  );
}

type FetchItem = { id: string; title: string; description: string | null; assignedTo: string | null };

function FetchContent() {
  const [list, setList] = useState<FetchItem[]>([]);
  const [myFetch, setMyFetch] = useState<FetchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get("/fetches").then((d) => (Array.isArray(d) ? d : []) as FetchItem[]),
      api.get("/fetches/my").then((d) => d as FetchItem | { assigned: false }),
    ])
      .then(([arr, my]) => {
        setList(Array.isArray(arr) ? arr : []);
        setMyFetch(my && "id" in my && my.id ? (my as FetchItem) : null);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async (id: string) => {
    setAssigningId(id);
    try {
      await api.post(`/fetches/${id}/assign`, {});
      load();
    } catch (_) {
      /* ignore */
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento…</p>;
  }

  return (
    <div className="space-y-4">
      {myFetch && (
        <div className="p-3 rounded border border-[var(--accent-violet)]/50 bg-[var(--accent-violet)]/10">
          <p className="text-[10px] uppercase tracking-widest text-[var(--accent-violet)] mb-1">Assegnata a te</p>
          <p className="text-sm font-display text-white">{myFetch.title}</p>
          {myFetch.description && <p className="text-xs text-gray-500 mt-1">{myFetch.description}</p>}
        </div>
      )}
      <p className="text-[10px] uppercase tracking-widest text-gray-500">Bacheca missioni</p>
      {list.length === 0 ? (
        <p className="text-sm text-gray-500">Nessuna fetch approvata.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {list.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 p-3 rounded border border-[var(--border-color)] bg-black/20">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-display text-white truncate">{f.title}</p>
                {f.description && <p className="text-xs text-gray-500 truncate mt-0.5">{f.description}</p>}
                {f.assignedTo && <p className="text-[10px] text-gray-600 mt-0.5">Assegnata</p>}
              </div>
              {!f.assignedTo && (
                <button
                  type="button"
                  onClick={() => assign(f.id)}
                  disabled={assigningId !== null}
                  className="shrink-0 px-2 py-1 rounded border border-[var(--accent-gold)] text-[10px] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                >
                  {assigningId === f.id ? "…" : "Assegna a me"}
                </button>
              )}
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

  const openProfile = (id: string) => {
    window.dispatchEvent(
      new CustomEvent("openProfileWindow", {
        detail: { characterId: id },
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
            onClick={() => openProfile(p.id)}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <span className={`font-display text-sm flex items-center gap-1.5 flex-wrap ${p.isMe ? "text-[var(--accent-gold)]" : "text-white"}`}>
                {p.name}
                <PixelIcons pixelIcons={p.pixelIcons} />
                {p.isMe && " (Tu)"}
              </span>
              {p.zone && (
                <p className="text-xs text-gray-500 truncate">{p.zone}</p>
              )}
            </div>
            <span className="text-[10px] uppercase text-emerald-500/80 shrink-0">Online</span>
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

  return (
    <div className="flex h-full min-h-0 bg-[var(--panel-bg)]">
      {/* Sidebar sinistra - segnalibri come faldone militare (solo 3 sezioni) */}
      <div className="w-14 shrink-0 border-r border-[var(--border-color)] bg-black/40 flex flex-col items-center py-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("profilo")}
          className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
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
          className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
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
        {/* Colonna sinistra: Avatar 350x400 e dati base */}
        <div className="w-[350px] shrink-0 border-r border-[var(--border-color)] p-6 bg-black/20 flex flex-col items-center gap-4">
          {data.avatar ? (
            <img
              src={data.avatar as string}
              alt={String(data.name)}
              className="w-[350px] h-[400px] rounded-lg border-2 border-[var(--accent-gold)] object-cover shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              style={{ width: "350px", height: "400px" }}
            />
          ) : (
            <div
              className="w-[350px] h-[400px] rounded-lg border-2 border-[var(--accent-gold)] bg-black/50 flex items-center justify-center"
              style={{ width: "350px", height: "400px" }}
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

          {/* Stat base sintetiche (mini-plancia) */}
          <div className="w-full mt-2 space-y-2 text-[11px]">
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

function SmsContent({ onUnreadChange }: { onUnreadChange?: () => void }) {
  const onUnreadChangeRef = useRef(onUnreadChange);
  useEffect(() => {
    onUnreadChangeRef.current = onUnreadChange;
  }, [onUnreadChange]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [selectedOther, setSelectedOther] = useState<{ id: string; name: string; miniAvatar: string | null } | null>(null);
  const [newMode, setNewMode] = useState(false);
  const [characterList, setCharacterList] = useState<CharacterListItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const list = (await api.get("/sms/conversations")) as Conversation[];
      setConversations(Array.isArray(list) ? list : []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    // Ottieni characterId corrente
    (async () => {
      try {
        const char = (await api.get("/characters/me")) as { id?: string };
        if (char?.id) setMyCharacterId(char.id);
      } catch {
        // ignore
      }
    })();
  }, [fetchConversations]);

  // WebSocket per SMS real-time (solo per aggiornare thread e conversazioni quando finestra aperta)
  // La notifica sonora e il badge sono gestiti da DashboardPage
  useSmsRealtime({
    myCharacterId,
    onNewMessage: (msg) => {
      // Se il thread è aperto e il messaggio è per questo thread, aggiungilo
      if (selectedOther && myCharacterId && (msg.senderId === selectedOther.id || msg.recipientId === selectedOther.id)) {
        const isOutgoing = msg.senderId === myCharacterId;
        setThread((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [
            ...prev,
            {
              id: msg.id,
              senderId: msg.senderId,
              recipientId: msg.recipientId,
              content: msg.content,
              readAt: isOutgoing ? new Date().toISOString() : null,
              createdAt: msg.createdAt,
              isOutgoing,
            },
          ];
        });
      }
      // Aggiorna sempre le conversazioni
      fetchConversations();
      // Aggiorna badge (chiama onUnreadChange che triggera fetchSmsUnread in DashboardPage)
      onUnreadChangeRef.current?.();
    },
    onUnreadUpdate: () => {
      // Aggiorna badge quando arriva un nuovo messaggio
      onUnreadChangeRef.current?.();
    },
  });

  useEffect(() => {
    if (!selectedOther) {
      setThread([]);
      setLoadingThread(false);
      return;
    }
    let ok = true;
    setLoadingThread(true);
    (async () => {
      try {
        const msgs = (await api.get(`/sms/thread/${selectedOther.id}`)) as ThreadMessage[];
        if (!ok) return;
        setThread(Array.isArray(msgs) ? msgs : []);
        setLoadingThread(false);
        // Segna come letto dopo aver caricato i messaggi
        try {
          await api.post(`/sms/thread/${selectedOther.id}/read`, {});
          // Aggiorna il badge immediatamente
          onUnreadChangeRef.current?.();
        } catch (e) {
          console.error("[SMS] Error marking as read:", e);
        }
        await fetchConversations();
      } catch (e) {
        console.error("[SMS] Error loading thread:", e);
        if (ok) {
          setThread([]);
          setLoadingThread(false);
        }
      }
    })();
    return () => { ok = false; };
  }, [selectedOther?.id, onUnreadChange, fetchConversations]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [thread]);

  const openNew = useCallback(async () => {
    setNewMode(true);
    setSelectedOther(null);
    setThread([]);
    try {
      const list = (await api.get("/characters/list")) as CharacterListItem[];
      setCharacterList(Array.isArray(list) ? list : []);
    } catch {
      setCharacterList([]);
    }
  }, []);

  const pickOther = useCallback((c: CharacterListItem) => {
    setNewMode(false);
    setSelectedOther({ id: c.id, name: c.name, miniAvatar: c.miniAvatar });
  }, []);

  const selectConversation = useCallback((c: Conversation) => {
    setNewMode(false);
    setSelectedOther({ id: c.otherId, name: c.otherName, miniAvatar: c.otherMiniAvatar });
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !selectedOther || sending) return;
    setSending(true);
    const originalInput = input;
    setInput("");
    try {
      await api.post("/sms/send", { recipientId: selectedOther.id, content: text });
      // Il messaggio arriverà via WebSocket, ma ricarichiamo il thread per sicurezza
      try {
        const msgs = (await api.get(`/sms/thread/${selectedOther.id}`)) as ThreadMessage[];
        setThread(Array.isArray(msgs) ? msgs : []);
      } catch (e) {
        console.error("[SMS] Error reloading thread after send:", e);
      }
      await fetchConversations();
    } catch (e) {
      console.error("[SMS] Error sending message:", e);
      setInput(originalInput);
    } finally {
      setSending(false);
    }
  }, [input, selectedOther, sending, fetchConversations]);

  return (
    <div className="flex flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
      {/* Lista conversazioni — stile WhatsApp */}
      <aside className="flex flex-col border-r border-[var(--border-color)] min-h-0">
        <div className="shrink-0 flex items-center gap-2 border-b border-[var(--border-color)]">
          {newMode ? (
            <button
              type="button"
              onClick={() => { setNewMode(false); setSelectedOther(null); setThread([]); }}
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-[var(--accent-gold)]"
            >
              <FontAwesomeIcon icon={icons.back} className="w-4 h-4" />
              Indietro
            </button>
          ) : (
            <button
              type="button"
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--accent-gold)] hover:bg-white/5"
            >
              <FontAwesomeIcon icon={icons.plus} className="w-4 h-4" />
              Nuova conversazione
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-4 text-xs text-gray-500">Caricamento…</p>
          ) : newMode ? (
            <ul className="divide-y divide-[var(--border-color)]">
              {characterList.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => pickOther(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-[var(--border-color)] shrink-0 overflow-hidden flex items-center justify-center">
                      {c.miniAvatar ? (
                        <img src={c.miniAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FontAwesomeIcon icon={icons.user} className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <span className="font-display text-sm text-white truncate">{c.name}</span>
                  </button>
                </li>
              ))}
              {characterList.length === 0 && !loading && (
                <li className="px-4 py-6 text-xs text-gray-500">Nessun altro personaggio.</li>
              )}
            </ul>
          ) : (
            <ul className="divide-y divide-[var(--border-color)]">
              {conversations.map((c) => (
                <li key={c.otherId}>
                  <button
                    type="button"
                    onClick={() => selectConversation(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 ${selectedOther?.id === c.otherId ? "bg-[var(--accent-gold)]/10" : ""}`}
                  >
                    <div className="relative w-10 h-10 shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-800 border border-[var(--border-color)] overflow-hidden flex items-center justify-center">
                        {c.otherMiniAvatar ? (
                          <img src={c.otherMiniAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FontAwesomeIcon icon={icons.user} className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--accent-gold)] text-black text-[10px] font-bold flex items-center justify-center px-1">
                          {c.unreadCount > 99 ? "99+" : c.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm text-white truncate">{c.otherName}</p>
                      <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0">
                      {new Date(c.lastAt).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </button>
                </li>
              ))}
              {conversations.length === 0 && !loading && (
                <li className="px-4 py-6 text-xs text-gray-500">Nessuna conversazione. Avviane una nuova.</li>
              )}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread messaggi */}
      <div className="flex flex-col min-h-0 min-w-0">
        {selectedOther ? (
          <>
            <div className="shrink-0 px-4 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 border border-[var(--border-color)] overflow-hidden flex items-center justify-center shrink-0">
                  {selectedOther.miniAvatar ? (
                    <img src={selectedOther.miniAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FontAwesomeIcon icon={icons.user} className="w-3 h-3 text-gray-500" />
                  )}
                </div>
                <span className="font-display text-sm text-white">{selectedOther.name}</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedOther || !confirm(`Cancellare tutta la conversazione con ${selectedOther.name}? Questa azione non può essere annullata.`)) return;
                  try {
                    await api.delete(`/sms/thread/${selectedOther.id}`);
                    setSelectedOther(null);
                    setThread([]);
                    await fetchConversations();
                    onUnreadChange?.();
                  } catch {
                    alert("Errore durante la cancellazione della conversazione.");
                  }
                }}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded border border-red-500/30 hover:border-red-500/50 transition-colors flex items-center gap-1.5"
                title="Cancella chat"
              >
                <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
                Cancella chat
              </button>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingThread ? (
                <p className="text-xs text-gray-500 text-center py-4">Caricamento messaggi…</p>
              ) : (
                <>
                  {thread.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.isOutgoing ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      m.isOutgoing
                        ? "bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/40 text-right"
                        : "bg-black/40 border border-[var(--border-color)]"
                    }`}
                  >
                    <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{m.content}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {new Date(m.createdAt).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                  ))}
                  {thread.length === 0 && !newMode && (
                    <p className="text-xs text-gray-500 text-center py-4">Nessun messaggio. Scrivi per iniziare.</p>
                  )}
                </>
              )}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="shrink-0 flex gap-2 p-3 border-t border-[var(--border-color)]"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi un messaggio…"
                maxLength={2000}
                className="flex-1 min-w-0 bg-black/50 border border-[var(--border-color)] rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-[var(--accent-gold)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={icons.send} className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            {newMode ? "Seleziona un personaggio" : "Seleziona una conversazione o avviane una nuova"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componenti Scheda Personaggio ───

// Pagina principale della scheda
function SchedaMainPage({ char, level, grade }: { char: any; level: number; grade: string }) {
  const computed = char.computed ?? {};
  const hpMax = computed.hpMax || computed.body || 0;
  const kotodamaMax = computed.kotodamaMax || 0;

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
      </div>

      {/* Mostrina militare */}
      <div className="bg-gradient-to-r from-[var(--panel-bg)] to-black border-2 border-[var(--accent-gold)] rounded-lg p-4 flex items-center justify-between shadow-[0_0_15px_rgba(212,175,55,0.2)]">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Livello</p>
          <p className="font-display text-3xl text-[var(--accent-gold)]" style={{ textShadow: "0 0 10px rgba(212,175,55,0.5)" }}>{level}</p>
        </div>
        <div className="h-12 w-px bg-[var(--accent-gold)]/30"></div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Grado</p>
          <p className="font-display text-xl text-white">{grade}</p>
        </div>
      </div>


      {/* Statistiche derivate */}
      {Object.keys(computed).length > 0 && (
        <DerivedStatsGrid computed={computed} />
      )}

      {/* Ultima posizione e icona casa */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ultima Posizione</p>
          <p className="text-sm text-gray-400">N/D</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("openHousingWindow"));
            }
          }}
          className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 transition-colors flex items-center gap-2 text-xs uppercase tracking-wider"
        >
          <FontAwesomeIcon icon={icons.home} className="w-4 h-4" />
          <span>Entra in Casa</span>
        </button>
      </div>
    </div>
  );
}

// Griglia ordinata e rinominata delle statistiche derivate
function DerivedStatsGrid({ computed }: { computed: any }) {
  const throwRange = computed.throwRange ?? {};

  // Raggruppo in blocchi tematici per effetto "faldone militare"
  const groups: Array<{
    id: string;
    title: string;
    rows: Array<{ key: string; label: string; value: number | undefined }>;
  }> = [
    {
      id: "sopravvivenza",
      title: "Sopravvivenza",
      rows: [
        { key: "hpMax", label: "Body [BOD]", value: computed.hpMax },
        { key: "kotodamaMax", label: "Kotodama [KOT]", value: computed.kotodamaMax },
      ],
    },
    {
      id: "movimento",
      title: "Movimento & Spazio",
      rows: [
        { key: "movement", label: "Movimento [MOV] (m)", value: computed.movement },
        { key: "jump", label: "Salto [JUMP] (m)", value: computed.jump },
        { key: "engageDistance", label: "Distanza d’ingaggio (m)", value: computed.engageDistance },
        { key: "throw_small", label: "Lancio (Piccole)", value: throwRange.small },
        { key: "throw_medium", label: "Lancio (Medie)", value: throwRange.medium },
        { key: "throw_large", label: "Lancio (Grandi)", value: throwRange.large },
        { key: "throw_giant", label: "Lancio (Giganti)", value: throwRange.giant },
      ],
    },
    {
      id: "percezione",
      title: "Percezione",
      rows: [
        { key: "perceptionPhysical", label: "Percezione Sensi [PER-S]", value: computed.perceptionPhysical },
        { key: "perceptionSpiritual", label: "Percezione Anime [PER-E]", value: computed.perceptionSpiritual },
      ],
    },
    {
      id: "combattimento",
      title: "Combattimento",
      rows: [
        { key: "reflexes", label: "Reflexes [REF]", value: computed.reflexes },
        { key: "velocity", label: "Velocità [VEL]", value: computed.velocity },
        { key: "meleeDamage", label: "Danno CAC", value: computed.meleeDamage },
        { key: "rangedDamage", label: "Danno CAD", value: computed.rangedDamage },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      rows: group.rows.filter((r) => typeof r.value === "number"),
    }))
    .filter((group) => group.rows.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-3 font-display">
        Statistiche Derivate
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => (
          <section
            key={group.id}
            className="bg-black/30 rounded-lg border border-[var(--border-color)]/80 shadow-[0_0_12px_rgba(0,0,0,0.6)]"
          >
            <header className="px-3 py-2 border-b border-[var(--border-color)]/60 bg-black/50">
              <p className="text-[9px] uppercase tracking-[0.25em] text-gray-400 font-display">
                {group.title}
              </p>
            </header>
            <div className="p-3 space-y-2">
              {group.id === "movimento" ? (
                <>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-1">
                    Movimento &amp; Posizione
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.rows
                      .filter((r) => r.key === "movement" || r.key === "jump" || r.key === "engageDistance")
                      .map((row) => (
                        <div
                          key={row.key}
                          className="bg-[var(--panel-bg)]/80 rounded-md px-2 py-2 border border-[var(--border-color)] hover:border-[var(--accent-gold)]/50 transition-colors"
                        >
                          <p className="text-[9px] text-gray-500 uppercase mb-0.5 leading-tight">
                            {row.label}
                          </p>
                          <p className="font-display text-lg text-[var(--accent-gold)] leading-none">
                            {String(row.value)}
                          </p>
                        </div>
                      ))}
                  </div>
                  {group.rows.some((r) => r.key.startsWith("throw_")) && (
                    <>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mt-2 mb-1">
                        Lancio [LAN]
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {group.rows
                          .filter((r) => r.key.startsWith("throw_"))
                          .map((row) => (
                            <div
                              key={row.key}
                              className="bg-[var(--panel-bg)]/80 rounded-md px-2 py-2 border border-[var(--border-color)] hover:border-[var(--accent-gold)]/50 transition-colors"
                            >
                              <p className="text-[9px] text-gray-500 uppercase mb-0.5 leading-tight">
                                {row.label}
                              </p>
                              <p className="font-display text-lg text-[var(--accent-gold)] leading-none">
                                {String(row.value)}
                              </p>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {group.rows.map((row) => (
                    <div
                      key={row.key}
                      className="bg-[var(--panel-bg)]/80 rounded-md px-2 py-2 border border-[var(--border-color)] hover:border-[var(--accent-gold)]/50 transition-colors"
                    >
                      <p className="text-[9px] text-gray-500 uppercase mb-0.5 leading-tight">
                        {row.label}
                      </p>
                      <p className="font-display text-lg text-[var(--accent-gold)] leading-none">
                        {String(row.value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// Componente Radar Chart SVG
function RadarChart({ data }: { data: { f: number; c: number; d: number; m: number; e: number } }) {
  const size = 240;
  const center = size / 2;
  const radius = 90;
  const angles = {
    f: -Math.PI / 2, // Top
    c: -Math.PI / 2 + (2 * Math.PI / 5) * 1,
    d: -Math.PI / 2 + (2 * Math.PI / 5) * 2,
    m: -Math.PI / 2 + (2 * Math.PI / 5) * 3,
    e: -Math.PI / 2 + (2 * Math.PI / 5) * 4,
  };

  const points = Object.entries(angles).map(([key, angle]) => {
    const value = data[key as keyof typeof data];
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      label: STAT_LABELS[key] || key,
      angle,
    };
  });

  const pathData = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")} Z`;

  return (
    <div className="flex items-center justify-center bg-[var(--panel-bg)] rounded-lg p-4 border border-[var(--accent-violet)]/30">
      <svg width={size} height={size} className="overflow-visible">
        {/* Griglia concentrica */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => (
          <circle
            key={scale}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke="rgba(124, 58, 237, 0.15)"
            strokeWidth="1"
          />
        ))}
        {/* Linee assi */}
        {Object.values(angles).map((angle, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="rgba(124, 58, 237, 0.2)"
            strokeWidth="1"
          />
        ))}
        {/* Area dati con gradiente viola */}
        <defs>
          <linearGradient id="radarGradientViolet" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.4)" />
            <stop offset="100%" stopColor="rgba(124, 58, 237, 0.1)" />
          </linearGradient>
        </defs>
        <path
          d={pathData}
          fill="url(#radarGradientViolet)"
          stroke="var(--accent-violet)"
          strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 8px rgba(124, 58, 237, 0.5))" }}
        />
        {/* Punti e etichette */}
        {points.map((point, i) => {
          const labelX = center + (radius + 20) * Math.cos(point.angle);
          const labelY = center + (radius + 20) * Math.sin(point.angle);
          return (
            <g key={i}>
              <circle 
                cx={point.x} 
                cy={point.y} 
                r="5" 
                fill="var(--accent-violet)" 
                style={{ filter: "drop-shadow(0 0 4px rgba(124, 58, 237, 0.7))" }}
              />
              <text
                x={labelX}
                y={labelY}
                fill="var(--accent-violet)"
                fontSize="11"
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-display"
                style={{ textShadow: "0 0 4px rgba(124, 58, 237, 0.5)" }}
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Barra statistica con estetica videogame (versione ancora più compatta)
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: "magenta" | "purple" }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const isMagenta = color === "magenta";
  // Magenta/rosa che si abbina bene con il viola
  const barColor = isMagenta ? "rgba(219, 39, 119, 0.8)" : "rgba(124, 58, 237, 0.8)";
  const glowColor = isMagenta ? "rgba(219, 39, 119, 0.4)" : "rgba(124, 58, 237, 0.4)";
  const gradientEnd = isMagenta ? "rgba(236, 72, 153, 0.9)" : "rgba(150, 100, 255, 0.9)";

  return (
    <div className="bg-[var(--panel-bg)] rounded-md px-2 py-1.5 border border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] uppercase tracking-widest text-gray-500 font-display">{label}</span>
        <span className="font-display text-[10px] text-[var(--accent-gold)]" style={{ textShadow: "0 0 5px rgba(212,175,55,0.3)" }}>
          {value}/{max}
        </span>
      </div>
      <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-[var(--border-color)] relative">
        <div
          className="h-full transition-all duration-700 relative"
          style={{ 
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${barColor} 0%, ${gradientEnd} 100%)`,
            boxShadow: `0 0 10px ${glowColor}, inset 0 0 8px rgba(255,255,255,0.08)`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}

// Pagina Modifica
function SchedaModificaPage({ char, onCharUpdate }: { char: any; onCharUpdate?: () => void }) {
  const [avatar, setAvatar] = useState(char.avatarUrl ?? char.avatar ?? "");
  const [miniAvatar, setMiniAvatar] = useState(char.miniAvatar ?? "");
  const [surname, setSurname] = useState(char.surname ?? "");
  const [background, setBackground] = useState((char as any)?.backgroundImage ?? "");
  const [music, setMusic] = useState((char as any)?.themeMusicUrl ?? "");
  const [bio, setBio] = useState(char.bio ?? "");
  const [saving, setSaving] = useState(false);

  // Aggiorna lo stato quando char cambia (dopo il salvataggio)
  useEffect(() => {
    setAvatar(char.avatarUrl ?? char.avatar ?? "");
    setMiniAvatar(char.miniAvatar ?? "");
    setSurname(char.surname ?? "");
    setBackground((char as any)?.backgroundImage ?? "");
    setMusic((char as any)?.themeMusicUrl ?? "");
    setBio(char.bio ?? "");
  }, [char]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/characters/me/profilo", {
        avatar,
        miniAvatar,
        surname,
        bio,
        backgroundImage: background,
        themeMusicUrl: music,
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
          <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="URL immagine"
            className="w-full px-4 py-2.5 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-display">Avatar Chat</label>
          <input
            type="text"
            value={miniAvatar}
            onChange={(e) => setMiniAvatar(e.target.value)}
            placeholder="URL immagine"
            className="w-full px-4 py-2.5 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-display">Background Immagine</label>
          <input
            type="text"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="URL immagine background"
            className="w-full px-4 py-2.5 rounded border border-[var(--border-color)] bg-[var(--panel-bg)] text-sm text-gray-200 focus:border-[var(--accent-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold)]/50 transition-colors"
          />
          {background && (
            <div className="mt-3 rounded-lg border border-[var(--border-color)] bg-black/40 overflow-hidden">
              <div
                className="h-32 bg-cover bg-center"
                style={{ backgroundImage: `url(${background})` }}
              />
              <p className="px-3 py-2 text-[10px] text-gray-500 uppercase tracking-[0.18em] font-display">
                Anteprima Background
              </p>
            </div>
          )}
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

// Pagina Background (solo anteprima iframe del contenuto)
function SchedaBackgroundPage({ char }: { char: any }) {
  const bio = char.bio ?? "";

  const previewHtml = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      padding: 20px;
      line-height: 1.6;
      overflow-x: hidden;
    }
    ${bio.includes('<style>') ? '' : '/* CSS personalizzato può essere inserito qui */'}
  </style>
</head>
<body>
  ${bio || '<p style="color: #666; font-style: italic;">Nessun contenuto inserito.</p>'}
</body>
</html>
  `;

  return (
    <div className="p-6 space-y-6 min-h-full box-border flex flex-col">
      <h2
        className="font-display text-xl text-[var(--accent-gold)] border-b border-[var(--border-color)] pb-3 mb-4"
        style={{ textShadow: "0 0 10px rgba(212,175,55,0.3)" }}
      >
        Background Personaggio
      </h2>

      <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)] flex-1 flex flex-col">
        <div className="p-4 flex-1 flex flex-col">
          <div className="border border-[var(--border-color)] bg-black/80 rounded-lg overflow-hidden flex-1">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
              title="Anteprima Background"
            />
          </div>
          <p className="mt-3 text-[10px] text-gray-600 italic text-center">
            Questa è la resa finale del background del personaggio.
          </p>
        </div>
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

// Pagina Waza
function SchedaWazaPage({ characterId }: { characterId?: string }) {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    api
      .get(`/characters/${characterId}/waza`)
      .then((d) => {
        setSkills(Array.isArray(d) ? d : []);
      })
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  }, [characterId]);

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento…</p>;
  }

  return (
    <div className="p-6 space-y-6 min-h-full box-border">
      <h2
        className="font-display text-xl text-[var(--accent-gold)] border-b border-[var(--border-color)] pb-3 mb-4"
        style={{ textShadow: "0 0 10px rgba(212,175,55,0.3)" }}
      >
        Waza / Skill Operative
      </h2>

      <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
        <header className="px-4 py-2 border-b border-[var(--border-color)]/70 bg-black/60 flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">
            Registro Waza
          </p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-violet)] font-display">
            Slot attivi: 0 / 0
          </p>
        </header>

        <div className="p-4">
          {skills.length === 0 ? (
            <div className="text-sm text-gray-500 italic">
              Nessuna Waza registrata. Le abilità apprese appariranno qui con nome, rango e costo in Kotodama.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-color)]/70 bg-black/40">
                    <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Nome
                    </th>
                    <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Rango
                    </th>
                    <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                      Costo KOT
                    </th>
                      <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        Tipo
                      </th>
                      <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                        Livello
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((s, idx) => {
                      const getTypeColor = (type: string) => {
                        switch (type?.toUpperCase()) {
                          case 'OFFENSIVE':
                          case 'ATTACK':
                            return 'text-red-400 bg-red-500/20 border-red-500/40';
                          case 'DEFENSIVE':
                          case 'DEFENSE':
                            return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
                          case 'SUPPORT':
                          case 'HEAL':
                            return 'text-green-400 bg-green-500/20 border-green-500/40';
                          case 'UTILITY':
                          case 'BUFF':
                            return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
                          default:
                            return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
                        }
                      };
                      return (
                        <tr
                          key={s.id || idx}
                          className="border-b border-[var(--border-color)]/40 last:border-0 hover:bg-white/5 transition-colors"
                        >
                          <td className="px-3 py-2 text-[11px] text-gray-100 font-display">{s.name}</td>
                          <td className="px-3 py-2 text-[11px] text-gray-300">{s.rank ?? "-"}</td>
                          <td className="px-3 py-2 text-[11px] text-[var(--accent-violet)] font-display">
                            {s.costKotodama ?? s.kotCost ?? "-"} KOT
                          </td>
                          <td className="px-3 py-2 text-[11px]">
                            {s.type ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border ${getTypeColor(s.type)}`}>
                                {s.type}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[11px] text-[var(--accent-gold)] font-display">
                            {s.level ?? 1}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Pagina Registrazioni
function SchedaRegistrazioniPage({ characterId }: { characterId?: string }) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "quest" | "free">("all");

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
          const isQuest = !!fetch || !!s.fetchId;
          const closedDate = s.closedAt || s.lastActiveAt || s.startedAt;
          return {
            id: s.id,
            date: closedDate,
            type: isQuest ? "Quest" : "Sessione Libera",
            title: fetch?.title || (isQuest ? `Quest ${s.roomId}` : `Sessione ${s.roomId}`),
            questName: fetch?.title,
            outcome: s.status === "CLOSED" ? "Completata" : s.status === "CANCELLED" ? "Annullata" : s.status,
            isQuest,
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
    if (filter === "free") return !r.isQuest;
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
                          r.isQuest
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
function SchedaLogPage({ char }: { char: any }) {
  const [expLogs, setExpLogs] = useState<any[]>([]);
  const [expLast7Days, setExpLast7Days] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/characters/me/exp-logs")
      .then((d: any) => {
        setExpLast7Days(d.expLast7Days ?? 0);
        setExpLogs(Array.isArray(d.expRewards) ? d.expRewards : []);
      })
      .catch(() => {
        setExpLast7Days(0);
        setExpLogs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Calcola livello basandosi su EXP totale
  const calculateLevel = (expTotal: number = 0): number => {
    if (expTotal < 100) return 1;
    if (expTotal < 300) return 2;
    if (expTotal < 600) return 3;
    if (expTotal < 1000) return 4;
    if (expTotal < 1500) return 5;
    if (expTotal < 2100) return 6;
    if (expTotal < 2800) return 7;
    if (expTotal < 3600) return 8;
    if (expTotal < 4500) return 9;
    return 10 + Math.floor((expTotal - 4500) / 1000);
  };

  const level = calculateLevel(char.experienceTotal ?? 0);

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
              Livello Operativo: {level}
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

function SchedaContent({ char, characterId, onCharUpdate }: { char?: CharacterSummary; characterId?: string; onCharUpdate?: () => void }) {
  const [activeSection, setActiveSection] = useState<"main" | "modifica" | "background" | "inventario" | "waza" | "registrazioni" | "log">("main");
  const [charData, setCharData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Se characterId è presente e diverso da char.id, è una scheda remota (mod/admin vedono altri)
  const isRemoteCharacter = characterId && characterId !== char?.id;

  const loadCharData = useCallback(() => {
    if (isRemoteCharacter && characterId) {
      // Carica dati completi di un altro personaggio (solo mod/admin)
      setLoading(true);
      api.get(`/characters/${characterId}/full`)
        .then((d) => setCharData(d))
        .catch(() => setCharData(null))
        .finally(() => setLoading(false));
    } else if (char?.id) {
      // Carica dati del personaggio corrente
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

  // Calcola livello basandosi su EXP totale
  const calculateLevel = (expTotal: number = 0): number => {
    if (expTotal < 100) return 1;
    if (expTotal < 300) return 2;
    if (expTotal < 600) return 3;
    if (expTotal < 1000) return 4;
    if (expTotal < 1500) return 5;
    if (expTotal < 2100) return 6;
    if (expTotal < 2800) return 7;
    if (expTotal < 3600) return 8;
    if (expTotal < 4500) return 9;
    return 10 + Math.floor((expTotal - 4500) / 1000);
  };

  const level = calculateLevel(displayChar.experienceTotal ?? char?.experienceTotal ?? 0);
  const grade = (displayChar as any)?.grade || "Nemuribito";

  // Calcola dati per radar chart (statistiche base normalizzate su scala 0-100)
  const stats = displayChar.stats ?? { f: 0, c: 0, d: 0, m: 0, e: 0 };
  const maxStat = Math.max(...(Object.values(stats) as number[]), 1);
  const radarData = {
    f: (stats.f / maxStat) * 100,
    c: (stats.c / maxStat) * 100,
    d: (stats.d / maxStat) * 100,
    m: (stats.m / maxStat) * 100,
    e: (stats.e / maxStat) * 100,
  };

  // Body & Kotodama (da computed)
  const computedMain = (displayChar as any)?.computed ?? {};
  const hpMax = computedMain.hpMax ?? computedMain.body ?? 0;
  const kotodamaMax = computedMain.kotodamaMax ?? 0;

  // Background estetico e tema musicale
  const backgroundImage = (displayChar as any)?.backgroundImage ?? "";
  const themeMusicUrl = (displayChar as any)?.themeMusicUrl ?? "";

  return (
    <div className="flex h-full min-h-0 bg-[var(--panel-bg)]">
      {/* Sidebar - Segnalibri come faldone militare */}
      <div className="w-14 shrink-0 border-r border-[var(--border-color)] bg-black/40 flex flex-col items-center py-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveSection("main")}
          className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
            activeSection === "main"
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
          }`}
          title="Principale"
        >
          <FontAwesomeIcon icon={icons.user} className="w-4 h-4" />
        </button>
        {!isRemoteCharacter && (
          <button
            type="button"
            onClick={() => setActiveSection("modifica")}
            className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
              activeSection === "modifica"
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title="Modifica"
          >
            <FontAwesomeIcon icon={icons.user} className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveSection("background")}
          className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
            activeSection === "background"
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
          }`}
          title="Background"
        >
          <FontAwesomeIcon icon={icons.ordine} className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("inventario")}
          className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
            activeSection === "inventario"
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
          }`}
          title="Inventario"
        >
          <FontAwesomeIcon icon={icons.shop} className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("waza")}
          className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
            activeSection === "waza"
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
          }`}
          title="Waza"
        >
          <FontAwesomeIcon icon={icons.waza} className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("registrazioni")}
          className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
            activeSection === "registrazioni"
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
          }`}
          title="Registrazioni"
        >
          <FontAwesomeIcon icon={icons.message} className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("log")}
          className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
            activeSection === "log"
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
              : "border-[var(--border-color)] text-gray-500 hover:border-gray-600 hover:text-gray-400"
          }`}
          title="Log"
        >
          <FontAwesomeIcon icon={icons.user} className="w-4 h-4" />
        </button>
      </div>

      {/* Contenuto principale - Layout fisso */}
      <div className="flex-1 min-h-0 flex">
        {/* Colonna sinistra: Avatar fisso 350x400 (larghezza x altezza) + Body/Kotodama + Radar Chart */}
        <div className="w-[350px] shrink-0 border-r border-[var(--border-color)] p-6 bg-black/20 flex flex-col items-center gap-4">
          {displayChar.avatarUrl || displayChar.avatar ? (
            <img
              src={(displayChar.avatarUrl || displayChar.avatar) as string}
              alt={String(displayChar.name)}
              className="w-[350px] h-[400px] rounded-lg border-2 border-[var(--accent-gold)] object-cover shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              style={{ width: "350px", height: "400px" }}
            />
          ) : (
            <div className="w-[350px] h-[400px] rounded-lg border-2 border-[var(--accent-gold)] bg-black/50 flex items-center justify-center" style={{ width: "350px", height: "400px" }}>
              <FontAwesomeIcon icon={icons.user} className="w-20 h-20 text-gray-600" />
            </div>
          )}
          {/* Body & Kotodama sopra il radar */}
          <div className="w-full space-y-2">
            <StatBar label="Body (HP)" value={hpMax} max={hpMax} color="magenta" />
            <StatBar label="Kotodama" value={kotodamaMax} max={kotodamaMax} color="purple" />
          </div>
          {/* Radar Chart sotto Body/Kotodama */}
          <div className="w-full">
            <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-violet)] mb-3 font-display text-center">
              Radar Statistiche
            </h3>
            <RadarChart data={radarData} />
          </div>

          {/* Controllo tema musicale, se presente */}
          {themeMusicUrl && (
            <div className="w-full mt-2">
              <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-display mb-1 text-center">
                Tema musicale
              </p>
              <audio
                controls
                loop
                className="w-full h-7 [&>button]:!text-[10px]"
              >
                <source src={themeMusicUrl} type="audio/mpeg" />
                Il tuo browser non supporta l&apos;audio.
              </audio>
            </div>
          )}
        </div>

        {/* Colonna destra: Contenuto dinamico con background personalizzato */}
        <div
          className="flex-1 min-h-0 overflow-y-auto"
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
          {activeSection === "main" && <SchedaMainPage char={displayChar} level={level} grade={grade} />}
          {activeSection === "modifica" && !isRemoteCharacter && <SchedaModificaPage char={displayChar} onCharUpdate={handleCharUpdate} />}
          {activeSection === "background" && <SchedaBackgroundPage char={displayChar} />}
          {activeSection === "inventario" && <SchedaInventarioPage characterId={characterId || displayChar.id} />}
          {activeSection === "waza" && <SchedaWazaPage characterId={characterId || displayChar.id} />}
          {activeSection === "registrazioni" && <SchedaRegistrazioniPage characterId={characterId || displayChar.id} />}
          {activeSection === "log" && <SchedaLogPage char={displayChar} />}
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
            className="w-[350px] h-[400px] rounded-lg object-cover border border-[var(--border-color)] shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-white flex items-center gap-1.5 flex-wrap mb-2">
            {char.name} {char.surname && <span className="text-[var(--accent-gold)]">{char.surname}</span>}
            <PixelIcons pixelIcons={char.pixelIcons} />
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Livello: {char.experienceTotal ? Math.floor(char.experienceTotal / 100) + 1 : 1}
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

// ─── Tab Statistiche (Attributi Base e Derivati) ───
function StatisticheTab({ char, onCharUpdate }: { char: NonNullable<CharacterSummary>; onCharUpdate?: () => void }) {
  const s = char.stats ?? { f: 0, c: 0, d: 0, m: 0, e: 0 };
  const stats = ["f", "c", "d", "m", "e"] as const;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Attributi Base (Editabili)
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {stats.map((k) => (
            <div key={k} className="bg-black/40 rounded p-2 border border-[var(--border-color)] text-center">
              <p className="text-[10px] text-gray-500 uppercase">{STAT_LABELS[k] ?? k}</p>
              <p className="font-display text-lg text-[var(--accent-gold)]">{s[k]}</p>
            </div>
          ))}
        </div>
      </div>

      {char.computed && Object.keys(char.computed).length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
            Statistiche Derivate (Calcolate)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(char.computed).map(([k, v]) => (
              <div key={k} className="bg-black/40 rounded p-3 border border-[var(--border-color)]">
                <p className="text-[10px] text-gray-500 uppercase mb-1">{k}</p>
                <p className="font-display text-xl text-[var(--accent-gold)]">{String(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
          Valute
        </h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <span><strong className="text-[var(--accent-gold)]">REM</strong> {char.rem ?? 0}</span>
          <span><strong className="text-[var(--accent-gold)]">EXP tot.</strong> {char.experienceTotal ?? 0}</span>
          <span><strong className="text-[var(--accent-gold)]">EXP spend.</strong> {char.experienceSpendable ?? 0}</span>
          <span><strong className="text-[var(--accent-gold)]">Keys</strong> {char.keys ?? 0}</span>
          <span><strong className="text-[var(--accent-gold)]">Gems</strong> {char.gems ?? 0}</span>
        </div>
      </div>

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

// ─── Sezione Inventario ───
function InventorySection({ characterId }: { characterId?: string }) {
  const [inventory, setInventory] = useState<{
    items: Array<{
      id: string;
      itemId: string;
      quantity: number;
      isEquipped: boolean;
      location: 'CARRY' | 'HOUSING';
      item: {
        id: string;
        name: string;
        description: string | null;
        type: string;
        slotsBonus: number;
      };
    }>;
    slots: {
      baseSlots: number;
      bagSlots: number;
      housingSlots: number;
      totalSlots: number;
      occupied: number;
      available: number;
      housingOccupied?: number;
      housingAvailable?: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    
    // Determina quale endpoint usare
    // Se characterId è presente, potrebbe essere un personaggio remoto (mod/admin vede altri)
    // oppure il personaggio corrente. Verifichiamo prima se è il personaggio corrente.
    const loadInventory = async () => {
      try {
        // Prima verifica se è il personaggio corrente
        const myChar = await api.get("/characters/me") as { id?: string };
        const isMyCharacter = myChar?.id === characterId;
        
        if (isMyCharacter) {
          // Se è il personaggio corrente, usa /me
          const data = await api.get("/inventory/me");
          setInventory(data as typeof inventory);
        } else {
          // Se è un altro personaggio, usa l'endpoint specifico (solo per mod/admin)
          const data = await api.get(`/inventory/character/${characterId}`);
          setInventory(data as typeof inventory);
        }
      } catch (e: any) {
        console.error("Errore caricamento inventario:", e);
        setInventory(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadInventory();
  }, [characterId]);

  const toggleEquip = async (inventoryId: string) => {
    try {
      await api.post(`/inventory/me/${inventoryId}/toggle-equip`, {});
      // Ricarica inventario
      const updated = await api.get("/inventory/me").then((d) => d as typeof inventory).catch(() => null);
      setInventory(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore");
    }
  };

  const removeItem = async (inventoryId: string) => {
    if (!confirm("Rimuovere questo oggetto dall'inventario?")) return;
    try {
      await api.delete(`/inventory/me/${inventoryId}`);
      // Ricarica inventario
      const updated = await api.get("/inventory/me").then((d) => d as typeof inventory).catch(() => null);
      setInventory(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore");
    }
  };

  const moveToHousing = async (inventoryId: string) => {
    try {
      await api.post(`/inventory/me/${inventoryId}/move-to-housing`, {});
      // Ricarica inventario
      const updated = await api.get("/inventory/me").then((d) => d as typeof inventory).catch(() => null);
      setInventory(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante lo spostamento in casa");
    }
  };

  const moveToCarry = async (inventoryId: string) => {
    try {
      await api.post(`/inventory/me/${inventoryId}/move-to-carry`, {});
      // Ricarica inventario
      const updated = await api.get("/inventory/me").then((d) => d as typeof inventory).catch(() => null);
      setInventory(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante lo spostamento nello zaino");
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 p-4">Caricamento inventario…</div>
    );
  }

  if (!inventory) {
    return (
      <div className="text-sm text-gray-500 p-4">Errore nel caricamento inventario.</div>
    );
  }

  // Separa gli oggetti in categorie videogame
  const carryItems = inventory.items.filter((inv) => inv.location === "CARRY");
  const housingItems = inventory.items.filter((inv) => inv.location === "HOUSING");

  const equippedItems = carryItems.filter(
    (inv) => inv.isEquipped && (inv.item.type === "WEAPON" || inv.item.type === "ARMOR" || inv.item.type === "ACCESSORY")
  );
  const equippedBag = carryItems.find((inv) => inv.isEquipped && inv.item.type === "BAG");
  const backpackItems = carryItems.filter(
    (inv) =>
      !inv.isEquipped &&
      inv.item.type !== "BAG" &&
      inv.item.type !== "WEAPON" &&
      inv.item.type !== "ARMOR" &&
      inv.item.type !== "ACCESSORY"
  );

  const renderItemCard = (inv: typeof inventory.items[0], showEquipButton = true, showLocationButtons = false) => (
    <div
      key={inv.id}
      className={`p-3 rounded-lg border transition-all ${
        inv.isEquipped
          ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 shadow-[0_0_8px_rgba(212,175,55,0.2)]"
          : "border-[var(--border-color)] bg-black/30 hover:border-[var(--border-color)]/80 hover:bg-black/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs font-display text-white truncate">
              {inv.item.name}
            </p>
            {inv.isEquipped && (
              <span className="text-[8px] uppercase tracking-wider text-[var(--accent-gold)] bg-[var(--accent-gold)]/20 px-1.5 py-0.5 rounded">
                EQP
              </span>
            )}
          </div>
          {inv.item.description && (
            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {inv.item.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-wider text-gray-600 bg-black/50 px-2 py-0.5 rounded">
              {inv.item.type}
            </span>
            {inv.quantity > 1 && (
              <span className="text-[9px] text-[var(--accent-violet)] font-display">
                x{inv.quantity}
              </span>
            )}
            {inv.item.slotsBonus > 0 && (
              <span className="text-[9px] text-[var(--accent-gold)]">
                +{inv.item.slotsBonus} slot
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {showEquipButton && (inv.item.type === "BAG" || inv.item.type === "WEAPON" || inv.item.type === "ARMOR" || inv.item.type === "ACCESSORY") && (
            <button
              type="button"
              onClick={() => toggleEquip(inv.id)}
              className="px-2.5 py-1 rounded border border-[var(--accent-gold)] text-[10px] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 transition-colors whitespace-nowrap"
              title={inv.isEquipped ? "Rimuovi equipaggiamento" : "Equipaggia"}
            >
              {inv.isEquipped ? "Rimuovi" : "Equip."}
            </button>
          )}
          {showLocationButtons && (
            <>
              {inv.location === "CARRY" ? (
                <button
                  type="button"
                  onClick={() => moveToHousing(inv.id)}
                  className="px-2 py-1 rounded border border-[var(--accent-violet)] text-[10px] text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/10 transition-colors whitespace-nowrap"
                  title="Deposita in casa"
                >
                  Casa
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => moveToCarry(inv.id)}
                  className="px-2 py-1 rounded border border-[var(--accent-gold)] text-[10px] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 transition-colors whitespace-nowrap"
                  title="Metti nello zaino"
                >
                  Zaino
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => removeItem(inv.id)}
            className="px-2 py-1 rounded border border-red-500/60 text-[10px] text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
            title="Rimuovi"
          >
            <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistiche slot */}
      <div className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] p-4">
        <div className={`grid grid-cols-2 ${inventory.slots.housingOccupied !== undefined ? 'md:grid-cols-3 lg:grid-cols-6' : 'md:grid-cols-4'} gap-3 text-xs`}>
          <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
              Slot Base
            </p>
            <p className="text-sm text-[var(--accent-gold)] font-display">
              {inventory.slots.baseSlots}
            </p>
          </div>
          <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
              Slot Zaino
            </p>
            <p className="text-sm text-[var(--accent-violet)] font-display">
              {inventory.slots.bagSlots}
            </p>
          </div>
          <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
              Occupati
            </p>
            <p className="text-sm text-white font-display">
              {inventory.slots.occupied}/{inventory.slots.totalSlots}
            </p>
          </div>
          <div className="bg-black/40 rounded-md border border-[var(--border-color)]/70 px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-display mb-1">
              Disponibili
            </p>
            <p className="text-sm text-[var(--accent-gold)] font-display">
              {inventory.slots.available}
            </p>
          </div>
        </div>
      </div>

      {/* Cose Indossate */}
      <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
        <header className="px-4 py-2.5 border-b border-[var(--border-color)]/70 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={icons.user} className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
            <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">
              Equipaggiamento Attivo
            </p>
          </div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-violet)] font-display">
            {equippedItems.length} oggetti
          </p>
        </header>
        <div className="p-4">
          {equippedItems.length === 0 ? (
            <div className="text-sm text-gray-500 italic text-center py-6">
              Nessun oggetto equipaggiato. Equipaggia armi, armature o accessori per vederli qui.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {equippedItems.map((inv) => renderItemCard(inv, true, false))}
            </div>
          )}
        </div>
      </section>

      {/* Zaino */}
      <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
        <header className="px-4 py-2.5 border-b border-[var(--border-color)]/70 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={icons.shop} className="w-3.5 h-3.5 text-[var(--accent-violet)]" />
            <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">
              Zaino {equippedBag ? `(${equippedBag.item.name})` : ""}
            </p>
          </div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-violet)] font-display">
            {backpackItems.length} oggetti
            {equippedBag && ` · ${inventory.slots.bagSlots} slot disponibili`}
          </p>
        </header>
        <div className="p-4">
          {!equippedBag ? (
            <div className="text-sm text-gray-500 italic text-center py-6">
              Nessuno zaino equipaggiato. Equipaggia un bag per utilizzare gli slot aggiuntivi.
            </div>
          ) : backpackItems.length === 0 ? (
            <div className="text-sm text-gray-500 italic text-center py-6">
              Zaino vuoto. Trascina qui gli oggetti per organizzarli.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {backpackItems.map((inv) => renderItemCard(inv, false, true))}
            </div>
          )}
        </div>
      </section>

      {/* Inventario Casa */}
      <section className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-color)] overflow-hidden shadow-[0_0_16px_rgba(0,0,0,0.6)]">
        <header className="px-4 py-2.5 border-b border-[var(--border-color)]/70 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={icons.ordine} className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
            <p className="text-[9px] uppercase tracking-[0.24em] text-gray-400 font-display">
              Inventario Abitazione
            </p>
          </div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--accent-violet)] font-display">
            {housingItems.length} oggetti
            {inventory.slots.housingSlots > 0 && ` · ${inventory.slots.housingSlots} slot disponibili`}
          </p>
        </header>
        <div className="p-4">
          {housingItems.length === 0 ? (
            <div className="text-sm text-gray-500 italic text-center py-6">
              Nessun oggetto depositato in casa. Gli oggetti depositati nella tua abitazione appariranno qui.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {housingItems.map((inv) => renderItemCard(inv, false, true))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Shop Content ───
type HousingTypeRow = {
  id: string;
  code: string;
  name: string;
  squareMeters: number;
  dailyRent: number | null;
  monthlyRent: number | null;
  hpBonus: number;
  inventorySlotsBonus: number;
  requirements: { paradisePass?: boolean } | null;
};
type CurrentHousingRow = {
  id: string;
  housingType: { id: string; code: string; name: string; dailyRent: number | null; monthlyRent: number | null };
  evicted: boolean;
} | null;

function ShopContent({ char, onCharUpdate }: { char?: CharacterSummary; onCharUpdate?: () => void }) {
  const [shopTab, setShopTab] = useState<"emporio" | "immobiliare">("emporio");
  const [shopItems, setShopItems] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    type: string;
    slotsBonus: number;
    price: number | null;
  }>>([]);
  const [inventory, setInventory] = useState<Array<{
    id: string;
    itemId: string;
    quantity: number;
    isEquipped: boolean;
    item: {
      id: string;
      name: string;
      type: string;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState<Record<string, number>>({});
  // Mercato immobiliare
  const [housingTypes, setHousingTypes] = useState<HousingTypeRow[]>([]);
  const [currentHousing, setCurrentHousing] = useState<CurrentHousingRow>(null);
  const [housingLoading, setHousingLoading] = useState(false);
  const [rentingId, setRentingId] = useState<string | null>(null);
  const [leavingHousing, setLeavingHousing] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/shop/items").then((d) => (Array.isArray(d) ? d : []) as typeof shopItems).catch(() => []),
      api.get("/inventory/me").then((d: { items?: unknown[] }) => {
        const items = Array.isArray(d?.items) ? d.items : [];
        return items as typeof inventory;
      }).catch(() => []),
      api.get("/housing/types").then((d) => (Array.isArray(d) ? d : []) as HousingTypeRow[]).catch(() => []),
      api.get("/housing/me").then((d) => d as CurrentHousingRow).catch(() => null),
    ])
      .then(([items, inv, types, housing]) => {
        setShopItems(items);
        setInventory(inv);
        setHousingTypes(types);
        setCurrentHousing(housing);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshHousing = useCallback(async () => {
    setHousingLoading(true);
    try {
      const [types, housing] = await Promise.all([
        api.get("/housing/types").then((d) => (Array.isArray(d) ? d : []) as HousingTypeRow[]).catch(() => []),
        api.get("/housing/me").then((d) => d as CurrentHousingRow).catch(() => null),
      ]);
      setHousingTypes(types);
      setCurrentHousing(housing);
    } finally {
      setHousingLoading(false);
    }
  }, []);

  const buyItem = async (itemId: string) => {
    setBuyingId(itemId);
    try {
      await api.post("/shop/buy", { itemId, quantity: 1 });
      // Ricarica inventario
      const updated = await api.get("/inventory/me").then((d: { items?: unknown[] }) => {
        const items = Array.isArray(d?.items) ? d.items : [];
        return items as typeof inventory;
      }).catch(() => []);
      setInventory(updated);
      // Aggiorna il personaggio per riflettere il nuovo saldo REM
      if (onCharUpdate) {
        onCharUpdate();
      }
      alert("Oggetto acquistato!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'acquisto");
    } finally {
      setBuyingId(null);
    }
  };

  const sellItem = async (inventoryId: string, price: number) => {
    if (!price || price <= 0) {
      alert("Inserisci un prezzo valido");
      return;
    }
    setSellingId(inventoryId);
    try {
      await api.post("/shop/sell", { inventoryId, price });
      // Ricarica inventario
      const updated = await api.get("/inventory/me").then((d: { items?: unknown[] }) => {
        const items = Array.isArray(d?.items) ? d.items : [];
        return items as typeof inventory;
      }).catch(() => []);
      setInventory(updated);
      // Aggiorna il personaggio per riflettere il nuovo saldo REM
      if (onCharUpdate) {
        onCharUpdate();
      }
      // Rimuovi il prezzo dal form
      setSellPrice((prev) => {
        const next = { ...prev };
        delete next[inventoryId];
        return next;
      });
      alert(`Oggetto venduto per ${price} REM!`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante la vendita");
    } finally {
      setSellingId(null);
    }
  };

  const handleRentHousing = async (housingTypeId: string) => {
    const type = housingTypes.find((t) => t.id === housingTypeId);
    const cost = type?.monthlyRent ?? type?.dailyRent ?? 0;
    const isSalary = type?.dailyRent != null && type.dailyRent > 0;
    const msg = isSalary
      ? `Vuoi assegnarti: ${type?.name}? (Detrazione giornaliera: ${type?.dailyRent} REM)`
      : `Vuoi affittare: ${type?.name}? Costo: ${cost} REM${type?.monthlyRent ? " mensili" : ""}`;
    if (!confirm(msg)) return;
    setRentingId(housingTypeId);
    try {
      await api.post("/housing/assign", { housingTypeId });
      await refreshHousing();
      if (onCharUpdate) onCharUpdate();
      alert("Operazione completata!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'assegnazione/affitto");
    } finally {
      setRentingId(null);
    }
  };

  const handleLeaveHousing = async () => {
    if (!confirm("Sei sicuro di voler lasciare la tua abitazione? Perderai l'accesso alla chat privata e le personalizzazioni.")) return;
    setLeavingHousing(true);
    try {
      await api.post("/housing/remove", {});
      setCurrentHousing(null);
      if (onCharUpdate) onCharUpdate();
      alert("Hai lasciato l'immobile.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'operazione");
    } finally {
      setLeavingHousing(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Tab: Emporio | Immobiliare (come vecchio Mercato) */}
      <div className="flex items-center gap-1 border-b border-[var(--border-color)] mb-2">
        <button
          type="button"
          onClick={() => setShopTab("emporio")}
          className={`px-4 py-2 text-xs uppercase tracking-wider font-display transition-colors border-b-2 -mb-px ${
            shopTab === "emporio"
              ? "text-[var(--accent-gold)] border-[var(--accent-gold)]"
              : "text-gray-500 border-transparent hover:text-gray-400"
          }`}
        >
          <FontAwesomeIcon icon={icons.shop} className="w-3 h-3 mr-1.5" />
          Emporio
        </button>
        <button
          type="button"
          onClick={() => setShopTab("immobiliare")}
          className={`px-4 py-2 text-xs uppercase tracking-wider font-display transition-colors border-b-2 -mb-px ${
            shopTab === "immobiliare"
              ? "text-[var(--accent-gold)] border-[var(--accent-gold)]"
              : "text-gray-500 border-transparent hover:text-gray-400"
          }`}
        >
          <FontAwesomeIcon icon={icons.home} className="w-3 h-3 mr-1.5" />
          Immobiliare
        </button>
      </div>

      {shopTab === "emporio" && (
        <>
          <div>
            <h3 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-1 font-display">Marketplace — Emporio</h3>
            <p className="text-xs text-gray-500 mb-4">
              Acquista oggetti per il tuo personaggio. Ogni oggetto occupa 1 slot nell'inventario.
            </p>
          </div>

          {shopItems.length === 0 ? (
            <p className="text-sm text-gray-500">Nessun oggetto disponibile nello shop.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {shopItems.map((item) => {
                const inInventory = inventory.find((inv) => inv.itemId === item.id);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded border border-[var(--border-color)] bg-black/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-white">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                        <div className="flex gap-2 mt-2 text-[10px] text-gray-600">
                          <span>Tipo: {item.type}</span>
                          {item.slotsBonus > 0 && <span>+{item.slotsBonus} slot</span>}
                        </div>
                        {item.price != null && (
                          <p className="text-xs text-[var(--accent-gold)] mt-1">
                            Prezzo: {item.price} REM
                          </p>
                        )}
                        {item.price == null && (
                          <p className="text-[10px] text-gray-600 mt-1">Non in vendita</p>
                        )}
                        {inInventory && (
                          <p className="text-[10px] text-[var(--accent-gold)] mt-1">
                            In inventario: x{inInventory.quantity}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => buyItem(item.id)}
                        disabled={Boolean(buyingId !== null || item.price === null || item.price === undefined || (char ? (char.rem ?? 0) < (item.price ?? 0) : false))}
                        className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={item.price == null ? "Non in vendita" : (char && (char.rem ?? 0) < (item.price ?? 0)) ? "Saldo insufficiente" : "Acquista"}
                      >
                        {buyingId === item.id ? "…" : item.price == null ? "N/D" : "Acquista"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border-color)]">
            <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Il tuo Inventario</h4>
            {inventory.length === 0 ? (
              <p className="text-sm text-gray-500">Nessun oggetto nell'inventario.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {inventory.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between text-xs py-2 border-b border-[var(--border-color)] last:border-0">
                    <div className="flex-1 min-w-0">
                      <span>
                        {inv.item.name}
                        {inv.quantity > 1 && ` x${inv.quantity}`}
                        {inv.isEquipped && <span className="text-[var(--accent-gold)] ml-1">[E]</span>}
                      </span>
                    </div>
                    {!inv.isEquipped && (
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Prezzo"
                          value={sellPrice[inv.id] ?? ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setSellPrice((prev) => ({
                              ...prev,
                              [inv.id]: isNaN(val) ? 0 : val,
                            }));
                          }}
                          className="w-20 px-2 py-1 rounded border border-[var(--border-color)] bg-black/50 text-xs text-white placeholder-gray-500 focus:border-[var(--accent-gold)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => sellItem(inv.id, sellPrice[inv.id] ?? 0)}
                          disabled={sellingId !== null || !sellPrice[inv.id] || sellPrice[inv.id] <= 0}
                          className="px-2 py-1 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sellingId === inv.id ? "…" : "Vendi"}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {shopTab === "immobiliare" && (
        <div className="space-y-4">
          <div className="text-center border-b border-[var(--border-color)] pb-3 mb-3">
            <h3 className="text-lg font-display text-[var(--accent-gold)] flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={icons.home} />
              Mercato Immobiliare
            </h3>
            <p className="text-xs text-gray-500 italic mt-1">
              Un tetto sicuro è il primo passo verso il potere. Scegli con saggezza.
            </p>
          </div>

          {currentHousing && !currentHousing.evicted && (
            <div className="p-3 rounded border border-red-500/60 bg-red-500/10 flex items-center justify-between gap-3">
              <p className="text-sm text-red-100">
                <strong>Proprietà attiva:</strong> Risiedi in <strong>{currentHousing.housingType.name}</strong>.
                Per cambiare abitazione, rescindi prima il contratto.
              </p>
              <button
                type="button"
                onClick={handleLeaveHousing}
                disabled={leavingHousing}
                className="px-3 py-2 rounded border border-red-400 text-red-200 text-xs font-display uppercase tracking-wider hover:bg-red-500/20 disabled:opacity-50 shrink-0"
              >
                {leavingHousing ? "…" : "Lascia immobile"}
              </button>
            </div>
          )}

          {housingLoading ? (
            <p className="text-sm text-gray-500">Caricamento listino…</p>
          ) : housingTypes.length === 0 ? (
            <p className="text-sm text-gray-500">Nessuna tipologia di abitazione disponibile.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {housingTypes.map((type) => {
                const isSalary = type.dailyRent != null && type.dailyRent > 0;
                const costRem = type.monthlyRent ?? type.dailyRent ?? 0;
                const rem = char?.rem ?? 0;
                const canAfford = isSalary || rem >= costRem;
                const isMyHouse = currentHousing && !currentHousing.evicted && currentHousing.housingType.id === type.id;
                const hasOtherHouse = currentHousing && !currentHousing.evicted && currentHousing.housingType.id !== type.id;
                let btnLabel: string;
                let disabled = false;
                let isOwned = false;
                if (isMyHouse) {
                  btnLabel = isSalary ? "Assegnato" : "Contratto firmato";
                  disabled = true;
                  isOwned = true;
                } else if (hasOtherHouse) {
                  btnLabel = "Non disponibile";
                  disabled = true;
                } else {
                  btnLabel = isSalary ? "Assegnazione" : "Firma contratto";
                  disabled = !canAfford || rentingId !== null;
                }
                return (
                  <div
                    key={type.id}
                    className={`p-4 rounded border flex flex-col gap-3 ${
                      isMyHouse
                        ? "border-green-500/60 bg-green-500/10"
                        : "border-[var(--border-color)] bg-black/20"
                    }`}
                  >
                    <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-2">
                      <h4 className="font-display text-sm text-[var(--accent-violet)]">{type.name}</h4>
                      <div className="text-right">
                        <span className="text-[var(--accent-gold)] font-mono font-bold block">
                          {costRem} REM
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase">
                          {isSalary ? "Detrazione" : "Mensile"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 flex-1">
                      {type.squareMeters} m²
                      {type.requirements?.paradisePass && " · Richiede Paradise Pass"}
                    </p>
                    <div className="flex justify-between text-xs py-2 px-3 rounded bg-black/30 border border-[var(--border-color)]">
                      <span className="text-[var(--accent-gold)]">+{type.inventorySlotsBonus} slot</span>
                      <span className="text-red-400/90">+{type.hpBonus} PF</span>
                    </div>
                    {isOwned ? (
                      <div className="py-2 px-3 rounded border border-green-500/50 text-green-400 text-xs font-display text-center flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={icons.check} />
                        {btnLabel}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !disabled && handleRentHousing(type.id)}
                        disabled={disabled}
                        className="py-2 px-3 rounded border border-[var(--accent-violet)] text-[var(--accent-violet)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-violet)]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {rentingId === type.id ? "…" : btnLabel}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
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

// ─── Waza Content ───
function WazaContent({ char }: { char?: CharacterSummary }) {
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!char?.id) {
      setLoading(false);
      return;
    }
    api
      .get(`/characters/${char.id}/waza`)
      .then((d) => {
        setSkills(Array.isArray(d) ? d : []);
      })
      .catch(() => setSkills([]))
      .finally(() => setLoading(false));
  }, [char?.id]);

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-3 font-display">
          Waza / Skill Operative
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Le tue abilità apprese con nome, rango e costo in Kotodama.
        </p>
      </div>

      {skills.length === 0 ? (
        <div className="text-sm text-gray-500 italic p-4 bg-black/20 rounded border border-[var(--border-color)]">
          Nessuna Waza registrata. Le abilità apprese appariranno qui con nome, rango e costo in Kotodama.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)]/70 bg-black/40">
                <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                  Nome
                </th>
                <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                  Rango
                </th>
                <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                  Costo KOT
                </th>
                <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                  Tipo
                </th>
                <th className="px-3 py-2 text-left font-normal text-[9px] uppercase tracking-[0.18em] text-gray-500">
                  Livello
                </th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s, idx) => {
                const getTypeColor = (type: string) => {
                  switch (type?.toUpperCase()) {
                    case 'OFFENSIVE':
                    case 'ATTACK':
                      return 'text-red-400 bg-red-500/20 border-red-500/40';
                    case 'DEFENSIVE':
                    case 'DEFENSE':
                      return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
                    case 'SUPPORT':
                    case 'HEAL':
                      return 'text-green-400 bg-green-500/20 border-green-500/40';
                    case 'UTILITY':
                    case 'BUFF':
                      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
                    default:
                      return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
                  }
                };
                return (
                  <tr
                    key={s.id || idx}
                    className="border-b border-[var(--border-color)]/40 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-3 py-2 text-[11px] text-gray-100 font-display">{s.name}</td>
                    <td className="px-3 py-2 text-[11px] text-gray-300">{s.rank ?? "-"}</td>
                    <td className="px-3 py-2 text-[11px] text-[var(--accent-violet)] font-display">
                      {s.costKotodama ?? s.kotCost ?? "-"} KOT
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      <span className={`px-2 py-0.5 rounded border text-[10px] ${getTypeColor(s.type ?? '')}`}>
                        {s.type ?? "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-[var(--accent-gold)] font-display">
                      {s.level ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Ordine Content ───
function OrdineContent({ char }: { char?: CharacterSummary }) {
  const [orderInfo, setOrderInfo] = useState<{
    name?: string;
    description?: string;
    members?: Array<{ id: string; name: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!char?.id) {
      setLoading(false);
      return;
    }
    // TODO: Implementare API endpoint per informazioni ordine
    // Per ora mostra informazioni dal character
    setOrderInfo({
      name: (char as any).order || "Nessun ordine",
      description: (char as any).orderDescription || "Non appartieni a nessun ordine.",
      members: [],
    });
    setLoading(false);
  }, [char?.id]);

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-3 font-display">
          Ordine
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Informazioni sul tuo ordine e i suoi membri.
        </p>
      </div>

      {orderInfo ? (
        <div className="space-y-4">
          <div className="p-4 rounded border border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/10">
            <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-1">Nome Ordine</p>
            <p className="text-lg font-display text-white">{orderInfo.name}</p>
          </div>

          {orderInfo.description && (
            <div className="p-4 rounded border border-[var(--border-color)] bg-black/20">
              <p className="text-xs text-gray-400">{orderInfo.description}</p>
            </div>
          )}

          {orderInfo.members && orderInfo.members.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
                Membri
              </h4>
              <ul className="space-y-2">
                {orderInfo.members.map((member) => (
                  <li
                    key={member.id}
                    className="p-2 rounded border border-[var(--border-color)] bg-black/20 text-xs text-gray-300"
                  >
                    {member.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic p-4 bg-black/20 rounded border border-[var(--border-color)]">
          Nessuna informazione disponibile sull'ordine.
        </div>
      )}
    </div>
  );
}

// ─── Bestiario Content ───
function BestiarioContent({ char }: { char?: CharacterSummary }) {
  const [creatures, setCreatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implementare API endpoint per bestiario
    // Per ora mostra placeholder
    setLoading(false);
    setCreatures([]);
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento…</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-3 font-display">
          Bestiario
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Registro delle creature incontrate durante le tue avventure.
        </p>
      </div>

      {creatures.length === 0 ? (
        <div className="text-sm text-gray-500 italic p-4 bg-black/20 rounded border border-[var(--border-color)]">
          Nessuna creatura registrata nel bestiario. Le creature incontrate durante le quest appariranno qui.
        </div>
      ) : (
        <div className="space-y-3">
          {creatures.map((creature) => (
            <div
              key={creature.id}
              className="p-4 rounded border border-[var(--border-color)] bg-black/20"
            >
              <h4 className="font-display text-sm text-white mb-2">{creature.name}</h4>
              {creature.description && (
                <p className="text-xs text-gray-400">{creature.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
