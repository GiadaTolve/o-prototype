"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import { resolveWazaTagPreview, WAZA_TAG_INDEX } from "@domain/combat/waza-tag-index";
import {
  enrichWazaTagPreviewWithSkiru,
  normalizeWazaLookupKey,
} from "@domain/combat/waza-tag-preview";
import {
  buildFullWazaLaunchLine,
  resolveAutoLaunchSkiruId,
} from "@domain/combat/waza-launch";
import { getWazaLaunchProfile } from "@domain/combat/waza-launch-extras";
import { computeDeclaredActionIr, computeLaunchDamagePreview, extractMechanicTagsFromEffect, getSkiruRider } from "@domain/combat/waza-skiru-riders";
import { getSkiruDef } from "@domain/skiru/catalog";
import { getSokaijuRank } from "@domain/skiru/sokaiju-combat";
import { useDoMechanicsSnapshot } from "@/hooks/useDoMechanicsSnapshot";
import type { Presente } from "../types";

type WazaRow = {
  id: string;
  name: string;
  isPassive?: boolean;
};

export function WazaLaunchPanel({
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

  const [open, setOpen] = useState(true);
  const [wazaList, setWazaList] = useState<WazaRow[]>([]);
  const [wazaLoading, setWazaLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedWazaId, setSelectedWazaId] = useState("");
  const [targetCharacterId, setTargetCharacterId] = useState("");
  const [declareHit, setDeclareHit] = useState(false);
  const [surpriseAttack, setSurpriseAttack] = useState(false);
  const [giurisdizioneCategory, setGiurisdizioneCategory] = useState<"proiettile" | "raggio">("proiettile");
  const [suturaKind, setSuturaKind] = useState<"offensiva" | "stile" | "elementale">("offensiva");
  const [decretoText, setDecretoText] = useState("");
  const [nagoriFrom, setNagoriFrom] = useState<"solido" | "liquido" | "gassoso" | "sonoro" | "elementale" | "energetico">("liquido");
  const [nagoriTo, setNagoriTo] = useState<"solido" | "liquido" | "gassoso" | "sonoro" | "elementale" | "energetico">("solido");
  const [meisakuLabel, setMeisakuLabel] = useState("");
  const [narrative, setNarrative] = useState("");

  const { extras: wazaResolveExtras } = useDoMechanicsSnapshot(currentCs ?? null, open);

  useEffect(() => {
    if (!characterId) {
      setWazaList([]);
      return;
    }
    let cancelled = false;
    setWazaLoading(true);
    api
      .get("/characters/me/waza")
      .then((d) => {
        if (cancelled || !mountedRef.current) return;
        const arr = Array.isArray(d) ? d : [];
        setWazaList(
          arr
            .filter((w: { isPassive?: boolean }) => !w.isPassive)
            .map((w: { id?: string; name?: string; isPassive?: boolean }) => ({
              id: w.id ?? "",
              name: w.name ?? "",
              isPassive: w.isPassive,
            })),
        );
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) setWazaList([]);
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) setWazaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [characterId]);

  const launchableWaza = useMemo(() => {
    return wazaList.filter((w) => {
      const entry = WAZA_TAG_INDEX.get(normalizeWazaLookupKey(w.name));
      if (!entry || entry.isPassive) return false;
      const preview = resolveWazaTagPreview(w.name, WAZA_TAG_INDEX);
      return preview.tier != null && preview.csCost != null;
    });
  }, [wazaList]);

  const filteredWaza = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return launchableWaza;
    return launchableWaza.filter((w) => w.name.toLowerCase().includes(q));
  }, [launchableWaza, filter]);

  const selectedWaza = useMemo(
    () => launchableWaza.find((w) => w.id === selectedWazaId) ?? null,
    [launchableWaza, selectedWazaId],
  );

  const targetOptions = useMemo(
    () =>
      usersInRoom
        .filter((u) => u.id && !u.isMe)
        .map((u) => ({
          id: u.id,
          label: u.name,
        })),
    [usersInRoom],
  );

  const preview = useMemo(() => {
    if (!selectedWaza) return null;
    const entry = WAZA_TAG_INDEX.get(normalizeWazaLookupKey(selectedWaza.name));
    let p = resolveWazaTagPreview(selectedWaza.name, WAZA_TAG_INDEX);
    if (skiruSheet) {
      p = enrichWazaTagPreviewWithSkiru(p, entry, skiruSheet, {
        currentCs: currentCs ?? undefined,
        ...wazaResolveExtras,
      });
    }
    return { preview: p, entry };
  }, [selectedWaza, skiruSheet, currentCs, wazaResolveExtras]);

  const wazaPreview = preview?.preview ?? null;
  const wazaEntry = preview?.entry;

  const launchProfile = useMemo(
    () => getWazaLaunchProfile(wazaEntry?.poolId),
    [wazaEntry?.poolId],
  );

  const hikanRank = useMemo(
    () => (skiruSheet ? getSokaijuRank(skiruSheet, "hikan") : 0),
    [skiruSheet],
  );

  useEffect(() => {
    setSurpriseAttack(false);
    setGiurisdizioneCategory("proiettile");
    setSuturaKind("offensiva");
    setDecretoText("");
    setNagoriFrom("liquido");
    setNagoriTo("solido");
    setMeisakuLabel("");
    setDeclareHit(false);
    setTargetCharacterId("");
  }, [selectedWazaId]);

  const launchExtras = useMemo(
    () => ({
      giurisdizioneCategory: launchProfile?.needsGiurisdizioneCategory
        ? giurisdizioneCategory
        : null,
      suturaKind: launchProfile?.needsSuturaKind ? suturaKind : null,
      surpriseAttack: surpriseAttack && hikanRank > 0,
      decretoText: launchProfile?.needsDecreto ? decretoText : null,
      nagoriShift: launchProfile?.needsNagoriShift
        ? { from: nagoriFrom, to: nagoriTo }
        : null,
      meisakuLabel: launchProfile?.needsMeisakuLabel ? meisakuLabel : null,
    }),
    [
      launchProfile,
      giurisdizioneCategory,
      suturaKind,
      surpriseAttack,
      hikanRank,
      decretoText,
      nagoriFrom,
      nagoriTo,
      meisakuLabel,
    ],
  );

  const autoSkiruId = useMemo(() => {
    if (!skiruSheet || !wazaEntry || wazaPreview?.isPassive) return null;
    return resolveAutoLaunchSkiruId(skiruSheet, wazaEntry);
  }, [skiruSheet, wazaEntry, wazaPreview?.isPassive]);

  const mechanicTags = useMemo(
    () => extractMechanicTagsFromEffect(wazaEntry?.effect ?? wazaEntry?.description),
    [wazaEntry],
  );

  const damagePreview = useMemo(() => {
    if (!wazaPreview?.tier) return null;
    return computeLaunchDamagePreview({
      tier: wazaPreview.tier,
      attackerSheet: skiruSheet ?? null,
      declaredSkiruId: autoSkiruId,
      wazaEffectText: wazaEntry?.effect ?? wazaEntry?.description ?? null,
    });
  }, [wazaPreview?.tier, skiruSheet, autoSkiruId, wazaEntry]);

  const effectiveCs = wazaPreview?.csCost ?? 0;

  const csInsufficient =
    currentCs != null && effectiveCs > 0 && effectiveCs > currentCs;

  const launchIr = useMemo(() => {
    if (!skiruSheet || wazaPreview?.isPassive) return null;
    if (autoSkiruId) return computeDeclaredActionIr(skiruSheet, autoSkiruId);
    return null;
  }, [skiruSheet, autoSkiruId, wazaPreview?.isPassive]);

  const launchLinePreview = useMemo(() => {
    if (!selectedWaza) return null;
    const target =
      targetCharacterId !== "" ? { characterId: targetCharacterId } : null;
    return buildFullWazaLaunchLine(selectedWaza.name, WAZA_TAG_INDEX, {
      skiruSheet: skiruSheet ?? null,
      declaredSkiruId: autoSkiruId,
      poolId: wazaEntry?.poolId ?? null,
      launchExtras,
      target,
      declareHit,
      currentCs: currentCs ?? null,
      ...wazaResolveExtras,
    });
  }, [
    selectedWaza,
    targetCharacterId,
    skiruSheet,
    autoSkiruId,
    wazaEntry?.poolId,
    launchExtras,
    declareHit,
    currentCs,
    wazaResolveExtras,
  ]);

  const rider = autoSkiruId ? getSkiruRider(autoSkiruId) : null;
  const skiruLabel = autoSkiruId ? getSkiruDef(autoSkiruId)?.name : null;

  const buildLaunchBody = useCallback(() => {
    if (!selectedWaza) return null;
    const target =
      targetCharacterId != null && targetCharacterId !== ""
        ? { characterId: targetCharacterId }
        : null;
    const line = buildFullWazaLaunchLine(selectedWaza.name, WAZA_TAG_INDEX, {
      skiruSheet: skiruSheet ?? null,
      declaredSkiruId: autoSkiruId,
      poolId: wazaEntry?.poolId ?? null,
      launchExtras,
      target,
      declareHit,
      currentCs: currentCs ?? null,
      ...wazaResolveExtras,
    });
    return narrative.trim() ? `${narrative.trim()}\n${line}` : line;
  }, [
    selectedWaza,
    targetCharacterId,
    skiruSheet,
    autoSkiruId,
    wazaEntry?.poolId,
    launchExtras,
    declareHit,
    currentCs,
    wazaResolveExtras,
    narrative,
  ]);

  const insertLaunch = useCallback(() => {
    const body = buildLaunchBody();
    if (!body) return;
    onInsertText(`${body}\n`);
    setNarrative("");
  }, [buildLaunchBody, onInsertText]);

  const sendLaunch = useCallback(() => {
    const body = buildLaunchBody();
    if (!body || !onSendMessage) return;
    onSendMessage(body);
    setNarrative("");
    setSelectedWazaId("");
    setTargetCharacterId("");
    setDeclareHit(false);
    setSurpriseAttack(false);
  }, [buildLaunchBody, onSendMessage]);

  const needsTarget = Boolean(launchProfile?.needsTarget);
  const missingTarget = needsTarget && targetCharacterId === "";
  const missingDecreto = Boolean(launchProfile?.needsDecreto && !decretoText.trim());

  const canLaunch =
    !!selectedWaza &&
    chatConnected &&
    !csInsufficient &&
    effectiveCs > 0 &&
    !missingTarget &&
    !missingDecreto;

  if (!characterId) {
    return (
      <p className="text-[10px] text-gray-500 italic">Seleziona un personaggio per lanciare waza.</p>
    );
  }

  return (
    <div className="waza-launch-panel space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-[9px] uppercase tracking-wider text-[var(--accent-violet-light)] hover:text-[var(--accent-gold)]"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <FontAwesomeIcon icon={icons.waza} className="w-3 h-3" />
          Pannello lancio
        </span>
        <span>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="space-y-2 animate__animated animate__fadeIn motion-reduce:animate-none border border-[var(--border-color)] rounded-md p-2 bg-black/25">
          <label className="block">
            <span className="text-[9px] uppercase text-gray-500 font-display">Cerca waza</span>
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtra…"
              className="mt-0.5 w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-1 text-[11px] text-white"
            />
          </label>

          <label className="block">
            <span className="text-[9px] uppercase text-gray-500 font-display">
              Waza possedute ({launchableWaza.length})
            </span>
            <select
              value={selectedWazaId}
              onChange={(e) => setSelectedWazaId(e.target.value)}
              className="mt-0.5 w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-[11px] text-white"
              disabled={wazaLoading}
            >
              <option value="">
                {wazaLoading
                  ? "Caricamento…"
                  : launchableWaza.length === 0
                    ? "Nessuna waza attiva posseduta"
                    : "— scegli —"}
              </option>
              {filteredWaza.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>

          {wazaPreview && (
            <div className="text-[9px] text-[var(--accent-violet-light)]/90 leading-relaxed border border-[var(--border-color)]/60 rounded px-2 py-1.5 bg-black/20 space-y-1">
              <>
                <span>
                  {wazaPreview.styleLabel && <>{wazaPreview.styleLabel} · </>}
                  T{wazaPreview.tier}
                  {wazaPreview.damage != null && <> · {wazaPreview.damage} dmg tier</>}
                  {effectiveCs > 0 && <> · {effectiveCs} CS</>}
                  {launchIr != null && <> · IR {launchIr}</>}
                </span>
                {autoSkiruId && skiruLabel && (
                  <p className="text-[8px] text-[var(--accent-gold)]/90">
                    Skiru: {skiruLabel}
                    {rider ? ` · ${rider.label}` : ""}
                  </p>
                )}
                {mechanicTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mechanicTags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-[var(--accent-violet)]/30 px-1 py-0.5 text-[8px] text-[var(--accent-violet-light)]"
                      >
                        [{tag}]
                      </span>
                    ))}
                  </div>
                )}
                {damagePreview && (
                  <p className="text-[8px] text-[var(--accent-gold)]/90">
                    Danno indicativo: {damagePreview.summary} →{" "}
                    <strong>{damagePreview.totalBeforeMitigation}</strong> (pre-mitig.)
                  </p>
                )}
              </>
              {wazaPreview.personalHint && (
                <p className="text-[8px] text-gray-500">{wazaPreview.personalHint}</p>
              )}
              {csInsufficient && (
                <p className="text-[8px] text-red-400/90">
                  CS insufficienti ({currentCs} disponibili, {effectiveCs} richiesti).
                </p>
              )}
            </div>
          )}

          {wazaPreview && launchProfile?.needsGiurisdizioneCategory && (
            <label className="block">
              <span className="text-[9px] uppercase text-gray-500 font-display">
                Categoria Giurisdizione
              </span>
              <select
                value={giurisdizioneCategory}
                onChange={(e) =>
                  setGiurisdizioneCategory(e.target.value as "proiettile" | "raggio")
                }
                className="mt-0.5 w-full rounded border border-[var(--accent-violet)]/40 bg-black/40 px-2 py-1.5 text-[11px] text-white"
              >
                <option value="proiettile">Proiettile</option>
                <option value="raggio">Raggio</option>
              </select>
            </label>
          )}

          {wazaPreview && launchProfile?.needsNagoriShift && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[9px] uppercase text-gray-500 font-display">Da</span>
                <select
                  value={nagoriFrom}
                  onChange={(e) => setNagoriFrom(e.target.value as typeof nagoriFrom)}
                  className="mt-0.5 w-full rounded border border-[var(--accent-violet)]/40 bg-black/40 px-2 py-1.5 text-[11px] text-white"
                >
                  {["solido", "liquido", "gassoso", "sonoro", "elementale", "energetico"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] uppercase text-gray-500 font-display">A</span>
                <select
                  value={nagoriTo}
                  onChange={(e) => setNagoriTo(e.target.value as typeof nagoriTo)}
                  className="mt-0.5 w-full rounded border border-[var(--accent-violet)]/40 bg-black/40 px-2 py-1.5 text-[11px] text-white"
                >
                  {["solido", "liquido", "gassoso", "sonoro", "elementale", "energetico"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {wazaPreview && launchProfile?.needsDecreto && (
            <label className="block">
              <span className="text-[9px] uppercase text-gray-500 font-display">Decreto</span>
              <input
                type="text"
                value={decretoText}
                onChange={(e) => setDecretoText(e.target.value)}
                placeholder='Es. «Quella Proiettile torna al mittente»'
                className="mt-0.5 w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-1 text-[11px] text-white"
              />
            </label>
          )}

          {wazaPreview && launchProfile?.needsSuturaKind && (
            <label className="block">
              <span className="text-[9px] uppercase text-gray-500 font-display">Tipo sutura</span>
              <select
                value={suturaKind}
                onChange={(e) =>
                  setSuturaKind(e.target.value as "offensiva" | "stile" | "elementale")
                }
                className="mt-0.5 w-full rounded border border-[var(--accent-violet)]/40 bg-black/40 px-2 py-1.5 text-[11px] text-white"
              >
                <option value="offensiva">Offensiva</option>
                <option value="stile">Di stile</option>
                <option value="elementale">Elementale</option>
              </select>
            </label>
          )}

          {wazaPreview && launchProfile?.needsMeisakuLabel && (
            <label className="block">
              <span className="text-[9px] uppercase text-gray-500 font-display">Nome Opera Prima</span>
              <input
                type="text"
                value={meisakuLabel}
                onChange={(e) => setMeisakuLabel(e.target.value)}
                placeholder="Nome del costrutto permanente"
                className="mt-0.5 w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-1 text-[11px] text-white"
              />
            </label>
          )}

          {wazaPreview && (launchProfile?.needsTarget || targetOptions.length > 0) && (
            <label className="block">
              <span className="text-[9px] uppercase text-gray-500 font-display">
                Bersaglio{launchProfile?.needsTarget ? " (richiesto)" : " (opz.)"}
              </span>
              <select
                value={targetCharacterId}
                onChange={(e) => setTargetCharacterId(e.target.value)}
                className="mt-0.5 w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-[11px] text-white"
              >
                <option value="">— nessuno —</option>
                {targetOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {wazaPreview && targetCharacterId !== "" && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={declareHit}
                onChange={(e) => setDeclareHit(e.target.checked)}
                className="mt-0.5 accent-[var(--accent-gold)]"
              />
              <span className="text-[9px] text-[var(--accent-violet-light)] leading-relaxed">
                <span className="uppercase tracking-wider text-gray-500 font-display block mb-0.5">
                  Colpo a segno
                </span>
                Aggiunge <code className="text-[8px]">[hit:1]</code> — il motore applica danno tier
                (+ Kongen, rider Skiru) al bersaglio. Il Master può arbitrare in narrato.
              </span>
            </label>
          )}

          {wazaPreview && hikanRank > 0 && launchProfile?.allowsSurprise !== false && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={surpriseAttack}
                onChange={(e) => setSurpriseAttack(e.target.checked)}
                className="mt-0.5 accent-[var(--accent-violet)]"
              />
              <span className="text-[9px] text-[var(--accent-violet-light)] leading-relaxed">
                <span className="uppercase tracking-wider text-gray-500 font-display block mb-0.5">
                  Sorpresa (Hikan rank {hikanRank})
                </span>
                Aggiunge <code className="text-[8px]">[sorpresa:1]</code> — se il bersaglio non ti
                percepiva, può ignorare la schivata reattiva (Hikan &gt; Chōkaku).
              </span>
            </label>
          )}

          <label className="block">
            <span className="text-[9px] uppercase text-gray-500 font-display">Narrato (opz.)</span>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={2}
              placeholder="Descrivi l'azione in chat…"
              className="mt-0.5 w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-1 text-[11px] text-white resize-y min-h-[2.5rem]"
            />
          </label>

          {launchLinePreview && selectedWaza && (
            <div className="rounded border border-[var(--border-color)]/40 bg-black/30 px-2 py-1.5">
              <span className="text-[8px] uppercase tracking-wider text-gray-600 font-display">
                Tag in chat
              </span>
              <p className="mt-0.5 text-[8px] text-gray-500 break-all leading-relaxed font-mono">
                {launchLinePreview}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              disabled={!canLaunch}
              onClick={insertLaunch}
              className="w-full px-3 py-2 rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] text-[10px] font-display uppercase tracking-wide hover:bg-[var(--accent-violet)]/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              Inserisci in textarea
            </button>
            {onSendMessage && (
              <button
                type="button"
                disabled={!canLaunch}
                onClick={sendLaunch}
                className="w-full px-3 py-2 rounded border border-[var(--accent-gold)]/60 text-[var(--accent-gold)] text-xs font-display uppercase tracking-wide hover:bg-[var(--accent-gold)]/10 transition-colors disabled:opacity-40 disabled:pointer-events-none shadow-[var(--shadow-gold)]"
              >
                Invia in chat
              </button>
            )}
          </div>

          <p className="text-[8px] text-gray-600 leading-relaxed">
            CS e Skiru sono calcolati dal tier e dalla waza scelta. Per override manuale:{" "}
            <code className="text-[var(--accent-violet-light)]/80">
              /waza Nome --skiru seimitsu --target Aoi
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
