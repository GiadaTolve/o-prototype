import { db } from "../../db";
import { playlists, songs } from "../../db/schema";
import { eq, asc, desc } from "drizzle-orm";

export const musicService = {
  /**
   * Ottiene tutte le playlist pubbliche.
   */
  async getAllPlaylists() {
    return await db.query.playlists.findMany({
      orderBy: [asc(playlists.createdAt)],
    });
  },

  /**
   * Ottiene una playlist specifica con le sue canzoni.
   */
  async getPlaylistById(playlistId: string) {
    return await db.query.playlists.findFirst({
      where: eq(playlists.id, playlistId),
      with: {
        songs: {
          orderBy: [asc(songs.order), asc(songs.createdAt)],
        },
      },
    });
  },

  /**
   * Ottiene tutte le canzoni di una playlist.
   */
  async getSongsByPlaylistId(playlistId: string) {
    return await db.query.songs.findMany({
      where: eq(songs.playlistId, playlistId),
      orderBy: [asc(songs.order), asc(songs.createdAt)],
    });
  },

  /**
   * Crea una nuova playlist.
   */
  async createPlaylist(data: { name: string; description?: string }) {
    const [playlist] = await db
      .insert(playlists)
      .values({
        name: data.name,
        description: data.description || null,
      })
      .returning();
    return playlist;
  },

  /**
   * Aggiorna una playlist.
   */
  async updatePlaylist(playlistId: string, data: { name?: string; description?: string }) {
    const [updated] = await db
      .update(playlists)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
      })
      .where(eq(playlists.id, playlistId))
      .returning();
    return updated;
  },

  /**
   * Elimina una playlist (cascade elimina anche le canzoni).
   */
  async deletePlaylist(playlistId: string) {
    await db.delete(playlists).where(eq(playlists.id, playlistId));
  },

  /**
   * Aggiunge una canzone a una playlist.
   */
  async addSong(data: {
    playlistId: string;
    title: string;
    url: string;
    sourceType: "youtube" | "file" | "url";
    coverImageUrl?: string;
    order?: number;
  }) {
    // Trova l'ordine massimo per questa playlist
    const existingSongs = await db.query.songs.findMany({
      where: eq(songs.playlistId, data.playlistId),
      orderBy: [desc(songs.order)],
      limit: 1,
    });
    const maxOrder = existingSongs[0]?.order ?? -1;

    const [song] = await db
      .insert(songs)
      .values({
        playlistId: data.playlistId,
        title: data.title,
        url: data.url,
        sourceType: data.sourceType,
        coverImageUrl: data.coverImageUrl || null,
        order: data.order ?? maxOrder + 1,
      })
      .returning();
    return song;
  },

  /**
   * Aggiorna una canzone.
   */
  async updateSong(
    songId: string,
    data: {
      title?: string;
      url?: string;
      sourceType?: "youtube" | "file" | "url";
      coverImageUrl?: string;
      order?: number;
    }
  ) {
    const [updated] = await db
      .update(songs)
      .set({
        ...(data.title && { title: data.title }),
        ...(data.url && { url: data.url }),
        ...(data.sourceType && { sourceType: data.sourceType }),
        ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl || null }),
        ...(data.order !== undefined && { order: data.order }),
      })
      .where(eq(songs.id, songId))
      .returning();
    return updated;
  },

  /**
   * Elimina una canzone.
   */
  async deleteSong(songId: string) {
    await db.delete(songs).where(eq(songs.id, songId));
  },
};
