"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

type CreatureAdmin = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  stats: { hp?: number; attack?: number; defense?: number } | null;
};

export function BestiarioManagement() {
  const [creatures, setCreatures] = useState<CreatureAdmin[]>([]);
  const [editing, setEditing] = useState<CreatureAdmin | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCreatures = useCallback(async () => {
    try {
      const data = (await api.get("/admin/creatures")) as CreatureAdmin[];
      setCreatures(Array.isArray(data) ? data : []);
    } catch {
      setCreatures([]);
    }
  }, []);

  useEffect(() => {
    fetchCreatures();
  }, [fetchCreatures]);

  const handleSave = async (data: { name: string; description?: string; image_url?: string; category: string; hp?: number; attack?: number; defense?: number }) => {
    setLoading(true);
    try {
      const stats = data.hp != null || data.attack != null || data.defense != null
        ? { hp: data.hp, attack: data.attack, defense: data.defense }
        : undefined;
      if (editing?.id) {
        await api.put(`/admin/creatures/${editing.id}`, {
          name: data.name,
          description: data.description || null,
          image_url: data.image_url || null,
          category: data.category,
          stats,
        });
      } else {
        await api.post("/admin/creatures", {
          name: data.name,
          description: data.description || null,
          image_url: data.image_url || null,
          category: data.category,
          stats,
        });
      }
      setEditing(null);
      fetchCreatures();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminare questo PNG?")) return;
    try {
      await api.delete(`/admin/creatures/${id}`);
      fetchCreatures();
    } catch {
      alert("Errore eliminazione.");
    }
  };

  const categoryLabels: Record<string, string> = {
    HOLIC: "Holic",
    PHOBIAS: "Phobias",
    MUEN: "Muen",
    HUMAN: "Umano",
    CUSTOM: "Custom",
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setEditing({} as CreatureAdmin)}
        className="px-4 py-2 rounded border border-[var(--accent-violet)] bg-[var(--accent-violet)]/20 text-[var(--accent-violet)] text-xs hover:bg-[var(--accent-violet)]/30"
      >
        + Nuovo PNG
      </button>
      <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/40">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Nome</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Categoria</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {creatures.length > 0 ? (
              creatures.map((c) => (
                <tr key={c.id} className="border-t border-[var(--border-color)] hover:bg-black/20">
                  <td className="px-4 py-2 text-white">{c.name}</td>
                  <td className="px-4 py-2 text-gray-400">{categoryLabels[c.category] ?? c.category}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setEditing(c)}
                      className="px-2 py-1 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)] mr-2"
                    >
                      <FontAwesomeIcon icon={icons.edit} className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
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
                  Nessun PNG.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <CreatureModal
          creature={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          loading={loading}
        />
      )}
    </div>
  );
}

function CreatureModal({
  creature,
  onSave,
  onCancel,
  loading,
}: {
  creature: Partial<CreatureAdmin>;
  onSave: (data: { name: string; description?: string; image_url?: string; category: string; hp?: number; attack?: number; defense?: number }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(creature.name || "");
  const [description, setDescription] = useState(creature.description || "");
  const [imageUrl, setImageUrl] = useState(creature.imageUrl || "");
  const [category, setCategory] = useState(creature.category || "HOLIC");
  const [hp, setHp] = useState<string>(creature.stats?.hp?.toString() ?? "");
  const [attack, setAttack] = useState<string>(creature.stats?.attack?.toString() ?? "");
  const [defense, setDefense] = useState<string>(creature.stats?.defense?.toString() ?? "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description: description || undefined,
      image_url: imageUrl || undefined,
      category,
      hp: hp ? Number(hp) : undefined,
      attack: attack ? Number(attack) : undefined,
      defense: defense ? Number(defense) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--accent-gold)] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-display text-[var(--accent-gold)] mb-4">
          {creature.id ? "Modifica" : "Nuovo"} PNG
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            >
              <option value="HOLIC">Holic</option>
              <option value="PHOBIAS">Phobias</option>
              <option value="MUEN">Muen</option>
              <option value="HUMAN">Umano</option>
              <option value="CUSTOM">Custom</option>
            </select>
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
            <label className="block text-sm text-gray-400 mb-1">URL immagine</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm text-gray-400 mb-1">HP</label>
              <input
                type="number"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">ATK</label>
              <input
                type="number"
                value={attack}
                onChange={(e) => setAttack(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">DEF</label>
              <input
                type="number"
                value={defense}
                onChange={(e) => setDefense(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                min={0}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 text-xs">
              Annulla
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/30 disabled:opacity-50">
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
