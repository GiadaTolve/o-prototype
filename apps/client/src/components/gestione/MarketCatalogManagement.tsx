"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { MARKET_CATEGORIES, MARKET_CATEGORY_LABELS, type MarketCategory } from "@domain/economy/market-catalog";

type ItemType = "GENERIC" | "WEAPON" | "ARMOR" | "BAG";

type CatalogItemAdmin = {
  id: string;
  marketCategory: MarketCategory;
  name: string;
  nameRomaji: string | null;
  description: string | null;
  iconUrl: string | null;
  integrityMax: number | null;
  effectText: string | null;
  priceRem: number | null;
  isActiveInMarket: boolean;
  type: ItemType | null;
  damage: number | null;
  resistance: number | null;
  bonus: number | null;
  ammoKind: string | null;
};

export function MarketCatalogManagement() {
  const [items, setItems] = useState<CatalogItemAdmin[]>([]);
  const [editing, setEditing] = useState<Partial<CatalogItemAdmin> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const data = (await api.get("/market-catalog-admin")) as { items: CatalogItemAdmin[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSave = async (data: {
    marketCategory: MarketCategory;
    name: string;
    nameRomaji?: string;
    description?: string;
    iconUrl?: string;
    integrityMax?: number;
    effectText?: string;
    priceRem: number;
    isActiveInMarket: boolean;
    type?: ItemType;
    damage?: number | null;
    resistance?: number | null;
    bonus?: number | null;
    ammoKind?: string | null;
  }) => {
    setLoading(true);
    try {
      const body = {
        marketCategory: data.marketCategory,
        name: data.name,
        nameRomaji: data.nameRomaji || null,
        description: data.description || null,
        iconUrl: data.iconUrl || null,
        integrityMax: data.integrityMax ?? null,
        effectText: data.effectText || null,
        priceRem: data.priceRem,
        isActiveInMarket: data.isActiveInMarket,
        type: data.type ?? "GENERIC",
        damage: data.damage ?? null,
        resistance: data.resistance ?? null,
        bonus: data.bonus ?? null,
        ammoKind: data.ammoKind || null,
      };
      if (editing?.id) {
        await api.put(`/market-catalog-admin/${editing.id}`, body);
      } else {
        await api.post("/market-catalog-admin", body);
      }
      setEditing(null);
      fetchItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Rimuovere questo oggetto dal Market?")) return;
    try {
      const result = (await api.delete(`/market-catalog-admin/${id}`)) as {
        deactivated?: boolean;
        deleted?: boolean;
      };
      if (result?.deactivated) {
        alert("Alcuni personaggi possiedono già questo oggetto: è stato disattivato invece che eliminato.");
      }
      fetchItems();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore eliminazione.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-display text-[var(--accent-gold)]">Market — Catalogo Oggetti</h2>
        <p className="text-xs text-[var(--accent-violet-light)] mt-1">
          Oggetti acquistabili con Rem, organizzati per categoria (Armi, Armature, Veicoli, Tecnologia, Rimedi,
          Oggettistica).
        </p>
      </div>

      <button
        type="button"
        onClick={() => setEditing({ marketCategory: "oggettistica", isActiveInMarket: true })}
        className="px-4 py-2 rounded border border-[var(--accent-violet)] bg-[var(--accent-violet)]/20 text-[var(--accent-violet)] text-xs hover:bg-[var(--accent-violet)]/30"
      >
        + Nuovo Oggetto
      </button>

      <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/40">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Nome</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Categoria</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Prezzo</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Stato</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((it) => (
                <tr key={it.id} className="border-t border-[var(--border-color)] hover:bg-black/20">
                  <td className="px-4 py-2 text-white">
                    {it.name}
                    {it.nameRomaji && <span className="text-gray-500 ml-1.5 text-xs">({it.nameRomaji})</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-400">{MARKET_CATEGORY_LABELS[it.marketCategory]}</td>
                  <td className="px-4 py-2 text-[var(--accent-gold)] tabular-nums">{it.priceRem ?? "—"} Rem</td>
                  <td className="px-4 py-2">
                    {it.isActiveInMarket ? (
                      <span className="text-[10px] uppercase tracking-wider text-[var(--accent-gold)]">Attivo</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-gray-600">Disattivo</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setEditing(it)}
                      className="px-2 py-1 rounded border border-[var(--border-color)] text-xs text-gray-400 hover:text-[var(--accent-gold)] mr-2"
                    >
                      <FontAwesomeIcon icon={icons.edit} className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(it.id)}
                      className="px-2 py-1 rounded border border-red-500/60 text-xs text-red-400 hover:bg-red-500/10"
                    >
                      <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">
                  Nessun oggetto nel catalogo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <CatalogItemModal
          item={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          loading={loading}
        />
      )}
    </div>
  );
}

function CatalogItemModal({
  item,
  onSave,
  onCancel,
  loading,
}: {
  item: Partial<CatalogItemAdmin>;
  onSave: (data: {
    marketCategory: MarketCategory;
    name: string;
    nameRomaji?: string;
    description?: string;
    iconUrl?: string;
    integrityMax?: number;
    effectText?: string;
    priceRem: number;
    isActiveInMarket: boolean;
    type?: ItemType;
    damage?: number | null;
    resistance?: number | null;
    bonus?: number | null;
    ammoKind?: string | null;
  }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [marketCategory, setMarketCategory] = useState<MarketCategory>(item.marketCategory ?? "oggettistica");
  const [name, setName] = useState(item.name ?? "");
  const [nameRomaji, setNameRomaji] = useState(item.nameRomaji ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [iconUrl, setIconUrl] = useState(item.iconUrl ?? "");
  const [integrityMax, setIntegrityMax] = useState<string>(item.integrityMax?.toString() ?? "");
  const [effectText, setEffectText] = useState(item.effectText ?? "");
  const [priceRem, setPriceRem] = useState<string>(item.priceRem?.toString() ?? "");
  const [isActiveInMarket, setIsActiveInMarket] = useState(item.isActiveInMarket ?? true);
  const [itemType, setItemType] = useState<ItemType>(item.type ?? "GENERIC");
  const [damage, setDamage] = useState<string>(item.damage?.toString() ?? "");
  const [resistance, setResistance] = useState<string>(item.resistance?.toString() ?? "");
  const [bonus, setBonus] = useState<string>(item.bonus?.toString() ?? "");
  const [ammoKind, setAmmoKind] = useState<string>(item.ammoKind ?? "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      marketCategory,
      name,
      nameRomaji: nameRomaji || undefined,
      description: description || undefined,
      iconUrl: iconUrl || undefined,
      integrityMax: integrityMax ? Number(integrityMax) : undefined,
      effectText: effectText || undefined,
      priceRem: priceRem ? Number(priceRem) : 0,
      isActiveInMarket,
      type: itemType,
      damage: damage !== "" ? Number(damage) : null,
      resistance: resistance !== "" ? Number(resistance) : null,
      bonus: bonus !== "" ? Number(bonus) : null,
      ammoKind: ammoKind || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--accent-gold)] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-display text-[var(--accent-gold)] mb-4">
          {item.id ? "Modifica" : "Nuovo"} Oggetto Market
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoria Market</label>
            <select
              value={marketCategory}
              onChange={(e) => setMarketCategory(e.target.value as MarketCategory)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            >
              {MARKET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {MARKET_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome italiano</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome romaji (kanji)</label>
            <input
              type="text"
              value={nameRomaji}
              onChange={(e) => setNameRomaji(e.target.value)}
              placeholder="es. Sabimaru (錆丸)"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white min-h-[70px]"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">URL immagine (100×100 consigliato)</label>
            <input
              type="text"
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://... (vuoto = placeholder)"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Integrità</label>
              <input
                type="number"
                value={integrityMax}
                onChange={(e) => setIntegrityMax(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prezzo Rem</label>
              <input
                type="number"
                value={priceRem}
                onChange={(e) => setPriceRem(e.target.value)}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                min={0}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Effetto</label>
            <input
              type="text"
              value={effectText}
              onChange={(e) => setEffectText(e.target.value)}
              placeholder="es. Scudo 4 (T1)"
              className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
            />
          </div>

          {/* Parametri combattimento */}
          <div className="border-t border-[var(--border-color)]/50 pt-3 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display">Parametri combattimento</p>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo oggetto</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ItemType)}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
              >
                <option value="GENERIC">Generico</option>
                <option value="WEAPON">Arma (WEAPON)</option>
                <option value="ARMOR">Armatura (ARMOR)</option>
                <option value="BAG">Zaino (BAG)</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Danno</label>
                <input
                  type="number"
                  value={damage}
                  onChange={(e) => setDamage(e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Armatura</label>
                <input
                  type="number"
                  value={resistance}
                  onChange={(e) => setResistance(e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Bonus</label>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                />
              </div>
            </div>
            {itemType === "WEAPON" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo munizioni (ammoKind)</label>
                <input
                  type="text"
                  value={ammoKind}
                  onChange={(e) => setAmmoKind(e.target.value)}
                  placeholder="es. proiettili, frecce (vuoto = nessuna)"
                  className="w-full px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
                />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={isActiveInMarket}
              onChange={(e) => setIsActiveInMarket(e.target.checked)}
              className="accent-[var(--accent-gold)]"
            />
            Visibile nel Market
          </label>
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
