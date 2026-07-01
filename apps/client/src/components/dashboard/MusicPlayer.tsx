"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import Image from "next/image";

type Playlist = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
};

type Song = {
  id: string;
  playlistId: string;
  title: string;
  url: string;
  sourceType: "youtube" | "file" | "url";
  coverImageUrl?: string;
  order: number;
  createdAt: string;
};

export function MusicPlayer() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Song[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oyasumi-player-muted") !== "false";
    }
    return false;
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  // Carica playlist al mount
  useEffect(() => {
    api
      .get("/playlists")
      .then((res) => {
        const data = res as Playlist[];
        setPlaylists(data);
        if (data.length > 0) {
          api
            .get(`/playlists/${data[0].id}/songs`)
            .then((songRes) => {
              const songs = songRes as Song[];
              setCurrentPlaylist(songs);
            })
            .catch((err) => console.error("Errore caricamento canzoni:", err));
        }
      })
      .catch((err) => console.error("Errore caricamento playlist:", err));
  }, []);

  // Gestisce mute/unmute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (typeof window !== "undefined") {
        localStorage.setItem("oyasumi-player-muted", String(isMuted));
      }
    }
  }, [isMuted]);

  // Carica nuova traccia quando cambia indice o playlist
  useEffect(() => {
    if (currentPlaylist.length > 0 && audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.warn("Autoplay:", e.message));
      }
    }
  }, [currentTrackIndex, currentPlaylist, isPlaying]);

  const playNext = () => {
    if (currentPlaylist.length) {
      setCurrentTrackIndex((prev) => (prev + 1) % currentPlaylist.length);
    }
  };

  const playPrev = () => {
    if (currentPlaylist.length) {
      setCurrentTrackIndex((prev) => (prev - 1 + currentPlaylist.length) % currentPlaylist.length);
    }
  };

  const togglePlay = () => {
    const newIsPlaying = !isPlaying;
    if (audioRef.current) {
      if (newIsPlaying) {
        audioRef.current.play().catch((e) => console.error("Play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
    setIsPlaying(newIsPlaying);
  };

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setIsPlaying(false);
    setCurrentTrackIndex(0);
    api
      .get(`/playlists/${pid}/songs`)
      .then((res) => {
        const songs = res as Song[];
        setCurrentPlaylist(songs);
      })
      .catch((err) => console.error("Errore caricamento canzoni:", err));
  };

  const currentTrack = currentPlaylist[currentTrackIndex];
  const getSrc = () => {
    if (!currentTrack) return null;
    if (currentTrack.sourceType === "youtube") {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
      const match = currentTrack.url.match(regex);
      return match ? `/api/youtube-stream/${match[1]}` : null;
    }
    return currentTrack.url;
  };

  return (
    <div
      className="mt-2 p-2 rounded-lg border border-[var(--accent-violet)]/20 flex flex-col gap-1.5"
      style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url('/backgrounds/cloudy.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
      }}
    >
      <audio ref={audioRef} src={getSrc() || undefined} onEnded={playNext} controls={false} />

      {/* COVER ART + TITOLO */}
      <div className="relative w-full h-[56px] rounded border border-white/10 overflow-hidden shrink-0">
        {currentTrack?.coverImageUrl ? (
          <Image
            src={currentTrack.coverImageUrl}
            alt="cover"
            fill
            className="object-cover brightness-90"
          />
        ) : (
          <div className="w-full h-full bg-black/50 flex items-center justify-center">
            <span className="text-gray-600 text-xs">NO COVER</span>
          </div>
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.9) 100%)",
          }}
        >
          <div className="absolute bottom-1 left-0 w-full text-center px-1.5 box-border">
            <div className="font-display text-[9px] text-[#e6e0ff] font-bold uppercase tracking-[0.5px] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] whitespace-nowrap overflow-hidden text-ellipsis">
              {currentTrack?.title || "SILENZIO"}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLLI */}
      <div className="flex justify-center items-center gap-1.5 pt-0">
        <button
          type="button"
          onClick={playPrev}
          title="Precedente"
          className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center transition-all hover:brightness-150"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-300"
            style={{
              filter: "invert(80%) sepia(10%) saturate(200%) hue-rotate(220deg) brightness(95%) contrast(90%)",
            }}
          >
            <polygon points="19 20 9 12 19 4 19 20" />
            <line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={togglePlay}
          title={isPlaying ? "Pausa" : "Riproduci"}
          className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center transition-all hover:scale-110"
        >
          {isPlaying ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[#c9a84a]"
              style={{
                filter: "drop-shadow(0 0 5px rgba(201, 168, 74, 0.5))",
              }}
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[#c9a84a]"
              style={{
                filter: "drop-shadow(0 0 5px rgba(201, 168, 74, 0.5))",
              }}
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={playNext}
          title="Successiva"
          className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center transition-all hover:brightness-150"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-300"
            style={{
              filter: "invert(80%) sepia(10%) saturate(200%) hue-rotate(220deg) brightness(95%) contrast(90%)",
            }}
          >
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? "Unmute" : "Mute"}
          className="bg-transparent border-none cursor-pointer p-0.5 ml-1 flex items-center justify-center transition-opacity opacity-70 hover:opacity-100"
        >
          {isMuted ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>
      </div>

      {/* PLAYLIST DROPDOWN */}
      {playlists.length > 0 && (
        <select
          onChange={handlePlaylistChange}
          className="w-full py-0.5 px-1.5 bg-black/50 text-[#c9a84a] border border-white/10 rounded text-[9px] font-display cursor-pointer outline-none mt-0"
        >
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
