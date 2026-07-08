"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getTierCsCost, getTierValue, isWazaTier } from "@domain/combat/tier";
import {
  vocabolarioGenitoreKey,
  WAZA_CATEGORIA_LABELS,
  WAZA_VERSIONE_STATO_LABELS,
  type WazaCategoria,
} from "./waza-admin-ui";
import { SezioneBlocchi } from "./editor/SezioneBlocchi";
import { PannelloValidazione } from "./editor/PannelloValidazione";
import { PannelloRenderMeccanico } from "./editor/PannelloRenderMeccanico";
import { renderBloccoMeccanico } from "./editor/waza-blocco-render";
import { SelettoreSkiruIr } from "./editor/SelettoreSkiruIr";
import { WazaApiError, wazaApi } from "./editor/waza-api";
import {
  translateValidationIssues,
  type ValidationIssue,
} from "./editor/waza-editor-utils";

type VocabolarioItem = { categoria: string; valore: string };

type WazaAnagrafica = {
  id: string;
  slug: string;
  categoria: WazaCategoria;
  genitore: string | null;
  tipo: "passiva" | "attiva";
  tier: number | null;
  archiviata: boolean;
  versionePubblicataId: string | null;
};

type WazaVersione = {
  id: string;
  numero: number;
  stato: "bozza" | "validata" | "pubblicata" | "superata";
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string | null;
  kanjiVerificato: boolean;
  descrizione: string;
  cs: number;
  tempoQuarti: number | null;
  tags: string[];
  scelteAlLancio: unknown[];
  effetti: unknown[];
  skiruIr: string[];
  statoCodifica: string;
  changelog: string | null;
};

type EditorForm = {
  categoria: WazaCategoria;
  genitore: string | null;
  tipo: "passiva" | "attiva";
  tier: number | null;
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string;
  kanjiVerificato: boolean;
  descrizione: string;
  cs: number;
  tempoQuarti: number | null;
  tags: string[];
  skiruIr: string[];
  effetti: Record<string, unknown>[];
};

function buildVocabMap(items: VocabolarioItem[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const item of items) {
    if (!map[item.categoria]) map[item.categoria] = [];
    map[item.categoria].push(item.valore);
  }
  for (const key of Object.keys(map)) {
    map[key].sort((a, b) => a.localeCompare(b, "it"));
  }
  return map;
}

function tagOptionsFromVocab(vocabMap: Record<string, string[]>): string[] {
  const keys = ["tag", "tags", "tipologia"];
  const out = new Set<string>();
  for (const k of keys) {
    for (const v of vocabMap[k] ?? []) out.add(v);
  }
  return [...out].sort((a, b) => a.localeCompare(b, "it"));
}

function versioneToForm(waza: WazaAnagrafica, versione: WazaVersione): EditorForm {
  return {
    categoria: waza.categoria,
    genitore: waza.genitore,
    tipo: waza.tipo,
    tier: waza.tier,
    nomeRomaji: versione.nomeRomaji,
    nomeItaliano: versione.nomeItaliano,
    kanji: versione.kanji ?? "",
    kanjiVerificato: versione.kanjiVerificato,
    descrizione: versione.descrizione,
    cs: versione.cs,
    tempoQuarti: versione.tempoQuarti,
    tags: versione.tags ?? [],
    skiruIr: Array.isArray(versione.skiruIr) ? versione.skiruIr : [],
    effetti: Array.isArray(versione.effetti)
      ? (versione.effetti as Record<string, unknown>[])
      : [],
  };
}

function DisabledTooltipButton({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  return (
    <span className="relative group">
      <button
        type="button"
        disabled
        className="text-xs px-3 py-1.5 rounded border border-[var(--border-color)] text-gray-600 cursor-not-allowed"
      >
        {label}
      </button>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block whitespace-nowrap text-[10px] bg-black/90 text-gray-300 px-2 py-1 rounded border border-[var(--border-color)]">
        {tooltip}
      </span>
    </span>
  );
}

export function EditorWaza({ wazaId }: { wazaId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [validationErrori, setValidationErrori] = useState<ValidationIssue[]>([]);
  const [validationAvvisi, setValidationAvvisi] = useState<ValidationIssue[]>([]);

  const [anagrafica, setAnagrafica] = useState<WazaAnagrafica | null>(null);
  const [versione, setVersione] = useState<WazaVersione | null>(null);
  const [form, setForm] = useState<EditorForm | null>(null);
  const [vocabolari, setVocabolari] = useState<VocabolarioItem[]>([]);

  const [tab, setTab] = useState<"modifica" | "anteprima">("modifica");
  const [anteprimaDirty, setAnteprimaDirty] = useState(false);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const effettiKey = JSON.stringify(form?.effetti ?? []);
  const firstEffettiRun = useRef(true);
  const validazioneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (firstEffettiRun.current) {
      firstEffettiRun.current = false;
      return;
    }
    if (tabRef.current !== "anteprima") setAnteprimaDirty(true);
  }, [effettiKey]);

  const showAnteprima = () => {
    setTab("anteprima");
    setAnteprimaDirty(false);
  };

  const scrollToValidazione = () => {
    validazioneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const readOnly = versione?.stato !== "bozza";
  const vocabMap = useMemo(() => buildVocabMap(vocabolari), [vocabolari]);
  const tagOptions = useMemo(() => tagOptionsFromVocab(vocabMap), [vocabMap]);

  const genitoriOptions = useMemo(() => {
    if (!form?.categoria || form.categoria === "generica") return [];
    const key = vocabolarioGenitoreKey(form.categoria);
    if (!key) return [];
    return vocabMap[key] ?? [];
  }, [form?.categoria, vocabMap]);

  const tierFlatDamage = useMemo(() => {
    if (form?.tier != null && isWazaTier(form.tier)) return getTierValue(form.tier);
    return null;
  }, [form?.tier]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, vocabRes] = await Promise.all([
        wazaApi.get<{
          waza: WazaAnagrafica;
          versioni: Array<{ numero: number; stato: WazaVersione["stato"] }>;
        }>(`/admin/waza/${wazaId}`),
        wazaApi.get<{ items: VocabolarioItem[] }>("/admin/waza/vocabolari"),
      ]);

      const versioni = detail.versioni ?? [];
      const targetNum =
        versioni.find((v) => v.stato === "bozza")?.numero ?? versioni[0]?.numero ?? 1;

      const full = await wazaApi.get<{ waza: WazaAnagrafica; versione: WazaVersione }>(
        `/admin/waza/${wazaId}/versioni/${targetNum}`,
      );

      setAnagrafica(full.waza);
      setVersione(full.versione);
      setForm(versioneToForm(full.waza, full.versione));
      setVocabolari(vocabRes.items ?? []);
      setValidationErrori([]);
      setValidationAvvisi([]);
      setInfo(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore caricamento waza");
    } finally {
      setLoading(false);
    }
  }, [wazaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchForm = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleTierChange = (tierStr: string) => {
    if (!form) return;
    if (tierStr === "") {
      patchForm("tier", null);
      return;
    }
    const tier = Number(tierStr);
    if (!isWazaTier(tier)) return;
    setForm({
      ...form,
      tier,
      cs: getTierCsCost(tier),
    });
  };

  const buildPayload = () => {
    if (!form) return null;
    return {
      nomeRomaji: form.nomeRomaji,
      nomeItaliano: form.nomeItaliano,
      kanji: form.kanji.trim() || null,
      kanjiVerificato: form.kanjiVerificato,
      descrizione: form.descrizione,
      cs: form.cs,
      tempoQuarti: form.tipo === "attiva" ? form.tempoQuarti : null,
      tags: form.tags,
      skiruIr: form.skiruIr,
      effetti: form.effetti,
      categoria: form.categoria,
      genitore: form.categoria === "generica" ? null : form.genitore,
      tipo: form.tipo,
      tier: form.tier,
    };
  };

  const handleSalva = async () => {
    if (!form || !versione || readOnly) return;
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    setInfo(null);
    setValidationErrori([]);
    setValidationAvvisi([]);
    try {
      const res = await wazaApi.put<{ waza: WazaAnagrafica; versione: WazaVersione }>(
        `/admin/waza/${wazaId}/versioni/${versione.numero}`,
        payload,
      );
      setAnagrafica(res.waza);
      setVersione(res.versione);
      setForm(versioneToForm(res.waza, res.versione));
      setInfo("Bozza salvata.");
    } catch (e) {
      if (e instanceof WazaApiError) {
        const errori = translateValidationIssues(
          (e.errori as Array<{ messaggio?: string; percorso?: string; keyword?: string; instancePath?: string; message?: string }>).map(
            (err) =>
              err.keyword
                ? {
                    instancePath: err.instancePath ?? err.percorso ?? "",
                    schemaPath: "",
                    keyword: err.keyword,
                    message: err.message ?? err.messaggio,
                  }
                : { messaggio: err.messaggio ?? "Errore", percorso: err.percorso },
          ),
        );
        setValidationErrori(errori.length > 0 ? errori : [{ messaggio: e.message }]);
      } else {
        setValidationErrori([{ messaggio: e instanceof Error ? e.message : "Errore salvataggio" }]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleValida = async () => {
    if (!versione || readOnly) return;
    setValidating(true);
    setInfo(null);
    setValidationErrori([]);
    setValidationAvvisi([]);
    try {
      if (form) {
        await wazaApi.put(`/admin/waza/${wazaId}/versioni/${versione.numero}`, buildPayload());
      }
      const res = await wazaApi.post<{
        errori: ValidationIssue[];
        avvisi: ValidationIssue[];
        versione?: WazaVersione;
      }>(`/admin/waza/${wazaId}/versioni/${versione.numero}/valida`);

      setValidationErrori(res.errori ?? []);
      setValidationAvvisi(res.avvisi ?? []);

      if ((res.errori ?? []).length === 0 && res.versione) {
        setVersione(res.versione);
        if (form && anagrafica) setForm(versioneToForm(anagrafica, res.versione));
        setInfo("Versione validata con successo.");
      } else if ((res.errori ?? []).length > 0) {
        setInfo("Validazione fallita: correggi gli errori.");
      }
    } catch (e) {
      if (e instanceof WazaApiError) {
        setValidationErrori(
          (e.errori as ValidationIssue[]).length > 0
            ? (e.errori as ValidationIssue[])
            : [{ messaggio: e.message }],
        );
        setValidationAvvisi((e.avvisi as ValidationIssue[]) ?? []);
      } else {
        setValidationErrori([{ messaggio: e instanceof Error ? e.message : "Errore validazione" }]);
      }
    } finally {
      setValidating(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (!form) return;
    const has = form.tags.includes(tag);
    patchForm("tags", has ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]);
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento editor…</p>;
  }

  if (error || !form || !versione || !anagrafica) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-300/90">{error ?? "Waza non trovata."}</p>
        <Link href="/sviluppo/waza" className="text-xs text-[var(--accent-gold)]">
          ← Torna al catalogo
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 min-h-[44px] md:min-h-0 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

  const errCount = validationErrori.length;
  const avvCount = validationAvvisi.length;
  const righeMeccaniche = form.effetti.map((b) => renderBloccoMeccanico(b, tierFlatDamage));
  const ultimaRiga = righeMeccaniche[righeMeccaniche.length - 1] ?? null;

  return (
    <div className="space-y-4 animate__animated animate__fadeIn pb-28 md:pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/sviluppo/waza"
            className="text-[10px] text-gray-500 hover:text-[var(--accent-gold)]"
          >
            ← Catalogo Waza
          </Link>
          <h1 className="text-xl font-display text-[var(--accent-gold)] mt-1">
            {form.nomeItaliano || "Editor waza"}
          </h1>
          <p className="text-xs text-gray-500 font-mono">{anagrafica.slug}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)]">
            {WAZA_VERSIONE_STATO_LABELS[versione.stato] ?? versione.stato}
          </span>
          <span className="text-xs text-gray-500">v{versione.numero}</span>
          {/* Su mobile Salva/Valida vivono nella barra sticky in basso */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={readOnly || saving}
              onClick={() => void handleSalva()}
              className="text-xs px-3 py-1.5 rounded border border-[var(--accent-gold)]/60 text-[var(--accent-gold)] disabled:opacity-50"
            >
              {saving ? "Salvataggio…" : "Salva"}
            </button>
            <button
              type="button"
              disabled={readOnly || validating}
              onClick={() => void handleValida()}
              className="text-xs px-3 py-1.5 rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] disabled:opacity-50"
            >
              {validating ? "Validazione…" : "Valida"}
            </button>
            <DisabledTooltipButton label="Pubblica" tooltip="Sprint 4" />
            <DisabledTooltipButton label="Prova" tooltip="Sprint 3" />
          </div>
        </div>
      </div>

      {/* Switch tab (solo mobile), fisso in alto */}
      <div className="md:hidden sticky top-0 z-20 -mx-1 px-1 py-2 bg-[var(--background)]/95 backdrop-blur">
        <div className="grid grid-cols-2 gap-1 rounded border border-[var(--border-color)] p-1">
          <button
            type="button"
            onClick={() => setTab("modifica")}
            className={`min-h-[40px] rounded text-sm ${
              tab === "modifica"
                ? "bg-[var(--panel-bg)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/40"
                : "text-gray-400"
            }`}
          >
            Modifica
          </button>
          <button
            type="button"
            onClick={showAnteprima}
            className={`relative min-h-[40px] rounded text-sm ${
              tab === "anteprima"
                ? "bg-[var(--panel-bg)] text-[var(--accent-violet-light)] border border-[var(--accent-violet)]/40"
                : "text-gray-400"
            }`}
          >
            Anteprima
            {form.effetti.length > 0 && (
              <span className="ml-1.5 text-[10px] text-gray-500">({form.effetti.length})</span>
            )}
            {anteprimaDirty && tab !== "anteprima" && (
              <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[var(--accent-gold)]" />
            )}
          </button>
        </div>
      </div>

      {readOnly && (
        <p className="text-xs text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 rounded px-3 py-2 bg-black/20">
          Questa versione non è in bozza: i campi sono in sola lettura. Per modificare, crea una nuova
          bozza (Sprint 4).
        </p>
      )}

      {/* ===== Tab MODIFICA (mobile) / colonna scheda (desktop) ===== */}
      <div className={tab === "anteprima" ? "hidden md:block space-y-4" : "space-y-4"}>
      <section className="rounded border border-[var(--border-color)] bg-[var(--background)]/30 p-4 space-y-4">
        <h2 className="text-sm font-display text-[var(--accent-gold)]">Anagrafica</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Nome rōmaji</span>
            <input
              disabled={readOnly}
              value={form.nomeRomaji}
              onChange={(e) => patchForm("nomeRomaji", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Nome italiano</span>
            <input
              disabled={readOnly}
              value={form.nomeItaliano}
              onChange={(e) => patchForm("nomeItaliano", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Kanji</span>
            <input
              disabled={readOnly}
              value={form.kanji}
              onChange={(e) => patchForm("kanji", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-[var(--accent-violet-light)]">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={form.kanjiVerificato}
              onChange={(e) => patchForm("kanjiVerificato", e.target.checked)}
              className="rounded border-[var(--border-color)]"
            />
            Kanji verificato
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Categoria</span>
            <select
              disabled={readOnly}
              value={form.categoria}
              onChange={(e) => {
                const cat = e.target.value as WazaCategoria;
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        categoria: cat,
                        genitore: cat === "generica" ? null : prev.genitore,
                      }
                    : prev,
                );
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
              disabled={readOnly || form.categoria === "generica"}
              value={form.genitore ?? ""}
              onChange={(e) => patchForm("genitore", e.target.value || null)}
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
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Tipo</span>
            <select
              disabled={readOnly}
              value={form.tipo}
              onChange={(e) => patchForm("tipo", e.target.value as "passiva" | "attiva")}
              className={inputClass}
            >
              <option value="attiva">Attiva</option>
              <option value="passiva">Passiva</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Tier</span>
            <div className="flex items-center gap-2">
              <select
                disabled={readOnly}
                value={form.tier ?? ""}
                onChange={(e) => handleTierChange(e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((t) => (
                  <option key={t} value={t}>
                    T{t}
                  </option>
                ))}
              </select>
              {tierFlatDamage != null && (
                <span className="text-xs text-[var(--accent-violet-light)] whitespace-nowrap">
                  → danno {tierFlatDamage}
                </span>
              )}
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">CS</span>
            <select
              disabled={readOnly}
              value={form.cs}
              onChange={(e) => patchForm("cs", Number(e.target.value))}
              className={inputClass}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {form.tipo === "attiva" && (
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                Tempo (quarti)
              </span>
              <select
                disabled={readOnly}
                value={form.tempoQuarti ?? ""}
                onChange={(e) =>
                  patchForm("tempoQuarti", e.target.value === "" ? null : Number(e.target.value))
                }
                className={inputClass}
              >
                <option value="">—</option>
                {[0, 1, 2, 3, 4, 5, 6, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <SelettoreSkiruIr
          value={form.skiruIr}
          onChange={(next) => patchForm("skiruIr", next)}
          disabled={readOnly}
          required={form.tipo === "attiva"}
          allowedSlugs={vocabMap.skiru ?? []}
        />

        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Tags</span>
          {tagOptions.length === 0 ? (
            <p className="text-xs text-gray-500">Nessun tag nei vocabolari — aggiungili in Sprint 4.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => {
                const active = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    disabled={readOnly}
                    onClick={() => toggleTag(tag)}
                    className={`text-[10px] px-2 py-1 rounded border ${
                      active
                        ? "border-[var(--accent-gold)] text-[var(--accent-gold)]"
                        : "border-[var(--border-color)] text-gray-500"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">
            Descrizione (layer narrativo)
          </span>
          <textarea
            disabled={readOnly}
            value={form.descrizione}
            onChange={(e) => patchForm("descrizione", e.target.value)}
            rows={6}
            className={`${inputClass} min-h-[8rem]`}
          />
        </label>
      </section>

      <SezioneBlocchi
        effetti={form.effetti}
        onChange={(next) => patchForm("effetti", next)}
        disabled={readOnly}
        tierFlatDamage={tierFlatDamage}
        vocabolari={vocabMap}
      />

      {/* Anteprima compatta dell'ultima riga renderizzata (mobile): evita di
          rimbalzare al tab Anteprima a ogni campo compilato. */}
      {ultimaRiga && (
        <button
          type="button"
          onClick={showAnteprima}
          className="md:hidden w-full text-left rounded border border-[var(--accent-violet)]/30 bg-[var(--panel-bg)]/40 px-3 py-2"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">
              Come si legge — ultima riga
            </span>
            <span className="text-[10px] text-[var(--accent-gold)]">vedi tutto →</span>
          </span>
          <span className="block text-sm text-[var(--accent-violet-light)]/90 leading-snug mt-1">
            {ultimaRiga}
          </span>
        </button>
      )}
      </div>

      {/* ===== Tab ANTEPRIMA (mobile) / colonna anteprima (desktop) ===== */}
      <div className={tab === "modifica" ? "hidden md:block space-y-4" : "space-y-4"}>
        {/* Scheda riassuntiva: solo mobile (su desktop la scheda è il form) */}
        <section className="md:hidden rounded border border-[var(--border-color)] bg-[var(--background)]/30 p-4 space-y-2">
          <h2 className="text-sm font-display text-[var(--accent-gold)]">Scheda</h2>
          <p className="text-lg font-display text-[var(--foreground)]">
            {form.nomeItaliano || "—"}
          </p>
          <p className="text-xs text-gray-500">
            {form.nomeRomaji}
            {form.kanji ? ` · ${form.kanji}` : ""}
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400">
              {WAZA_CATEGORIA_LABELS[form.categoria]}
            </span>
            {form.genitore && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)]">
                {form.genitore}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400 capitalize">
              {form.tipo}
            </span>
            {form.tier != null && (
              <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--accent-gold)]/40 text-[var(--accent-gold)]">
                T{form.tier}
                {tierFlatDamage != null ? ` · danno ${tierFlatDamage}` : ""}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400">
              CS {form.cs}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400">
              {form.skiruIr.length} Skiru IR
            </span>
          </div>
          {form.descrizione && (
            <p className="text-xs text-[var(--accent-violet-light)]/80 leading-relaxed pt-1 whitespace-pre-wrap">
              {form.descrizione}
            </p>
          )}
        </section>

        <PannelloRenderMeccanico effetti={form.effetti} tierFlatDamage={tierFlatDamage} />

        {form.effetti.length === 0 && (
          <p className="md:hidden text-xs text-gray-500 border border-dashed border-[var(--border-color)] rounded px-3 py-6 text-center">
            Nessun blocco ancora. Torna su «Modifica» e aggiungi un effetto per vedere qui la
            lettura meccanica.
          </p>
        )}
      </div>

      <div ref={validazioneRef}>
        <PannelloValidazione errori={validationErrori} avvisi={validationAvvisi} info={info} />
      </div>

      {/* ===== Barra azioni sticky (mobile) ===== */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--border-color)] bg-[var(--background)]/95 backdrop-blur px-3 py-2 flex items-center gap-2">
        <button
          type="button"
          disabled={readOnly || saving}
          onClick={() => void handleSalva()}
          className="flex-1 min-h-[44px] rounded border border-[var(--accent-gold)]/60 text-[var(--accent-gold)] text-sm disabled:opacity-50"
        >
          {saving ? "Salvataggio…" : "Salva"}
        </button>
        <button
          type="button"
          disabled={readOnly || validating}
          onClick={() => void handleValida()}
          className="flex-1 min-h-[44px] rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] text-sm disabled:opacity-50"
        >
          {validating ? "Validazione…" : "Valida"}
        </button>
        <button
          type="button"
          onClick={scrollToValidazione}
          aria-label="Vai al pannello di validazione"
          className={`min-h-[44px] px-3 rounded border text-xs whitespace-nowrap ${
            errCount > 0
              ? "border-red-400/50 text-red-300"
              : avvCount > 0
                ? "border-[var(--accent-gold)]/50 text-[var(--accent-gold)]"
                : "border-[var(--border-color)] text-gray-400"
          }`}
        >
          {errCount} err · {avvCount} avv
        </button>
      </div>
    </div>
  );
}
