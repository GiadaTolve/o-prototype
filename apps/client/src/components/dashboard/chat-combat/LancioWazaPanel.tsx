"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { WAZA_TAG_INDEX } from "@domain/combat/waza-tag-index";
import {
  resolveWazaTagPreview,
  normalizeWazaLookupKey,
} from "@domain/combat/waza-tag-preview";
import {
  buildFullWazaLaunchLine,
  resolveRelevantLaunchSkiruCandidates,
} from "@domain/combat/waza-launch";
import { getWazaLaunchProfile } from "@domain/combat/waza-launch-extras";
import {
  computeLaunchDamagePreview,
  extractMechanicTagsFromEffect,
} from "@domain/combat/waza-skiru-riders";
import {
  buildIndicativeActionIndex,
  calculateSuccessIndex,
} from "@domain/combat/resolution";
import { getSkiruDef } from "@domain/skiru/catalog";
import {
  resolveWazaCatalogFamily,
  WAZA_CATALOG_FAMILY_LABELS,
  type WazaCatalogFamily,
} from "@domain/progression/waza-catalog-family";
import { useDoMechanicsSnapshot } from "@/hooks/useDoMechanicsSnapshot";
import type { Presente } from "../types";

/** Riga /me/waza arricchita per la Zona 3. */
type LwzRow = {
  id: string;
  name: string;
  fonte: WazaCatalogFamily;
  styleLabel: string | null;
  styleId: string | null;
  tier: number | null;
  cs: number | null;
  tags: string[];
  poolId: string | null;
  effect: string | null;
  candidates: string[];
};

import type { KadenIntensity } from "@domain/combat/waza-launch-extras";

type RawWaza = {
  id?: string;
  name?: string;
  description?: string | null;
  rank?: string | null;
  isPassive?: boolean;
  styleId?: string | null;
  madoshoId?: string | null;
  poolId?: string | null;
};

/** Filtri fonte — le fonti REALI del catalogo (non esiste una famiglia "premio"). */
const FONTI: { k: "tutte" | WazaCatalogFamily; label: string }[] = [
  { k: "tutte", label: "Tutte" },
  { k: "do", label: "Stili" },
  { k: "madosho", label: "Madoshō" },
  { k: "ordine", label: "Ordine" },
  { k: "generiche", label: "Generiche" },
  { k: "oni-no-mori", label: "Oni no Mori" },
];

const FAV_KEY = (cid?: string) => `lwz-fav:${cid ?? "anon"}`;

export function LancioWazaPanel({
  characterId,
  skiruSheet,
  usersInRoom,
  currentCs,
  onInsertText,
  onSendMessage,
  chatConnected = true,
}: {
  characterId?: string;
  skiruSheet?: Record<string, number>;
  usersInRoom: Presente[];
  currentCs?: number | null;
  onInsertText: (text: string) => void;
  onSendMessage?: (text: string) => void;
  chatConnected?: boolean;
}) {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [rows, setRows] = useState<LwzRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [fonte, setFonte] = useState<"tutte" | WazaCatalogFamily>("tutte");
  const [soloLanciabili, setSoloLanciabili] = useState(false);
  const [selId, setSelId] = useState("");
  const [skiruA, setSkiruA] = useState("");
  const [skiruB, setSkiruB] = useState("");
  const [dett, setDett] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [declareHit, setDeclareHit] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [favIds, setFavIds] = useState<string[]>([]);

  // controlli condizionali avanzati (§4 — portati dal pannello precedente)
  const [giurisdizioneCategory, setGiurisdizioneCategory] = useState<"proiettile" | "raggio">("proiettile");
  const [suturaKind, setSuturaKind] = useState<"offensiva" | "stile" | "elementale">("offensiva");
  const [decretoText, setDecretoText] = useState("");
  const [nagoriFrom, setNagoriFrom] = useState<"solido" | "liquido" | "gassoso" | "sonoro" | "elementale" | "energetico">("liquido");
  const [nagoriTo, setNagoriTo] = useState<"solido" | "liquido" | "gassoso" | "sonoro" | "elementale" | "energetico">("solido");
  const [meisakuLabel, setMeisakuLabel] = useState("");
  const [surpriseAttack, setSurpriseAttack] = useState(false);
  // §4 nuovi controlli condizionali
  const [kadenIntensity, setKadenIntensity] = useState<KadenIntensity | null>(null);
  const [quartoSelected, setQuartoSelected] = useState<1 | 2 | 3 | 4>(1);
  const [delayedEffect, setDelayedEffect] = useState(false);

  const { extras: wazaResolveExtras } = useDoMechanicsSnapshot(currentCs ?? null, true);

  // preferiti da localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY(characterId));
      setFavIds(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setFavIds([]);
    }
  }, [characterId]);

  const toggleFav = useCallback(
    (id: string) => {
      setFavIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        try {
          localStorage.setItem(FAV_KEY(characterId), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [characterId],
  );

  // carica waza possedute e arricchisci
  useEffect(() => {
    if (!characterId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get("/characters/me/waza")
      .then((d) => {
        if (cancelled || !mountedRef.current) return;
        const arr = (Array.isArray(d) ? d : []) as RawWaza[];
        const enriched: LwzRow[] = arr
          .filter((w) => !w.isPassive && w.name)
          .map((w) => {
            const entry = WAZA_TAG_INDEX.get(normalizeWazaLookupKey(w.name ?? ""));
            const preview = resolveWazaTagPreview(w.name ?? "", WAZA_TAG_INDEX);
            const effect = entry?.effect ?? entry?.description ?? w.description ?? null;
            const candidates =
              entry && skiruSheet
                ? resolveRelevantLaunchSkiruCandidates(skiruSheet, entry)
                : [];
            return {
              id: w.id ?? "",
              name: w.name ?? "",
              fonte: resolveWazaCatalogFamily({
                styleId: w.styleId,
                madoshoId: w.madoshoId,
                description: w.description,
                name: w.name,
                poolId: w.poolId,
              }),
              styleLabel: preview.styleLabel,
              styleId: w.styleId ?? null,
              tier: preview.tier,
              cs: preview.csCost,
              tags: extractMechanicTagsFromEffect(effect).slice(0, 4),
              poolId: entry?.poolId ?? w.poolId ?? null,
              effect,
              candidates,
            };
          })
          // solo waza lanciabili in catalogo (tier+cs presenti)
          .filter((r) => r.tier != null && r.cs != null);
        setRows(enriched);
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) setRows([]);
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [characterId, skiruSheet]);

  // lanciabilità: per Tappa 1 = tier+cs presenti e CS sufficienti.
  // (condizioni stack/grado §4 arriveranno con i dati strutturati.)
  const lanciabile = useCallback(
    (r: LwzRow) => {
      if (r.tier == null || r.cs == null) return false;
      if (currentCs != null && r.cs > currentCs) return false;
      return true;
    },
    [currentCs],
  );

  const reason = useCallback(
    (r: LwzRow): string | null => {
      if (currentCs != null && r.cs != null && r.cs > currentCs) {
        return `CS insufficienti (${currentCs}/${r.cs})`;
      }
      return null;
    },
    [currentCs],
  );

  const lista = useMemo(() => {
    const query = q.trim().toLowerCase();
    let l = rows.filter(
      (r) =>
        (fonte === "tutte" || r.fonte === fonte) &&
        (query === "" ||
          (r.name + (r.styleLabel ?? "")).toLowerCase().includes(query)),
    );
    if (soloLanciabili) l = l.filter(lanciabile);
    // lanciabili in cima, non-lanciabili spente in fondo
    return [...l].sort((a, b) => (lanciabile(b) ? 1 : 0) - (lanciabile(a) ? 1 : 0));
  }, [rows, q, fonte, soloLanciabili, lanciabile]);

  const favoriti = useMemo(
    () => rows.filter((r) => favIds.includes(r.id)),
    [rows, favIds],
  );

  const sel = useMemo(() => rows.find((r) => r.id === selId) ?? null, [rows, selId]);
  const selEntry = sel ? WAZA_TAG_INDEX.get(normalizeWazaLookupKey(sel.name)) : undefined;

  // Skiru papabili per i due menu: candidate della waza (+ indicative se <2).
  const skiruOptions = useMemo(() => {
    if (!sel) return [] as { id: string; label: string }[];
    const ids = new Set<string>(sel.candidates);
    if (ids.size < 2 && skiruSheet) {
      const ind = buildIndicativeActionIndex(skiruSheet);
      ids.add(ind.physicalSkiruId);
      ids.add(ind.channelingSkiruId);
    }
    return [...ids].map((id) => ({ id, label: getSkiruDef(id)?.name ?? id }));
  }, [sel, skiruSheet]);

  // default delle due papabili quando cambia la waza selezionata
  useEffect(() => {
    if (!sel) return;
    const opts = skiruOptions.map((o) => o.id);
    setSkiruA(opts[0] ?? "");
    setSkiruB(opts[1] ?? opts[0] ?? "");
    // reset controlli condizionali
    setDeclareHit(false);
    setTargetId("");
    setSurpriseAttack(false);
    setGiurisdizioneCategory("proiettile");
    setSuturaKind("offensiva");
    setDecretoText("");
    setNagoriFrom("liquido");
    setNagoriTo("solido");
    setMeisakuLabel("");
    setKadenIntensity(null);
    setQuartoSelected(1);
    setDelayedEffect(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId]);

  const launchProfile = useMemo(
    () => getWazaLaunchProfile(sel?.poolId ?? undefined),
    [sel?.poolId],
  );

  const launchExtras = useMemo(
    () => ({
      giurisdizioneCategory: launchProfile?.needsGiurisdizioneCategory ? giurisdizioneCategory : null,
      suturaKind: launchProfile?.needsSuturaKind ? suturaKind : null,
      surpriseAttack,
      decretoText: launchProfile?.needsDecreto ? decretoText : null,
      nagoriShift: launchProfile?.needsNagoriShift ? { from: nagoriFrom, to: nagoriTo } : null,
      meisakuLabel: launchProfile?.needsMeisakuLabel ? meisakuLabel : null,
      kadenIntensity: sel?.styleId === "hado" ? kadenIntensity : null,
      quartoSelected: launchProfile?.needsQuarto ? quartoSelected : null,
      delayedEffect: launchProfile?.needsDelayedEffect ? delayedEffect : false,
    }),
    [launchProfile, giurisdizioneCategory, suturaKind, surpriseAttack, decretoText, nagoriFrom, nagoriTo, meisakuLabel, sel?.styleId, kadenIntensity, quartoSelected, delayedEffect],
  );

  // IR — §5: (Skiru A + Skiru B) / 2 + Σ modificatori (Meiju Sōkaiju via tag).
  const irBreakdown = useMemo(() => {
    if (!sel || !skiruSheet || !skiruA || !skiruB) return null;
    const indexBonus =
      (wazaResolveExtras.yuragiParityNext ? 2 : 0) +
      (wazaResolveExtras.itoIrBonus && wazaResolveExtras.itoIrBonus > 0 ? wazaResolveExtras.itoIrBonus : 0);
    return calculateSuccessIndex(skiruSheet, {
      physicalSkiruId: skiruA,
      channelingSkiruId: skiruB,
      wazaTags: sel.tags,
      indexBonus,
    });
  }, [sel, skiruSheet, skiruA, skiruB, wazaResolveExtras.yuragiParityNext, wazaResolveExtras.itoIrBonus]);

  const ir = irBreakdown?.successIndex ?? null;

  // Danno — §5: valore-tier + bonus situazionali (pre-mitigazione).
  const damage = useMemo(() => {
    if (!sel?.tier) return null;
    return computeLaunchDamagePreview({
      tier: sel.tier,
      attackerSheet: skiruSheet ?? null,
      declaredSkiruId: skiruA || null,
      wazaEffectText: sel.effect,
    });
  }, [sel, skiruSheet, skiruA]);

  const csAfter =
    currentCs != null && sel?.cs != null ? currentCs - sel.cs : null;

  const targetOptions = useMemo(
    () => usersInRoom.filter((u) => u.id && !u.isMe).map((u) => ({ id: u.id, label: u.name })),
    [usersInRoom],
  );

  const needsTarget = Boolean(launchProfile?.needsTarget);
  const missingTarget = needsTarget && targetId === "";
  const missingDecreto = Boolean(launchProfile?.needsDecreto && !decretoText.trim());

  const canLaunch =
    !!sel &&
    chatConnected &&
    lanciabile(sel) &&
    !missingTarget &&
    !missingDecreto &&
    !!skiruA &&
    !!skiruB;

  const buildBody = useCallback(() => {
    if (!sel) return null;
    const target = targetId ? { characterId: targetId } : null;
    const line = buildFullWazaLaunchLine(sel.name, WAZA_TAG_INDEX, {
      skiruSheet: skiruSheet ?? null,
      declaredSkiruId: skiruA || null,
      irOverride: ir,
      poolId: sel.poolId,
      launchExtras,
      target,
      declareHit,
      currentCs: currentCs ?? null,
      ...wazaResolveExtras,
    });
    return narrative.trim() ? `${narrative.trim()}\n${line}` : line;
  }, [sel, targetId, skiruSheet, skiruA, ir, launchExtras, declareHit, currentCs, wazaResolveExtras, narrative]);

  const doInsert = useCallback(() => {
    const body = buildBody();
    if (!body) return;
    onInsertText(`${body}\n`);
    setNarrative("");
  }, [buildBody, onInsertText]);

  const doSend = useCallback(() => {
    const body = buildBody();
    if (!body || !onSendMessage) return;
    onSendMessage(body);
    setNarrative("");
  }, [buildBody, onSendMessage]);

  if (!characterId) {
    return <p className="text-[10px] text-gray-500 italic">Seleziona un personaggio per lanciare waza.</p>;
  }

  const badgeClass = (f: WazaCatalogFamily) => `lwz__badge lwz__badge--${f}`;

  return (
    <div className="lwz">
      <div className="lwz__header">
        <span className="lwz__dot" />
        <span>Lancio Waza</span>
      </div>

      {/* ricerca */}
      <input
        className="lwz__search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca una waza…"
      />

      {/* filtri fonte + lanciabili ora */}
      <div className="lwz__chips">
        {FONTI.map((f) => (
          <button
            key={f.k}
            type="button"
            onClick={() => setFonte(f.k)}
            className={`lwz__chip${fonte === f.k ? " lwz__chip--on" : ""}`}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSoloLanciabili((v) => !v)}
          className={`lwz__chip lwz__chip--castable${soloLanciabili ? " lwz__chip--on" : ""}`}
        >
          lanciabili ora
        </button>
      </div>

      {/* preferiti */}
      {q === "" && fonte === "tutte" && favoriti.length > 0 && (
        <div>
          <div className="lwz__label" style={{ marginBottom: 6 }}>Preferiti</div>
          <div className="lwz__fav-row">
            {favoriti.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelId(r.id)}
                className={`lwz__fav${selId === r.id ? " lwz__fav--on" : ""}`}
              >
                ★ {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* elenco unico */}
      <div>
        <div className="lwz__label" style={{ marginBottom: 6 }}>
          {loading ? "Caricamento…" : soloLanciabili ? "Lanciabili ora" : `Tutte le waza (${lista.length})`}
        </div>
        <div className="lwz__list">
          {lista.map((r) => {
            const on = r.id === selId;
            const canCast = lanciabile(r);
            const why = canCast ? null : reason(r);
            return (
              <button
                key={r.id}
                type="button"
                disabled={!canCast}
                onClick={() => canCast && setSelId(r.id)}
                className={`lwz__row${on ? " lwz__row--on" : ""}${canCast ? "" : " lwz__row--off"}`}
              >
                <div className="lwz__row-top">
                  <span className="lwz__row-name">
                    {r.name}
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFav(r.id);
                      }}
                      title={favIds.includes(r.id) ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
                      style={{
                        marginLeft: 6,
                        cursor: "pointer",
                        color: favIds.includes(r.id) ? "var(--accent-gold)" : "rgba(255,255,255,0.3)",
                        fontSize: "0.7rem",
                      }}
                    >
                      ★
                    </span>
                  </span>
                  <span className="lwz__row-meta">
                    T{r.tier} · {r.cs} CS
                  </span>
                </div>
                <div className="lwz__row-tags">
                  <span className={badgeClass(r.fonte)}>
                    {r.styleLabel ?? WAZA_CATALOG_FAMILY_LABELS[r.fonte]}
                  </span>
                  {r.tags.map((t) => (
                    <span key={t} className="lwz__tag">
                      {t}
                    </span>
                  ))}
                  {why && <span className="lwz__reason">· {why}</span>}
                </div>
              </button>
            );
          })}
          {!loading && lista.length === 0 && (
            <p className="text-[10px] text-gray-500 italic">Nessuna waza corrisponde ai filtri.</p>
          )}
        </div>
      </div>

      {/* configurazione della waza scelta */}
      {sel && (
        <div className="lwz__config">
          <div className="lwz__label">Configura · {sel.name}</div>

          {/* due Skiru papabili per l'IR */}
          <div>
            <div className="lwz__label" style={{ marginBottom: 4, opacity: 0.8 }}>
              Skiru per l&apos;Indice (due papabili)
            </div>
            <div className="lwz__skiru-row">
              <select className="lwz__select" value={skiruA} onChange={(e) => setSkiruA(e.target.value)}>
                {skiruOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>+</span>
              <select className="lwz__select" value={skiruB} onChange={(e) => setSkiruB(e.target.value)}>
                {skiruOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* controlli condizionali avanzati (§4 — parità con pannello precedente) */}
          {launchProfile?.needsGiurisdizioneCategory && (
            <label className="block">
              <span className="lwz__label">Categoria Giurisdizione</span>
              <select className="lwz__select" style={{ width: "100%" }} value={giurisdizioneCategory} onChange={(e) => setGiurisdizioneCategory(e.target.value as "proiettile" | "raggio")}>
                <option value="proiettile">Proiettile</option>
                <option value="raggio">Raggio</option>
              </select>
            </label>
          )}
          {launchProfile?.needsNagoriShift && (
            <div className="lwz__skiru-row">
              <select className="lwz__select" value={nagoriFrom} onChange={(e) => setNagoriFrom(e.target.value as typeof nagoriFrom)}>
                {["solido", "liquido", "gassoso", "sonoro", "elementale", "energetico"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>→</span>
              <select className="lwz__select" value={nagoriTo} onChange={(e) => setNagoriTo(e.target.value as typeof nagoriTo)}>
                {["solido", "liquido", "gassoso", "sonoro", "elementale", "energetico"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {launchProfile?.needsDecreto && (
            <label className="block">
              <span className="lwz__label">Decreto</span>
              <input className="lwz__search" type="text" value={decretoText} onChange={(e) => setDecretoText(e.target.value)} placeholder="Es. «Quella Proiettile torna al mittente»" />
            </label>
          )}
          {launchProfile?.needsSuturaKind && (
            <label className="block">
              <span className="lwz__label">Tipo sutura</span>
              <select className="lwz__select" style={{ width: "100%" }} value={suturaKind} onChange={(e) => setSuturaKind(e.target.value as "offensiva" | "stile" | "elementale")}>
                <option value="offensiva">Offensiva</option>
                <option value="stile">Di stile</option>
                <option value="elementale">Elementale</option>
              </select>
            </label>
          )}
          {launchProfile?.needsMeisakuLabel && (
            <label className="block">
              <span className="lwz__label">Nome Opera Prima</span>
              <input className="lwz__search" type="text" value={meisakuLabel} onChange={(e) => setMeisakuLabel(e.target.value)} placeholder="Nome del costrutto permanente" />
            </label>
          )}

          {/* §4 — Kaden intensity (solo waza Hadō) */}
          {sel?.styleId === "hado" && (
            <label className="block">
              <span className="lwz__label">Intensità Kaden</span>
              <select
                className="lwz__select"
                style={{ width: "100%" }}
                value={kadenIntensity ?? ""}
                onChange={(e) => setKadenIntensity((e.target.value || null) as KadenIntensity | null)}
              >
                <option value="">Nessuna (normale)</option>
                <option value="cs12">CS ≥ 12 — +1 tier (Kaatsu)</option>
                <option value="overheat">Overheat — +2 tier + drain</option>
                <option value="frattura">Frattura volontaria — −5 HP → +1 tier</option>
              </select>
            </label>
          )}

          {/* §4 — Multi-quarto */}
          {launchProfile?.needsQuarto && (
            <label className="block">
              <span className="lwz__label">Quarto d&apos;azione</span>
              <div className="lwz__chips" style={{ marginTop: 4 }}>
                {([1, 2, 3, 4] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuartoSelected(q)}
                    className={`lwz__chip${quartoSelected === q ? " lwz__chip--on" : ""}`}
                  >
                    {q}/4
                  </button>
                ))}
              </div>
            </label>
          )}

          {/* §4 — Effetto rimandato (setup) */}
          {launchProfile?.needsDelayedEffect && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={delayedEffect}
                onChange={(e) => setDelayedEffect(e.target.checked)}
                className="mt-0.5 accent-[var(--accent-violet)]"
              />
              <span className="text-[9px] text-[var(--accent-violet-light)] leading-relaxed">
                <span className="lwz__label" style={{ display: "block", marginBottom: 2 }}>Effetto rimandato</span>
                Aggiunge <code className="text-[8px]">[setup:1]</code> — waza in attesa, non agisce subito.
              </span>
            </label>
          )}

          {/* anteprima card */}
          <div className="lwz__card">
            <div className="lwz__label" style={{ marginBottom: 8 }}>
              Anteprima in chat
              {launchProfile?.masterOnlyCard && (
                <span className="lwz__badge lwz__badge--do" style={{ marginLeft: 6 }}>solo narrazione</span>
              )}
            </div>
            {launchProfile?.masterOnlyCard && (
              <p className="text-[9px] text-[var(--accent-violet-light)] italic mb-2">
                Waza nota-master: nessun IR/danno visibile — aggiungi il tuo testo di narrazione.
              </p>
            )}
            <div className="lwz__card-nums" style={launchProfile?.masterOnlyCard ? { display: "none" } : {}}>
              <div className="lwz__bignum lwz__bignum--ir">
                <div className="lwz__bignum-label">Indice</div>
                <div className="lwz__bignum-val">{ir ?? "—"}</div>
              </div>
              <div className="lwz__bignum lwz__bignum--dmg">
                <div className="lwz__bignum-label">Danno</div>
                <div className="lwz__bignum-val">{damage?.totalBeforeMitigation ?? "—"}</div>
              </div>
            </div>
            <button type="button" className="lwz__calc-toggle" onClick={() => setDett((v) => !v)}>
              {dett ? "− nascondi calcoli" : "+ mostra calcoli"}
            </button>
            {dett && (
              <div className="lwz__calc">
                {irBreakdown && (
                  <>
                    <div className="lwz__calc-head--ir">Indice</div>
                    <div>
                      ({getSkiruDef(skiruA)?.name ?? skiruA} {irBreakdown.physicalPoints} + {getSkiruDef(skiruB)?.name ?? skiruB} {irBreakdown.channelingPoints}) ÷ 2
                      {irBreakdown.indexBonus ? ` + ${irBreakdown.indexBonus}` : ""} = {irBreakdown.successIndex}
                    </div>
                  </>
                )}
                {damage && (
                  <>
                    <div className="lwz__calc-head--dmg">Danno</div>
                    <div>{damage.summary} → {damage.totalBeforeMitigation} (pre-mitigazione)</div>
                  </>
                )}
                <div style={{ fontSize: "0.58rem", marginTop: 6, fontStyle: "italic", opacity: 0.7 }}>
                  Ridotto da scudo e mitigazione del bersaglio, se il colpo entra (arbitrato Master).
                </div>
              </div>
            )}
          </div>

          {/* bersaglio + colpo a segno */}
          {(needsTarget || targetOptions.length > 0) && (
            <label className="block">
              <span className="lwz__label">Bersaglio{needsTarget ? " (richiesto)" : " (opz.)"}</span>
              <select className="lwz__select" style={{ width: "100%" }} value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">— nessuno —</option>
                {targetOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
          )}
          {targetId !== "" && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={declareHit} onChange={(e) => setDeclareHit(e.target.checked)} className="mt-0.5 accent-[var(--accent-gold)]" />
              <span className="text-[9px] text-[var(--accent-violet-light)] leading-relaxed">
                <span className="lwz__label" style={{ display: "block", marginBottom: 2 }}>Colpo a segno</span>
                Aggiunge <code className="text-[8px]">[hit:1]</code> — dichiarazione arbitrabile dal Master.
              </span>
            </label>
          )}
          {launchProfile?.allowsSurprise !== false && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={surpriseAttack} onChange={(e) => setSurpriseAttack(e.target.checked)} className="mt-0.5 accent-[var(--accent-violet)]" />
              <span className="text-[9px] text-[var(--accent-violet-light)] leading-relaxed">
                <span className="lwz__label" style={{ display: "block", marginBottom: 2 }}>Sorpresa narrativa</span>
                Aggiunge <code className="text-[8px]">[sorpresa:1]</code> — tag per il Master.
              </span>
            </label>
          )}

          {/* narrato */}
          <label className="block">
            <span className="lwz__label">Narrato (opz.)</span>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={2}
              placeholder="Descrivi l'azione in chat…"
              className="lwz__search"
              style={{ resize: "vertical", minHeight: "2.5rem" }}
            />
          </label>

          {/* lancia */}
          <div className="lwz__launch-row">
            <button type="button" className="lwz__btn-insert" disabled={!canLaunch} onClick={doInsert}>
              In textarea
            </button>
            {onSendMessage && (
              <button type="button" className="lwz__btn-launch" disabled={!canLaunch} onClick={doSend}>
                Lancia
              </button>
            )}
          </div>
          {csAfter != null && (
            <div className={`lwz__cs-after${csAfter < 0 ? " lwz__cs-after--warn" : ""}`}>
              CS dopo il lancio: {csAfter}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
