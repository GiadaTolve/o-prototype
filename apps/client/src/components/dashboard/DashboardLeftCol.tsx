"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { PixelIcons } from "./PixelIcons";
import { MusicPlayer } from "./MusicPlayer";
import { api } from "@/lib/api";
import { MiniSkiruStatsHud } from "./MiniSkiruStatsHud";
import { resolveCharacterComputed } from "./character-computed";
import type { WindowId, CharacterSummary } from "./types";

type Props = {
  char: CharacterSummary;
  onOpenScheda: () => void;
  onOpenShop: () => void;
  onOpenMercato: () => void;
  onOpenSms: () => void;
  onOpenBanca: () => void;
  onOpenWaza?: () => void;
  onOpenOrdine?: () => void;
  onOpenBestiario?: () => void;
  smsUnread?: number;
};

export function DashboardLeftCol({ char, onOpenScheda, onOpenShop, onOpenMercato, onOpenSms, onOpenBanca, onOpenWaza, onOpenOrdine, onOpenBestiario, smsUnread = 0 }: Props) {
  const avatarSrc = (char?.avatarUrl ?? char?.avatar ?? char?.miniAvatar) as string | undefined;
  const nome = (char?.name ?? "Nome PG") as string;
  const cognome = (char?.surname ?? "") as string;
  const skiruStats = resolveCharacterComputed(char?.computed);

  return (
    <aside className="flex flex-col gap-4 w-full lg:max-w-[360px] shrink-0 order-2 lg:order-1 min-h-0 overflow-y-auto">
      {/* Mini-Profilo — click nome/avatar apre Scheda */}
      <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <button
          type="button"
          onClick={onOpenScheda}
          className="flex items-center gap-3 w-full text-left rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/50 hover:bg-white/5 transition-colors -m-1 p-1"
        >
            <div className="w-[60px] h-[60px] rounded-md bg-gray-800 shrink-0 overflow-hidden flex items-center justify-center border-2 border-[var(--border-color)] ring-2 ring-[var(--accent-gold)]/30">
              {avatarSrc ? (
                <img src={avatarSrc} alt={nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[var(--accent-gold)]">
                  <FontAwesomeIcon icon={icons.user} className="w-6 h-6" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm text-white truncate flex items-center gap-1.5 flex-wrap">
                {nome}
                <PixelIcons pixelIcons={char?.pixelIcons} />
              </p>

              {cognome && (
                <p className="text-[10px] text-[var(--accent-gold)]/80 truncate font-display">{cognome}</p>
              )}

              <MiniSkiruStatsHud stats={skiruStats} />
            </div>
          </button>
      </section>

      {/* SMS — Messaggi */}
      <section className={`bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4 ${smsUnread > 0 ? "animate-sms-section" : ""}`}>
        <button
          type="button"
          onClick={onOpenSms}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded border border-[var(--border-color)] bg-black/30 hover:border-[var(--accent-gold)]/50 hover:bg-white/5 transition-colors relative"
          title={smsUnread > 0 ? `${smsUnread} messaggi non letti` : "Messaggi"}
          aria-label={smsUnread > 0 ? `${smsUnread} non letti` : "Messaggi"}
        >
          {smsUnread > 0 ? (
            <FontAwesomeIcon icon={icons.message} className="w-4 h-4 text-[var(--accent-gold)]" />
          ) : (
            <FontAwesomeIcon icon={icons.envelope} className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-xs font-display text-gray-300">
            {smsUnread > 0 ? `${smsUnread} messaggi` : "Messaggi"}
          </span>
          {smsUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--accent-gold)] text-black text-[10px] font-bold flex items-center justify-center px-1 animate-sms-badge">
              {smsUnread > 99 ? "99+" : smsUnread}
            </span>
          )}
        </button>
      </section>

      {/* Media — Music Player */}
      <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <MusicPlayer />
        <div className="flex flex-col gap-2 mt-3">
          <button
            type="button"
            onClick={onOpenBanca}
            className="relative group w-full h-10 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              backgroundImage: "url('/buttons-bottoni-frame/bottoni-frame/sidebar.menu.button.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-[var(--accent-gold)] font-display group-hover:text-white transition-colors">
                Banca
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenShop}
            className="relative group w-full h-10 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              backgroundImage: "url('/buttons-bottoni-frame/bottoni-frame/sidebar.menu.button.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-[var(--accent-gold)] font-display group-hover:text-white transition-colors">
                Shop
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenMercato}
            className="relative group w-full h-10 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              backgroundImage: "url('/buttons-bottoni-frame/bottoni-frame/sidebar.menu.button.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-[var(--accent-gold)] font-display group-hover:text-white transition-colors">
                Mercato
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenWaza}
            className="relative group w-full h-10 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              backgroundImage: "url('/buttons-bottoni-frame/bottoni-frame/sidebar.menu.button.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-[var(--accent-gold)] font-display group-hover:text-white transition-colors">
                Skiru &amp; Waza
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenOrdine}
            className="relative group w-full h-10 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              backgroundImage: "url('/buttons-bottoni-frame/bottoni-frame/sidebar.menu.button.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-[var(--accent-gold)] font-display group-hover:text-white transition-colors">
                Ordine
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={onOpenBestiario}
            className="relative group w-full h-10 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:brightness-110"
            style={{
              backgroundImage: "url('/buttons-bottoni-frame/bottoni-frame/sidebar.menu.button.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-[var(--accent-gold)] font-display group-hover:text-white transition-colors">
                Bestiario
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* News Visor — scroll CRT anni '80, testo viola */}
      <NewsVisor />
    </aside>
  );
}

// ─── News Visor Component ───
function NewsVisor() {
  const [topics, setTopics] = useState<Array<{ id: string; titolo: string; timestamp_creazione: string; contenuto?: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mainBoardId, setMainBoardId] = useState<string | null>(null);

  // Trova la bacheca principale (ID 1 o la prima disponibile)
  useEffect(() => {
    const fetchMainBoard = async () => {
      try {
        const sections = (await api.get("/forum")) as Array<{
          id: string;
          bacheche: Array<{ id: string; name: string }>;
        }>;
        if (Array.isArray(sections) && sections.length > 0 && sections[0].bacheche && sections[0].bacheche.length > 0) {
          setMainBoardId(sections[0].bacheche[0].id);
        }
      } catch (error) {
        // Ignora errori silenziosamente - le tabelle potrebbero non esistere ancora
        console.debug("News Visor: forum non disponibile o tabelle non create");
      }
    };
    fetchMainBoard();
  }, []);

  // Carica topic dalla bacheca principale
  useEffect(() => {
    if (!mainBoardId) return;
    const fetchTopics = async () => {
      try {
        const data = (await api.get(`/forum/bacheca/${mainBoardId}/latest-topics?limit=5`)) as Array<{
          id: string;
          titolo: string;
          timestamp_creazione: string;
          contenuto?: string;
        }>;
        console.debug("News Visor - Topics ricevuti:", data);
        setTopics(Array.isArray(data) ? data : []);
      } catch (error) {
        // Ignora errori silenziosamente
        console.debug("News Visor: errore caricamento topic", error);
        setTopics([]);
      }
    };
    fetchTopics();
  }, [mainBoardId]);

  // Rotazione automatica ogni 6 secondi
  useEffect(() => {
    if (topics.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % topics.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [topics]);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1} - ${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const currentTopic = topics[currentIndex];

  // Estrae solo il testo dal contenuto (rimuove BBCode per semplicità)
  const getPlainText = (content: string | undefined): string => {
    if (!content || content.trim() === "") return "[ Nessun contenuto disponibile ]";
    // Rimuove tag BBCode semplici per mostrare solo testo
    let text = content
      .replace(/\[b\](.*?)\[\/b\]/gi, "$1")
      .replace(/\[i\](.*?)\[\/i\]/gi, "$1")
      .replace(/\[u\](.*?)\[\/u\]/gi, "$1")
      .replace(/\[quote.*?\](.*?)\[\/quote\]/gi, "$1")
      .replace(/\[code\](.*?)\[\/code\]/gi, "$1")
      .replace(/\[img\](.*?)\[\/img\]/gi, "")
      .replace(/\[url.*?\](.*?)\[\/url\]/gi, "$1")
      .replace(/\[color.*?\](.*?)\[\/color\]/gi, "$1")
      .replace(/\[center\](.*?)\[\/center\]/gi, "$1")
      .replace(/\[spoiler\](.*?)\[\/spoiler\]/gi, "$1")
      .replace(/<br\s*\/?>/gi, " ")
      .trim();
    
    if (text === "") return "[ Contenuto non disponibile ]";
    return text; // Restituisce il testo completo, la limitazione avviene nel rendering
  };

  return (
    <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg px-4 pt-4 pb-6 overflow-hidden flex flex-col">
      <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-violet)] mb-2 font-display flex items-center gap-2 flex-shrink-0">
        <FontAwesomeIcon icon={icons.news} className="w-3 h-3" />
        News Visor
      </h3>
      {currentTopic ? (
        <>
          <div className="flex justify-between items-center mb-2 text-[10px] text-[var(--accent-violet)] font-sans flex-shrink-0">
            <span className="uppercase font-bold">NEWS DAL GIOCO</span>
            <span className="font-mono">{formatDate(currentTopic.timestamp_creazione)}</span>
          </div>
          <div
            className="bg-black/90 rounded border border-[var(--accent-violet)]/40 p-2.5 min-h-[85px] max-h-[85px] relative overflow-hidden flex-shrink-0"
            style={{
              boxShadow: "inset 0 0 10px rgba(124, 58, 237, 0.2), 0 0 15px rgba(124, 58, 237, 0.1)",
            }}
          >
            {/* Effetto static/glitch */}
            <div
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(124, 58, 237, 0.1) 2px, rgba(124, 58, 237, 0.1) 4px)",
                animation: "static 0.1s infinite",
              }}
            />
            <div
              key={currentIndex}
              className="text-[var(--accent-violet)] font-mono text-[11px] leading-relaxed relative z-10 h-full overflow-hidden"
              style={{
                textShadow: "0 0 3px rgba(124, 58, 237, 0.5)",
                letterSpacing: "0.5px",
              }}
            >
              <span className="inline-block animate-pulse">▶</span>{" "}
              {(() => {
                const text = getPlainText(currentTopic.contenuto);
                // Limita a 200 caratteri per la preview
                const preview = text.length > 200 ? text.substring(0, 200) + "..." : text;
                return preview;
              })()}
            </div>
          </div>
        </>
      ) : (
        <div
          className="bg-black/90 rounded border border-[var(--accent-violet)]/30 p-2 min-h-[85px] max-h-[85px] flex items-center justify-center text-gray-600 text-xs font-mono flex-shrink-0"
          style={{
            boxShadow: "inset 0 0 10px rgba(124, 58, 237, 0.1)",
          }}
        >
          <span className="animate-pulse">[ In attesa di segnale... ]</span>
        </div>
      )}
    </section>
  );
}
