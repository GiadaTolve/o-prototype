import { Elysia } from "elysia";
import { musicService } from "./music.service";
import { readdir } from "fs/promises";
import { join } from "path";

export const musicRoutes = new Elysia({ prefix: "/playlists" })
  /**
   * GET /playlists
   * Ottiene tutte le playlist pubbliche.
   */
  .get("/", async () => {
    const playlists = await musicService.getAllPlaylists();
    return playlists;
  })

  /**
   * GET /playlists/:id
   * Ottiene una playlist specifica con le sue canzoni.
   */
  .get("/:id", async ({ params }) => {
    const playlist = await musicService.getPlaylistById(params.id);
    if (!playlist) {
      return { error: "Playlist non trovata" };
    }
    return playlist;
  })

  /**
   * GET /playlists/:id/songs
   * Ottiene tutte le canzoni di una playlist.
   */
  .get("/:id/songs", async ({ params }) => {
    const songs = await musicService.getSongsByPlaylistId(params.id);
    return songs;
  })

  /**
   * GET /playlists/available-songs
   * Ottiene la lista di tutte le canzoni disponibili nella cartella public/musica.
   */
  .get("/available-songs", async () => {
    try {
      // Percorso relativo alla root del progetto (dove si trova public)
      // In produzione potrebbe essere diverso, ma per ora assumiamo che sia nella cartella client
      const musicDir = join(process.cwd(), "apps", "client", "public", "musica");
      const files = await readdir(musicDir);
      
      // Filtra solo i file audio
      const audioFiles = files
        .filter((file) => {
          const ext = file.toLowerCase();
          return ext.endsWith(".mp3") || ext.endsWith(".wav") || ext.endsWith(".ogg") || ext.endsWith(".m4a");
        })
        .map((file) => {
          // Estrae il nome senza estensione per il titolo
          const nameWithoutExt = file.replace(/\.(mp3|wav|ogg|m4a)$/i, "");
          // Converte il formato "artista.titolo" in "Artista - Titolo"
          const formattedName = nameWithoutExt
            .split(".")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" - ");
          
          return {
            filename: file,
            title: formattedName,
            url: `/musica/${file}`,
            sourceType: "file" as const,
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title));
      
      return audioFiles;
    } catch (error) {
      console.error("[Music] Errore lettura cartella musica:", error);
      return [];
    }
  });
