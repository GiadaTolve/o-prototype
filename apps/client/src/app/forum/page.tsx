"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

type ForumSection = {
  id: string;
  name: string;
  description?: string;
  order: number;
  createdAt: string;
  bacheche: ForumBoard[];
};

type ForumBoard = {
  id: string;
  name: string;
  description?: string;
  topicCount: number;
  lastPostTimestamp: string | null;
  lastPostAuthor: string | null;
  hasNewPosts?: boolean;
};

export default function ForumPage() {
  const router = useRouter();
  const [sections, setSections] = useState<ForumSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchForum = async () => {
      try {
        setLoading(true);
        const data = (await api.get("/forum")) as ForumSection[];
        if (Array.isArray(data)) {
          setSections(data);
        } else {
          setError("Formato dati non valido.");
        }
      } catch (err) {
        console.error("Errore caricamento forum:", err);
        const errorMessage = err instanceof Error ? err.message : "Errore sconosciuto";
        if (errorMessage.includes("Failed query") || errorMessage.includes("does not exist")) {
          setError("Le tabelle del forum non sono state create. Esegui: bun run add-forum-tables");
        } else {
          setError("Impossibile caricare la struttura del forum.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchForum();
  }, []);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Nessun messaggio";
    const date = new Date(isoString);
    return date.toLocaleDateString("it-IT") + " " + date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] flex items-center justify-center">
        <p className="text-gray-500">Apertura archivi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--panel-bg)] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          className="w-full h-[50px] mb-8 rounded border-b border-[var(--accent-violet)]/30 flex justify-center items-center"
          style={{
            backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)), url('/backgrounds/cloudy.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
          }}
        >
          <h1 className="font-display font-bold text-[#c9a84a] text-lg tracking-[2px] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] m-0">
            ARCHIVI DI OYASUMI
          </h1>
        </div>

        {/* Sezioni e Bacheche */}
        {sections.map((section) => (
          <div
            key={section.id}
            className="mb-10 bg-[rgba(11,11,17,0.6)] border border-[var(--accent-violet)]/20 rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
          >
            {/* Header Sezione */}
            <div className="bg-[var(--accent-violet)]/10 px-5 py-4 border-b border-[var(--accent-violet)]/20 flex items-center gap-2.5">
              <span className="text-[#c9a84a] text-lg">✦</span>
              <h2 className="font-display text-xl text-[#e6e0ff] font-bold tracking-[1px] m-0">{section.name}</h2>
            </div>

            {/* Lista Bacheche */}
            <div>
              {section.bacheche.map((bacheca) => (
                <div
                  key={bacheca.id}
                  className="grid grid-cols-[50px_1fr_150px_250px] px-5 py-5 border-b border-white/5 transition-colors cursor-pointer hover:bg-white/5 items-center"
                  onClick={() => router.push(`/forum/bacheca/${bacheca.id}`)}
                >
                  {/* Icona */}
                  <div className="flex justify-center">
                    {bacheca.hasNewPosts ? (
                      <FontAwesomeIcon
                        icon={icons.circleDot}
                        className="text-[#c9a84a] drop-shadow-[0_0_5px_rgba(201,168,74,0.5)] w-4 h-4"
                        title="Nuovi Messaggi"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={icons.circle}
                        className="text-gray-600 w-4 h-4"
                        title="Nessun nuovo messaggio"
                      />
                    )}
                  </div>

                  {/* Info Bacheca */}
                  <div className="pr-5">
                    <div className="font-display text-base text-[#c9a84a] mb-1 font-bold">{bacheca.name}</div>
                    <div className="text-xs text-gray-500 leading-snug">{bacheca.description || ""}</div>
                  </div>

                  {/* Statistiche */}
                  <div className="text-center text-xs text-gray-600">
                    <div>{bacheca.topicCount || 0}</div>
                    <div className="text-[10px] uppercase">Discussioni</div>
                  </div>

                  {/* Ultimo Post */}
                  <div className="text-[11px] text-gray-500 text-right">
                    {bacheca.lastPostTimestamp ? (
                      <>
                        <div>{formatDate(bacheca.lastPostTimestamp)}</div>
                        <div>
                          da <span className="text-[var(--accent-violet)] font-bold">{bacheca.lastPostAuthor}</span>
                        </div>
                      </>
                    ) : (
                      <span>--</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
