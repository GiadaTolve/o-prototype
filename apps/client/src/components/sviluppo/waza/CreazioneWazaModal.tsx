"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getTierCsCost, isWazaTier } from "@domain/combat/tier";
import { WazaApiError, wazaApi } from "./editor/waza-api";
import {
  vocabolarioGenitoreKey,
  WAZA_CATEGORIA_LABELS,
  type WazaCategoria,
} from "./waza-admin-ui";

type VocabolarioItem = { categoria: string; valore: string };

type CreazioneWazaModalProps = {
  open: boolean;
  onClose: () => void;
  vocabolari: VocabolarioItem[];
};

export function CreazioneWazaModal({ open, onClose, vocabolari }: CreazioneWazaModalProps) {
  const router = useRouter();
  const [nomeRomaji, setNomeRomaji] = useState("");
  const [nomeItaliano, setNomeItaliano] = useState("");
  const [categoria, setCategoria] = useState<WazaCategoria>("generica");
  const [genitore, setGenitore] = useState("");
  const [tipo, setTipo] = useState<"passiva" | "attiva">("attiva");
  const [tier, setTier] = useState<string>("1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genitoriOptions = useMemo(() => {
    if (categoria === "generica") return [];
    const key = vocabolarioGenitoreKey(categoria);
    if (!key) return [];
    return vocabolari.filter((v) => v.categoria === key).map((v) => v.valore);
  }, [categoria, vocabolari]);

  if (!open) return null;

  const inputClass =
    "w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const tierNum = tipo === "attiva" && tier ? Number(tier) : null;
    const cs = tierNum != null && isWazaTier(tierNum) ? getTierCsCost(tierNum) : 0;

    try {
      const res = await wazaApi.post<{ waza: { id: string } }>("/admin/waza", {
        nomeRomaji: nomeRomaji.trim(),
        nomeItaliano: nomeItaliano.trim(),
        descrizione: "",
        cs,
        categoria,
        genitore: categoria === "generica" ? null : genitore || null,
        tipo,
        tier: tipo === "attiva" ? tierNum : null,
        tempoQuarti: tipo === "attiva" ? 1 : null,
        effetti: [],
        tags: [],
      });
      onClose();
      router.push(`/sviluppo/waza/${res.waza.id}`);
    } catch (err) {
      setError(err instanceof WazaApiError ? err.message : "Errore creazione waza");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-lg rounded border border-[var(--border-color)] bg-[var(--panel-bg)] p-4 space-y-4 shadow-[var(--shadow-violet)]"
      >
        <h2 className="text-sm font-display text-[var(--accent-gold)]">Nuova waza</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Nome rōmaji</span>
            <input
              required
              value={nomeRomaji}
              onChange={(e) => setNomeRomaji(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Nome italiano</span>
            <input
              required
              value={nomeItaliano}
              onChange={(e) => setNomeItaliano(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Categoria</span>
            <select
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value as WazaCategoria);
                setGenitore("");
              }}
              className={inputClass}
            >
              {(Object.keys(WAZA_CATEGORIA_LABELS) as WazaCategoria[]).map((cat) => (
                <option key={cat} value={cat}>
                  {WAZA_CATEGORIA_LABELS[cat]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Genitore</span>
            <select
              value={genitore}
              onChange={(e) => setGenitore(e.target.value)}
              disabled={categoria === "generica"}
              required={categoria !== "generica"}
              className={inputClass}
            >
              <option value="">—</option>
              {genitoriOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Tipo</span>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "passiva" | "attiva")}
              className={inputClass}
            >
              <option value="attiva">Attiva</option>
              <option value="passiva">Passiva</option>
            </select>
          </label>
          {tipo === "attiva" && (
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Tier</span>
              <select value={tier} onChange={(e) => setTier(e.target.value)} className={inputClass}>
                {[1, 2, 3, 4, 5].map((t) => (
                  <option key={t} value={t}>
                    T{t}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {error && <p className="text-xs text-red-300/90">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded border border-[var(--border-color)] text-gray-400"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded border border-[var(--accent-gold)]/60 text-[var(--accent-gold)] disabled:opacity-50"
          >
            {saving ? "Creazione…" : "Crea e apri editor"}
          </button>
        </div>
      </form>
    </div>
  );
}
