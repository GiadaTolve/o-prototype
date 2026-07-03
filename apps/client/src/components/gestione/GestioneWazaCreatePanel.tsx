"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { STYLE_LABELS, type StyleId } from "@domain/progression/style-hexagon";
import { invalidateWazaCatalogCache } from "@/hooks/useWazaCatalog";
import { useSviluppoTaxonomy } from "@/hooks/useSviluppoTaxonomy";

type CreatePreset = "base" | "ordine" | "madosho" | "premio";

const PRESET_META: Record<CreatePreset, { title: string; poolPrefix: string }> = {
  base: { title: "Crea Nuovo (waza)", poolPrefix: "" },
  ordine: { title: "Crea Nuovo (in ordine)", poolPrefix: "ordine-" },
  madosho: { title: "Crea Nuovo (in madosho)", poolPrefix: "madosho-" },
  premio: { title: "Crea Nuovo (in premio)", poolPrefix: "premio-" },
};

const STYLE_OPTIONS = Object.entries(STYLE_LABELS) as [StyleId, string][];

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function GestioneWazaCreatePanel({
  preset,
  onCreated,
}: {
  preset: CreatePreset;
  onCreated?: () => void;
}) {
  const meta = PRESET_META[preset];
  const [name, setName] = useState("");
  const [rank, setRank] = useState("T1");
  const [costExp, setCostExp] = useState(0);
  const [styleId, setStyleId] = useState<string>("");
  const { state: taxonomy } = useSviluppoTaxonomy();
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resolvedPoolId = useMemo(() => {
    const base = slugify(name);
    if (!base) return "";
    if (preset === "madosho") return `${parentId || "madosho"}-${base}`.replace(/-+/g, "-");
    if (preset === "ordine") return `ordine-${parentId || "ordine"}-${base}`.replace(/-+/g, "-");
    if (preset === "premio") return `premio-${parentId || "premio"}-${base}`.replace(/-+/g, "-");
    return `${meta.poolPrefix}${base}`.replace(/-+/g, "-");
  }, [meta.poolPrefix, name, preset, parentId]);

  const create = async () => {
    if (!name.trim() || !resolvedPoolId.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/waza/admin/${encodeURIComponent(resolvedPoolId)}`, {
        name: name.trim(),
        description: "",
        effect: "",
        rank,
        isPassive: false,
        styleId: styleId || null,
        launchSkiruIds: [],
        damageSkiruIds: [],
        damageIndexKind: null,
        costExp: Number(costExp) || 0,
      });
      invalidateWazaCatalogCache();
      setMessage("Waza creata con successo.");
      setName("");
      setRank("T1");
      setCostExp(0);
      setStyleId("");
      setParentId("");
      onCreated?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Errore creazione waza");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded border border-[var(--border-color)] bg-[var(--background)]/40 p-4 space-y-3 animate__animated animate__fadeIn">
      <h2 className="text-lg font-display text-[var(--accent-gold)]">{meta.title}</h2>
      <p className="text-xs text-[var(--accent-violet-light)]">
        Crea una nuova voce nel catalogo staff. Puoi poi rifinirla nelle sezioni di modifica.
      </p>

      <label className="block space-y-1">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          placeholder="Nome Waza"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Tier</span>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          >
            <option value="T1">T1</option>
            <option value="T2">T2</option>
            <option value="T3">T3</option>
            <option value="T4">T4</option>
            <option value="T5">T5</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Costo EXP</span>
          <input
            type="number"
            min={0}
            value={costExp}
            onChange={(e) => setCostExp(Number(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          />
        </label>
        {preset === "base" ? (
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Genitore Dō (opzionale)</span>
            <select
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
            >
              <option value="">—</option>
              {STYLE_OPTIONS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">ID genitore</span>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
            >
              <option value="">—</option>
              {(preset === "madosho" ? taxonomy.madosho : preset === "ordine" ? taxonomy.ordine : taxonomy.premio).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {message && (
        <p className="text-xs text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-3 py-2">
          {message}
        </p>
      )}

      <button
        type="button"
        disabled={saving || !name.trim()}
        onClick={() => void create()}
        className="w-full py-2.5 rounded font-display text-sm uppercase tracking-wider bg-[var(--button-bg)] border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:shadow-[var(--shadow-gold)] disabled:opacity-50"
      >
        {saving ? "Creazione..." : "Crea nuova Waza"}
      </button>
    </div>
  );
}
