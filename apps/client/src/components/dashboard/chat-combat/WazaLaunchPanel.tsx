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
  listInvestedChannelSkiru,
} from "@domain/combat/waza-launch";
import { computeDeclaredActionIr, computeLaunchDamagePreview, extractMechanicTagsFromEffect, getSkiruRider } from "@domain/combat/waza-skiru-riders";
import { getSkiruDef } from "@domain/skiru/catalog";
import { useDoMechanicsSnapshot } from "@/hooks/useDoMechanicsSnapshot";
import type { Presente } from "../types";

type WazaRow = { id: string; name: string };

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
  const [declaredSkiruId, setDeclaredSkiruId] = useState("");
  const [csOverride, setCsOverride] = useState<number | "">("");
  const [targetCharacterId, setTargetCharacterId] = useState("");
  const [declareHit, setDeclareHit] = useState(false);
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
          arr.map((w: { id?: string; name?: string }) => ({
            id: w.id ?? "",
            name: w.name ?? "",
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

  const channelSkiru = useMemo(
    () => listInvestedChannelSkiru(skiruSheet ?? null),
    [skiruSheet],
  );

  useEffect(() => {
    setCsOverride("");
  }, [selectedWazaId]);

  useEffect(() => {
    if (declaredSkiruId || channelSkiru.length === 0) return;
    setDeclaredSkiruId(channelSkiru[0].id);
  }, [channelSkiru, declaredSkiruId]);

  const filteredWaza = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return wazaList;
    return wazaList.filter((w) => w.name.toLowerCase().includes(q));
  }, [wazaList, filter]);

  const selectedWaza = useMemo(
    () => wazaList.find((w) => w.id === selectedWazaId) ?? null,
    [wazaList, selectedWazaId],
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

  const mechanicTags = useMemo(
    () => extractMechanicTagsFromEffect(wazaEntry?.effect ?? wazaEntry?.description),
    [wazaEntry],
  );

  const damagePreview = useMemo(() => {
    if (!wazaPreview?.tier) return null;
    return computeLaunchDamagePreview({
      tier: wazaPreview.tier,
      attackerSheet: skiruSheet ?? null,
      declaredSkiruId: declaredSkiruId || null,
      wazaEffectText: wazaEntry?.effect ?? wazaEntry?.description ?? null,
    });
  }, [wazaPreview?.tier, skiruSheet, declaredSkiruId, wazaEntry]);

  const effectiveCs = useMemo(() => {
    if (csOverride !== "" && Number.isFinite(csOverride)) return Math.max(0, csOverride);
    return wazaPreview?.csCost ?? 0;
  }, [csOverride, wazaPreview?.csCost]);

  const csInsufficient =
    currentCs != null && effectiveCs > 0 && effectiveCs > currentCs;

  const launchIr = useMemo(() => {
    if (!skiruSheet || wazaPreview?.isPassive) return null;
    if (declaredSkiruId) return computeDeclaredActionIr(skiruSheet, declaredSkiruId);
    return null;
  }, [skiruSheet, declaredSkiruId, wazaPreview?.isPassive]);

  const launchLinePreview = useMemo(() => {
    if (!selectedWaza) return null;
    const target =
      targetCharacterId !== "" ? { characterId: targetCharacterId } : null;
    return buildFullWazaLaunchLine(selectedWaza.name, WAZA_TAG_INDEX, {
      skiruSheet: skiruSheet ?? null,
      declaredSkiruId: declaredSkiruId || null,
      csOverride: csOverride !== "" ? csOverride : null,
      target,
      declareHit,
      currentCs: currentCs ?? null,
      ...wazaResolveExtras,
    });
  }, [
    selectedWaza,
    targetCharacterId,
    skiruSheet,
    declaredSkiruId,
    csOverride,
    declareHit,
    currentCs,
    wazaResolveExtras,
  ]);

  const rider = declaredSkiruId ? getSkiruRider(declaredSkiruId) : null;
  const skiruLabel = declaredSkiruId ? getSkiruDef(declaredSkiruId)?.name : null;

  const insertLaunch = useCallback(() => {
    if (!selectedWaza) return;
    const target =
      targetCharacterId != null && targetCharacterId !== ""
        ? { characterId: targetCharacterId }
        : null;
    const line = buildFullWazaLaunchLine(selectedWaza.name, WAZA_TAG_INDEX, {
      skiruSheet: skiruSheet ?? null,
      declaredSkiruId: declaredSkiruId || null,
      csOverride: csOverride !== "" ? csOverride : null,
      target,
      declareHit,
      currentCs: currentCs ?? null,
      ...wazaResolveExtras,
    });
    const body = narrative.trim() ? `${narrative.trim()}\n${line}` : line;
    onInsertText(`${body}\n`);
    setNarrative("");
  }, [
    selectedWaza,
    targetCharacterId,
    skiruSheet,
    declaredSkiruId,
    csOverride,
    declareHit,
    currentCs,
    wazaResolveExtras,
    narrative,
    onInsertText,
  ]);

  const sendLaunch = useCallback(() => {
    if (!selectedWaza || !onSendMessage) return;
    const target =
      targetCharacterId != null && targetCharacterId !== ""
        ? { characterId: targetCharacterId }
        : null;
    const line = buildFullWazaLaunchLine(selectedWaza.name, WAZA_TAG_INDEX, {
      skiruSheet: skiruSheet ?? null,
      declaredSkiruId: declaredSkiruId || null,
      csOverride: csOverride !== "" ? csOverride : null,
      target,
      declareHit,
      currentCs: currentCs ?? null,
      ...wazaResolveExtras,
    });
    const body = narrative.trim() ? `${narrative.trim()}\n${line}` : line;
    onSendMessage(body);
    setNarrative("");
    setSelectedWazaId("");
    setTargetCharacterId("");
    setCsOverride("");
    setDeclareHit(false);
  }, [
    selectedWaza,
    targetCharacterId,
    skiruSheet,
    declaredSkiruId,
    csOverride,
    declareHit,
    currentCs,
    wazaResolveExtras,
    narrative,
    onSendMessage,
  ]);

  const needsSkiru = wazaPreview != null && !wazaPreview.isPassive && wazaPreview.tier != null;
  const canLaunch =
    !!selectedWaza &&
    chatConnected &&
    !csInsufficient &&
    (!needsSkiru || (declaredSkiruId !== "" && channelSkiru.some((s) => s.id === declaredSkiruId)));

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
            <span className="text-[9px] uppercase text-gray-500 font-display">Waza</span>
            <select
              value={selectedWazaId}
              onChange={(e) => setSelectedWazaId(e.target.value)}
              className="mt-0.5 w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-[11px] text-white"
              disabled={wazaLoading}
            >
              <option value="">{wazaLoading ? "Caricamento…" : "— scegli —"}</option>
              {filteredWaza.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>

          {wazaPreview && (
            <div className="text-[9px] text-[var(--accent-violet-light)]/90 leading-relaxed border border-[var(--border-color)]/60 rounded px-2 py-1.5 bg-black/20 space-y-1">
              {wazaPreview.isPassive ? (
                <span>Dō passiva · nessun lancio meccanico</span>
              ) : (
                <>
                  <span>
                    {wazaPreview.styleLabel && <>{wazaPreview.styleLabel} · </>}
                    T{wazaPreview.tier}
                    {wazaPreview.damage != null && <> · {wazaPreview.damage} dmg tier</>}
                    {effectiveCs > 0 && <> · {effectiveCs} CS</>}
                    {launchIr != null && <> · IR {launchIr}</>}
                  </span>
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
              )}
              {wazaPreview.personalHint && (
                <p className="text-[8px] text-gray-500">{wazaPreview.personalHint}</p>
              )}
            </div>
          )}

          {needsSkiru && (
            <label className="block">
              <span className="text-[9px] uppercase text-gray-500 font-display">Skiru incanalamento</span>
              <select
                value={declaredSkiruId}
                onChange={(e) => setDeclaredSkiruId(e.target.value)}
                className="mt-0.5 w-full rounded border border-[var(--accent-gold)]/40 bg-black/40 px-2 py-1.5 text-[11px] text-[var(--accent-gold)]"
              >
                {channelSkiru.length === 0 ? (
                  <option value="">Nessuna Skiru investita</option>
                ) : (
                  channelSkiru.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.points}pt)
                    </option>
                  ))
                )}
              </select>
              {rider && (
                <p className="mt-1 text-[8px] text-[var(--accent-violet-light)]">
                  Rider {skiruLabel}: {rider.label}
                </p>
              )}
            </label>
          )}

          {needsSkiru && wazaPreview?.csCost != null && (
            <label className="block">
              <span className="text-[9px] uppercase text-gray-500 font-display">
                CS ({wazaPreview.csCost} base
                {currentCs != null ? ` · hai ${currentCs}` : ""})
              </span>
              <input
                type="number"
                min={0}
                max={currentCs != null ? Math.max(currentCs, wazaPreview.csCost) : 99}
                value={csOverride === "" ? wazaPreview.csCost : csOverride}
                onChange={(e) => {
                  const v = e.target.value;
                  setCsOverride(v === "" ? "" : Number(v) || 0);
                }}
                className={`mt-0.5 w-full rounded border bg-black/40 px-2 py-1 text-[11px] text-white tabular-nums ${
                  csInsufficient
                    ? "border-red-400/60"
                    : "border-[var(--border-color)]"
                }`}
              />
              {csInsufficient && (
                <p className="mt-1 text-[8px] text-red-400/90">
                  CS insufficienti ({currentCs} disponibili, {effectiveCs} richiesti).
                </p>
              )}
            </label>
          )}

          {needsSkiru && targetOptions.length > 0 && (
            <label className="block">
              <span className="text-[9px] uppercase text-gray-500 font-display">Bersaglio (opz.)</span>
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

          {needsSkiru && targetCharacterId !== "" && (
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
            Oppure:{" "}
            <code className="text-[var(--accent-violet-light)]/80">
              /waza Nome --skiru seimitsu --cs 2 --target Aoi
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
