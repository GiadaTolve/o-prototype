"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import { useSmsRealtime } from "@/hooks/useSmsRealtime";

const MOBILE_SMS_MAX_LENGTH = 500;

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

type Props = {
  onUnreadChange?: () => void;
  initialTargetCharacterId?: { id: string; name: string };
  /** split = desktop due colonne; stack = mobile lista ↔ thread */
  variant?: "split" | "stack";
};

export function SmsPanel({
  onUnreadChange,
  initialTargetCharacterId,
  variant = "split",
}: Props) {
  const isStack = variant === "stack";
  const maxMessageLength = isStack ? MOBILE_SMS_MAX_LENGTH : 2000;

  const onUnreadChangeRef = useRef(onUnreadChange);
  useEffect(() => {
    onUnreadChangeRef.current = onUnreadChange;
  }, [onUnreadChange]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [selectedOther, setSelectedOther] = useState<{ id: string; name: string; miniAvatar: string | null } | null>(null);
  const [newMode, setNewMode] = useState(false);
  const [characterList, setCharacterList] = useState<CharacterListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const SMS_CACHE_KEY = "oyasumi-sms-conversations-cache";

  const fetchConversations = useCallback(async () => {
    try {
      const list = (await api.get("/sms/conversations")) as Conversation[];
      const normalized = Array.isArray(list) ? list : [];
      setConversations(normalized);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(SMS_CACHE_KEY, JSON.stringify(normalized));
        }
      } catch {
        // ignore localStorage errors
      }
    } catch {
      try {
        if (typeof window !== "undefined") {
          const cached = window.localStorage.getItem(SMS_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as unknown;
            setConversations(Array.isArray(parsed) ? parsed : []);
            return;
          }
        }
      } catch {
        // ignore
      }
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    (async () => {
      try {
        const char = (await api.get("/characters/me")) as { id?: string };
        if (char?.id) setMyCharacterId(char.id);
      } catch {
        // ignore
      }
    })();
  }, [fetchConversations]);

  useEffect(() => {
    if (initialTargetCharacterId?.id && initialTargetCharacterId?.name) {
      setNewMode(false);
      setSelectedOther({
        id: initialTargetCharacterId.id,
        name: initialTargetCharacterId.name,
        miniAvatar: null,
      });
    }
  }, [initialTargetCharacterId?.id, initialTargetCharacterId?.name]);

  useSmsRealtime({
    myCharacterId,
    onNewMessage: (msg) => {
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
      fetchConversations();
      onUnreadChangeRef.current?.();
    },
    onUnreadUpdate: () => {
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
        try {
          await api.post(`/sms/thread/${selectedOther.id}/read`, {});
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
    return () => {
      ok = false;
    };
  }, [selectedOther?.id, fetchConversations]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [thread]);

  const openNew = useCallback(() => {
    setNewMode(true);
    setSelectedOther(null);
    setThread([]);
    setSearchQuery("");
    setCharacterList([]);
  }, []);

  const backToList = useCallback(() => {
    setNewMode(false);
    setSelectedOther(null);
    setThread([]);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    if (!newMode || !myCharacterId) return;
    const t = setTimeout(() => {
      setSearchLoading(true);
      const q = searchQuery.trim();
      api
        .get(`/characters/search${q ? `?q=${encodeURIComponent(q)}` : ""}`)
        .then((list: unknown) => setCharacterList(Array.isArray(list) ? (list as CharacterListItem[]) : []))
        .catch(() => setCharacterList([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [newMode, myCharacterId, searchQuery]);

  const pickOther = useCallback((c: CharacterListItem) => {
    setNewMode(false);
    setSelectedOther({ id: c.id, name: c.name, miniAvatar: c.miniAvatar });
  }, []);

  const selectConversation = useCallback((c: Conversation) => {
    setNewMode(false);
    setSelectedOther({ id: c.otherId, name: c.otherName, miniAvatar: c.otherMiniAvatar });
  }, []);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.otherName ?? "").toLowerCase().includes(q) || (c.lastMessage ?? "").toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !selectedOther || sending) return;
    setSending(true);
    const originalInput = input;
    setInput("");
    try {
      await api.post("/sms/send", { recipientId: selectedOther.id, content: text });
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

  const showList = !isStack || !selectedOther;
  const showThread = !isStack || Boolean(selectedOther);

  const conversationList = (
    <aside className={`flex flex-col min-h-0 ${isStack ? "flex-1" : "border-r border-[var(--border-color)]"}`}>
      <div className="shrink-0 flex items-center gap-2 border-b border-[var(--border-color)]">
        {newMode ? (
          <button
            type="button"
            onClick={backToList}
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
      <div className="shrink-0 px-3 py-2 border-b border-[var(--border-color)]">
        <div className="relative">
          <FontAwesomeIcon
            icon={icons.search}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"
          />
          <input
            type="search"
            placeholder={newMode ? "Cerca personaggio…" : "Filtra conversazioni…"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-black/40 border border-[var(--border-color)] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-gold)]/50"
            aria-label={newMode ? "Cerca personaggio" : "Filtra conversazioni"}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading && !newMode ? (
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
            {characterList.length === 0 && (
              <li className="px-4 py-6 text-xs text-gray-500">
                {searchLoading ? "Ricerca…" : searchQuery.trim() ? "Nessun personaggio trovato." : "Digita per cercare un personaggio."}
              </li>
            )}
          </ul>
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {filteredConversations.map((c) => (
              <li key={c.otherId}>
                <button
                  type="button"
                  onClick={() => selectConversation(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 ${
                    selectedOther?.id === c.otherId && !isStack ? "bg-[var(--accent-gold)]/10" : ""
                  }`}
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
            {filteredConversations.length === 0 && !loading && (
              <li className="px-4 py-6 text-xs text-gray-500">
                {searchQuery.trim() ? "Nessuna conversazione trovata." : "Nessuna conversazione. Avviane una nuova."}
              </li>
            )}
          </ul>
        )}
      </div>
    </aside>
  );

  const threadPanel = (
    <div className={`flex flex-col min-h-0 min-w-0 ${isStack ? "flex-1" : ""}`}>
      {selectedOther ? (
        <>
          <div className="shrink-0 px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {isStack && (
                <button
                  type="button"
                  onClick={backToList}
                  className="shrink-0 p-2 -ml-1 text-gray-400 hover:text-[var(--accent-gold)]"
                  aria-label="Torna alle conversazioni"
                >
                  <FontAwesomeIcon icon={icons.back} className="w-4 h-4" />
                </button>
              )}
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-[var(--border-color)] overflow-hidden flex items-center justify-center shrink-0">
                {selectedOther.miniAvatar ? (
                  <img src={selectedOther.miniAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FontAwesomeIcon icon={icons.user} className="w-3 h-3 text-gray-500" />
                )}
              </div>
              <span className="font-display text-sm text-white truncate">{selectedOther.name}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!selectedOther || !confirm(`Cancellare tutta la conversazione con ${selectedOther.name}? Questa azione non può essere annullata.`)) return;
                try {
                  await api.delete(`/sms/thread/${selectedOther.id}`);
                  backToList();
                  await fetchConversations();
                  onUnreadChange?.();
                } catch {
                  alert("Errore durante la cancellazione della conversazione.");
                }
              }}
              className="shrink-0 px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded border border-red-500/30 hover:border-red-500/50 transition-colors flex items-center gap-1"
              title="Cancella chat"
            >
              <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
              {!isStack && "Cancella chat"}
            </button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {loadingThread ? (
              <p className="text-xs text-gray-500 text-center py-4">Caricamento messaggi…</p>
            ) : (
              <>
                {thread.map((m) => (
                  <div key={m.id} className={`flex ${m.isOutgoing ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        m.isOutgoing
                          ? "bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/40 text-right"
                          : "bg-black/40 border border-[var(--border-color)]"
                      }`}
                    >
                      <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{m.content}</p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(m.createdAt).toLocaleString("it-IT", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="shrink-0 flex flex-col gap-1 p-3 border-t border-[var(--border-color)]"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, maxMessageLength))}
                placeholder="Scrivi un messaggio…"
                maxLength={maxMessageLength}
                className="flex-1 min-w-0 bg-black/50 border border-[var(--border-color)] rounded px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-[var(--accent-gold)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-4 py-2.5 rounded border border-[var(--border-color)] text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={icons.send} className="w-4 h-4" />
              </button>
            </div>
            {isStack && (
              <p className={`text-[10px] text-right ${input.length >= maxMessageLength ? "text-[var(--accent-gold)]" : "text-gray-500"}`}>
                {input.length}/{maxMessageLength}
              </p>
            )}
          </form>
        </>
      ) : (
        !isStack && (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            {newMode ? "Seleziona un personaggio" : "Seleziona una conversazione o avviane una nuova"}
          </div>
        )
      )}
    </div>
  );

  return (
    <div
      className={`flex flex-1 min-h-0 ${
        isStack ? "flex-col h-full" : "grid grid-cols-1 lg:grid-cols-[1fr_1.2fr]"
      }`}
    >
      {showList && conversationList}
      {showThread && threadPanel}
    </div>
  );
}
