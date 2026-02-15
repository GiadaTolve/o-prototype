"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

type ForumBoard = {
  id: string;
  name: string;
  description?: string;
  section?: { id: string; name: string };
  topics: ForumTopic[];
};

type ForumTopic = {
  id: string;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  postCount: number;
  lastPostTimestamp: string;
  lastPostAuthor: string;
  hasNewPosts?: boolean;
  author: {
    name: string;
    surname?: string;
    miniAvatar?: string;
  };
};

export default function BachecaPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<ForumBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [canAccessGestione, setCanAccessGestione] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    fetchBoardData();
    // Verifica permessi admin
    const checkPermissions = async () => {
      try {
        const char = (await api.get("/characters/me")) as { canAccessGestione?: boolean };
        setCanAccessGestione(char?.canAccessGestione ?? false);
      } catch (e) {
        console.error("Errore verifica permessi:", e);
      }
    };
    checkPermissions();
  }, [boardId]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const data = (await api.get(`/forum/bacheca/${boardId}`)) as ForumBoard;
      setBoard(data);
    } catch (error) {
      console.error("Errore caricamento bacheca:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const handlePinToggle = async (topicId: string, newPinStatus: boolean) => {
    try {
      await api.put(`/admin/forum/topics/${topicId}/pin`, { is_pinned: newPinStatus });
      await fetchBoardData();
    } catch (error) {
      console.error("Errore pin:", error);
      alert("Errore durante il pin del topic.");
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Eliminare questo topic? Questa azione non può essere annullata.")) return;
    try {
      await api.delete(`/admin/forum/topics/${topicId}`);
      await fetchBoardData();
    } catch (error) {
      console.error("Errore eliminazione:", error);
      alert("Errore durante l'eliminazione del topic.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] flex items-center justify-center">
        <p className="text-red-400">Bacheca non trovata</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[rgba(11,11,17,0.98)] rounded-lg flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-[var(--accent-violet)]/20">
      {/* Header */}
      <div
        className="px-8 py-5 border-b border-[var(--accent-violet)]/30 flex justify-between items-center flex-shrink-0"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)), url('/backgrounds/cloudy.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex flex-col gap-1">
          <Link href="/forum" className="text-gray-400 text-xs font-display mb-1 inline-block hover:text-[var(--accent-gold)] transition-colors">
            ← TORNA AL FORUM
          </Link>
          <h1 className="font-display text-[#c9a84a] text-[2.2rem] m-0 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">{board.name}</h1>
          {board.description && (
            <p className="font-sans text-gray-300 text-sm italic mt-1">{board.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowNewTopicForm(true)}
          className="px-5 py-2.5 border border-[var(--accent-violet)] rounded cursor-pointer bg-[var(--accent-violet)]/15 text-[#e6e0ff] font-display font-bold transition-all hover:bg-[var(--accent-violet)]/25"
        >
          NUOVA DISCUSSIONE
        </button>
      </div>

      {/* Lista Topic */}
      <div
        className="flex-grow overflow-y-auto p-0"
        style={{
          backgroundImage: "url('/backgrounds/darkstone.png')",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "overlay",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
      >
        {board.topics.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessuna discussione ancora.</div>
        ) : (
          <div>
            {board.topics.map((topic) => (
              <div
                key={topic.id}
                className="grid grid-cols-[50px_1fr_120px_220px] items-center border-b border-white/5 px-2.5 py-4 transition-colors cursor-pointer hover:bg-[var(--accent-violet)]/5"
                onClick={() => router.push(`/forum/topic/${topic.id}`)}
              >
                {/* Icona */}
                <div className="flex justify-center items-center">
                  {topic.isPinned ? (
                    <FontAwesomeIcon icon={icons.pin} className="text-[var(--accent-gold)] w-5 h-5" title="Topic fissato" />
                  ) : topic.isLocked ? (
                    <FontAwesomeIcon icon={icons.lock} className="text-gray-500 w-5 h-5" title="Topic bloccato" />
                  ) : topic.hasNewPosts ? (
                    <FontAwesomeIcon icon={icons.circleDot} className="text-[var(--accent-gold)] w-4 h-4" title="Nuovi messaggi" />
                  ) : (
                    <FontAwesomeIcon icon={icons.file} className="text-gray-500 w-5 h-5" title="Topic normale" />
                  )}
                </div>

                {/* Info Topic */}
                <div className="pr-4 flex flex-col gap-1">
                  <Link
                    href={`/forum/topic/${topic.id}`}
                    className="text-[#e6e0ff] text-base font-bold font-display flex items-center gap-2 hover:text-[var(--accent-gold)] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {topic.title}
                  </Link>
                  <div className="text-[11px] text-gray-500 font-sans">
                    Iniziato da <span className="text-[var(--accent-gold)] font-bold">{topic.author.name}{topic.author.surname ? ` ${topic.author.surname}` : ""}</span> • {formatDate(topic.createdAt)}
                  </div>
                </div>

                {/* Statistiche */}
                <div className="text-center text-xs text-gray-600">
                  <div className="text-sm text-[#e6e0ff]">{Math.max(0, topic.postCount - 1)}</div>
                  <div>RISPOSTE</div>
                </div>

                {/* Ultimo Post */}
                <div className="text-[11px] text-gray-500 text-right pr-2.5">
                  <div>{formatDate(topic.lastPostTimestamp)}</div>
                  <div>
                    di <span className="text-[var(--accent-violet)] font-bold">{topic.lastPostAuthor || "N/A"}</span>
                  </div>
                  {canAccessGestione && (
                    <div className="flex justify-end gap-1 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinToggle(topic.id, !topic.isPinned);
                        }}
                        className="bg-transparent border border-white/10 p-1 rounded cursor-pointer flex items-center justify-center transition-all hover:border-[var(--accent-gold)] text-gray-400 hover:text-[var(--accent-gold)]"
                        title={topic.isPinned ? "Togli Pin" : "Fissa in alto"}
                      >
                        <FontAwesomeIcon icon={icons.pin} className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(topic.id);
                        }}
                        className="bg-transparent border border-white/10 p-1 rounded cursor-pointer flex items-center justify-center transition-all hover:border-red-500 text-gray-400 hover:text-red-500"
                        title="Elimina"
                      >
                        <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nuovo Topic */}
      {showNewTopicForm && (
        <NewTopicForm
          boardId={boardId}
          onClose={() => {
            setShowNewTopicForm(false);
            fetchBoardData();
          }}
          onTopicCreated={() => {
            setShowNewTopicForm(false);
            fetchBoardData();
          }}
        />
      )}
    </div>
  );
}

// ─── Form Nuovo Topic ───
function NewTopicForm({
  boardId,
  onClose,
  onTopicCreated,
}: {
  boardId: string;
  onClose: () => void;
  onTopicCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + openTag + selectedText + closeTag + content.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, end + openTag.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Titolo e contenuto sono obbligatori.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await api.post("/forum/topics", { bacheca_id: boardId, titolo: title, testo: content });
      onTopicCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore durante la creazione della discussione.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex justify-center items-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[700px] bg-[#111] border border-[var(--accent-violet)] rounded-lg p-8 shadow-[0_0_30px_rgba(162,112,255,0.3)] flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-[#c9a84a] text-center mt-0 text-[1.8rem] drop-shadow-[0_2px_5px_black]">
          NUOVA DISCUSSIONE
        </h2>

        {error && <p className="text-red-400 text-center text-xs">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[var(--accent-violet)] text-xs font-bold font-sans uppercase">TITOLO</label>
            <input
              type="text"
              placeholder="Inserisci il titolo della discussione..."
              className="w-full px-3 py-3 bg-white/5 border border-gray-600 text-white box-border rounded font-sans text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[var(--accent-violet)] text-xs font-bold font-sans uppercase">CONTENUTO</label>

            {/* Toolbar BBCode */}
            <div className="flex flex-wrap gap-1 p-2 bg-white/5 border border-gray-600 border-b-0 rounded-t">
              <button type="button" className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px] font-bold rounded min-w-[25px] text-center font-mono transition-all hover:border-[var(--accent-violet)] hover:text-white" onClick={() => insertTag("[b]", "[/b]")} title="Grassetto">
                <b>B</b>
              </button>
              <button type="button" className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px] font-bold rounded min-w-[25px] text-center font-mono transition-all hover:border-[var(--accent-violet)] hover:text-white" onClick={() => insertTag("[i]", "[/i]")} title="Corsivo">
                <i>I</i>
              </button>
              <button type="button" className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px] font-bold rounded min-w-[25px] text-center font-mono transition-all hover:border-[var(--accent-violet)] hover:text-white" onClick={() => insertTag("[u]", "[/u]")} title="Sottolineato">
                <u>U</u>
              </button>
              <button type="button" className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px] font-bold rounded min-w-[25px] text-center font-mono transition-all hover:border-[var(--accent-violet)] hover:text-white" onClick={() => insertTag("[quote]", "[/quote]")} title="Citazione">
                ""
              </button>
              <button type="button" className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px] font-bold rounded min-w-[25px] text-center font-mono transition-all hover:border-[var(--accent-violet)] hover:text-white" onClick={() => insertTag("[code]", "[/code]")} title="Codice">
                &lt;/&gt;
              </button>
              <button type="button" className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px] font-bold rounded min-w-[25px] text-center font-mono transition-all hover:border-[var(--accent-violet)] hover:text-white" onClick={() => insertTag("[img]", "[/img]")} title="Immagine">
                IMG
              </button>
              <button type="button" className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px] font-bold rounded min-w-[25px] text-center font-mono transition-all hover:border-[var(--accent-violet)] hover:text-white" onClick={() => insertTag("[url=LINK]", "[/url]")} title="Link">
                LINK
              </button>
            </div>

            <textarea
              ref={textareaRef}
              className="w-full h-[300px] px-2.5 py-2.5 bg-black/50 border border-gray-600 text-[#e6e0ff] box-border resize-y rounded-b font-sans leading-relaxed"
              placeholder="Scrivi qui il tuo messaggio..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 mt-2.5">
            <button
              type="button"
              className="px-6 py-2.5 cursor-pointer border-none rounded font-bold font-display bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
              onClick={onClose}
            >
              ANNULLA
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 cursor-pointer border-none rounded font-bold font-display bg-gradient-to-r from-[#60519b] to-[var(--accent-violet)] text-white shadow-[0_0_10px_rgba(162,112,255,0.4)] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "PUBBLICAZIONE..." : "PUBBLICA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
