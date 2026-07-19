"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { MARKET_CATEGORIES, MARKET_CATEGORY_LABELS, type MarketCategory } from "@domain/economy/market-catalog";
import type { ItemCategory } from "@domain/economy/types";
import { SKIRU_CATALOG } from "@domain/skiru";
import { SOCIAL_CLASSES } from "@domain/shakai-kaikyu";
import { formatItemCategory } from "@/components/dashboard/inventory/labels";

type ItemType = "GENERIC" | "WEAPON" | "ARMOR" | "BAG";

type SkiruFlatRow = { skiruId: string; value: number };

type DismantleYieldsAdmin = {
  junkCatalogKey?: string | null;
  junkQuantity?: number | null;
  materials?: Record<string, number> | null;
} | null;

type CatalogItemAdmin = {
  id: string;
  catalogKey?: string | null;
  marketCategory: MarketCategory | null;
  name: string;
  nameRomaji: string | null;
  description: string | null;
  iconUrl: string | null;
  integrityMax: number | null;
  effectText: string | null;
  priceRem: number | null;
  isActiveInMarket: boolean;
  category?: ItemCategory | string;
  type: ItemType | null;
  damage: number | null;
  resistance: number | null;
  bonus: number | null;
  mitigationFlat: number | null;
  skiruBonuses: SkiruFlatRow[] | null;
  skiruMaluses: SkiruFlatRow[] | null;
  craftExclusiveClassId: string | null;
  ammoKind: string | null;
  dismantleYields?: DismantleYieldsAdmin;
};

const SKIRU_OPTIONS = SKIRU_CATALOG.map((s) => ({ id: s.id, label: s.name }));

const ITEM_CATEGORIES: ItemCategory[] = [
  "junk",
  "materiale",
  "consumabile",
  "equipaggiamento",
  "costrutto_materiale",
  "oggetto_trama",
];

export function ItemCatalogManagement() {
  const [items, setItems] = useState<CatalogItemAdmin[]>([]);
  const [editing, setEditing] = useState<Partial<CatalogItemAdmin> | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const data = (await api.get("/economy-admin/items")) as { items: CatalogItemAdmin[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? items.filter(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            (it.catalogKey ?? "").toLowerCase().includes(q) ||
            (it.description ?? "").toLowerCase().includes(q),
        )
      : items;

    const map = new Map<ItemCategory, CatalogItemAdmin[]>();
    for (const cat of ITEM_CATEGORIES) map.set(cat, []);
    for (const it of filtered) {
      const cat = (it.category as ItemCategory) ?? "junk";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(it);
    }
    return ITEM_CATEGORIES.map((cat) => ({ cat, items: map.get(cat) ?? [] })).filter(
      (g) => g.items.length > 0,
    );
  }, [items, filter]);

  const handleSave = async (data: Partial<CatalogItemAdmin> & { id: string }) => {
    setLoading(true);
    try {
      await api.put(`/economy-admin/items/${data.id}`, {
        name: data.name,
        nameRomaji: data.nameRomaji,
        description: data.description,
        iconUrl: data.iconUrl,
        integrityMax: data.integrityMax,
        effectText: data.effectText,
        priceRem: data.priceRem ?? 0,
        isActiveInMarket: data.isActiveInMarket,
        category: data.category,
        marketCategory: data.marketCategory,
        type: data.type,
        damage: data.damage,
        resistance: data.resistance,
        bonus: data.bonus,
        mitigationFlat: data.mitigationFlat,
        skiruBonuses: data.skiruBonuses,
        skiruMaluses: data.skiruMaluses,
        craftExclusiveClassId: data.craftExclusiveClassId,
        ammoKind: data.ammoKind,
        dismantleYields: data.dismantleYields ?? null,
      });
      setEditing(null);
      fetchItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate__animated animate__fadeIn">
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-display">Cerca</span>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Nome, catalog key, descrizione…"
          className="mt-1 w-full min-h-[44px] px-3 py-2 rounded border border-[var(--border-color)] bg-black/40 text-sm"
        />
      </label>

      {grouped.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Nessun oggetto nel catalogo.</p>
      ) : (
        grouped.map(({ cat, items: groupItems }) => (
          <section key={cat} className="rounded-lg border border-[var(--border-color)] overflow-hidden">
            <h3 className="px-3 py-2 text-xs font-display uppercase tracking-wider text-[var(--accent-gold)] bg-black/40 border-b border-[var(--border-color)]">
              {formatItemCategory(cat)} · {groupItems.length}
            </h3>
            <ul className="divide-y divide-[var(--border-color)]">
              {groupItems.map((it) => (
                <li
                  key={it.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between hover:bg-black/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-display">{it.name}</p>
                    {it.nameRomaji && <p className="text-[11px] text-gray-500">{it.nameRomaji}</p>}
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{it.catalogKey ?? "—"}</p>
                    {(it.effectText || it.description) && (
                      <p className="text-[11px] text-[var(--accent-violet-light)] mt-1 line-clamp-2">
                        {it.effectText ?? it.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-gray-500">
                      {it.integrityMax != null && <span>INT max {it.integrityMax}</span>}
                      {it.damage != null && <span>DMG {it.damage}</span>}
                      {it.mitigationFlat != null && <span>Mit {it.mitigationFlat}%</span>}
                      {it.resistance != null && <span>Sc {it.resistance}</span>}
                      {it.craftExclusiveClassId && (
                        <span className="text-[var(--accent-violet-light)]">
                          Craft {it.craftExclusiveClassId}
                        </span>
                      )}
                      {it.marketCategory && (
                        <span className="text-[var(--accent-gold)]">
                          Market · {MARKET_CATEGORY_LABELS[it.marketCategory]}
                        </span>
                      )}
                      {it.dismantleYields && (
                        <span className="text-[var(--accent-violet-light)]">Resa smantellamento custom</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(it)}
                    className="min-h-[44px] min-w-[44px] shrink-0 px-3 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)]"
                  >
                    <FontAwesomeIcon icon={icons.edit} className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {editing?.id && (
        <ItemEditModal
          item={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          loading={loading}
        />
      )}
    </div>
  );
}

function ItemEditModal({
  item,
  onSave,
  onCancel,
  loading,
}: {
  item: Partial<CatalogItemAdmin> & { id: string };
  onSave: (data: Partial<CatalogItemAdmin> & { id: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [category, setCategory] = useState<ItemCategory>((item.category as ItemCategory) ?? "junk");
  const [marketCategory, setMarketCategory] = useState<MarketCategory | "">(item.marketCategory ?? "");
  const [name, setName] = useState(item.name ?? "");
  const [nameRomaji, setNameRomaji] = useState(item.nameRomaji ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [effectText, setEffectText] = useState(item.effectText ?? "");
  const [integrityMax, setIntegrityMax] = useState(item.integrityMax?.toString() ?? "");
  const [priceRem, setPriceRem] = useState(item.priceRem?.toString() ?? "");
  const [isActiveInMarket, setIsActiveInMarket] = useState(item.isActiveInMarket ?? true);
  const [itemType, setItemType] = useState<ItemType>(item.type ?? "GENERIC");
  const [damage, setDamage] = useState(item.damage?.toString() ?? "");
  const [resistance, setResistance] = useState(item.resistance?.toString() ?? "");
  const [mitigationFlat, setMitigationFlat] = useState(item.mitigationFlat?.toString() ?? "");
  const [skiruBonuses, setSkiruBonuses] = useState<SkiruFlatRow[]>(
    Array.isArray(item.skiruBonuses) ? item.skiruBonuses : [],
  );
  const [skiruMaluses, setSkiruMaluses] = useState<SkiruFlatRow[]>(
    Array.isArray(item.skiruMaluses) ? item.skiruMaluses : [],
  );
  const [craftExclusiveClassId, setCraftExclusiveClassId] = useState(
    item.craftExclusiveClassId ?? "",
  );
  const [ammoKind, setAmmoKind] = useState(item.ammoKind ?? "");
  const [dismantleJunkKey, setDismantleJunkKey] = useState(item.dismantleYields?.junkCatalogKey ?? "");
  const [dismantleJunkQty, setDismantleJunkQty] = useState(
    item.dismantleYields?.junkQuantity?.toString() ?? "",
  );
  const [dismantleMaterials, setDismantleMaterials] = useState(
    item.dismantleYields?.materials ? JSON.stringify(item.dismantleYields.materials, null, 2) : "",
  );

  const buildDismantleYields = (): DismantleYieldsAdmin => {
    const junkCatalogKey = dismantleJunkKey.trim() || null;
    const junkQuantity = dismantleJunkQty.trim() ? Number(dismantleJunkQty) : null;
    let materials: Record<string, number> | null = null;
    const rawMaterials = dismantleMaterials.trim();
    if (rawMaterials) {
      const parsed = JSON.parse(rawMaterials) as unknown;
      if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
        throw new Error("Materiali smantellamento: JSON oggetto non valido.");
      }
      materials = {};
      for (const [key, qty] of Object.entries(parsed)) {
        if (typeof qty !== "number" || qty < 1) {
          throw new Error(`Materiale «${key}»: quantità non valida.`);
        }
        materials[key] = Math.floor(qty);
      }
    }
    if (!junkCatalogKey && junkQuantity == null && !materials) return null;
    return { junkCatalogKey, junkQuantity, materials };
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    let dismantleYields: DismantleYieldsAdmin = null;
    try {
      dismantleYields = buildDismantleYields();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Resa smantellamento non valida.");
      return;
    }
    onSave({
      id: item.id,
      category,
      marketCategory: marketCategory || null,
      name,
      nameRomaji: nameRomaji || null,
      description: description || null,
      effectText: effectText || null,
      integrityMax: integrityMax ? Number(integrityMax) : null,
      priceRem: priceRem ? Number(priceRem) : 0,
      isActiveInMarket,
      type: itemType,
      damage: damage !== "" ? Number(damage) : null,
      resistance: resistance !== "" ? Number(resistance) : null,
      mitigationFlat: mitigationFlat !== "" ? Number(mitigationFlat) : null,
      skiruBonuses: skiruBonuses.filter((r) => r.skiruId && r.value !== 0),
      skiruMaluses: skiruMaluses.filter((r) => r.skiruId && r.value !== 0),
      craftExclusiveClassId: craftExclusiveClassId || null,
      ammoKind: ammoKind || null,
      dismantleYields,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onCancel}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--accent-gold)] rounded-t-xl sm:rounded-lg p-4 sm:p-6 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-display text-[var(--accent-gold)] mb-4">Modifica oggetto</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Categoria gioco">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="field-input"
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {formatItemCategory(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nome">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="field-input" required />
          </Field>
          <Field label="Nome romaji">
            <input type="text" value={nameRomaji} onChange={(e) => setNameRomaji(e.target.value)} className="field-input" />
          </Field>
          <Field label="Descrizione">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="field-input min-h-[70px]" />
          </Field>
          <Field label="Effetto (testo in gioco)">
            <textarea value={effectText} onChange={(e) => setEffectText(e.target.value)} className="field-input min-h-[70px]" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="INT max">
              <input type="number" inputMode="numeric" value={integrityMax} onChange={(e) => setIntegrityMax(e.target.value)} className="field-input" />
            </Field>
            <Field label="DMG (flat)">
              <input type="number" inputMode="numeric" value={damage} onChange={(e) => setDamage(e.target.value)} className="field-input" />
            </Field>
            <Field label="Mitigazione % (flat)">
              <input type="number" inputMode="numeric" value={mitigationFlat} onChange={(e) => setMitigationFlat(e.target.value)} className="field-input" />
            </Field>
            <Field label="Scudo / RES">
              <input type="number" inputMode="numeric" value={resistance} onChange={(e) => setResistance(e.target.value)} className="field-input" />
            </Field>
          </div>

          <SkiruFlatEditor
            label="Bonus Skiru"
            rows={skiruBonuses}
            onChange={setSkiruBonuses}
          />
          <SkiruFlatEditor
            label="Malus Skiru"
            rows={skiruMaluses}
            onChange={setSkiruMaluses}
          />

          <Field label="Craft esclusivo (classe)">
            <select
              value={craftExclusiveClassId}
              onChange={(e) => setCraftExclusiveClassId(e.target.value)}
              className="field-input"
            >
              <option value="">Nessuno (drop ok)</option>
              {SOCIAL_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameItalian} ({c.id})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-1">
              Se impostato: solo craft di classe; non droppabile dal Master. Chi lo compra in Piazza può usarlo.
            </p>
          </Field>
          <Field label="Categoria Market (vetrina)">
            <select
              value={marketCategory}
              onChange={(e) => setMarketCategory(e.target.value as MarketCategory | "")}
              className="field-input"
            >
              <option value="">— Non in vetrina —</option>
              {MARKET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {MARKET_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prezzo Rem">
            <input type="number" inputMode="numeric" min={0} value={priceRem} onChange={(e) => setPriceRem(e.target.value)} className="field-input" />
          </Field>
          <div className="rounded border border-[var(--border-color)]/60 p-3 space-y-2 bg-black/20">
            <p className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)] font-display">
              Resa smantellamento (Artigiano)
            </p>
            <p className="text-[10px] text-gray-500">
              Opzionale — sovrascrive le regole default. Lascia vuoto per junklist / ricetta / fallback.
            </p>
            <Field label="Junk catalog key">
              <input
                type="text"
                value={dismantleJunkKey}
                onChange={(e) => setDismantleJunkKey(e.target.value)}
                placeholder="es. junk-flaconi"
                className="field-input font-mono text-xs"
              />
            </Field>
            <Field label="Quantità junk">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={dismantleJunkQty}
                onChange={(e) => setDismantleJunkQty(e.target.value)}
                placeholder="1"
                className="field-input"
              />
            </Field>
            <Field label="Materiali (JSON)">
              <textarea
                value={dismantleMaterials}
                onChange={(e) => setDismantleMaterials(e.target.value)}
                placeholder='{"reagente": 2, "stoffa": 1}'
                className="field-input min-h-[72px] font-mono text-xs"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 min-h-[44px] text-sm text-gray-400">
            <input type="checkbox" checked={isActiveInMarket} onChange={(e) => setIsActiveInMarket(e.target.checked)} />
            Attivo in vetrina Market
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 min-h-[44px] rounded border border-[var(--border-color)] text-sm">
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 min-h-[44px] rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] text-sm"
            >
              {loading ? "…" : "Salva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SkiruFlatEditor({
  label,
  rows,
  onChange,
}: {
  label: string;
  rows: SkiruFlatRow[];
  onChange: (rows: SkiruFlatRow[]) => void;
}) {
  return (
    <div className="rounded border border-[var(--border-color)]/60 p-3 space-y-2 bg-black/20">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)] font-display">
          {label}
        </p>
        <button
          type="button"
          onClick={() => onChange([...rows, { skiruId: "kairiki", value: 1 }])}
          className="min-h-[36px] px-2 rounded border border-[var(--border-color)] text-[10px] uppercase text-gray-400 hover:text-[var(--accent-gold)]"
        >
          + Riga
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-[10px] text-gray-500 italic">Nessuna riga.</p>
      ) : (
        rows.map((row, idx) => (
          <div key={`${row.skiruId}-${idx}`} className="flex flex-col sm:flex-row gap-2">
            <select
              value={row.skiruId}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, skiruId: e.target.value };
                onChange(next);
              }}
              className="field-input flex-1 min-h-[44px]"
            >
              {SKIRU_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={row.value}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...row, value: Number(e.target.value) || 0 };
                onChange(next);
              }}
              className="field-input w-full sm:w-24 min-h-[44px]"
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== idx))}
              className="min-h-[44px] min-w-[44px] rounded border border-[var(--border-color)] text-gray-500 hover:text-red-400"
              aria-label="Rimuovi"
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
