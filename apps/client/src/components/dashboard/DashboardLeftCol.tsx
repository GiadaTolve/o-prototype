"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { PixelIcons } from "./PixelIcons";
import { MusicPlayer } from "./MusicPlayer";
import { api } from "@/lib/api";
import type { WindowId, CharacterSummary } from "./types";

type Props = {
  char: CharacterSummary;
  onOpenScheda: () => void;
  onOpenShop: () => void;
  onOpenSms: () => void;
  onOpenBanca: () => void;
  onOpenWaza?: () => void;
  onOpenOrdine?: () => void;
  onOpenBestiario?: () => void;
  smsUnread?: number;
};

export function DashboardLeftCol({ char, onOpenScheda, onOpenShop, onOpenSms, onOpenBanca, onOpenWaza, onOpenOrdine, onOpenBestiario, smsUnread = 0 }: Props) {
  const avatarSrc = (char?.avatarUrl ?? char?.avatar ?? char?.miniAvatar) as string | undefined;
  const nome = (char?.name ?? "Nome PG") as string;
  const cognome = (char?.surname ?? "") as string;

  // Valori Body & Kotodama dal computed della scheda (se presenti)
  const computed = (char as any)?.computed ?? {};
  const hpMax = (computed.hpMax ?? computed.body ?? 0) as number;
  const kotodamaMax = (computed.kotodamaMax ?? 0) as number;

  return (
    <aside className="flex flex-col gap-4 w-full lg:max-w-[280px] shrink-0 order-2 lg:order-1 min-h-0 overflow-y-auto">
      {/* Mini-Profilo — click nome/avatar apre Scheda (window) */}
      <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-3 font-display flex items-center gap-2">
          <FontAwesomeIcon icon={icons.user} className="w-3 h-3" />
          Mini-Profilo
        </h3>
        <button
          type="button"
          onClick={onOpenScheda}
          className="flex items-center gap-3 w-full text-left rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/50 hover:bg-white/5 transition-colors -m-1 p-1"
        >
          <div className="w-12 h-12 rounded-full bg-gray-800 border border-[var(--border-color)] shrink-0 overflow-hidden flex items-center justify-center">
            {avatarSrc ? (
              <img src={avatarSrc} alt={nome} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[var(--accent-gold)]">
                <FontAwesomeIcon icon={icons.user} className="w-5 h-5" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm text-white truncate flex items-center gap-1.5 flex-wrap">
              {nome}
              <PixelIcons pixelIcons={char?.pixelIcons} />
            </p>
            <p className="text-xs text-gray-500 truncate">{cognome || "Cognome (se presente)"}</p>

            {/* Body & Kotodama mini-HUD in stile videogame */}
            {(hpMax > 0 || kotodamaMax > 0) && (
              <div className="mt-2 space-y-1">
                {/* Body */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase tracking-widest text-gray-500 font-display">
                    BOD
                  </span>
                  <div className="flex-1 h-2 bg-black/60 rounded-full overflow-hidden border border-[var(--border-color)] relative">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (hpMax > 0 ? (hpMax / hpMax) * 100 : 0))}%`,
                        background:
                          "linear-gradient(90deg, rgba(219,39,119,0.8) 0%, rgba(236,72,153,0.9) 100%)",
                        boxShadow: "0 0 8px rgba(219,39,119,0.5)",
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-display text-[var(--accent-gold)]">
                    {hpMax}
                  </span>
                </div>
                {/* Kotodama */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] uppercase tracking-widest text-gray-500 font-display">
                    KOT
                  </span>
                  <div className="flex-1 h-2 bg-black/60 rounded-full overflow-hidden border border-[var(--border-color)] relative">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (kotodamaMax > 0 ? (kotodamaMax / kotodamaMax) * 100 : 0))}%`,
                        background:
                          "linear-gradient(90deg, rgba(124,58,237,0.8) 0%, rgba(150,100,255,0.9) 100%)",
                        boxShadow: "0 0 8px rgba(124,58,237,0.5)",
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-display text-[var(--accent-gold)]">
                    {kotodamaMax}
                  </span>
                </div>
              </div>
            )}
          </div>
        </button>
      </section>

      {/* SMS — interfaccia stile WhatsApp, icona + badge non letti */}
      <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-3 font-display flex items-center gap-2">
          <FontAwesomeIcon icon={icons.message} className="w-3 h-3" />
          SMS
        </h3>
        <button
          type="button"
          onClick={onOpenSms}
          className="w-full flex items-center gap-3 rounded border border-[var(--border-color)] bg-black/30 hover:border-[var(--accent-gold)]/50 hover:bg-white/5 transition-colors p-3 text-left"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-800 border border-[var(--border-color)] flex items-center justify-center">
              <FontAwesomeIcon icon={icons.message} className="w-4 h-4 text-[var(--accent-gold)]" />
            </div>
            {smsUnread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--accent-gold)] text-black text-[10px] font-bold flex items-center justify-center px-1"
                aria-label={`${smsUnread} non letti`}
              >
                {smsUnread > 99 ? "99+" : smsUnread}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-display text-white">Messaggi</p>
            <p className="text-xs text-gray-500">
              {smsUnread > 0 ? `${smsUnread} non letti` : "Nessun nuovo messaggio"}
            </p>
          </div>
        </button>
      </section>

      {/* Media — Music Player */}
      <section className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-3 font-display flex items-center gap-2">
          <FontAwesomeIcon icon={icons.play} className="w-3 h-3" />
          Media
        </h3>
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
                Waza
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
