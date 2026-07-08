"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { parseBBCode } from "@/lib/bbcode-parser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { getPixelIconUrlRuolo, getPixelIconUrlOrdine, type PixelIconRuolo, type PixelIconOrdine } from "@/components/dashboard/pixel-icons";

type ForumTopic = {
  id: string;
  title: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  board: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    name: string;
    surname?: string;
    miniAvatar?: string;
    uiMetadata?: { roleIcon?: string; orderIcon?: string };
    order?: string;
  };
  posts: ForumPost[];
};

type ForumPost = {
  id: string;
  content: string;
  likeCount: number;
  userHasLiked: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    surname?: string;
    miniAvatar?: string;
    uiMetadata?: { roleIcon?: string; orderIcon?: string };
    order?: string;
  };
};

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;

  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [canAccessGestione, setCanAccessGestione] = useState(false);
  const replyFormRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!topicId) return;
    const loadData = async () => {
      await fetchTopicData();
      // Verifica permessi admin
      try {
        const char = (await api.get("/characters/me")) as { canAccessGestione?: boolean };
        setCanAccessGestione(char?.canAccessGestione ?? false);
      } catch (e) {
        console.error("Errore verifica permessi:", e);
      }
    };
    loadData();
  }, [topicId]);

  const fetchTopicData = async () => {
    try {
      setLoading(true);
      const data = (await api.get(`/forum/topic/${topicId}`)) as ForumTopic;
      setTopic(data);
      // Marca come letto
      try {
        await api.post(`/forum/topics/${topicId}/mark-as-read`, {});
      } catch (e) {
        // Ignora errori
      }
    } catch (error) {
      console.error("Errore topic:", error);
      setTopic(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await api.post(`/forum/posts/${postId}/like`, {});
      await fetchTopicData(); // Ricarica per aggiornare like count
    } catch (error) {
      console.error("Errore like:", error);
    }
  };

  const handleLockToggle = async () => {
    if (!topic) return;
    try {
      await api.put(`/admin/forum/topics/${topic.id}/lock`, { is_locked: !topic.isLocked });
      await fetchTopicData();
    } catch (error) {
      console.error("Errore lock:", error);
      alert("Errore durante il blocco/sblocco del topic.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Eliminare questo post? Questa azione non può essere annullata.")) return;
    try {
      await api.delete(`/admin/forum/posts/${postId}`);
      await fetchTopicData();
    } catch (error) {
      console.error("Errore eliminazione:", error);
      alert("Errore durante l'eliminazione del post.");
    }
  };

  const handleQuote = (author: string, text: string) => {
    const quotedText = `[quote=${author}]${text}[/quote]\n\n`;
    setReplyText((prev) => prev + quotedText);
    replyFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await api.post("/forum/posts", { topic_id: topicId, testo: replyText });
      setReplyText("");
      await fetchTopicData();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Errore invio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("it-IT");
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-[rgba(11,11,17,0.98)] rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="w-full h-full bg-[rgba(11,11,17,0.98)] rounded-lg flex items-center justify-center">
        <p className="text-red-400">Topic non trovato</p>
      </div>
    );
  }

  // Costruisci pixel icons per un autore
  const getPixelIcons = (author: ForumPost["author"]) => {
    const meta = author.uiMetadata ?? {};
    const roleIcon = (meta.roleIcon ?? "").toLowerCase();
    const orderIcon = (meta.orderIcon ?? "").toLowerCase();

    const pixelIcons: { ruolo?: string[]; ordine?: string[] } = {};
    if (roleIcon && ["admin", "moderatore", "fixer", "capo-shinigami", "shinigami"].includes(roleIcon)) {
      pixelIcons.ruolo = [roleIcon];
    }
    if (orderIcon && ["mugen-tai", "chisen-tai"].includes(orderIcon)) {
      pixelIcons.ordine = [orderIcon];
    } else if (author.order && author.order !== "NONE") {
      pixelIcons.ordine = [author.order.toLowerCase()];
    }
    return pixelIcons;
  };

  return (
    <div className="w-full h-full bg-[rgba(11,11,17,0.98)] rounded-lg flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-[var(--accent-violet)]/20">
      {/* Header */}
      <div
        className="px-8 py-4 border-b border-[var(--accent-violet)]/30 flex justify-between items-center flex-shrink-0"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)), url('/backgrounds/cloudy.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div>
          <Link
            href={`/forum/bacheca/${topic.board.id}`}
            className="text-gray-400 text-xs font-display block mb-1 hover:text-[var(--accent-gold)] transition-colors"
          >
            ← TORNA ALLA BACHECA
          </Link>
          <h1 className="font-display text-[#c9a84a] text-2xl m-0 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">{topic.title}</h1>
        </div>
        {topic.isLocked && (
          <div className="px-4 py-2 text-center bg-red-500/20 border border-red-500/60 text-red-400 font-display rounded">
            BLOCCATO
          </div>
        )}
      </div>

      {/* Lista Post */}
      <div
        className="flex-grow overflow-y-auto px-5 py-0"
        style={{
          backgroundImage: "url('/backgrounds/darkstone.png')",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "overlay",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
      >
        {topic.posts.map((post) => {
          const pixelIcons = getPixelIcons(post.author);
          return (
            <div key={post.id} className="flex border border-white/5 p-5 bg-[rgba(20,20,25,0.7)] my-5 rounded">
              {/* Autore */}
              <div className="w-40 flex-shrink-0 text-center pr-5 border-r border-white/5">
                {post.author.miniAvatar && (
                  <div className="mb-3">
                    <Image
                      src={post.author.miniAvatar}
                      alt={`${post.author.name}${post.author.surname ? ` ${post.author.surname}` : ""}`}
                      width={100}
                      height={100}
                      className="w-[100px] h-[100px] object-cover rounded-full border-2 border-[#60519b] mx-auto"
                    />
                  </div>
                )}
                <div className="font-display text-[#c9a84a] font-bold text-sm mb-2">
                  {post.author.name}
                  {post.author.surname ? ` ${post.author.surname}` : ""}
                </div>
                {/* Pixel icons */}
                {pixelIcons.ruolo && (
                  <div className="flex justify-center gap-1 mb-2">
                    {pixelIcons.ruolo.map((r) => {
                      const url = getPixelIconUrlRuolo(r as PixelIconRuolo);
                      return url ? (
                        <Image key={`ruolo-${r}`} src={url} alt={r} width={16} height={16} className="w-4 h-4 object-contain" />
                      ) : null;
                    })}
                  </div>
                )}
                {pixelIcons.ordine && (
                  <div className="flex justify-center gap-1 mb-2">
                    {pixelIcons.ordine.map((o) => {
                      const url = getPixelIconUrlOrdine(o as PixelIconOrdine);
                      return url ? (
                        <img key={`ordine-${o}`} src={url} alt={o} width={16} height={16} className="w-4 h-4 object-contain" />
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Contenuto Post */}
              <div className="flex-grow pl-5 flex flex-col">
                <div className="text-[11px] text-gray-600 mb-4 border-b border-dashed border-gray-600 pb-1">
                  {formatDate(post.createdAt)}
                </div>
                <div
                  className="whitespace-pre-wrap leading-relaxed flex-grow font-sans text-[#dcdcdc] text-sm"
                  dangerouslySetInnerHTML={{ __html: parseBBCode(post.content) }}
                />
                <div className="mt-5 flex justify-end items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuote(`${post.author.name}${post.author.surname ? ` ${post.author.surname}` : ""}`, post.content)}
                    className="bg-transparent border border-gray-600 p-1.5 rounded cursor-pointer flex items-center justify-center transition-all hover:border-[var(--accent-violet)]"
                    title="Cita"
                  >
                    <FontAwesomeIcon icon={icons.quote} className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className={`bg-transparent border p-1.5 rounded cursor-pointer flex items-center justify-center transition-all gap-1 ${
                      post.userHasLiked ? "border-[var(--accent-gold)] text-[var(--accent-gold)]" : "border-gray-600 text-gray-400 hover:border-[var(--accent-violet)]"
                    }`}
                    title="Mi piace"
                  >
                    <FontAwesomeIcon icon={icons.heart} className="w-4 h-4" />
                    <span className="text-xs">{post.likeCount}</span>
                  </button>
                  {canAccessGestione && (
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="bg-transparent border border-gray-600 p-1.5 rounded cursor-pointer flex items-center justify-center transition-all hover:border-red-500 text-gray-400 hover:text-red-500"
                      title="Elimina post"
                    >
                      <FontAwesomeIcon icon={icons.trash} className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Risposta */}
      {!topic.isLocked && (
        <div ref={replyFormRef} className="flex-shrink-0 p-5 border-t border-[var(--accent-violet)]/20 bg-[rgba(15,15,20,0.95)]">
          {submitError && <p className="text-red-400 text-xs mb-2">{submitError}</p>}
          <form onSubmit={handleSubmitReply} className="mt-2.5 p-0">
            <div className="bg-white/5 border border-white/10 p-1.5 flex gap-1 border-b-0">
              <button
                type="button"
                className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px]"
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selectedText = replyText.substring(start, end);
                    const newText = replyText.substring(0, start) + `[b]${selectedText}[/b]` + replyText.substring(end);
                    setReplyText(newText);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + 3, end + 3);
                    }, 0);
                  }
                }}
              >
                <b>B</b>
              </button>
              <button
                type="button"
                className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px]"
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selectedText = replyText.substring(start, end);
                    const newText = replyText.substring(0, start) + `[i]${selectedText}[/i]` + replyText.substring(end);
                    setReplyText(newText);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + 3, end + 3);
                    }, 0);
                  }
                }}
              >
                <i>I</i>
              </button>
              <button
                type="button"
                className="bg-transparent border border-gray-600 text-gray-300 cursor-pointer px-2 py-1 text-[11px]"
                onClick={() => {
                  const textarea = textareaRef.current;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const selectedText = replyText.substring(start, end);
                    const newText = replyText.substring(0, start) + `[quote]${selectedText}[/quote]` + replyText.substring(end);
                    setReplyText(newText);
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + 7, end + 7);
                    }, 0);
                  }
                }}
              >
                QUOTE
              </button>
            </div>
            <textarea
              ref={textareaRef}
              name="reply"
              className="w-full box-border px-2.5 py-2.5 bg-black/30 border border-white/10 text-[#e6e0ff] font-sans text-sm min-h-[100px]"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Scrivi la tua risposta..."
              required
            />
            <button
              type="submit"
              className="mt-2.5 px-5 py-2.5 border border-[var(--accent-violet)] rounded cursor-pointer bg-[var(--accent-violet)]/20 text-[#e6e0ff] font-bold font-display disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "INVIO..." : "INVIA RISPOSTA"}
            </button>
          </form>
        </div>
      )}

      {topic.isLocked && (
        <div className="px-4 py-4 text-center bg-red-500/20 border-t border-red-500/60 text-red-400 font-display">
          Questa discussione è bloccata. Non è possibile rispondere.
        </div>
      )}
    </div>
  );
}
