"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import Image from "next/image";
import { api } from "@/lib/api";
import { formatNarrativeText } from "@/lib/narrative-parser";
import { getPixelIconUrlRuolo, getPixelIconUrlOrdine, type PixelIconRuolo, type PixelIconOrdine } from "@/components/dashboard/pixel-icons";

type Quest = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string | null;
  status: string;
  participantCount: number;
};
type Participant = { id: string; characterId: string; characterName: string };
type Reward = { id: string; characterId: string; characterName: string; type: string; value: number | null; description: string | null };
type VoteAgg = { characterId: string; characterName: string; votes: number };
type QuestMessage = {
  id: string;
  zone: string;
  characterId: string;
  name: string;
  surname: string | null;
  miniAvatar: string | null;
  content: string;
  locationTag: string | null;
  createdAt: string;
  pixelIcons?: { ruolo?: string[]; ordine?: string[] };
};

export default function QuestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const [quest, setQuest] = useState<Quest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [votes, setVotes] = useState<VoteAgg[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addRewardChar, setAddRewardChar] = useState("");
  const [addRewardType, setAddRewardType] = useState<"EXP" | "REM" | "ITEM" | "CUSTOM">("EXP");
  const [addRewardVal, setAddRewardVal] = useState("");
  const [votedFor, setVotedFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [showReadModal, setShowReadModal] = useState(false);
  const [questMessages, setQuestMessages] = useState<QuestMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [q, p, r, v] = await Promise.all([
        api.get(`/quests/${id}`),
        api.get(`/quests/${id}/participants`),
        api.get(`/quests/${id}/rewards`),
        api.get(`/quests/${id}/votes`),
      ]);
      setQuest(q as Quest);
      setParticipants(Array.isArray(p) ? p : []);
      setRewards(Array.isArray(r) ? r : []);
      setVotes(Array.isArray(v) ? v : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/auth");
      return;
    }
    api.get("/characters/me")
      .then((c: { id?: string }) => setMyId(c?.id ?? null))
      .catch(() => {});
    load();
  }, [router, load]);

  const participate = async () => {
    if (!id || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/quests/${id}/participate`, {});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  };

  const addReward = async () => {
    if (!id || !addRewardChar || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/quests/${id}/rewards`, {
        characterId: addRewardChar,
        type: addRewardType,
        value: addRewardType === "EXP" || addRewardType === "REM" ? Number(addRewardVal) || 0 : undefined,
        description: addRewardType === "CUSTOM" || addRewardType === "ITEM" ? addRewardVal : undefined,
      });
      setAddRewardChar("");
      setAddRewardVal("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  };

  const vote = async () => {
    if (!id || !votedFor || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post(`/quests/${id}/vote`, { votedFor });
      setVotedFor("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  };

  const closeQuest = async () => {
    if (!id || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.patch(`/quests/${id}/status`, { status: "CLOSED" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  };

  const loadQuestMessages = useCallback(async () => {
    if (!id) return;
    setLoadingMessages(true);
    try {
      const messages = await api.get(`/quests/${id}/messages`) as QuestMessage[];
      setQuestMessages(messages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore caricamento messaggi");
    } finally {
      setLoadingMessages(false);
    }
  }, [id]);

  const openReadModal = async () => {
    setShowReadModal(true);
    await loadQuestMessages();
  };

  if (loading || !quest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loading ? "Caricamento…" : "Quest non trovata."}
      </div>
    );
  }

  const amCreator = myId === quest.creatorId;
  const amParticipant = participants.some((x) => x.characterId === myId);
  const isClosed = quest.status === "CLOSED";

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/shinigami" className="text-sm text-gray-400 hover:text-[var(--accent-gold)]">← Shinigami</Link>
      </div>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl text-[var(--accent-gold)] mb-2">{quest.title}</h1>
          <p className="text-sm text-gray-500 mb-4">
            di {quest.creatorName} · {quest.status} · {quest.participantCount} partecipanti
          </p>
        </div>
        <button
          onClick={openReadModal}
          className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 text-sm"
        >
          Leggi
        </button>
      </div>
      {quest.description && <p className="text-sm text-gray-400 mb-4">{quest.description}</p>}

      <section className="border border-[var(--border-color)] rounded-lg p-4 mb-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-2">Partecipanti</h2>
        <ul className="space-y-1 text-sm">
          {participants.map((p) => (
            <li key={p.id}>{p.characterName}</li>
          ))}
        </ul>
        {!isClosed && !amParticipant && (
          <button onClick={participate} disabled={busy} className="mt-2 px-3 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 text-sm">
            Registra giocata
          </button>
        )}
      </section>

      <section className="border border-[var(--border-color)] rounded-lg p-4 mb-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-2">Tabellario premi</h2>
        <ul className="space-y-1 text-sm">
          {rewards.map((r) => (
            <li key={r.id}>
              {r.characterName}: {r.type}
              {r.value != null ? ` +${r.value}` : ""}
              {r.description ? ` — ${r.description}` : ""}
            </li>
          ))}
        </ul>
        {amCreator && !isClosed && participants.length > 0 && (
          <form onSubmit={(e) => { e.preventDefault(); addReward(); }} className="mt-3 flex flex-wrap gap-2">
            <select value={addRewardChar} onChange={(e) => setAddRewardChar(e.target.value)} className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-sm">
              <option value="">Personaggio</option>
              {participants.map((p) => (
                <option key={p.characterId} value={p.characterId}>{p.characterName}</option>
              ))}
            </select>
            <select value={addRewardType} onChange={(e) => setAddRewardType(e.target.value as "EXP" | "REM" | "ITEM" | "CUSTOM")} className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-sm">
              <option value="EXP">EXP</option>
              <option value="REM">REM</option>
              <option value="ITEM">ITEM</option>
              <option value="CUSTOM">CUSTOM</option>
            </select>
            <input
              type="text"
              value={addRewardVal}
              onChange={(e) => setAddRewardVal(e.target.value)}
              placeholder={addRewardType === "EXP" || addRewardType === "REM" ? "Valore" : "Descrizione"}
              className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-sm w-24"
            />
            <button type="submit" disabled={busy} className="px-3 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-sm">Aggiungi</button>
          </form>
        )}
      </section>

      <section className="border border-[var(--border-color)] rounded-lg p-4 mb-4">
        <h2 className="text-sm uppercase tracking-wider text-[var(--accent-gold)] mb-2">Let this character shine!</h2>
        <ul className="space-y-1 text-sm">
          {votes.map((v) => (
            <li key={v.characterId}>{v.characterName}: {v.votes} voti</li>
          ))}
        </ul>
        {!isClosed && amParticipant && participants.length > 1 && (
          <form onSubmit={(e) => { e.preventDefault(); vote(); }} className="mt-3 flex flex-wrap gap-2">
            <select value={votedFor} onChange={(e) => setVotedFor(e.target.value)} className="px-2 py-1 rounded border border-[var(--border-color)] bg-black/40 text-sm">
              <option value="">Vota per…</option>
              {participants.filter((p) => p.characterId !== myId).map((p) => (
                <option key={p.characterId} value={p.characterId}>{p.characterName}</option>
              ))}
            </select>
            <button type="submit" disabled={busy || !votedFor} className="px-3 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-sm">Vota</button>
          </form>
        )}
      </section>

      {amCreator && !isClosed && (
        <button onClick={closeQuest} disabled={busy} className="px-4 py-2 rounded border border-red-500/60 text-red-400 hover:bg-red-500/10">
          Chiudi quest
        </button>
      )}

      {/* Modal Leggi */}
      {showReadModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg w-full max-w-5xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <h2 className="font-display text-lg text-[var(--accent-gold)]">Registrazione Quest: {quest.title}</h2>
              <button
                onClick={() => {
                  setShowReadModal(false);
                  setQuestMessages([]);
                }}
                className="text-gray-400 hover:text-[var(--accent-gold)]"
              >
                ✕
              </button>
            </div>
            
            {/* Contenuto messaggi */}
            <div
              className="flex-1 overflow-y-auto p-10"
              style={{
                backgroundImage: "url('/backgrounds/darkstone.png')",
                backgroundRepeat: 'repeat',
                backgroundBlendMode: 'overlay',
                backgroundColor: 'rgba(0,0,0,0.6)',
              }}
            >
              {loadingMessages ? (
                <p className="text-gray-400 text-center">Caricamento messaggi...</p>
              ) : questMessages.length === 0 ? (
                <p className="text-gray-400 text-center">Nessun messaggio disponibile.</p>
              ) : (
                questMessages.map((m) => (
                  <QuestMessageBlock key={m.id} message={m} />
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Componente per renderizzare un messaggio della quest (identico a ChatMessageBlock)
function QuestMessageBlock({ message }: { message: QuestMessage }) {
  const formattedContent = formatNarrativeText(message.content);
  const isGlobal = message.zone === "GLOBAL" || message.name.startsWith("[GLOBAL]");
  
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
