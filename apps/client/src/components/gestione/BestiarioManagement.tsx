"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/lib/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

type DropRow = {
  item_id: string;
  item_nome?: string;
  quantita_min?: number;
  quantita_max?: number;
  probabilita: number;
};

type WazaRow = {
  nome: string;
  descrizione?: string;
  danno?: number;
  tier?: number;
};

type BestiarioEntry = {
  id: string;
  nome: string;
  name_jp?: string | null;
  name_kanji?: string | null;
  tipo: string;
  tier: number;
  lore?: string | null;
  habitat?: string | null;
  comportamento?: string | null;
  onimori?: string | null;
  hp_max: number;
  cs_max: number;
  ir_attacco: number;
  ir_difesa: number;
  waza: WazaRow[];
  drop_table: DropRow[];
  tag_caccia: boolean;
  immagine?: string | null;
};

const TIPI = ["mob", "kizu", "kyofu", "holic", "boss", "umano"] as const;

const emptyDraft = (): Partial<BestiarioEntry> => ({
  nome: "",
  tipo: "mob",
  tier: 1,
  hp_max: 40,
  cs_max: 10,
  ir_attacco: 5,
  ir_difesa: 5,
  waza: [],
  drop_table: [],
  tag_caccia: false,
});

function wazaToText(rows: WazaRow[] | undefined): string {
  if (!rows?.length) return "";
  return rows
    .map((w) => {
      const bits = [w.nome];
      if (w.descrizione) bits.push(w.descrizione);
      if (w.danno != null) bits.push(String(w.danno));
      if (w.tier != null) bits.push(`T${w.tier}`);
      return bits.join(" | ");
    })
    .join("\n");
}

function textToWaza(raw: string): WazaRow[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nome, descrizione, dannoRaw, tierRaw] = line.split("|").map((s) => s.trim());
      const danno = dannoRaw ? Number(dannoRaw) : undefined;
      const tier = tierRaw?.replace(/^T/i, "") ? Number(tierRaw.replace(/^T/i, "")) : undefined;
      return {
        nome: nome || line,
        descrizione: descrizione || undefined,
        danno: Number.isFinite(danno) ? danno : undefined,
        tier: Number.isFinite(tier) ? tier : undefined,
      };
    });
}

function dropToText(rows: DropRow[] | undefined): string {
  if (!rows?.length) return "";
  return rows
    .map((d) => {
      const min = d.quantita_min ?? 1;
      const max = d.quantita_max ?? min;
      const nome = d.item_nome ? ` (${d.item_nome})` : "";
      return `${d.item_id}${nome} | ${min}-${max} | ${d.probabilita}%`;
    })
    .join("\n");
}

function textToDrop(raw: string): DropRow[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((s) => s.trim());
      const idPart = parts[0] ?? "";
      const qtyPart = parts[1] ?? "1-1";
      const probPart = (parts[2] ?? "50").replace("%", "");
      const nameMatch = idPart.match(/^(\S+)\s*(?:\((.+)\))?$/);
      const item_id = nameMatch?.[1] ?? idPart;
      const item_nome = nameMatch?.[2];
      const [minRaw, maxRaw] = qtyPart.split("-").map((s) => s.trim());
      const quantita_min = Number(minRaw) || 1;
      const quantita_max = Number(maxRaw ?? minRaw) || quantita_min;
      return {
        item_id,
        item_nome,
        quantita_min,
        quantita_max,
        probabilita: Number(probPart) || 0,
      };
    })
    .filter((d) => d.item_id);
}

export function BestiarioManagement() {
  const [items, setItems] = useState<BestiarioEntry[]>([]);
  const [editing, setEditing] = useState<Partial<BestiarioEntry> | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [onlyCaccia, setOnlyCaccia] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (onlyCaccia) params.set("tag_caccia", "1");
      const qs = params.toString();
      const data = (await api.get(`/admin/bestiario${qs ? `?${qs}` : ""}`)) as {
        items?: BestiarioEntry[];
      };
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setItems([]);
    }
  }, [q, onlyCaccia]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const activeFilterCount = (q.trim() ? 1 : 0) + (onlyCaccia ? 1 : 0);

  const handleSave = async (data: Partial<BestiarioEntry>) => {
    setLoading(true);
    try {
      const body = {
        nome: data.nome,
        name_jp: data.name_jp ?? null,
        name_kanji: data.name_kanji ?? null,
        tipo: data.tipo,
        tier: data.tier,
        lore: data.lore ?? null,
        habitat: data.habitat ?? null,
        comportamento: data.comportamento ?? null,
        onimori: data.onimori ?? null,
        hp_max: data.hp_max,
        cs_max: data.cs_max,
        ir_attacco: data.ir_attacco,
        ir_difesa: data.ir_difesa,
        waza: data.waza ?? [],
        drop_table: data.drop_table ?? [],
        tag_caccia: Boolean(data.tag_caccia),
        immagine: data.immagine ?? null,
      };
      if (editing?.id) {
        await api.put(`/admin/bestiario/${editing.id}`, body);
      } else {
        await api.post("/admin/bestiario", body);
      }
      setEditing(null);
      await fetchList();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminare questa voce dal Bestiario Spec?")) return;
    try {
      await api.delete(`/admin/bestiario/${id}`);
      await fetchList();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore eliminazione.");
    }
  };

  const summary = useMemo(() => {
    const caccia = items.filter((i) => i.tag_caccia).length;
    return { total: items.length, caccia };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-gray-500">
          <span className="px-2 py-1 rounded border border-[var(--border-color)]">
            {summary.total} voci
          </span>
          <span className="px-2 py-1 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)]">
            {summary.caccia} caccia
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="min-h-[44px] px-3 rounded border border-[var(--border-color)] text-xs text-gray-300"
          >
            Filtri{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setEditing(emptyDraft())}
            className="min-h-[44px] px-4 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] text-xs"
          >
            + Nuova voce
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="rounded-lg border border-[var(--border-color)] bg-black/30 p-3 space-y-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca nome / JP / tipo…"
            className="w-full min-h-[44px] px-3 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white"
          />
          <label className="flex items-center gap-2 text-sm text-gray-300 min-h-[44px]">
            <input
              type="checkbox"
              checked={onlyCaccia}
              onChange={(e) => setOnlyCaccia(e.target.checked)}
              className="h-5 w-5"
            />
            Solo tag caccia
          </label>
        </div>
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 italic py-8 text-sm">Nessuna voce Bestiario.</p>
        ) : (
          items.map((c) => (
            <article
              key={c.id}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)] p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-white font-medium">{c.nome}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">
                    {c.tipo} · T{c.tier}
                    {c.tag_caccia ? " · caccia" : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Modifica"
                    onClick={() => setEditing(c)}
                    className="min-h-[44px] min-w-[44px] rounded border border-[var(--border-color)] text-gray-400"
                  >
                    <FontAwesomeIcon icon={icons.edit} className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Elimina"
                    onClick={() => void handleDelete(c.id)}
                    className="min-h-[44px] min-w-[44px] rounded border border-red-500/50 text-red-400"
                  >
                    <FontAwesomeIcon icon={icons.trash} className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {c.onimori && <p className="text-xs text-gray-400 line-clamp-2">{c.onimori}</p>}
            </article>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border border-[var(--border-color)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/40">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Nome</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Tipo</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Tier</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Tag</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-gray-500">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((c) => (
                <tr key={c.id} className="border-t border-[var(--border-color)] hover:bg-black/20">
                  <td className="px-4 py-2 text-white">{c.nome}</td>
                  <td className="px-4 py-2 text-gray-400">{c.tipo}</td>
                  <td className="px-4 py-2 text-gray-400">{c.tier}</td>
                  <td className="px-4 py-2 text-[var(--accent-violet-light)]">
                    {c.tag_caccia ? "caccia" : "—"}
                  </td>
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
                      onClick={() => void handleDelete(c.id)}
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
                  Nessuna voce Bestiario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <BestiarioEditorModal
          entry={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          loading={loading}
        />
      )}
    </div>
  );
}

function BestiarioEditorModal({
  entry,
  onSave,
  onCancel,
  loading,
}: {
  entry: Partial<BestiarioEntry>;
  onSave: (data: Partial<BestiarioEntry>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [nome, setNome] = useState(entry.nome || "");
  const [nameJp, setNameJp] = useState(entry.name_jp || "");
  const [nameKanji, setNameKanji] = useState(entry.name_kanji || "");
  const [tipo, setTipo] = useState(entry.tipo || "mob");
  const [tier, setTier] = useState(String(entry.tier ?? 1));
  const [lore, setLore] = useState(entry.lore || "");
  const [habitat, setHabitat] = useState(entry.habitat || "");
  const [comportamento, setComportamento] = useState(entry.comportamento || "");
  const [onimori, setOnimori] = useState(entry.onimori || "");
  const [hp, setHp] = useState(String(entry.hp_max ?? 40));
  const [cs, setCs] = useState(String(entry.cs_max ?? 10));
  const [irAtk, setIrAtk] = useState(String(entry.ir_attacco ?? 5));
  const [irDef, setIrDef] = useState(String(entry.ir_difesa ?? 5));
  const [immagine, setImmagine] = useState(entry.immagine || "");
  const [tagCaccia, setTagCaccia] = useState(Boolean(entry.tag_caccia));
  const [wazaText, setWazaText] = useState(wazaToText(entry.waza));
  const [dropText, setDropText] = useState(dropToText(entry.drop_table));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      nome,
      name_jp: nameJp || null,
      name_kanji: nameKanji || null,
      tipo,
      tier: Number(tier) || 1,
      lore: lore || null,
      habitat: habitat || null,
      comportamento: comportamento || null,
      onimori: onimori || null,
      hp_max: Number(hp) || 40,
      cs_max: Number(cs) || 10,
      ir_attacco: Number(irAtk) || 5,
      ir_difesa: Number(irDef) || 5,
      immagine: immagine || null,
      tag_caccia: tagCaccia,
      waza: textToWaza(wazaText),
      drop_table: textToDrop(dropText),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onCancel}>
      <div
        className="bg-[var(--panel-bg)] border border-[var(--accent-gold)] rounded-t-xl sm:rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-display text-[var(--accent-gold)] mb-4">
          {entry.id ? "Modifica" : "Nuova"} voce Bestiario
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nome">
            <input required value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nome JP">
              <input value={nameJp} onChange={(e) => setNameJp(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Kanji">
              <input value={nameKanji} onChange={(e) => setNameKanji(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Tipo">
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
                {TIPI.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tier">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={5}
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Lore">
            <textarea value={lore} onChange={(e) => setLore(e.target.value)} className={`${inputCls} min-h-[72px]`} />
          </Field>
          <Field label="Habitat">
            <input value={habitat} onChange={(e) => setHabitat(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Comportamento">
            <input value={comportamento} onChange={(e) => setComportamento(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Onimori">
            <input value={onimori} onChange={(e) => setOnimori(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Field label="HP">
              <input type="number" inputMode="numeric" min={1} value={hp} onChange={(e) => setHp(e.target.value)} className={inputCls} />
            </Field>
            <Field label="CS">
              <input type="number" inputMode="numeric" min={0} value={cs} onChange={(e) => setCs(e.target.value)} className={inputCls} />
            </Field>
            <Field label="IR Atk">
              <input type="number" inputMode="numeric" min={0} value={irAtk} onChange={(e) => setIrAtk(e.target.value)} className={inputCls} />
            </Field>
            <Field label="IR Def">
              <input type="number" inputMode="numeric" min={0} value={irDef} onChange={(e) => setIrDef(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Waza (una per riga: Nome | desc | danno | T#)">
            <textarea value={wazaText} onChange={(e) => setWazaText(e.target.value)} className={`${inputCls} min-h-[80px] font-mono text-xs`} />
          </Field>
          <Field label="Drop (una per riga: catalogKey (nome) | min-max | %)">
            <textarea value={dropText} onChange={(e) => setDropText(e.target.value)} className={`${inputCls} min-h-[80px] font-mono text-xs`} />
          </Field>
          <Field label="URL immagine">
            <input value={immagine} onChange={(e) => setImmagine(e.target.value)} className={inputCls} placeholder="https://…" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-300 min-h-[44px]">
            <input type="checkbox" checked={tagCaccia} onChange={(e) => setTagCaccia(e.target.checked)} className="h-5 w-5" />
            Tag caccia (predisposizione drop autonomo)
          </label>
          <div className="sticky bottom-0 pt-3 flex gap-2 justify-end bg-[var(--panel-bg)]">
            <button type="button" onClick={onCancel} className="min-h-[44px] px-4 rounded border border-[var(--border-color)] text-gray-400 text-xs">
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] px-4 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] text-xs disabled:opacity-50"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full min-h-[44px] px-3 py-2 rounded border border-[var(--border-color)] bg-black/50 text-sm text-white";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
