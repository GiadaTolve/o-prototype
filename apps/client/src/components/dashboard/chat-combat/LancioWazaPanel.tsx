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
import { getWazaLaunchProfile, MACCHIATO_SPEND_OPTIONS } from "@domain/combat/waza-launch-extras";
import {
  computeLaunchDamagePreview,
  extractMechanicTagsFromEffect,
  wazaEffectDeclaresConstruct,
} from "@domain/combat/waza-skiru-riders";
import { deriveConstructProfile } from "@domain/combat/construct-profile";
import { CONSTRUCT_SIZES, CONSTRUCT_SIZE_IDS, type ConstructSizeId } from "@domain/combat/constructs";
import { CONSTRUCT_PROPRIETA_IDS, BATTERIA_CS_CAP, type ConstructProprietaId } from "@domain/combat/construct-profile";
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
  isPassive: boolean;
  tags: string[];
  poolId: string | null;
  effect: string | null;
  candidates: string[];
  evocaCostrutto: boolean;
  /** Requisito grado dal testo meccanica (`[K]` = Kanteikan, `[SB]` = Sentatsu Bunsekikan). */
  gradeRequired: "K" | "SB" | null;
};

/** Tag abbreviazione-grado da filtrare dalla vista — non sono meccaniche giocabili. */
const GRADE_ABBREV_TAGS = new Set(["K", "SB"]);

/** Gradi che soddisfano [K] (Kanteikan) o superiore. */
const KANTEIKAN_PLUS = new Set(["Kanteikan", "Shin'enkan", "Akumu Zankyō"]);
/** Gradi che soddisfano [SB] (Sentatsu Bunsekikan) o superiore. */
const SENTATSU_PLUS = new Set(["Sentatsu Bunsekikan", "Kanteikan", "Shin'enkan", "Akumu Zankyō"]);

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
  grade,
  usersInRoom,
  currentCs,
  onInsertText,
  onSendMessage,
  chatConnected = true,
}: {
  characterId?: string;
  skiruSheet?: Record<string, number>;
  /** Grado gerarchico del PG (es. "Hakyō", "Kanteikan"). */
  grade?: string | null;
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

  const [favIds, setFavIds] = useState<string[]>([]);

  // controlli condizionali avanzati (§4 — portati dal pannello precedente)
  const [giurisdizioneCategory, setGiurisdizioneCategory] = useState<"proiettile" | "raggio">("proiettile");
  const [suturaKind, setSuturaKind] = useState<"offensiva" | "stile" | "elementale">("offensiva");
  const [decretoText, setDecretoText] = useState("");
  const [nagoriFrom, setNagoriFrom] = useState<"solido" | "liquido" | "gassoso" | "sonoro" | "elementale" | "energetico">("liquido");
  const [nagoriTo, setNagoriTo] = useState<"solido" | "liquido" | "gassoso" | "sonoro" | "elementale" | "energetico">("solido");
  const [meisakuLabel, setMeisakuLabel] = useState("");
  // §4 nuovi controlli condizionali
  const [kadenIntensity, setKadenIntensity] = useState<KadenIntensity | null>(null);
  const [quartoSelected, setQuartoSelected] = useState<1 | 2 | 3 | 4>(1);
  const [delayedEffect, setDelayedEffect] = useState(false);
  // §4 trasforma tag (Someito, Yugami, Igyō-Rensei…)
  const [trasformaFrom, setTrasformaFrom] = useState("");
  const [trasformaTo, setTrasformaTo] = useState("");
  // blocco costrutto (solo se la waza evoca) — taglia + sticker
  const [constructTaglia, setConstructTaglia] = useState<ConstructSizeId>("media");
  const [constructSticker, setConstructSticker] = useState<Record<ConstructProprietaId, boolean>>({
    BATTERIA: false,
    PERSONALE: false,
    TORO: false,
  });

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
          .filter((w) => w.name)
          .map((w) => {
            const entry = WAZA_TAG_INDEX.get(normalizeWazaLookupKey(w.name ?? ""));
            const preview = resolveWazaTagPreview(w.name ?? "", WAZA_TAG_INDEX);
            const effect = entry?.effect ?? entry?.description ?? w.description ?? null;
            const candidates =
              entry && skiruSheet
                ? resolveRelevantLaunchSkiruCandidates(skiruSheet, entry)
                : [];
            const gradeRequired: LwzRow["gradeRequired"] =
              effect && /\[K\]/.test(effect) ? "K"
              : effect && /\[SB\]/.test(effect) ? "SB"
              : null;
            // Filtra abbreviazioni grado dai tag visualizzati — non sono meccaniche giocabili.
            const displayTags = extractMechanicTagsFromEffect(effect)
              .filter((t) => !GRADE_ABBREV_TAGS.has(t))
              .slice(0, 4);
            const isPassive = w.isPassive ?? preview.isPassive ?? false;
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
              isPassive,
              tags: displayTags,
              poolId: entry?.poolId ?? w.poolId ?? null,
              effect,
              candidates,
              evocaCostrutto: wazaEffectDeclaresConstruct(effect),
              gradeRequired,
            };
          })
          // waza lanciabili in catalogo (tier+cs presenti) o passive con profilo trasforma
          .filter((r) => (r.tier != null && r.cs != null) || (r.isPassive && r.poolId != null && getWazaLaunchProfile(r.poolId)?.needsTrasformaTag));
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

  const gradeBlocked = useCallback(
    (r: LwzRow): string | null => {
      if (!r.gradeRequired || grade == null) return null;
      if (r.gradeRequired === "K" && !KANTEIKAN_PLUS.has(grade)) {
        return `Grado Kanteikan richiesto (attuale: ${grade})`;
      }
      if (r.gradeRequired === "SB" && !SENTATSU_PLUS.has(grade)) {
        return `Grado Sentatsu Bunsekikan richiesto (attuale: ${grade})`;
      }
      return null;
    },
    [grade],
  );

  const lanciabile = useCallback(
    (r: LwzRow) => {
      // Passive waza con profilo trasforma sono sempre "lanciabili" (dichiarazione al Master)
      if (r.isPassive && r.poolId && getWazaLaunchProfile(r.poolId)?.needsTrasformaTag) return true;
      if (r.tier == null || r.cs == null) return false;
      if (currentCs != null && r.cs > currentCs) return false;
      if (gradeBlocked(r)) return false;
      return true;
    },
    [currentCs, gradeBlocked],
  );

  const reason = useCallback(
    (r: LwzRow): string | null => {
      if (currentCs != null && r.cs != null && r.cs > currentCs) {
        return `CS insufficienti (${currentCs}/${r.cs})`;
      }
      return gradeBlocked(r);
    },
    [currentCs, gradeBlocked],
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
    setTargetId("");
    setGiurisdizioneCategory("proiettile");
    setSuturaKind("offensiva");
    setDecretoText("");
    setNagoriFrom("liquido");
    setNagoriTo("solido");
    setMeisakuLabel("");
    setKadenIntensity(null);
    // Persiste il quarto per waza multi-stadio: ripristina dall'ultima sessione
    const quartoKey = sel.poolId ? `lwz-quarto:${characterId ?? ""}:${sel.poolId}` : null;
    const storedQuarto = quartoKey ? sessionStorage.getItem(quartoKey) : null;
    setQuartoSelected((storedQuarto && [1,2,3,4].includes(Number(storedQuarto)) ? Number(storedQuarto) : 1) as 1|2|3|4);
    setDelayedEffect(false);
    setConstructTaglia("media");
    setConstructSticker({ BATTERIA: false, PERSONALE: false, TORO: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId]);

  const launchProfile = useMemo(
    () => getWazaLaunchProfile(sel?.poolId ?? undefined),
    [sel?.poolId],
  );

  // Persiste il quarto selezionato in sessionStorage per waza multi-stadio
  useEffect(() => {
    if (!launchProfile?.needsQuarto || !sel?.poolId) return;
    const key = `lwz-quarto:${characterId ?? ""}:${sel.poolId}`;
    sessionStorage.setItem(key, String(quartoSelected));
  }, [quartoSelected, sel?.poolId, launchProfile?.needsQuarto, characterId]);

  const launchExtras = useMemo(
    () => ({
      giurisdizioneCategory: launchProfile?.needsGiurisdizioneCategory ? giurisdizioneCategory : null,
      suturaKind: launchProfile?.needsSuturaKind ? suturaKind : null,
      decretoText: launchProfile?.needsDecreto ? decretoText : null,
      nagoriShift: launchProfile?.needsNagoriShift ? { from: nagoriFrom, to: nagoriTo } : null,
      meisakuLabel: launchProfile?.needsMeisakuLabel ? meisakuLabel : null,
      kadenIntensity: sel?.styleId === "hado" ? kadenIntensity : null,
      quartoSelected: launchProfile?.needsQuarto ? quartoSelected : null,
      delayedEffect: launchProfile?.needsDelayedEffect ? delayedEffect : false,
      constructTaglia: sel?.evocaCostrutto ? constructTaglia : null,
      constructSticker: sel?.evocaCostrutto
        ? (CONSTRUCT_PROPRIETA_IDS.filter((p) => constructSticker[p]) as ConstructProprietaId[])
        : null,
      trasformaTag: launchProfile?.needsTrasformaTag && trasformaFrom && trasformaTo
        ? { dimensione: launchProfile.trasformaDimensione ?? 'consistenza', from: trasformaFrom, to: trasformaTo }
        : null,
    }),
    [
      launchProfile,
      giurisdizioneCategory,
      suturaKind,
      decretoText,
      nagoriFrom,
      nagoriTo,
      meisakuLabel,
      sel?.styleId,
      sel?.evocaCostrutto,
      kadenIntensity,
      quartoSelected,
      delayedEffect,
      constructTaglia,
      constructSticker,
      trasformaFrom,
      trasformaTo,
    ],
  );

  // Blocco costrutto — parametri derivati dalla taglia (§5: Resistenza, Movimento).
  const constructProfile = useMemo(() => {
    if (!sel?.evocaCostrutto || !skiruSheet || sel.tier == null) return null;
    return deriveConstructProfile({
      wazaTier: sel.tier,
      taglia: constructTaglia,
      proprieta: CONSTRUCT_PROPRIETA_IDS.filter((p) => constructSticker[p]) as ConstructProprietaId[],
      creator: { sheet: skiruSheet },
      resistenza: "DERIVATA",
      movimento_m: "DERIVATA",
    });
  }, [sel?.evocaCostrutto, sel?.tier, skiruSheet, constructTaglia, constructSticker]);

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

  // Kaden tier bonus: cs12/frattura +1, overheat +2 (solo waza Hadō).
  const kadenTierBonus =
    sel?.styleId === "hado" && kadenIntensity === "overheat" ? 2
    : sel?.styleId === "hado" && (kadenIntensity === "cs12" || kadenIntensity === "frattura") ? 1
    : 0;

  // Danno — §5: valore-tier + bonus situazionali (pre-mitigazione).
  const damage = useMemo(() => {
    if (!sel?.tier) return null;
    return computeLaunchDamagePreview({
      tier: Math.min(5, sel.tier + kadenTierBonus) as 1 | 2 | 3 | 4 | 5,
      attackerSheet: skiruSheet ?? null,
      declaredSkiruId: skiruA || null,
      wazaEffectText: sel.effect,
    });
  }, [sel, skiruSheet, skiruA, kadenTierBonus]);

  // CS residui — costo waza + eventuale Batteria −5 (§5).
  const batteriaDeposit = sel?.evocaCostrutto && constructSticker.BATTERIA ? BATTERIA_CS_CAP : 0;
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
    (launchProfile?.masterOnlyCard ? true : !!skiruA && !!skiruB);

  const buildBody = useCallback(() => {
    if (!sel) return null;
    const target = targetId ? { characterId: targetId } : null;
    const line = buildFullWazaLaunchLine(sel.name, WAZA_TAG_INDEX, {
      skiruSheet: skiruSheet ?? null,
      declaredSkiruId: launchProfile?.masterOnlyCard ? null : (skiruA || null),
      irOverride: ir,
      poolId: sel.poolId,
      launchExtras,
      target,
      currentCs: currentCs ?? null,
      ...wazaResolveExtras,
    });
    return line;
  }, [sel, targetId, skiruSheet, skiruA, launchProfile, ir, launchExtras, currentCs, wazaResolveExtras]);

  const applyFrattura = useCallback(() => {
    if (kadenIntensity === "frattura") {
      void api.patch("/characters/me/kaden-frattura", {}).then((v) => {
        const vitals = v as { hpCurrent: number; hpMax: number };
        if (vitals?.hpCurrent != null && characterId) {
          window.dispatchEvent(new CustomEvent("characterHpUpdated", {
            detail: { characterId, hpCurrent: vitals.hpCurrent, hpMax: vitals.hpMax },
          }));
        }
      }).catch(() => {});
    }
  }, [kadenIntensity, characterId]);

  const doInsert = useCallback(() => {
    const body = buildBody();
    if (!body) return;
    applyFrattura();
    onInsertText(`${body}\n`);
  }, [buildBody, onInsertText, applyFrattura]);

  const doSend = useCallback(() => {
    const body = buildBody();
    if (!body || !onSendMessage) return;
    applyFrattura();
    onSendMessage(body);
  }, [buildBody, onSendMessage, applyFrattura]);

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
                title={r.effect ?? undefined}
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
                    {r.isPassive ? "Passiva" : `T${r.tier} · ${r.cs} CS`}
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

          {/* due Skiru papabili per l'IR — nascosti per waza solo-narrazione */}
          {!launchProfile?.masterOnlyCard && (
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
          )}

          {/* blocco costrutto — solo se la waza evoca (mockup + spec §2/§4/§5) */}
          {sel.evocaCostrutto && (
            <div
              className="rounded-lg p-2.5"
              style={{
                background: "color-mix(in srgb, var(--accent-violet) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent-violet) 30%, transparent)",
              }}
            >
              <div className="text-[10px] font-mono mb-2" style={{ color: "var(--accent-violet-light)" }}>
                ▚ Evoca un costrutto
              </div>

              <div className="text-[9px] mb-1" style={{ color: "var(--muted-foreground)" }}>Taglia</div>
              <div className="flex gap-1 mb-2.5">
                {CONSTRUCT_SIZE_IDS.map((sizeId) => (
                  <button
                    key={sizeId}
                    type="button"
                    onClick={() => setConstructTaglia(sizeId)}
                    className="flex-1 text-[10px] rounded py-1 transition-colors"
                    style={{
                      background: constructTaglia === sizeId ? "var(--accent-violet)" : "rgba(0,0,0,0.25)",
                      color: constructTaglia === sizeId ? "#160f22" : "var(--muted-foreground)",
                      border: `1px solid ${constructTaglia === sizeId ? "var(--accent-violet)" : "var(--border-color)"}`,
                      fontWeight: constructTaglia === sizeId ? 700 : 400,
                    }}
                  >
                    {CONSTRUCT_SIZES[sizeId].label}
                  </button>
                ))}
              </div>

              <div className="text-[9px] mb-1" style={{ color: "var(--muted-foreground)" }}>Sticker</div>
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                {CONSTRUCT_PROPRIETA_IDS.map((stickerId) => {
                  const on = constructSticker[stickerId];
                  const label = stickerId === "BATTERIA" ? "Batteria" : stickerId === "PERSONALE" ? "Personale" : "Tōrō";
                  return (
                    <button
                      key={stickerId}
                      type="button"
                      onClick={() => setConstructSticker((prev) => ({ ...prev, [stickerId]: !prev[stickerId] }))}
                      className="text-[10px] rounded px-2.5 py-1 transition-colors"
                      style={{
                        background: on ? "#3a2519" : "rgba(0,0,0,0.25)",
                        color: on ? "var(--accent-ember, #e8763a)" : "var(--muted-foreground)",
                        border: `1px solid ${on ? "var(--accent-ember, #e8763a)" : "var(--border-color)"}`,
                      }}
                    >
                      {on ? "✓ " : ""}{label}
                    </button>
                  );
                })}
              </div>

              {constructProfile && (
                <div
                  className="flex gap-3 text-[10px] font-mono pt-2"
                  style={{ color: "var(--muted-foreground)", borderTop: "1px solid color-mix(in srgb, var(--accent-violet) 20%, transparent)" }}
                >
                  <span>Resistenza <b style={{ color: "var(--foreground)" }}>{constructProfile.resistenza}</b></span>
                  <span>Mov <b style={{ color: "var(--foreground)" }}>{constructProfile.movimento_m != null ? `${constructProfile.movimento_m}m` : "—"}</b></span>
                  {constructSticker.BATTERIA && (
                    <span style={{ color: "var(--accent-ember, #e8763a)" }}>Batteria: {BATTERIA_CS_CAP} CS depositati nel costrutto (recuperabili)</span>
                  )}
                </div>
              )}
            </div>
          )}

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

          {/* §4 — Trasforma tag (Someito, Yugami, Igyō-Rensei…) */}
          {launchProfile?.needsTrasformaTag && (
            <div className="lwz__card" style={{ borderColor: "color-mix(in srgb, var(--accent-gold) 30%, var(--border-color))" }}>
              <div className="lwz__label" style={{ marginBottom: 6 }}>
                Trasforma {launchProfile.trasformaDimensione === 'categoria' ? 'Categoria' : 'Consistenza'}
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="lwz__select flex-1"
                  value={trasformaFrom}
                  onChange={(e) => setTrasformaFrom(e.target.value)}
                >
                  <option value="">— da —</option>
                  {(launchProfile.trasformaFromOptions ?? []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <span style={{ color: "var(--accent-gold)", fontSize: 12 }}>→</span>
                <select
                  className="lwz__select flex-1"
                  value={trasformaTo}
                  onChange={(e) => setTrasformaTo(e.target.value)}
                >
                  <option value="">— a —</option>
                  {(launchProfile.trasformaToOptions ?? []).filter((o) => o !== trasformaFrom).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {trasformaFrom && trasformaTo && (
                <p className="text-[9px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                  Tag: <code className="text-[8px]">[trasforma:{launchProfile.trasformaDimensione}:{trasformaFrom}→{trasformaTo}]</code>
                </p>
              )}
            </div>
          )}

          {/* §4 — Spesa counter Macchiato (Yobimodoshi) */}
          {launchProfile?.needsMacchiatoSpend && (
            <div className="lwz__card" style={{ background: "color-mix(in srgb, var(--accent-violet) 8%, transparent)", borderColor: "color-mix(in srgb, var(--accent-violet) 35%, transparent)" }}>
              <div className="lwz__label" style={{ marginBottom: 6 }}>Spendi Counter Macchiato</div>
              <p className="text-[9px] italic mb-3" style={{ color: "var(--muted-foreground)", lineHeight: 1.5 }}>
                Azione separata — inserisce la spesa in chat senza lanciare la waza.
              </p>
              <div className="flex flex-col gap-2">
                {MACCHIATO_SPEND_OPTIONS.map((opt) => (
                  <button
                    key={opt.cost}
                    type="button"
                    className="lwz__chip"
                    style={{ justifyContent: "flex-start", textAlign: "left", padding: "6px 8px", height: "auto", flexDirection: "column", alignItems: "flex-start", gap: 2 }}
                    onClick={() => onInsertText(`${opt.chatTag} ${opt.detail}\n`)}
                  >
                    <span className="font-semibold" style={{ fontSize: "0.65rem", color: "var(--accent-violet-light)" }}>{opt.label}</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--foreground)", opacity: 0.75 }}>{opt.detail}</span>
                  </button>
                ))}
              </div>
            </div>
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
              {batteriaDeposit > 0 && (
                <span style={{ color: "var(--accent-ember, #e8763a)", marginLeft: 6, fontSize: "0.8em" }}>
                  +{batteriaDeposit} depositati nel costrutto
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
