"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { formatNarrativeText } from "@/lib/narrative-parser";
import { GestioneRichiestePanel } from "@/components/gestione/GestioneRichiestePanel";

type User = {
  id: string;
  email: string;
  role: string;
  banState: string;
  characters?: Array<{
    id: string;
    name: string;
  }>;
};

type Sanction = {
  id: string;
  userId: string;
  type: string;
  reason: string | null;
  createdAt: string;
  adminName: string | null;
};

export default function GestionePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "richieste" | "forum" | "musica" | "logs" | "maps" | "banners" | "events" | "jobs" | "housing">("users");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const data = (await api.get("/player-requests/admin/pending-count")) as { count?: number };
      setPendingRequests(typeof data.count === "number" ? data.count : 0);
    } catch {
      setPendingRequests(0);
    }
  }, []);

  useEffect(() => {
    // Verifica autenticazione e permessi
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }

    // Carica lista utenti
    loadUsers();
    fetchPendingRequests();
  }, [router, fetchPendingRequests]);

  const loadUsers = async () => {
    try {
      const data = await api.get("/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento utenti:", e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSanctions = async (userId: string) => {
    try {
      const data = (await api.get(`/admin/users/${userId}/sanctions`)) as Sanction[];
      setSanctions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento sanzioni:", e);
      setSanctions([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--panel-bg)] flex items-center justify-center">
        <p className="text-gray-400">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--panel-bg)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-[var(--border-color)] mb-6 flex-wrap">
          {[
            { id: "users" as const, label: "Gestione Utenti" },
            { id: "richieste" as const, label: "Richieste", badge: pendingRequests },
            { id: "forum" as const, label: "Moderazione Forum" },
            { id: "logs" as const, label: "Log Chat" },
            { id: "maps" as const, label: "Gestione Mappe" },
            { id: "jobs" as const, label: "Arubaito / Lavori" },
            { id: "housing" as const, label: "Immobiliare / Abitazioni" },
            { id: "banners" as const, label: "Banner" },
            { id: "events" as const, label: "Eventi" },
            { id: "musica" as const, label: "Musica" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-display transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "text-[var(--accent-gold)] border-[var(--accent-gold)]"
                  : "text-gray-500 border-transparent hover:text-gray-400"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {tab.label}
                {"badge" in tab && tab.badge != null && tab.badge > 0 && (
                  <span className="min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[var(--accent-gold)] text-[var(--background)] text-[9px] font-bold tabular-nums leading-none flex items-center justify-center">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-display text-white">Lista Utenti</h2>
                <button
                  type="button"
                  onClick={loadUsers}
                  className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
                >
                  <FontAwesomeIcon icon={icons.refresh} className="w-3 h-3 mr-1" />
                  Aggiorna
                </button>
              </div>
              {users.length === 0 ? (
                <p className="text-gray-500">Nessun utente trovato.</p>
              ) : (
                <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-black/40">
                      <tr>
                        <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">ID</th>
                        <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Email</th>
                        <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Nome PG</th>
                        <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Ruolo</th>
                        <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Ban State</th>
                        <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t border-[var(--border-color)] hover:bg-black/20">
                          <td className="px-4 py-2 text-gray-400 text-xs font-mono">{user.id.slice(0, 8)}...</td>
                          <td className="px-4 py-2 text-white">{user.email}</td>
                          <td className="px-4 py-2">
                            {(() => {
                              const character = user.characters && user.characters.length > 0 ? user.characters[0] : null;
                              return character?.id ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Invia messaggio al parent window (dashboard) per aprire il profilo
                                    if (window.parent && window.parent !== window) {
                                      window.parent.postMessage(
                                        {
                                          type: "openCharacterProfile",
                                          characterId: character.id,
                                        },
                                        "*"
                                      );
                                    } else {
                                      // Fallback: usa evento custom se non siamo in iframe
                                      window.dispatchEvent(
                                        new CustomEvent("openProfileWindow", {
                                          detail: { characterId: character.id },
                                        })
                                      );
                                    }
                                  }}
                                  className="text-[var(--accent-gold)] hover:text-[var(--accent-violet)] hover:underline transition-colors cursor-pointer"
                                >
                                  {character.name || "N/A"}
                                </button>
                              ) : (
                                <span className="text-white">N/A</span>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-2 text-gray-400">{user.role}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs ${
                              user.banState === "FULL" ? "text-red-400" :
                              user.banState === "SHADOW" ? "text-yellow-400" :
                              "text-green-400"
                            }`}>
                              {user.banState}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(user);
                                loadSanctions(user.id);
                              }}
                              className="px-2 py-1 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
                            >
                              Gestisci
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Modal Gestione Utente */}
              {selectedUser && (
                <UserManagementModal
                  user={selectedUser}
                  sanctions={sanctions}
                  onClose={() => {
                    setSelectedUser(null);
                    setSanctions([]);
                  }}
                  onUpdate={() => {
                    loadUsers();
                    if (selectedUser) loadSanctions(selectedUser.id);
                  }}
                />
              )}
            </div>
          )}

          {activeTab === "richieste" && (
            <GestioneRichiestePanel onQueueChange={fetchPendingRequests} />
          )}

          {activeTab === "forum" && <ForumManagement />}

          {activeTab === "logs" && (
            <div className="space-y-6">
              <LogViewer />
            </div>
          )}

          {activeTab === "maps" && <MapManagement />}

          {activeTab === "jobs" && <JobsManagement />}

          {activeTab === "housing" && <HousingTypesManagement />}

          {activeTab === "banners" && <BannerManagement />}

          {activeTab === "events" && <DailyEventsManagement />}

          {activeTab === "musica" && (
            <PlaylistManagement />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal Gestione Utente ───
function UserManagementModal({
  user,
  sanctions,
  onClose,
  onUpdate,
}: {
  user: User;
  sanctions: Sanction[];
  onClose: () => void;
  onUpdate: () => void;
}) {
  const character = user.characters && user.characters.length > 0 ? user.characters[0] : null;
  const [newRole, setNewRole] = useState(user.role);
  const [newBanState, setNewBanState] = useState(user.banState);
  const [newName, setNewName] = useState(character?.name || "");
  const [saving, setSaving] = useState(false);

  const handleUpdateRole = async () => {
    if (newRole === user.role) return;
    setSaving(true);
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      onUpdate();
      alert("Ruolo aggiornato!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBan = async () => {
    if (newBanState === user.banState) return;
    if (!confirm(`Vuoi ${newBanState === "FULL" ? "bannare completamente" : newBanState === "SHADOW" ? "shadowbannare" : "sbannare"} questo utente?`)) return;
    setSaving(true);
    try {
      await api.put(`/admin/users/${user.id}/ban`, { banState: newBanState });
      onUpdate();
      alert("Stato ban aggiornato!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async () => {
    if (!character || newName === character.name) return;
    if (!confirm(`Vuoi cambiare il nome del personaggio da "${character.name}" a "${newName}"?`)) return;
    setSaving(true);
    try {
      await api.put(`/admin/characters/${character.id}/name`, { name: newName });
      onUpdate();
      alert("Nome aggiornato!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleResetStats = async () => {
    if (!character) return;
    if (!confirm("Vuoi resettare le statistiche di questo personaggio ai valori base (tutti a 1)?")) return;
    setSaving(true);
    try {
      await api.post(`/admin/characters/${character.id}/reset-stats`, {});
      onUpdate();
      alert("Statistiche resettate!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il reset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg uppercase tracking-wider text-[var(--accent-gold)]">
            Gestione Utente
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FontAwesomeIcon icon={icons.close} className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Email</p>
            <p className="text-white">{user.email}</p>
          </div>

          {character && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Nome Personaggio</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={handleUpdateName}
                  disabled={saving || newName === character?.name}
                  className="px-3 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                >
                  Aggiorna
                </button>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-400 mb-1">Ruolo</p>
            <div className="flex gap-2">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="flex-1 px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              >
                <option value="PLAYER">PLAYER</option>
                <option value="MASTER">MASTER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={saving || newRole === user.role}
                className="px-3 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
              >
                Aggiorna
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Ban State</p>
            <div className="flex gap-2">
              <select
                value={newBanState}
                onChange={(e) => setNewBanState(e.target.value as BanState)}
                className="flex-1 px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              >
                <option value="NONE">NONE</option>
                <option value="SHADOW">SHADOW</option>
                <option value="FULL">FULL</option>
              </select>
              <button
                type="button"
                onClick={handleUpdateBan}
                disabled={saving || newBanState === user.banState}
                className="px-3 py-2 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10 disabled:opacity-50"
              >
                Aggiorna
              </button>
            </div>
          </div>

          {character && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Azioni Amministrative</p>
              <button
                type="button"
                onClick={handleResetStats}
                disabled={saving}
                className="px-4 py-2 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10 disabled:opacity-50"
              >
                Reset Statistiche
              </button>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-400 mb-2">Storico Sanzioni</p>
            {sanctions.length === 0 ? (
              <p className="text-xs text-gray-500">Nessuna sanzione registrata.</p>
            ) : (
              <ul className="space-y-2">
                {sanctions.map((s) => (
                  <li key={s.id} className="p-2 rounded border border-[var(--border-color)] bg-black/20 text-xs">
                    <p className="text-white">{s.type}</p>
                    {s.reason && <p className="text-gray-500 mt-1">{s.reason}</p>}
                    <p className="text-gray-600 mt-1">
                      {new Date(s.createdAt).toLocaleDateString("it-IT")}
                      {s.adminName && ` · da ${s.adminName}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type UserRole = "PLAYER" | "MASTER" | "ADMIN";
type BanState = "NONE" | "SHADOW" | "FULL";

// ─── Gestione Playlist ───
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

function PlaylistManagement() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showSongModal, setShowSongModal] = useState(false);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const data = await api.get("/playlists");
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento playlist:", e);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSongs = async (playlistId: string) => {
    try {
      const data = await api.get(`/playlists/${playlistId}/songs`);
      setSongs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento canzoni:", e);
      setSongs([]);
    }
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    loadSongs(playlist.id);
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm("Vuoi eliminare questa playlist? Le canzoni verranno eliminate.")) return;
    try {
      await api.delete(`/admin/playlists/${id}`);
      await loadPlaylists();
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null);
        setSongs([]);
      }
      alert("Playlist eliminata!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'eliminazione");
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!confirm("Vuoi eliminare questa canzone?")) return;
    try {
      await api.delete(`/admin/songs/${id}`);
      if (selectedPlaylist) {
        await loadSongs(selectedPlaylist.id);
      }
      alert("Canzone eliminata!");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'eliminazione");
    }
  };

  if (loading) {
    return <p className="text-gray-500">Caricamento...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-white">Gestione Playlist</h2>
        <button
          type="button"
          onClick={() => setShowPlaylistModal(true)}
          className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10"
        >
          + Nuova Playlist
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Lista Playlist */}
        <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
          <div className="bg-black/40 p-3 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-display text-white">Playlist</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {playlists.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">Nessuna playlist.</p>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {playlists.map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 cursor-pointer hover:bg-black/20 transition-colors ${
                      selectedPlaylist?.id === p.id ? "bg-[var(--accent-gold)]/10" : ""
                    }`}
                    onClick={() => handleSelectPlaylist(p)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white font-display text-sm">{p.name}</p>
                        {p.description && (
                          <p className="text-gray-500 text-xs mt-1">{p.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(p.id);
                        }}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        <FontAwesomeIcon icon={icons.close} className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lista Canzoni */}
        <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
          <div className="bg-black/40 p-3 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="text-sm font-display text-white">
              Canzoni {selectedPlaylist ? `- ${selectedPlaylist.name}` : ""}
            </h3>
            {selectedPlaylist && (
              <button
                type="button"
                onClick={() => setShowSongModal(true)}
                className="px-2 py-1 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10"
              >
                + Aggiungi
              </button>
            )}
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {!selectedPlaylist ? (
              <p className="p-4 text-gray-500 text-sm">Seleziona una playlist.</p>
            ) : songs.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">Nessuna canzone in questa playlist.</p>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {songs.map((s) => (
                  <div key={s.id} className="p-3 hover:bg-black/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-white text-sm">{s.title}</p>
                        <p className="text-gray-500 text-xs mt-1">{s.url}</p>
                        <p className="text-gray-600 text-xs mt-1">
                          Tipo: {s.sourceType} · Ordine: {s.order}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSong(s.id)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        <FontAwesomeIcon icon={icons.close} className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nuova/Modifica Playlist */}
      {showPlaylistModal && (
        <PlaylistModal
          playlist={null}
          onClose={() => {
            setShowPlaylistModal(false);
          }}
          onSave={async () => {
            await loadPlaylists();
            setShowPlaylistModal(false);
          }}
        />
      )}

      {/* Modal Nuova/Modifica Canzone */}
      {showSongModal && selectedPlaylist && (
        <SongModal
          playlistId={selectedPlaylist.id}
          song={null}
          onClose={() => {
            setShowSongModal(false);
          }}
          onSave={async () => {
            await loadSongs(selectedPlaylist.id);
            setShowSongModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Gestione Forum ───
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
  order: number;
  sectionId: string;
};

function ForumManagement() {
  const [sections, setSections] = useState<ForumSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<ForumSection | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<ForumBoard | null>(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const data = (await api.get("/forum")) as ForumSection[];
      setSections(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento sezioni:", e);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Eliminare questa sezione? Verranno eliminate anche tutte le bacheche e i topic contenuti.")) return;
    try {
      await api.delete(`/admin/forum/sections/${sectionId}`);
      await loadSections();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'eliminazione");
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm("Eliminare questa bacheca? Verranno eliminati anche tutti i topic contenuti.")) return;
    try {
      await api.delete(`/admin/forum/boards/${boardId}`);
      await loadSections();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'eliminazione");
    }
  };

  if (loading) {
    return <div className="text-gray-400">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-white">Gestione Forum</h2>
        <button
          type="button"
          onClick={() => {
            setSelectedSection(null);
            setShowSectionModal(true);
          }}
          className="px-4 py-2 bg-[var(--accent-violet)]/20 border border-[var(--accent-violet)] rounded text-sm text-white hover:bg-[var(--accent-violet)]/30 transition-colors"
        >
          + Nuova Sezione
        </button>
      </div>

      {sections.length === 0 ? (
        <p className="text-gray-500">Nessuna sezione ancora. Crea la prima sezione per iniziare.</p>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="border border-[var(--border-color)] rounded-lg p-4 bg-black/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-[var(--accent-gold)] text-lg">{section.name}</h3>
                  {section.description && <p className="text-sm text-gray-400 mt-1">{section.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSection(section);
                      setShowSectionModal(true);
                    }}
                    className="px-3 py-1 text-xs border border-gray-600 rounded text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
                  >
                    Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(section.id)}
                    className="px-3 py-1 text-xs border border-red-600 rounded text-red-400 hover:bg-red-600/20 transition-colors"
                  >
                    Elimina
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase">Bacheche</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBoard(null);
                      setSelectedSection(section);
                      setShowBoardModal(true);
                    }}
                    className="px-2 py-1 text-xs border border-[var(--accent-violet)] rounded text-[var(--accent-violet)] hover:bg-[var(--accent-violet)]/20 transition-colors"
                  >
                    + Nuova Bacheca
                  </button>
                </div>
                {section.bacheche.length === 0 ? (
                  <p className="text-xs text-gray-600">Nessuna bacheca in questa sezione.</p>
                ) : (
                  section.bacheche.map((board) => (
                    <div key={board.id} className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/5">
                      <div>
                        <span className="text-sm text-white">{board.name}</span>
                        {board.description && <span className="text-xs text-gray-500 ml-2">— {board.description}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBoard(board);
                            setSelectedSection(section);
                            setShowBoardModal(true);
                          }}
                          className="px-2 py-1 text-xs border border-gray-600 rounded text-gray-400 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] transition-colors"
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBoard(board.id)}
                          className="px-2 py-1 text-xs border border-red-600 rounded text-red-400 hover:bg-red-600/20 transition-colors"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Sezione */}
      {showSectionModal && (
        <SectionModal
          section={selectedSection}
          onClose={() => {
            setShowSectionModal(false);
            setSelectedSection(null);
          }}
          onSave={async () => {
            await loadSections();
            setShowSectionModal(false);
            setSelectedSection(null);
          }}
        />
      )}

      {/* Modal Bacheca */}
      {showBoardModal && selectedSection && (
        <BoardModal
          board={selectedBoard}
          sectionId={selectedSection.id}
          onClose={() => {
            setShowBoardModal(false);
            setSelectedBoard(null);
            setSelectedSection(null);
          }}
          onSave={async () => {
            await loadSections();
            setShowBoardModal(false);
            setSelectedBoard(null);
            setSelectedSection(null);
          }}
        />
      )}
    </div>
  );
}

function SectionModal({
  section,
  onClose,
  onSave,
}: {
  section: ForumSection | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(section?.name || "");
  const [description, setDescription] = useState(section?.description || "");
  const [order, setOrder] = useState(section?.order ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Il nome è obbligatorio");
      return;
    }
    setSaving(true);
    try {
      if (section) {
        await api.put(`/admin/forum/sections/${section.id}`, { name, description, order });
      } else {
        await api.post("/admin/forum/sections", { name, description, order });
      }
      onSave();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg uppercase tracking-wider text-[var(--accent-gold)] mb-4">
          {section ? "Modifica Sezione" : "Nuova Sezione"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ordine</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded text-gray-400 hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[var(--accent-violet)] rounded text-white hover:bg-[var(--accent-violet)]/80 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardModal({
  board,
  sectionId,
  onClose,
  onSave,
}: {
  board: ForumBoard | null;
  sectionId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(board?.name || "");
  const [description, setDescription] = useState(board?.description || "");
  const [order, setOrder] = useState(board?.order ?? 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Il nome è obbligatorio");
      return;
    }
    setSaving(true);
    try {
      if (board) {
        await api.put(`/admin/forum/boards/${board.id}`, { name, description, order, section_id: sectionId });
      } else {
        await api.post("/admin/forum/boards", { section_id: sectionId, name, description, order });
      }
      onSave();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg uppercase tracking-wider text-[var(--accent-gold)] mb-4">
          {board ? "Modifica Bacheca" : "Nuova Bacheca"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ordine</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded text-gray-400 hover:text-white transition-colors"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[var(--accent-violet)] rounded text-white hover:bg-[var(--accent-violet)]/80 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaylistModal({
  playlist,
  onClose,
  onSave,
}: {
  playlist: Playlist | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(playlist?.name || "");
  const [description, setDescription] = useState(playlist?.description || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Il nome è obbligatorio");
      return;
    }
    setSaving(true);
    try {
      if (playlist) {
        await api.put(`/admin/playlists/${playlist.id}`, { name, description });
      } else {
        await api.post("/admin/playlists", { name, description });
      }
      onSave();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg uppercase tracking-wider text-[var(--accent-gold)] mb-4">
          {playlist ? "Modifica Playlist" : "Nuova Playlist"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 text-xs"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type AvailableSong = {
  filename: string;
  title: string;
  url: string;
  sourceType: "file";
};

function SongModal({
  playlistId,
  song,
  onClose,
  onSave,
}: {
  playlistId: string;
  song: Song | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [title, setTitle] = useState(song?.title || "");
  const [url, setUrl] = useState(song?.url || "");
  const [sourceType, setSourceType] = useState<"youtube" | "file" | "url">(song?.sourceType || "url");
  const [coverImageUrl, setCoverImageUrl] = useState(song?.coverImageUrl || "");
  const [order, setOrder] = useState(song?.order ?? 0);
  const [saving, setSaving] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<AvailableSong[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [selectedAvailableSong, setSelectedAvailableSong] = useState<string>("");

  // Carica canzoni disponibili quando si apre il modal
  useEffect(() => {
    if (!song) {
      // Solo quando si crea una nuova canzone, carica le canzoni disponibili
      loadAvailableSongs();
    }
  }, [song]);

  const loadAvailableSongs = async () => {
    setLoadingSongs(true);
    try {
      const data = (await api.get("/playlists/available-songs")) as AvailableSong[];
      setAvailableSongs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento canzoni disponibili:", e);
      setAvailableSongs([]);
    } finally {
      setLoadingSongs(false);
    }
  };

  const handleSelectAvailableSong = (filename: string) => {
    const selected = availableSongs.find((s) => s.filename === filename);
    if (selected) {
      setSelectedAvailableSong(filename);
      setTitle(selected.title);
      setUrl(selected.url);
      setSourceType("file");
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      alert("Titolo e URL sono obbligatori");
      return;
    }
    setSaving(true);
    try {
      if (song) {
        await api.put(`/admin/songs/${song.id}`, { title, url, sourceType, coverImageUrl, order });
      } else {
        await api.post(`/admin/playlists/${playlistId}/songs`, {
          title,
          url,
          sourceType,
          coverImageUrl,
          order,
        });
      }
      onSave();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg uppercase tracking-wider text-[var(--accent-gold)] mb-4">
          {song ? "Modifica Canzone" : "Nuova Canzone"}
        </h3>
        <div className="space-y-4">
          {/* Selettore canzoni disponibili (solo per nuove canzoni) */}
          {!song && availableSongs.length > 0 && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Seleziona canzone disponibile</label>
              <select
                value={selectedAvailableSong}
                onChange={(e) => handleSelectAvailableSong(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              >
                <option value="">-- Seleziona una canzone --</option>
                {availableSongs.map((s) => (
                  <option key={s.filename} value={s.filename}>
                    {s.title}
                  </option>
                ))}
              </select>
              {selectedAvailableSong && (
                <p className="text-xs text-gray-500 mt-1">
                  Canzone selezionata: {availableSongs.find((s) => s.filename === selectedAvailableSong)?.title}
                </p>
              )}
            </div>
          )}

          {!song && loadingSongs && (
            <p className="text-xs text-gray-500">Caricamento canzoni disponibili...</p>
          )}

          <div className="border-t border-[var(--border-color)] pt-4">
            <p className="text-xs text-gray-500 mb-3">Oppure inserisci manualmente:</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Titolo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              placeholder={selectedAvailableSong ? "Compilato automaticamente" : "Nome della canzone"}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL *</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              placeholder={selectedAvailableSong ? "Compilato automaticamente" : "https://... o /musica/file.mp3"}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo Sorgente</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as "youtube" | "file" | "url")}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            >
              <option value="url">URL</option>
              <option value="youtube">YouTube</option>
              <option value="file">File</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL Immagine Copertina</label>
            <input
              type="text"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ordine</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 text-xs"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !title.trim() || !url.trim()}
              className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Log Message Block (formattazione chat) ───
function LogMessageBlock({
  log,
}: {
  log: { id: string; timestamp: string; autore: string; tipo: string; testo: string };
}) {
  const formattedContent = formatNarrativeText(log.testo ?? "");
  const isGlobal = log.tipo === "GLOBALE";
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  if (isGlobal) {
    return (
      <div className="border border-[var(--accent-violet)] bg-gradient-to-r from-[var(--accent-violet)]/20 via-transparent to-[var(--accent-violet)]/20 py-3 px-4 text-center">
        <strong className="block text-[var(--accent-violet)] mb-2 text-xs font-display">
          ✦ MESSAGGIO GLOBALE ✦
        </strong>
        <p className="m-0 font-normal text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: formattedContent }} />
      </div>
    );
  }

  return (
    <div className="w-full text-[#b3b3c0] relative pl-3">
      <div className="flex items-center mb-1.5 text-xs border-b border-white/5 pb-1 w-full">
        <span className="mr-3 text-[10px] text-gray-600 font-sans">
          {formatTime(log.timestamp)}
        </span>
        <span className="font-display font-bold text-[var(--accent-gold)] mr-2.5 tracking-wide text-[13px]">
          {log.autore}
        </span>
      </div>
      <p
        className="m-0 leading-relaxed whitespace-pre-wrap break-words font-sans text-[13px] text-[#7d7f7d] text-justify"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </div>
  );
}

// ─── Log Viewer ───
function LogViewer() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const toDatetimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [chatRooms, setChatRooms] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedChat, setSelectedChat] = useState("");
  const [selectedFrom, setSelectedFrom] = useState(toDatetimeLocal(todayStart));
  const [selectedTo, setSelectedTo] = useState(toDatetimeLocal(todayEnd));
  const [logs, setLogs] = useState<Array<{ id: string; timestamp: string; autore: string; tipo: string; testo: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = (await api.get("/admin/chat-rooms")) as Array<{ id: string; name: string }>;
        setChatRooms(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedChat) setSelectedChat(data[0].id);
      } catch (e) {
        console.error("Errore caricamento chat rooms:", e);
      }
    };
    fetchRooms();
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!selectedChat || !selectedFrom) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ chatId: selectedChat, from: selectedFrom });
      if (selectedTo) params.set("to", selectedTo);
      const data = (await api.get(`/admin/logs?${params}`)) as Array<{
        id: string;
        timestamp: string;
        autore: string;
        tipo: string;
        testo: string;
      }>;
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento log:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedChat, selectedFrom, selectedTo]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div className="min-w-[200px]">
          <label className="block text-sm text-gray-400 mb-1">Chat</label>
          <select
            value={selectedChat}
            onChange={(e) => setSelectedChat(e.target.value)}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
          >
            {chatRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Da</label>
          <input
            type="datetime-local"
            value={selectedFrom}
            onChange={(e) => setSelectedFrom(e.target.value)}
            className="px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">A</label>
          <input
            type="datetime-local"
            value={selectedTo}
            onChange={(e) => setSelectedTo(e.target.value)}
            className="px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
          />
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 rounded border border-[var(--accent-violet)] bg-[var(--accent-violet)]/20 text-[var(--accent-violet)] text-xs hover:bg-[var(--accent-violet)]/30 disabled:opacity-50"
        >
          {loading ? "Caricamento..." : "LEGGI LOG"}
        </button>
      </div>
      <div className="border border-[var(--border-color)] rounded-lg overflow-hidden bg-black/30 min-h-[200px] max-h-[500px] overflow-y-auto">
        {logs.length > 0 ? (
          <div className="p-4 space-y-6">
            {logs.map((log) => (
              <LogMessageBlock key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 italic">
            Nessun log trovato.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Banner Management ───
type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  order: number;
};

function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBanners = useCallback(async () => {
    try {
      const data = (await api.get("/admin/banners")) as Banner[];
      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Errore caricamento banner:", error);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleSave = async (bannerData: Partial<Banner> & { title: string; image_url: string }) => {
    setLoading(true);
    try {
      if (editingBanner?.id) {
        await api.put(`/admin/banners/${editingBanner.id}`, {
          title: bannerData.title,
          image_url: bannerData.image_url,
          link_url: bannerData.linkUrl || null,
          is_active: bannerData.isActive ?? true,
          order: bannerData.order ?? 0,
        });
      } else {
        await api.post("/admin/banners", {
          title: bannerData.title,
          image_url: bannerData.image_url,
          link_url: bannerData.linkUrl || null,
          is_active: bannerData.isActive ?? true,
          order: bannerData.order ?? 0,
        });
      }
      setEditingBanner(null);
      fetchBanners();
    } catch (error) {
      alert("Errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sei sicuro?")) return;
    try {
      await api.delete(`/admin/banners/${id}`);
      fetchBanners();
    } catch (error) {
      alert("Errore durante l'eliminazione.");
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setEditingBanner({} as Banner)}
        className="px-4 py-2 rounded border border-[var(--accent-violet)] bg-[var(--accent-violet)]/20 text-[var(--accent-violet)] text-xs hover:bg-[var(--accent-violet)]/30"
      >
        + Nuovo Banner
      </button>
      <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/40">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Titolo</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Attivo</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-t border-[var(--border-color)] hover:bg-black/20">
                <td className="px-4 py-2 text-white">{b.title}</td>
                <td className="px-4 py-2 text-gray-400">{b.isActive ? "Sì" : "No"}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setEditingBanner(b)}
                    className="px-2 py-1 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)] mr-2"
                  >
                    <FontAwesomeIcon icon={icons.edit} className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="px-2 py-1 rounded border border-red-500/60 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingBanner && (
        <BannerEditorModal
          banner={editingBanner}
          onSave={handleSave}
          onCancel={() => setEditingBanner(null)}
        />
      )}
    </div>
  );
}

function BannerEditorModal({
  banner,
  onSave,
  onCancel,
}: {
  banner: Partial<Banner>;
  onSave: (data: Partial<Banner> & { title: string; image_url: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(banner.title || "");
  const [imageUrl, setImageUrl] = useState(banner.imageUrl || "");
  const [linkUrl, setLinkUrl] = useState(banner.linkUrl || "");
  const [isActive, setIsActive] = useState(banner.isActive ?? true);
  const [order, setOrder] = useState(banner.order ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, image_url: imageUrl, linkUrl, isActive, order });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--accent-gold)] rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-display text-[var(--accent-gold)] mb-4">
          {banner.id ? "Modifica" : "Nuovo"} Banner
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Titolo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL Immagine</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Link</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-400">Attivo</label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 text-xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/30"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Daily Events Management ───
type DailyEvent = {
  id: string;
  eventDate: string;
  title: string;
  description: string | null;
};

function DailyEventsManagement() {
  const [events, setEvents] = useState<DailyEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<DailyEvent | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const data = (await api.get("/admin/daily-events")) as DailyEvent[];
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Errore caricamento eventi:", error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSave = async (eventData: Partial<DailyEvent> & { event_date: string; title: string }) => {
    setLoading(true);
    try {
      if (editingEvent?.id) {
        await api.put(`/admin/daily-events/${editingEvent.id}`, {
          event_date: eventData.event_date,
          title: eventData.title,
          description: eventData.description || null,
        });
      } else {
        await api.post("/admin/daily-events", {
          event_date: eventData.event_date,
          title: eventData.title,
          description: eventData.description || null,
        });
      }
      setEditingEvent(null);
      fetchEvents();
    } catch (error) {
      alert("Errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sei sicuro?")) return;
    try {
      await api.delete(`/admin/daily-events/${id}`);
      fetchEvents();
    } catch (error) {
      alert("Errore durante l'eliminazione.");
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setEditingEvent({} as DailyEvent)}
        className="px-4 py-2 rounded border border-[var(--accent-violet)] bg-[var(--accent-violet)]/20 text-[var(--accent-violet)] text-xs hover:bg-[var(--accent-violet)]/30"
      >
        + Nuovo Evento
      </button>
      <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/40">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Data</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Titolo</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {events.length > 0 ? (
              events.map((event) => (
                <tr key={event.id} className="border-t border-[var(--border-color)] hover:bg-black/20">
                  <td className="px-4 py-2 text-gray-400">{event.eventDate}</td>
                  <td className="px-4 py-2 text-white">{event.title}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setEditingEvent(event)}
                      className="px-2 py-1 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)] mr-2"
                    >
                      <FontAwesomeIcon icon={icons.edit} className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id)}
                      className="px-2 py-1 rounded border border-red-500/60 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500 italic">
                  Nessun evento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editingEvent && (
        <DailyEventModal
          event={editingEvent}
          onSave={handleSave}
          onCancel={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}

function DailyEventModal({
  event,
  onSave,
  onCancel,
}: {
  event: Partial<DailyEvent>;
  onSave: (data: Partial<DailyEvent> & { event_date: string; title: string }) => void;
  onCancel: () => void;
}) {
  const [eventDate, setEventDate] = useState(event.eventDate || "");
  const [title, setTitle] = useState(event.title || "");
  const [description, setDescription] = useState(event.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ event_date: eventDate, title, description: description || null });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--accent-gold)] rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-display text-[var(--accent-gold)] mb-4">
          {event.id ? "Modifica" : "Nuovo"} Evento
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Data</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Titolo</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white min-h-[100px]"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 text-xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/30"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ─── Map Management ───
const GAME_MAP_BANNER_OPTIONS: { value: string; label: string }[] = [
  { value: "ogon", label: "Ogon" },
  { value: "izayoi", label: "Izayoi" },
  { value: "onimori", label: "Onimori" },
  { value: "ezochi", label: "Ezochi" },
  { value: "altrove", label: "Altrove" },
];

const BANNER_POSITION_OPTIONS: { value: string; label: string }[] = [
  { value: "center", label: "Centro" },
  { value: "top", label: "In alto" },
  { value: "bottom", label: "In basso" },
  { value: "left", label: "A sinistra" },
  { value: "right", label: "A destra" },
  { value: "left top", label: "In alto a sinistra" },
  { value: "right top", label: "In alto a destra" },
  { value: "left bottom", label: "In basso a sinistra" },
  { value: "right bottom", label: "In basso a destra" },
];

type Location = {
  id: string;
  parentId: string | null;
  name: string;
  type: "MAP" | "CHAT";
  imageUrl: string | null;
  bannerUrl: string | null;
  bannerForGameMap: string | null;
  /** Posizione immagine nel ritaglio: center, top, left top, ecc. o "x% y%" */
  bannerPosition: string | null;
  description: string | null;
  prefecture: string | null;
  posX: number;
  posY: number;
};

// ─── Jobs (Arubaito) Management ───
function JobsManagement() {
  type Job = { id: string; title: string; description: string | null; dailySalary: number; createdAt?: string };
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: "", description: "", daily_salary: "20" });
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const data = (await api.get("/admin/jobs")) as Job[];
      setJobs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento lavori:", e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = formData.title.trim();
    const dailySalary = parseInt(formData.daily_salary, 10);
    if (!title) {
      alert("Inserisci un titolo per il lavoro.");
      return;
    }
    if (!Number.isFinite(dailySalary) || dailySalary < 0) {
      alert("Inserisci uno stipendio giornaliero valido (numero ≥ 0).");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/admin/jobs", {
        title,
        description: formData.description.trim() || undefined,
        daily_salary: dailySalary,
      });
      setFormData({ title: "", description: "", daily_salary: "20" });
      fetchJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore durante la creazione.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminare questo lavoro? I personaggi che lo avevano assegnato non avranno più un lavoro.")) return;
    try {
      await api.delete(`/admin/jobs/${id}`);
      fetchJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore durante l'eliminazione.");
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento lavori…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-white">Lavori (Arubaito)</h2>
        <button
          type="button"
          onClick={() => fetchJobs()}
          className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
        >
          <FontAwesomeIcon icon={icons.refresh} className="w-3 h-3 mr-1" />
          Aggiorna
        </button>
      </div>

      <form onSubmit={handleCreate} className="p-4 rounded border border-[var(--border-color)] bg-black/20 space-y-3">
        <h3 className="text-sm font-display text-[var(--accent-gold)]">Nuovo lavoro</h3>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Titolo</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            placeholder="Es. Fioraio/a a Ikebukuro"
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white placeholder-gray-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Descrizione (opzionale)</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            placeholder="Breve descrizione"
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Stipendio giornaliero (REM)</label>
          <input
            type="number"
            min={0}
            value={formData.daily_salary}
            onChange={(e) => setFormData((p) => ({ ...p, daily_salary: e.target.value }))}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
        >
          {submitting ? "Creazione…" : "Crea lavoro"}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-display text-[var(--accent-gold)] mb-2">Elenco lavori</h3>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-500">Nessun lavoro creato. Aggiungine uno dal form sopra.</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between gap-4 py-3 px-4 rounded border border-[var(--border-color)] bg-black/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm text-white">{job.title}</p>
                  {job.description && <p className="text-xs text-gray-500 mt-0.5">{job.description}</p>}
                  <p className="text-xs text-[var(--accent-gold)] mt-1">{job.dailySalary} REM/giorno</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(job.id)}
                  className="px-2 py-1 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10 shrink-0"
                  title="Elimina lavoro"
                >
                  <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Housing Types (Immobiliare / Abitazioni) Management ───
type HousingType = {
  id: string;
  code: string;
  name: string;
  squareMeters: number;
  dailyRent: number | null;
  monthlyRent: number | null;
  hpBonus: number;
  inventorySlotsBonus: number;
  requirements?: { paradisePass?: boolean };
  createdAt?: string;
};

const defaultHousingForm = {
  code: "",
  name: "",
  square_meters: "20",
  daily_rent: "",
  monthly_rent: "",
  hp_bonus: "0",
  inventory_slots_bonus: "0",
  paradise_pass: false,
};

function HousingTypesManagement() {
  const [list, setList] = useState<HousingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(defaultHousingForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const data = (await api.get("/admin/housing-types")) as HousingType[];
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento tipologie abitazione:", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const resetForm = () => {
    setFormData(defaultHousingForm);
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = formData.code.trim();
    const name = formData.name.trim();
    const squareMeters = parseInt(formData.square_meters, 10);
    if (!code || !name) {
      alert("Inserisci codice e nome.");
      return;
    }
    if (!Number.isFinite(squareMeters) || squareMeters < 0) {
      alert("Metri quadri non validi.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        code,
        name,
        square_meters: squareMeters,
        hp_bonus: parseInt(formData.hp_bonus, 10) || 0,
        inventory_slots_bonus: parseInt(formData.inventory_slots_bonus, 10) || 0,
        paradise_pass: formData.paradise_pass,
      };
      if (formData.daily_rent !== "") {
        const v = parseInt(formData.daily_rent, 10);
        body.daily_rent = Number.isFinite(v) ? v : null;
      }
      if (formData.monthly_rent !== "") {
        const v = parseInt(formData.monthly_rent, 10);
        body.monthly_rent = Number.isFinite(v) ? v : null;
      }
      const res = await api.post("/admin/housing-types", body);
      if (res && typeof res === "object" && "error" in res) {
        alert((res as { error: string }).error);
        return;
      }
      resetForm();
      fetchList();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore durante la creazione.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const code = formData.code.trim();
    const name = formData.name.trim();
    const squareMeters = parseInt(formData.square_meters, 10);
    if (!code || !name) {
      alert("Inserisci codice e nome.");
      return;
    }
    if (!Number.isFinite(squareMeters) || squareMeters < 0) {
      alert("Metri quadri non validi.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        code,
        name,
        square_meters: squareMeters,
        hp_bonus: parseInt(formData.hp_bonus, 10) || 0,
        inventory_slots_bonus: parseInt(formData.inventory_slots_bonus, 10) || 0,
        paradise_pass: formData.paradise_pass,
      };
      if (formData.daily_rent !== "") {
        const v = parseInt(formData.daily_rent, 10);
        body.daily_rent = Number.isFinite(v) ? v : null;
      } else {
        body.daily_rent = null;
      }
      if (formData.monthly_rent !== "") {
        const v = parseInt(formData.monthly_rent, 10);
        body.monthly_rent = Number.isFinite(v) ? v : null;
      } else {
        body.monthly_rent = null;
      }
      const res = await api.put(`/admin/housing-types/${editingId}`, body);
      if (res && typeof res === "object" && "error" in res) {
        alert((res as { error: string }).error);
        return;
      }
      resetForm();
      fetchList();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore durante l'aggiornamento.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminare questa tipologia? Non è possibile se è assegnata ad almeno un personaggio.")) return;
    try {
      const res = await api.delete(`/admin/housing-types/${id}`);
      if (res && typeof res === "object" && "error" in res) {
        alert((res as { error: string }).error);
        return;
      }
      if (editingId === id) resetForm();
      fetchList();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore durante l'eliminazione.");
    }
  };

  const startEdit = (row: HousingType) => {
    setEditingId(row.id);
    setFormData({
      code: row.code,
      name: row.name,
      square_meters: String(row.squareMeters),
      daily_rent: row.dailyRent != null ? String(row.dailyRent) : "",
      monthly_rent: row.monthlyRent != null ? String(row.monthlyRent) : "",
      hp_bonus: String(row.hpBonus ?? 0),
      inventory_slots_bonus: String(row.inventorySlotsBonus ?? 0),
      paradise_pass: !!row.requirements?.paradisePass,
    });
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento tipologie abitazione…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-white">Tipologie di abitazione</h2>
        <button
          type="button"
          onClick={() => fetchList()}
          className="px-3 py-1.5 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
        >
          <FontAwesomeIcon icon={icons.refresh} className="w-3 h-3 mr-1" />
          Aggiorna
        </button>
      </div>

      <form
        onSubmit={editingId ? handleUpdate : handleCreate}
        className="p-4 rounded border border-[var(--border-color)] bg-black/20 space-y-3"
      >
        <h3 className="text-sm font-display text-[var(--accent-gold)]">
          {editingId ? "Modifica tipologia" : "Nuova tipologia"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Codice (univoco)</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
              placeholder="es. order_room, container"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white placeholder-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="es. Stanza dell'Ordine, Container"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white placeholder-gray-500"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">m²</label>
            <input
              type="number"
              min={0}
              value={formData.square_meters}
              onChange={(e) => setFormData((p) => ({ ...p, square_meters: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Affitto giornaliero (REM)</label>
            <input
              type="number"
              min={0}
              value={formData.daily_rent}
              onChange={(e) => setFormData((p) => ({ ...p, daily_rent: e.target.value }))}
              placeholder="vuoto = no"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Affitto mensile (REM)</label>
            <input
              type="number"
              min={0}
              value={formData.monthly_rent}
              onChange={(e) => setFormData((p) => ({ ...p, monthly_rent: e.target.value }))}
              placeholder="vuoto = no"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Bonus PF</label>
            <input
              type="number"
              min={0}
              value={formData.hp_bonus}
              onChange={(e) => setFormData((p) => ({ ...p, hp_bonus: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Bonus slot inventario</label>
            <input
              type="number"
              min={0}
              value={formData.inventory_slots_bonus}
              onChange={(e) => setFormData((p) => ({ ...p, inventory_slots_bonus: e.target.value }))}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="paradise_pass"
              checked={formData.paradise_pass}
              onChange={(e) => setFormData((p) => ({ ...p, paradise_pass: e.target.checked }))}
              className="rounded border-[var(--border-color)]"
            />
            <label htmlFor="paradise_pass" className="text-xs text-gray-400">Requisito Paradise Pass</label>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
          >
            {submitting ? "Salvataggio…" : editingId ? "Salva modifiche" : "Crea tipologia"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 text-xs hover:bg-black/20"
            >
              Annulla
            </button>
          )}
        </div>
      </form>

      <div>
        <h3 className="text-sm font-display text-[var(--accent-gold)] mb-2">Elenco tipologie</h3>
        {list.length === 0 ? (
          <p className="text-sm text-gray-500">Nessuna tipologia. Creane una dal form sopra.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 py-3 px-4 rounded border border-[var(--border-color)] bg-black/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm text-white">{row.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    codice: {row.code} · {row.squareMeters} m²
                    {row.dailyRent != null && ` · ${row.dailyRent} REM/giorno`}
                    {row.monthlyRent != null && ` · ${row.monthlyRent} REM/mese`}
                    {row.hpBonus !== 0 && ` · +${row.hpBonus} PF`}
                    {row.inventorySlotsBonus !== 0 && ` · +${row.inventorySlotsBonus} slot`}
                    {row.requirements?.paradisePass && " · Paradise Pass"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="px-2 py-1 rounded border border-[var(--border-color)] text-gray-400 text-xs hover:text-[var(--accent-gold)]"
                    title="Modifica"
                  >
                    <FontAwesomeIcon icon={icons.edit} className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    className="px-2 py-1 rounded border border-red-500/60 text-red-400 text-xs hover:bg-red-500/10"
                    title="Elimina"
                  >
                    <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MapManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const data = (await api.get("/admin/locations")) as Location[];
      console.log("Locations ricevute dal backend:", data);
      setLocations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Errore caricamento locations:", e);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const buildTree = (list: Location[]) => {
    const map: Record<string, Location & { children: Location[] }> = {};
    const roots: (Location & { children: Location[] })[] = [];
    if (!list) return roots;
    list.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });
    list.forEach((item) => {
      if (item.parentId !== null && map[item.parentId]) {
        map[item.parentId].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });
    return roots;
  };

  const handleCreate = async (data: Partial<Location> & { name: string; type: "MAP" | "CHAT" }) => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: data.name,
        type: data.type,
        pos_x: data.posX ?? 50,
        pos_y: data.posY ?? 50,
      };
      if (data.parentId != null && data.parentId !== "") body.parent_id = data.parentId;
      if (data.imageUrl != null && data.imageUrl !== "") body.image_url = data.imageUrl;
      if (data.bannerUrl != null && data.bannerUrl !== "") body.banner_url = data.bannerUrl;
      if (data.bannerForGameMap != null && data.bannerForGameMap !== "") body.banner_for_game_map = data.bannerForGameMap;
      if (data.bannerPosition != null && data.bannerPosition !== "") body.banner_position = data.bannerPosition;
      if (data.description != null && data.description !== "") body.description = data.description;
      if (data.prefecture != null && data.prefecture !== "") body.prefecture = data.prefecture;
      await api.post("/admin/locations", body);
      fetchLocations();
    } catch (e) {
      console.error("Errore creazione location:", e);
      const errorMessage = e instanceof Error ? e.message : "Errore durante la creazione.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Sei sicuro? Cancellando una mappa elimini anche tutte le chat al suo interno."))
      return;
    try {
      await api.delete(`/admin/locations/${id}`);
      fetchLocations();
    } catch (e) {
      console.error("Errore eliminazione location:", e);
      alert("Errore durante l'eliminazione.");
    }
  };

  const handleSave = async (data: Location) => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: data.name,
        type: data.type,
        pos_x: data.posX,
        pos_y: data.posY,
      };
      if (data.imageUrl != null && data.imageUrl !== "") body.image_url = data.imageUrl;
      if (data.bannerUrl != null && data.bannerUrl !== "") body.banner_url = data.bannerUrl;
      if (data.bannerForGameMap != null && data.bannerForGameMap !== "") body.banner_for_game_map = data.bannerForGameMap;
      if (data.bannerPosition != null && data.bannerPosition !== "") body.banner_position = data.bannerPosition;
      if (data.description != null && data.description !== "") body.description = data.description;
      if (data.prefecture != null && data.prefecture !== "") body.prefecture = data.prefecture;
      await api.put(`/admin/locations/${data.id}`, body);
      setEditingLocation(null);
      fetchLocations();
    } catch (e) {
      console.error("Errore aggiornamento location:", e);
      alert("Errore durante l'aggiornamento.");
    } finally {
      setLoading(false);
    }
  };

  const tree = buildTree(locations);

  return (
    <div className="space-y-4">
      {editingLocation && (
        <LocationEditorModal
          location={editingLocation}
          onSave={handleSave}
          onCancel={() => setEditingLocation(null)}
        />
      )}
      <LocationCreator parentId={null} onCreate={handleCreate} />
      <div className="mt-5 space-y-2">
        {tree.map((node) => (
          <LocationNode
            key={node.id}
            node={node}
            onCreate={handleCreate}
            onDelete={handleDelete}
            onEdit={setEditingLocation}
          />
        ))}
      </div>
    </div>
  );
}

function LocationCreator({
  parentId,
  onCreate,
}: {
  parentId: string | null;
  onCreate: (data: Partial<Location> & { name: string; type: "MAP" | "CHAT" }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"MAP" | "CHAT">("CHAT");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ parentId, name, type });
    setName("");
    setType("CHAT");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 mb-5 bg-black/20 rounded border border-[var(--border-color)]"
    >
      <div className="flex gap-2 items-center flex-wrap">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "MAP" | "CHAT")}
          className="px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white w-[100px]"
        >
          <option value="MAP">Mappa</option>
          <option value="CHAT">Chat</option>
        </select>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome Nuova Zona"
          className="flex-1 px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 rounded border border-[var(--accent-violet)] bg-[var(--accent-violet)]/20 text-[var(--accent-violet)] text-xs hover:bg-[var(--accent-violet)]/30"
        >
          CREA
        </button>
      </div>
    </form>
  );
}

function LocationNode({
  node,
  onCreate,
  onDelete,
  onEdit,
}: {
  node: Location & { children?: Location[] };
  onCreate: (data: Partial<Location> & { name: string; type: "MAP" | "CHAT" }) => void;
  onDelete: (id: string) => void;
  onEdit: (location: Location) => void;
}) {
  const [showCreator, setShowCreator] = useState(false);

  return (
    <div
      className={`p-4 border border-[var(--border-color)] mb-2 rounded ${
        node.type === "MAP" ? "bg-[var(--accent-violet)]/10" : "bg-black/30"
      }`}
    >
      <div className="flex justify-between items-center flex-wrap gap-2">
        <span className="font-display text-sm font-bold" style={{ color: node.type === "MAP" ? "#c9a84a" : "#e6e0ff" }}>
          {node.name} <span className="text-xs text-gray-500 uppercase">{node.type}</span>
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(node)}
            className="px-2 py-1 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
          >
            <FontAwesomeIcon icon={icons.pin} className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setShowCreator(!showCreator)}
            className="px-2 py-1 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
          >
            {showCreator ? "-" : "+"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="px-2 py-1 rounded border border-red-500/60 text-xs text-red-400 hover:bg-red-500/10"
          >
            <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
          </button>
        </div>
      </div>
      {showCreator && (
        <LocationCreator
          parentId={node.id}
          onCreate={(data) => {
            onCreate(data);
            setShowCreator(false);
          }}
        />
      )}
      {node.type === "MAP" && node.children && node.children.length > 0 && (
        <div className="mt-2 pl-4 border-l-2 border-[var(--border-color)]">
          {node.children.map((child) => (
            <LocationNode key={child.id} node={{ ...child, children: (child as Location & { children?: Location[] }).children }} onCreate={onCreate} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

function LocationEditorModal({
  location,
  onSave,
  onCancel,
}: {
  location: Location;
  onSave: (data: Location) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(location);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = ["posX", "posY"].includes(name) ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--accent-gold)] rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-display text-[var(--accent-gold)] mb-4">
          {location.id ? "Modifica" : "Nuova"} Location
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL Immagine</label>
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          {formData.type === "MAP" && (
            <div className="space-y-2">
              <label className="block text-sm text-gray-400 mb-1">Banner (header mappa)</label>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Mostra questo banner quando si apre:</label>
                <select
                  name="bannerForGameMap"
                  value={formData.bannerForGameMap ?? ""}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                >
                  <option value="">— Nessuna mappa —</option>
                  {GAME_MAP_BANNER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">Posizione immagine nel ritaglio:</label>
                <select
                  name="bannerPosition"
                  value={formData.bannerPosition ?? "center"}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                >
                  {BANNER_POSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">URL immagine (path dalla root):</label>
                <input
                  type="text"
                  name="bannerUrl"
                  value={formData.bannerUrl ?? ""}
                  onChange={handleChange}
                  placeholder="/maps/hamanachi-banner.jpg"
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                />
              </div>
            </div>
          )}
          {formData.type === "MAP" && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prefettura</label>
              <input
                type="text"
                name="prefecture"
                value={formData.prefecture || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrizione</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white min-h-[80px]"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Pos X %</label>
              <input
                type="number"
                name="posX"
                value={formData.posX}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Pos Y %</label>
              <input
                type="number"
                name="posY"
                value={formData.posY}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 text-xs"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/30"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
