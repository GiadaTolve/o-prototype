"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import {
  buildDoMechanicsSectionTitle,
  useDoMechanicsVisibility,
} from "@/hooks/useDoMechanicsVisibility";
import { DoMechanicsPanel } from "../DoMechanicsPanel";
import type { CharacterSummary, Presente } from "../types";
import { resolveCharacterComputed, formatMovementMeters } from "../character-computed";
import { StatusEffectsPanel } from "../StatusEffectsPanel";
import { CombatHpInline } from "./CombatHpInline";
import { CombatCsInline } from "./CombatCsInline";
import { LancioWazaPanel } from "./LancioWazaPanel";
import { CombatToroSection } from "./CombatToroSection";
import { CombatConstructsSection } from "./CombatConstructsSection";

const WAZA_TESTER_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_WAZA_TESTER_URL
    ? process.env.NEXT_PUBLIC_WAZA_TESTER_URL
    : "http://localhost:5173";

const EMOTIONAL = ["ira", "tristezza", "disperazione", "beatitudine", "euforia"] as const;
const ATYPICAL = ["emorragia", "debitore", "debito", "metamorfosi", "trance_onirica", "sigillato", "macchiato"] as const;
const ELEMENTS = [
  { id: "fuoco", label: "Fuoco" },
  { id: "fulmine", label: "Fulmine" },
  { id: "acqua", label: "Acqua" },
  { id: "gravita", label: "Gravità" },
  { id: "aria", label: "Aria" },
] as const;

type ChronoVitals = {
  csCurrent: number;
  csCapacity: number;
  accumulating: boolean;
  isOverheated: boolean;
};

type SceneStatus = {
  characterId: string;
  name: string;
  hpCurrent: number;
  hpMax: number;
  chrono?: ChronoVitals;
  effects: { tag: string; stacks: number }[];
};

function CombatSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: typeof icons.waza;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [bodyReady, setBodyReady] = useState(false);

  useEffect(() => {
    setBodyReady(true);
  }, []);

  return (
    <div className="chat-combat-section">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="chat-combat-section__toggle"
        aria-expanded={open}
      >
        <FontAwesomeIcon icon={icon} className="w-3 h-3 shrink-0" />
        <span>{title}</span>
        <span className="chat-combat-section__chev">{open ? "−" : "+"}</span>
      </button>
      {open && bodyReady && (
        <div className="chat-combat-section__body animate__animated animate__fadeIn motion-reduce:animate-none">
          {children}
        </div>
      )}
    </div>
  );
}

export function ChatCombatPanel({
  onInsertText,
  onSendMessage,
  chatConnected = true,
  characterId,
  skiruSheet,
  char,
  usersInRoom,
  isMaster,
}: {
  onInsertText: (text: string) => void;
  onSendMessage?: (text: string) => void;
  chatConnected?: boolean;
  characterId?: string;
  skiruSheet?: Record<string, number>;
  char?: CharacterSummary;
  usersInRoom: Presente[];
  isMaster?: boolean;
}) {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const vitals = useMemo(() => resolveCharacterComputed(char?.computed), [char?.computed]);
  const [ownHp, setOwnHp] = useState<{ current: number; max: number } | null>(null);
  const [ownCs, setOwnCs] = useState<ChronoVitals | null>(null);

  useEffect(() => {
    if (vitals.hpMax > 0) {
      setOwnHp({ current: vitals.hpCurrent, max: vitals.hpMax });
    } else {
      setOwnHp(null);
    }
  }, [vitals.hpCurrent, vitals.hpMax]);

  useEffect(() => {
    const c = char?.computed as { csCurrent?: number; csCapacity?: number; csAccumulating?: boolean } | undefined;
    if (c?.csCapacity != null && c.csCurrent != null) {
      setOwnCs({
        csCurrent: c.csCurrent,
        csCapacity: c.csCapacity,
        accumulating: Boolean(c.csAccumulating),
        isOverheated: c.csCurrent > (c.csCapacity ?? 20),
      });
    }
  }, [char?.computed]);

  useEffect(() => {
    if (!characterId) return;
    let cancelled = false;
    api
      .get(`/characters/${characterId}/status-effects`)
      .then((data) => {
        if (cancelled || !mountedRef.current) return;
        const chrono = (data as { vitals?: { chronoStack?: ChronoVitals } }).vitals?.chronoStack;
        if (chrono) setOwnCs(chrono);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [characterId]);

  useEffect(() => {
    const onHp = (e: Event) => {
      const d = (e as CustomEvent<{ characterId: string; hpCurrent: number; hpMax: number }>).detail;
      if (!d?.characterId) return;
      if (d.characterId === characterId) {
        setOwnHp({ current: d.hpCurrent, max: d.hpMax });
      }
      setSceneStatus((prev) =>
        prev.map((row) =>
          row.characterId === d.characterId
            ? { ...row, hpCurrent: d.hpCurrent, hpMax: d.hpMax }
            : row,
        ),
      );
    };
    window.addEventListener("characterHpUpdated", onHp);
    return () => window.removeEventListener("characterHpUpdated", onHp);
  }, [characterId]);

  useEffect(() => {
    const onCs = (e: Event) => {
      const d = (e as CustomEvent<{ characterId: string } & ChronoVitals>).detail;
      if (!d?.characterId) return;
      const row: ChronoVitals = {
        csCurrent: d.csCurrent,
        csCapacity: d.csCapacity,
        accumulating: d.accumulating,
        isOverheated: d.isOverheated,
      };
      if (d.characterId === characterId) {
        setOwnCs(row);
      }
      setSceneStatus((prev) =>
        prev.map((r) => (r.characterId === d.characterId ? { ...r, chrono: row } : r)),
      );
    };
    window.addEventListener("characterChronoUpdated", onCs);
    return () => window.removeEventListener("characterChronoUpdated", onCs);
  }, [characterId]);

  const insertAtCursor = useCallback((text: string) => onInsertText(text), [onInsertText]);

  const {
    visibleStyles: doVisibleStyles,
    showHitTier: doShowHitTier,
    visible: doMechanicsVisible,
    loading: doMechanicsLoading,
  } = useDoMechanicsVisibility(!!characterId);

  const [sceneStatus, setSceneStatus] = useState<SceneStatus[]>([]);
  const [sceneLoading, setSceneLoading] = useState(false);

  const loadSceneStatus = useCallback(async () => {
    const targets = usersInRoom.filter((u) => u.id);
    if (targets.length === 0) {
      if (mountedRef.current) setSceneStatus([]);
      return;
    }
    if (mountedRef.current) setSceneLoading(true);
    try {
      const rows = await Promise.all(
        targets.map(async (u) => {
          try {
            const data = (await api.get(`/characters/${u.id}/status-effects`)) as {
              effects?: { tag: string; stacks: number }[];
              vitals?: {
                hpCurrent: number;
                hpMax: number;
                chronoStack?: ChronoVitals;
              };
            };
            const hpMax = data.vitals?.hpMax ?? 0;
            return {
              characterId: u.id,
              name: u.name,
              hpCurrent: data.vitals?.hpCurrent ?? hpMax,
              hpMax,
              chrono: data.vitals?.chronoStack,
              effects: (data.effects ?? []).map((e) => ({ tag: e.tag, stacks: e.stacks })),
            };
          } catch {
            return { characterId: u.id, name: u.name, hpCurrent: 0, hpMax: 0, chrono: undefined, effects: [] };
          }
        }),
      );
      if (mountedRef.current) setSceneStatus(rows);
    } finally {
      if (mountedRef.current) setSceneLoading(false);
    }
  }, [usersInRoom]);

  useEffect(() => {
    void loadSceneStatus();
  }, [loadSceneStatus]);

  const [masterTargetId, setMasterTargetId] = useState("");
  const [masterMsg, setMasterMsg] = useState<string | null>(null);
  const [masterBusy, setMasterBusy] = useState(false);
  const [hpAmount, setHpAmount] = useState(3);
  const [damageHitTier, setDamageHitTier] = useState<number | null>(3);
  const [masterTargetStatus, setMasterTargetStatus] = useState<
    Array<{ id: string; tag: string; stacks: number }>
  >([]);

  const masterTargets = useMemo(
    () => usersInRoom.map((u) => ({ id: u.id, label: u.name + (u.isMe ? " (tu)" : "") })),
    [usersInRoom],
  );

  const effectiveMasterTargetId = masterTargetId || masterTargets[0]?.id || "";

  const othersInScene = useMemo(
    () => sceneStatus.filter((row) => row.characterId !== characterId),
    [sceneStatus, characterId],
  );

  const loadMasterTarget = useCallback(async (cid: string) => {
    if (!cid) {
      if (mountedRef.current) {
        setMasterTargetStatus([]);
      }
      return;
    }
    try {
      const st = (await api.get(`/characters/${cid}/status-effects`)) as {
        effects?: Array<{ id: string; tag: string; stacks: number }>;
      };
      if (mountedRef.current) {
        setMasterTargetStatus(st.effects ?? []);
      }
    } catch {
      if (mountedRef.current) {
        setMasterTargetStatus([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!isMaster || !effectiveMasterTargetId) return;
    let cancelled = false;
    loadMasterTarget(effectiveMasterTargetId).then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [isMaster, effectiveMasterTargetId, loadMasterTarget]);

  useEffect(() => {
    const onStatus = () => {
      void loadSceneStatus();
      if (isMaster && effectiveMasterTargetId) {
        void loadMasterTarget(effectiveMasterTargetId);
      }
    };
    window.addEventListener("characterStatusUpdated", onStatus);
    return () => window.removeEventListener("characterStatusUpdated", onStatus);
  }, [isMaster, effectiveMasterTargetId, loadMasterTarget, loadSceneStatus]);

  const runMaster = async (fn: () => Promise<unknown>, ok: string) => {
    if (!effectiveMasterTargetId) return;
    if (mountedRef.current) {
      setMasterBusy(true);
      setMasterMsg(null);
    }
    try {
      await fn();
      if (mountedRef.current) setMasterMsg(ok);
      window.dispatchEvent(new CustomEvent("characterStatusUpdated"));
      await loadSceneStatus();
      await loadMasterTarget(effectiveMasterTargetId);
    } catch (e: unknown) {
      if (mountedRef.current) setMasterMsg(e instanceof Error ? e.message : "Operazione fallita");
    } finally {
      if (mountedRef.current) setMasterBusy(false);
    }
  };

  return (
    <div className="chat-combat-panel space-y-2">
      <h5 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display flex items-center gap-1.5">
        <FontAwesomeIcon icon={icons.waza} className="w-3 h-3" />
        Combattimento
      </h5>

      <CombatSection title="Tu" icon={icons.heart} defaultOpen>
        {ownHp && ownHp.max > 0 && (
          <div className="mb-2">
            <CombatHpInline current={ownHp.current} max={ownHp.max} />
          </div>
        )}
        {ownCs && (
          <div className="mb-2">
            <CombatCsInline
              current={ownCs.csCurrent}
              capacity={ownCs.csCapacity}
              accumulating={ownCs.accumulating}
              isOverheated={ownCs.isOverheated}
            />
          </div>
        )}
        {ownHp && ownHp.max > 0 && (
          <dl className="chat-combat-vitals mb-2">
            <div>
              <dt>Mitig.</dt>
              <dd>{vitals.mitigationPercent}%</dd>
            </div>
            <div>
              <dt>Mov./¼</dt>
              <dd>{formatMovementMeters(vitals.movementMeters)}</dd>
            </div>
          </dl>
        )}
        <StatusEffectsPanel characterId={characterId} isOwnCharacter embedded />
      </CombatSection>

      <CombatSection title="Tōrō & tag chat" icon={icons.skiru}>
        <CombatToroSection onInsertText={insertAtCursor} />
      </CombatSection>

      <CombatSection title="Costrutti sul campo" icon={icons.waza}>
        <CombatConstructsSection
          characterId={characterId}
          onInsertText={insertAtCursor}
        />
      </CombatSection>

      {!doMechanicsLoading && doMechanicsVisible && (
        <CombatSection
          title={buildDoMechanicsSectionTitle(doVisibleStyles)}
          icon={icons.skiru}
          defaultOpen
        >
          <DoMechanicsPanel
            embedded
            currentCs={ownCs?.csCurrent ?? null}
            visibleStyles={doVisibleStyles}
            showHitTier={doShowHitTier}
          />
        </CombatSection>
      )}

      <CombatSection title="Altri in scena" icon={icons.presenti}>
        {sceneLoading ? (
          <p className="text-[9px] text-gray-500 italic">Aggiorno…</p>
        ) : othersInScene.length === 0 ? (
          <p className="text-[10px] text-gray-500 italic">Nessun altro presente in chat.</p>
        ) : (
          <ul className="space-y-2">
            {othersInScene.map((row) => (
              <li key={row.characterId} className="chat-combat-scene-row">
                <span className="chat-combat-scene-row__name">{row.name}</span>
                {row.hpMax > 0 && (
                  <CombatHpInline current={row.hpCurrent} max={row.hpMax} compact />
                )}
                {row.chrono && (
                  <CombatCsInline
                    current={row.chrono.csCurrent}
                    capacity={row.chrono.csCapacity}
                    accumulating={row.chrono.accumulating}
                    isOverheated={row.chrono.isOverheated}
                    compact
                  />
                )}
                {row.effects.length === 0 ? (
                  <span className="text-[9px] text-gray-600 italic">—</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {row.effects.map((e, i) => (
                      <span key={`${e.tag}-${i}`} className="status-emotional-tag text-[8px]">
                        {e.tag}×{e.stacks}
                      </span>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CombatSection>

      <CombatSection title="Waza in chat" icon={icons.waza} defaultOpen>
        <LancioWazaPanel
          characterId={characterId}
          skiruSheet={skiruSheet}
          usersInRoom={usersInRoom}
          currentCs={ownCs?.csCurrent ?? null}
          onInsertText={insertAtCursor}
          onSendMessage={onSendMessage}
          chatConnected={chatConnected}
        />
        <a
          href={WAZA_TESTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 block w-full px-3 py-1.5 rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet)] text-[10px] hover:bg-[var(--accent-violet)]/10 transition-colors text-center"
        >
          Tester Waza
        </a>
      </CombatSection>

      {isMaster && (
        <CombatSection title="Strumenti Master" icon={icons.ordine}>
          <label className="block mb-2">
            <span className="text-[9px] uppercase text-gray-500 font-display">Bersaglio</span>
            <select
              value={effectiveMasterTargetId}
              onChange={(e) => setMasterTargetId(e.target.value)}
              className="mt-0.5 w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-[11px] text-white"
            >
              {masterTargets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {masterMsg && (
            <p className="text-[9px] text-[var(--accent-violet-light)] mb-2 border border-[var(--border-color)] rounded px-2 py-1 bg-black/30">
              {masterMsg}
            </p>
          )}

          <p className="text-[9px] uppercase text-gray-500 font-display mb-1">HP (non in chat)</p>
          <div className="flex flex-wrap items-center gap-1 mb-2">
            <input
              type="number"
              min={1}
              max={999}
              value={hpAmount}
              onChange={(e) => setHpAmount(Number(e.target.value) || 1)}
              className="w-14 rounded border border-[var(--border-color)] bg-black/40 px-1 py-0.5 text-[10px] text-white"
            />
            <button
              type="button"
              disabled={masterBusy || !effectiveMasterTargetId}
              onClick={() =>
                runMaster(
                  () =>
                    api.post(`/characters/${effectiveMasterTargetId}/combat-hp`, {
                      delta: -hpAmount,
                      ...(damageHitTier != null ? { hitTier: damageHitTier } : {}),
                    }),
                  damageHitTier != null
                    ? `HP -${hpAmount} · T${damageHitTier} (Junnō/Hibiki)`
                    : `HP -${hpAmount}`,
                )
              }
              className="chat-combat-master-btn chat-combat-master-btn--warn"
            >
              − HP
            </button>
            <button
              type="button"
              disabled={masterBusy || !effectiveMasterTargetId}
              onClick={() =>
                runMaster(
                  () => api.post(`/characters/${effectiveMasterTargetId}/combat-hp`, { delta: hpAmount }),
                  `HP +${hpAmount}`,
                )
              }
              className="chat-combat-master-btn"
            >
              + HP
            </button>
          </div>
          <p className="text-[9px] font-display uppercase text-gray-500 mb-1">Tier colpo (Junnō / Hibiki)</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((t) => (
              <button
                key={t}
                type="button"
                disabled={masterBusy}
                className={`chat-combat-master-btn ${
                  damageHitTier === t ? "border-[var(--accent-gold)]/50 text-[var(--accent-gold)]" : ""
                }`}
                onClick={() => setDamageHitTier(t)}
              >
                T{t}
              </button>
            ))}
            <button
              type="button"
              disabled={masterBusy}
              className="chat-combat-master-btn"
              onClick={() => setDamageHitTier(null)}
            >
              —
            </button>
          </div>
          <p className="text-[9px] text-gray-600 mb-2 leading-relaxed">
            Il narrato HP resta nel masterscreen; qui aggiorni la barra in scheda e in chat.
            Con − HP e tier selezionato, il bersaglio registra l&apos;ultimo colpo per Junnō/Hibiki.
          </p>

          <p className="text-[9px] uppercase text-gray-500 font-display mb-1">Status</p>
          {masterTargetStatus.length > 0 ? (
            <div className="flex flex-wrap gap-1 mb-2">
              {masterTargetStatus.map((e) => (
                <span
                  key={e.id}
                  className="inline-flex items-center gap-0.5 rounded border border-[var(--border-color)] bg-black/30 px-1.5 py-0.5 text-[9px] text-[var(--accent-violet-light)]"
                >
                  {e.tag} ×{e.stacks}
                  <button
                    type="button"
                    disabled={masterBusy || !effectiveMasterTargetId}
                    onClick={() =>
                      runMaster(
                        () =>
                          api.delete(
                            `/characters/${effectiveMasterTargetId}/status-effects/${e.id}`,
                          ),
                        `Rimosso ${e.tag}`,
                      )
                    }
                    className="text-red-400/80 hover:text-red-400 leading-none px-0.5 disabled:opacity-40"
                    title={`Rimuovi ${e.tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[9px] text-gray-600 italic mb-2">Nessuno status attivo sul bersaglio.</p>
          )}
          <div className="flex flex-wrap gap-1 mb-2">
            {EMOTIONAL.map((id) => (
              <button
                key={id}
                type="button"
                disabled={masterBusy || !effectiveMasterTargetId}
                onClick={() =>
                  runMaster(
                    () => api.post(`/characters/${effectiveMasterTargetId}/status-effects/apply`, { statusId: id }),
                    `+${id}`,
                  )
                }
                className="chat-combat-master-btn"
              >
                +{id}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {ELEMENTS.map((el) => (
              <button
                key={el.id}
                type="button"
                disabled={masterBusy || !effectiveMasterTargetId}
                onClick={() =>
                  runMaster(
                    () =>
                      api.post(`/characters/${effectiveMasterTargetId}/status-effects/apply`, { element: el.id }),
                    el.label,
                  )
                }
                className="chat-combat-master-btn chat-combat-master-btn--violet"
              >
                {el.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {ATYPICAL.slice(0, 4).map((id) => (
              <button
                key={id}
                type="button"
                disabled={masterBusy || !effectiveMasterTargetId}
                onClick={() =>
                  runMaster(
                    () =>
                      api.post(`/characters/${effectiveMasterTargetId}/status-effects/apply`, { statusId: id }),
                    `+${id}`,
                  )
                }
                className="chat-combat-master-btn"
              >
                +{id}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            <button
              type="button"
              disabled={masterBusy || !effectiveMasterTargetId}
              onClick={() =>
                runMaster(
                  () => api.post(`/characters/${effectiveMasterTargetId}/status-effects/tick-turn`, {}),
                  "Tick turno",
                )
              }
              className="chat-combat-master-btn chat-combat-master-btn--gold"
            >
              Tick turno
            </button>
            <button
              type="button"
              disabled={masterBusy || !effectiveMasterTargetId}
              onClick={() =>
                runMaster(
                  () => api.post(`/characters/${effectiveMasterTargetId}/status-effects/hit-taken`, {}),
                  "Colpo subito",
                )
              }
              className="chat-combat-master-btn"
            >
              Colpo subito
            </button>
          </div>

          <p className="text-[9px] uppercase text-gray-500 font-display mb-1 mt-3">
            Costrutti bersaglio
          </p>
          <CombatConstructsSection
            isMaster
            masterTargetId={effectiveMasterTargetId}
          />
        </CombatSection>
      )}
    </div>
  );
}
