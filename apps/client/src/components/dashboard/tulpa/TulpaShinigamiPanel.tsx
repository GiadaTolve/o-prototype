"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import {
  emptyPngDraft,
  PNG_TIPO_LABELS,
  PNG_TIPI,
  type PngScheda,
  type PngTier,
  type PngTipo,
} from "@domain/shinigami";
import type { Presente } from "../types";
import { CombatConstructsSection } from "../chat-combat/CombatConstructsSection";
import { SchedaBestiarioView, SchedaPngView, type FieldNpc } from "./SchedaPngView";

type ColId = "a" | "b" | "c";
type ToolsTab = "creazione" | "albo" | "bestiario";

type PgCard = {
  characterId: string;
  name: string;
  hpCurrent: number;
  hpMax: number;
  csCurrent: number;
  csCapacity: number;
  dodgeIr?: number;
  parryIr?: number;
  effects: { id: string; tag: string; stacks: number }[];
  mechanics?: {
    itoTension?: number;
    kaden?: number;
    pressione?: number;
    naikanPhase?: number;
  };
};

type StatusPayload = {
  effects: { id: string; tag: string; stacks: number }[];
  vitals?: {
    hpCurrent?: number;
    hpMax?: number;
    chronoStack?: { csCurrent: number; csCapacity: number };
    dodgeIr?: number;
    parryIr?: number;
  };
};

type DoMechSnap = {
  ito?: { level?: number; rawLevel?: number; tension?: number };
  hado?: { pressure?: number; kaden?: number };
  gokaon?: { stacks?: number; pressione?: number; pressure?: number };
  naikan?: { phase?: number };
};

type AlboEntry = {
  id: string;
  nome: string;
  tipo: PngTipo;
  tier: number;
  hp_max: number;
  cs_max: number;
  ir_attacco: number;
  ir_difesa: number;
  waza?: PngScheda["waza"];
  note?: string;
};

type BestiarioEntry = AlboEntry & {
  lore?: string | null;
  onimori?: string | null;
  tag_caccia?: boolean;
  name_jp?: string | null;
  drop_table?: unknown[];
};

const EMOTIONAL = ["ira", "tristezza", "disperazione", "beatitudine", "euforia"] as const;
const ATYPICAL = ["emorragia", "metamorfosi", "macchiato", "sigillato"] as const;

const BTN =
  "min-h-[36px] px-2 rounded border border-[var(--border-color)] text-[10px] uppercase tracking-wide text-gray-300 bg-black/35 disabled:opacity-40 hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)]/50";
const BTN_WARN = `${BTN} hover:text-red-400`;
const BTN_VIOLET = `${BTN} text-[var(--accent-violet-light)]`;
const BTN_GOLD = `${BTN} text-[var(--accent-gold)] border-[var(--accent-gold)]/40`;

function HpBar({ cur, max }: { cur: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((cur / max) * 100))) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[9px] text-gray-500">
        <span>HP</span>
        <span className="text-[var(--accent-gold)] tabular-nums">
          {cur}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-black/60 border border-[var(--border-color)] overflow-hidden">
        <div className="h-full bg-[var(--accent-gold)]/80" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TulpaShinigamiPanel({
  usersInRoom = [],
  roomId,
}: {
  usersInRoom?: Presente[];
  roomId?: string | null;
}) {
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [col, setCol] = useState<ColId>("a");
  const [toolsTab, setToolsTab] = useState<ToolsTab>("creazione");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [pgCards, setPgCards] = useState<PgCard[]>([]);
  const [fieldNpcs, setFieldNpcs] = useState<FieldNpc[]>([]);
  const [albo, setAlbo] = useState<AlboEntry[]>([]);
  const [bestiario, setBestiario] = useState<BestiarioEntry[]>([]);
  const [draft, setDraft] = useState(() => emptyPngDraft(1, "mob"));
  const [selectedSheet, setSelectedSheet] = useState<Partial<PngScheda> & { nome: string } | null>(
    null,
  );
  const [expandedPg, setExpandedPg] = useState<string | null>(null);
  const [hpAmt, setHpAmt] = useState(5);
  const [csAmt, setCsAmt] = useState(3);
  const [filterAlbo, setFilterAlbo] = useState("");
  const [filterBest, setFilterBest] = useState("");
  const [editingAlboId, setEditingAlboId] = useState<string | null>(null);
  const [expandedNpc, setExpandedNpc] = useState<string | null>(null);

  const targets = useMemo(
    () => usersInRoom.map((u) => ({ id: u.id, label: u.name || u.id.slice(0, 8) })),
    [usersInRoom],
  );

  const run = useCallback(async (fn: () => Promise<unknown>, ok: string) => {
    if (!mountedRef.current) return;
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (mountedRef.current) setMsg(ok);
    } catch (e: unknown) {
      if (mountedRef.current) setMsg(e instanceof Error ? e.message : "Errore");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, []);

  const loadColumnA = useCallback(async () => {
    if (targets.length === 0) {
      if (mountedRef.current) setPgCards([]);
      return;
    }
    const rows: PgCard[] = [];
    await Promise.all(
      targets.map(async (t) => {
        try {
          const [st, mech] = await Promise.all([
            api.get(`/characters/${t.id}/status-effects`) as Promise<StatusPayload>,
            api
              .get(`/characters/${t.id}/do-mechanics`)
              .then((d) => d as DoMechSnap)
              .catch(() => null),
          ]);
          const chrono = st.vitals?.chronoStack;
          rows.push({
            characterId: t.id,
            name: t.label,
            hpCurrent: st.vitals?.hpCurrent ?? 0,
            hpMax: st.vitals?.hpMax ?? 0,
            csCurrent: chrono?.csCurrent ?? 0,
            csCapacity: chrono?.csCapacity ?? 20,
            dodgeIr: st.vitals?.dodgeIr,
            parryIr: st.vitals?.parryIr,
            effects: st.effects ?? [],
            mechanics: {
              itoTension: mech?.ito?.rawLevel ?? mech?.ito?.level ?? mech?.ito?.tension,
              kaden: mech?.hado?.pressure ?? mech?.hado?.kaden,
              pressione: mech?.gokaon?.stacks ?? mech?.gokaon?.pressione ?? mech?.gokaon?.pressure,
              naikanPhase: mech?.naikan?.phase,
            },
          });
        } catch {
          rows.push({
            characterId: t.id,
            name: t.label,
            hpCurrent: 0,
            hpMax: 0,
            csCurrent: 0,
            csCapacity: 20,
            effects: [],
          });
        }
      }),
    );
    rows.sort((a, b) => a.name.localeCompare(b.name));
    if (mountedRef.current) setPgCards(rows);
  }, [targets]);

  const loadField = useCallback(async () => {
    if (!roomId) {
      if (mountedRef.current) setFieldNpcs([]);
      return;
    }
    try {
      const data = (await api.get(`/shinigami/combat/field/${roomId}`)) as {
        items: FieldNpc[];
      };
      if (mountedRef.current) setFieldNpcs(data.items ?? []);
    } catch {
      if (mountedRef.current) setFieldNpcs([]);
    }
  }, [roomId]);

  const loadAlbo = useCallback(async () => {
    try {
      const data = (await api.get(
        `/shinigami/combat/albo${filterAlbo ? `?q=${encodeURIComponent(filterAlbo)}` : ""}`,
      )) as { items: AlboEntry[] };
      if (mountedRef.current) setAlbo(data.items ?? []);
    } catch {
      if (mountedRef.current) setAlbo([]);
    }
  }, [filterAlbo]);

  const loadBestiario = useCallback(async () => {
    try {
      const data = (await api.get(
        `/shinigami/combat/bestiario${filterBest ? `?q=${encodeURIComponent(filterBest)}` : ""}`,
      )) as { items: BestiarioEntry[] };
      if (mountedRef.current) setBestiario(data.items ?? []);
    } catch {
      if (mountedRef.current) setBestiario([]);
    }
  }, [filterBest]);

  useEffect(() => {
    if (col === "a") void loadColumnA();
    if (col === "b") void loadField();
    if (col === "c" && toolsTab === "albo") void loadAlbo();
    if (col === "c" && toolsTab === "bestiario") void loadBestiario();
  }, [col, toolsTab, loadColumnA, loadField, loadAlbo, loadBestiario]);

  const patchNpc = async (id: string, patch: Record<string, unknown>, ok: string) => {
    await run(async () => {
      await api.patch(`/shinigami/combat/field/npc/${id}`, patch);
      await loadField();
    }, ok);
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-[var(--panel-bg)]">
      <div className="shrink-0 px-3 pt-2 pb-1 border-b border-[var(--border-color)]">
        <p className="text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)] font-display mb-2">
          Shinigami · reminder privato (non scrive in chat)
        </p>
        <div className="flex gap-1 lg:hidden overflow-x-auto pb-1">
          {(
            [
              { id: "a" as const, label: "A · PG" },
              { id: "b" as const, label: "B · PNG" },
              { id: "c" as const, label: "C · Tool" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setCol(t.id)}
              className={`shrink-0 min-h-[36px] px-2.5 rounded text-[10px] uppercase font-display tracking-wide border ${
                col === t.id
                  ? "border-[var(--accent-gold)] text-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                  : "border-[var(--border-color)] text-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {msg && (
          <p className="mt-1.5 text-[10px] text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-2 py-1 bg-black/30">
            {msg}
          </p>
        )}
        {!roomId && (
          <p className="mt-1 text-[10px] text-gray-500 italic">
            Apri una chat per gestire PNG sul campo (Colonna B).
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-color)]/50">
        {/* COLONNA A */}
        <section
          className={`min-h-0 overflow-y-auto p-3 space-y-2 ${col === "a" ? "block" : "hidden lg:block"}`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display">
              A · PG del party
            </h4>
            <button type="button" disabled={busy} className={BTN} onClick={() => void loadColumnA()}>
              Aggiorna
            </button>
          </div>
          {pgCards.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Nessun PG in chat.</p>
          ) : (
            pgCards.map((pg) => {
              const open = expandedPg === pg.characterId;
              return (
                <div
                  key={pg.characterId}
                  className="rounded border border-[var(--border-color)]/70 bg-black/25 p-2.5 space-y-2"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setExpandedPg(open ? null : pg.characterId)}
                  >
                    <p className="text-sm font-display text-white">{pg.name}</p>
                    <HpBar cur={pg.hpCurrent} max={pg.hpMax} />
                    <p className="text-[10px] text-[var(--accent-violet-light)] mt-1 tabular-nums">
                      CS {pg.csCurrent}/{pg.csCapacity}
                      {pg.dodgeIr != null ? ` · Schivata ${pg.dodgeIr}` : ""}
                      {pg.parryIr != null ? ` · Parata ${pg.parryIr}` : ""}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 tabular-nums">
                      {pg.mechanics?.kaden != null ? `Kaden ${pg.mechanics.kaden}` : ""}
                      {pg.mechanics?.itoTension != null
                        ? `${pg.mechanics?.kaden != null ? " · " : ""}Tens. ${pg.mechanics.itoTension}`
                        : ""}
                      {pg.mechanics?.pressione != null
                        ? `${pg.mechanics?.kaden != null || pg.mechanics?.itoTension != null ? " · " : ""}Press. ${pg.mechanics.pressione}`
                        : ""}
                    </p>
                    {pg.effects.length > 0 && (
                      <p className="text-[9px] text-gray-500 mt-0.5">
                        {pg.effects.map((e) => `${e.tag}×${e.stacks}`).join(" · ")}
                      </p>
                    )}
                  </button>

                  {open && (
                    <div className="space-y-2 border-t border-[var(--border-color)]/40 pt-2">
                      <div className="flex flex-wrap gap-1 items-center">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={hpAmt}
                          onChange={(e) => setHpAmt(Number(e.target.value) || 1)}
                          className="w-14 min-h-[36px] rounded border border-[var(--border-color)] bg-black/40 px-1 text-[11px] text-white"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_WARN}
                          onClick={() =>
                            run(async () => {
                              await api.post(`/characters/${pg.characterId}/combat-hp`, {
                                delta: -hpAmt,
                              });
                              await loadColumnA();
                            }, `HP −${hpAmt} · ${pg.name}`)
                          }
                        >
                          −HP
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN}
                          onClick={() =>
                            run(async () => {
                              await api.post(`/characters/${pg.characterId}/combat-hp`, {
                                delta: hpAmt,
                              });
                              await loadColumnA();
                            }, `HP +${hpAmt} · ${pg.name}`)
                          }
                        >
                          +HP
                        </button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={csAmt}
                          onChange={(e) => setCsAmt(Number(e.target.value) || 1)}
                          className="w-14 min-h-[36px] rounded border border-[var(--border-color)] bg-black/40 px-1 text-[11px] text-white"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_WARN}
                          onClick={() =>
                            run(async () => {
                              await api.post(`/characters/${pg.characterId}/combat-cs`, {
                                delta: -csAmt,
                              });
                              await loadColumnA();
                            }, `CS −${csAmt}`)
                          }
                        >
                          −CS
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN}
                          onClick={() =>
                            run(async () => {
                              await api.post(`/characters/${pg.characterId}/combat-cs`, {
                                delta: csAmt,
                              });
                              await loadColumnA();
                            }, `CS +${csAmt}`)
                          }
                        >
                          +CS
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {pg.effects.map((e) => (
                          <span
                            key={e.id}
                            className="inline-flex items-center gap-0.5 rounded border border-[var(--border-color)] bg-black/30 px-1.5 py-0.5 text-[9px] text-[var(--accent-violet-light)]"
                          >
                            {e.tag}×{e.stacks}
                            <button
                              type="button"
                              disabled={busy}
                              className="text-[var(--accent-gold)] px-0.5"
                              onClick={() =>
                                run(async () => {
                                  await api.delete(
                                    `/characters/${pg.characterId}/status-effects/${e.id}`,
                                  );
                                  await loadColumnA();
                                }, `−${e.tag}`)
                              }
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[...EMOTIONAL, ...ATYPICAL].map((id) => (
                          <button
                            key={id}
                            type="button"
                            disabled={busy}
                            className={BTN}
                            onClick={() =>
                              run(async () => {
                                await api.post(
                                  `/characters/${pg.characterId}/status-effects/apply`,
                                  { statusId: id, addStacks: true },
                                );
                                await loadColumnA();
                              }, `+${id}`)
                            }
                          >
                            +{id}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_VIOLET}
                          onClick={() =>
                            run(async () => {
                              await api.patch(`/characters/${pg.characterId}/do-mechanics`, {
                                kaden: (pg.mechanics?.kaden ?? 0) + 1,
                              });
                              await loadColumnA();
                            }, "Kaden +1")
                          }
                        >
                          +Kaden
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_VIOLET}
                          onClick={() =>
                            run(async () => {
                              await api.patch(`/characters/${pg.characterId}/do-mechanics`, {
                                kaden: Math.max(0, (pg.mechanics?.kaden ?? 0) - 1),
                              });
                              await loadColumnA();
                            }, "Kaden −1")
                          }
                        >
                          −Kaden
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_VIOLET}
                          onClick={() =>
                            run(async () => {
                              await api.patch(`/characters/${pg.characterId}/do-mechanics`, {
                                itoTension: Math.max(0, (pg.mechanics?.itoTension ?? 0) + 1),
                              });
                              await loadColumnA();
                            }, "Tensione +1")
                          }
                        >
                          +Tens.
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_VIOLET}
                          onClick={() =>
                            run(async () => {
                              await api.patch(`/characters/${pg.characterId}/do-mechanics`, {
                                itoTension: Math.max(0, (pg.mechanics?.itoTension ?? 0) - 1),
                              });
                              await loadColumnA();
                            }, "Tensione −1")
                          }
                        >
                          −Tens.
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_VIOLET}
                          onClick={() =>
                            run(async () => {
                              await api.patch(`/characters/${pg.characterId}/do-mechanics`, {
                                style: "gokaon",
                                action: "add",
                              });
                              await loadColumnA();
                            }, "Pressione +1")
                          }
                        >
                          +Press.
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_VIOLET}
                          onClick={() =>
                            run(async () => {
                              await api.patch(`/characters/${pg.characterId}/do-mechanics`, {
                                style: "gokaon",
                                action: "remove",
                              });
                              await loadColumnA();
                            }, "Pressione −1")
                          }
                        >
                          −Press.
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_GOLD}
                          onClick={() =>
                            run(async () => {
                              await api.post(
                                `/characters/${pg.characterId}/status-effects/tick-turn`,
                                {},
                              );
                              await loadColumnA();
                            }, "Tick turno")
                          }
                        >
                          Tick
                        </button>
                      </div>

                      <CombatConstructsSection isMaster masterTargetId={pg.characterId} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* COLONNA B */}
        <section
          className={`min-h-0 overflow-y-auto p-3 space-y-2 ${col === "b" ? "block" : "hidden lg:block"}`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display">
              B · PNG sul campo
            </h4>
            <button type="button" disabled={busy || !roomId} className={BTN} onClick={() => void loadField()}>
              Aggiorna
            </button>
          </div>
          {fieldNpcs.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              Nessun PNG attivo. Creane uno dalla Colonna C.
            </p>
          ) : (
            fieldNpcs.map((npc) => {
              const open = expandedNpc === npc.id;
              const statuses = npc.status_attivi ?? [];
              return (
              <div
                key={npc.id}
                className="rounded border border-[var(--border-color)]/70 bg-black/25 p-2.5 space-y-2"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedNpc(open ? null : npc.id!)}
                >
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-display text-white truncate">{npc.nome}</p>
                      <p className="text-[9px] text-[var(--accent-violet-light)]">
                        {PNG_TIPO_LABELS[npc.tipo]} · T{npc.tier} · IR {npc.ir_attacco}/
                        {npc.ir_difesa}
                      </p>
                    </div>
                  </div>
                  <HpBar cur={npc.hp_correnti} max={npc.hp_max} />
                  <p className="text-[10px] text-gray-500 tabular-nums mt-1">
                    CS {npc.cs_correnti}/{npc.cs_max}
                    {statuses.length > 0
                      ? ` · ${statuses.map((s) => `${s.slug}×${s.stack}`).join(" · ")}`
                      : ""}
                  </p>
                </button>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    disabled={busy}
                    className={BTN_WARN}
                    onClick={() =>
                      patchNpc(
                        npc.id!,
                        { hp_correnti: Math.max(0, npc.hp_correnti - hpAmt) },
                        `HP −${hpAmt} · ${npc.nome}`,
                      )
                    }
                  >
                    −HP
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={BTN}
                    onClick={() =>
                      patchNpc(
                        npc.id!,
                        { hp_correnti: Math.min(npc.hp_max, npc.hp_correnti + hpAmt) },
                        `HP +${hpAmt} · ${npc.nome}`,
                      )
                    }
                  >
                    +HP
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={BTN_WARN}
                    onClick={() =>
                      patchNpc(
                        npc.id!,
                        { cs_correnti: Math.max(0, npc.cs_correnti - csAmt) },
                        `CS −${csAmt}`,
                      )
                    }
                  >
                    −CS
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={BTN}
                    onClick={() =>
                      patchNpc(
                        npc.id!,
                        { cs_correnti: Math.min(npc.cs_max, npc.cs_correnti + csAmt) },
                        `CS +${csAmt}`,
                      )
                    }
                  >
                    +CS
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={BTN_VIOLET}
                    onClick={() =>
                      run(async () => {
                        await api.post("/shinigami/combat/albo", {
                          nome: npc.nome,
                          tipo: npc.tipo,
                          tier: npc.tier,
                          hp_max: npc.hp_max,
                          cs_max: npc.cs_max,
                          ir_attacco: npc.ir_attacco,
                          ir_difesa: npc.ir_difesa,
                          waza: npc.waza,
                          note: npc.note,
                        });
                        await loadAlbo();
                      }, "Salvato in Albo")
                    }
                  >
                    Salva Albo
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className={BTN_WARN}
                    onClick={() =>
                      run(async () => {
                        await api.delete(`/shinigami/combat/field/npc/${npc.id}`);
                        await loadField();
                      }, `Rimosso ${npc.nome}`)
                    }
                  >
                    Rimuovi
                  </button>
                </div>
                {open && (
                  <div className="space-y-2 border-t border-[var(--border-color)]/40 pt-2">
                    {(npc.waza?.length ?? 0) > 0 && (
                      <ul className="text-[10px] text-[var(--accent-violet-light)] space-y-0.5">
                        {npc.waza!.map((w, i) => (
                          <li key={`${w.nome}-${i}`}>
                            {w.nome}
                            {w.danno != null ? ` · dmg ${w.danno}` : ""}
                            {w.descrizione ? ` — ${w.descrizione}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {statuses.map((s, i) => (
                        <span
                          key={`${s.slug}-${i}`}
                          className="inline-flex items-center gap-0.5 rounded border border-[var(--border-color)] bg-black/30 px-1.5 py-0.5 text-[9px] text-[var(--accent-violet-light)]"
                        >
                          {s.slug}×{s.stack}
                          <button
                            type="button"
                            disabled={busy}
                            className="text-[var(--accent-gold)] px-0.5"
                            onClick={() => {
                              const next = statuses
                                .map((x, j) =>
                                  j === i ? { ...x, stack: x.stack - 1 } : x,
                                )
                                .filter((x) => x.stack > 0);
                              void patchNpc(npc.id!, { status_attivi: next }, `−${s.slug}`);
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[...EMOTIONAL, ...ATYPICAL].slice(0, 6).map((id) => (
                        <button
                          key={id}
                          type="button"
                          disabled={busy}
                          className={BTN}
                          onClick={() => {
                            const existing = statuses.find((s) => s.slug === id);
                            const next = existing
                              ? statuses.map((s) =>
                                  s.slug === id ? { ...s, stack: s.stack + 1 } : s,
                                )
                              : [...statuses, { slug: id, stack: 1 }];
                            void patchNpc(npc.id!, { status_attivi: next }, `+${id}`);
                          }}
                        >
                          +{id}
                        </button>
                      ))}
                    </div>
                    <label className="block">
                      <span className="text-[9px] uppercase text-gray-500 font-display">Note</span>
                      <textarea
                        defaultValue={npc.note ?? ""}
                        onBlur={(e) => {
                          const note = e.target.value;
                          if (note !== (npc.note ?? "")) {
                            void patchNpc(npc.id!, { note }, "Note aggiornate");
                          }
                        }}
                        className="mt-0.5 w-full min-h-[56px] rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-[11px] text-white"
                      />
                    </label>
                  </div>
                )}
              </div>
              );
            })
          )}
        </section>

        {/* COLONNA C */}
        <section
          className={`min-h-0 overflow-y-auto p-3 space-y-3 ${col === "c" ? "block" : "hidden lg:block"}`}
        >
          <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display">
            C · Strumenti
          </h4>
          <div className="flex gap-1 flex-wrap">
            {(
              [
                { id: "creazione" as const, label: "Creazione" },
                { id: "albo" as const, label: "Albo" },
                { id: "bestiario" as const, label: "Bestiario" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setToolsTab(t.id)}
                className={`min-h-[36px] px-2 rounded text-[10px] uppercase font-display border ${
                  toolsTab === t.id
                    ? "border-[var(--accent-violet)] text-[var(--accent-violet-light)] bg-[var(--accent-violet)]/10"
                    : "border-[var(--border-color)] text-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {toolsTab === "creazione" && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-end">
                <label className="block">
                  <span className="text-[9px] uppercase text-gray-500 font-display">Tier</span>
                  <select
                    value={draft.tier}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, tier: Number(e.target.value) as PngTier }))
                    }
                    className="mt-0.5 min-h-[40px] rounded border border-[var(--border-color)] bg-black/40 px-2 text-[12px] text-white"
                  >
                    {[1, 2, 3, 4, 5].map((t) => (
                      <option key={t} value={t}>
                        T{t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block flex-1 min-w-[120px]">
                  <span className="text-[9px] uppercase text-gray-500 font-display">Tipo</span>
                  <select
                    value={draft.tipo}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, tipo: e.target.value as PngTipo }))
                    }
                    className="mt-0.5 w-full min-h-[40px] rounded border border-[var(--border-color)] bg-black/40 px-2 text-[12px] text-white"
                  >
                    {PNG_TIPI.map((t) => (
                      <option key={t} value={t}>
                        {PNG_TIPO_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={busy}
                  className={BTN_VIOLET}
                  onClick={() =>
                    run(async () => {
                      const rolled = (await api.post("/shinigami/combat/random", {
                        tier: draft.tier,
                        tipo: draft.tipo,
                      })) as ReturnType<typeof emptyPngDraft>;
                      setDraft({ ...rolled, salvato_in_albo: false });
                      setSelectedSheet(rolled);
                    }, `Random T${draft.tier}`)
                  }
                >
                  <FontAwesomeIcon icon={icons.refresh} className="w-3 h-3 mr-1" />
                  Randomizza
                </button>
              </div>

              <label className="block">
                <span className="text-[9px] uppercase text-gray-500 font-display">Nome</span>
                <input
                  value={draft.nome}
                  onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                  className="mt-0.5 w-full min-h-[44px] rounded border border-[var(--border-color)] bg-black/40 px-2 text-[12px] text-white"
                />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase text-gray-500 font-display">Note</span>
                <textarea
                  value={draft.note}
                  onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                  className="mt-0.5 w-full min-h-[60px] rounded border border-[var(--border-color)] bg-black/40 px-2 py-2 text-[12px] text-white"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["hp_max", "HP max"],
                    ["hp_correnti", "HP ora"],
                    ["cs_max", "CS max"],
                    ["cs_correnti", "CS ora"],
                    ["ir_attacco", "IR atk"],
                    ["ir_difesa", "IR def"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-[9px] uppercase text-gray-500 font-display">{label}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [key]: Number(e.target.value) || 0 }))
                      }
                      className="mt-0.5 w-full min-h-[40px] rounded border border-[var(--border-color)] bg-black/40 px-2 text-[11px] text-white"
                    />
                  </label>
                ))}
              </div>
              <label className="block">
                <span className="text-[9px] uppercase text-gray-500 font-display">
                  Waza (una per riga: Nome | desc | danno)
                </span>
                <textarea
                  value={(draft.waza ?? [])
                    .map((w) => [w.nome, w.descrizione ?? "", w.danno ?? ""].join(" | "))
                    .join("\n")}
                  onChange={(e) => {
                    const waza = e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [nome, descrizione, danno] = line.split("|").map((s) => s.trim());
                        return {
                          nome: nome || "Attacco",
                          descrizione: descrizione || undefined,
                          danno: danno ? Number(danno) : undefined,
                          tier: draft.tier,
                        };
                      });
                    setDraft((d) => ({ ...d, waza }));
                  }}
                  className="mt-0.5 w-full min-h-[70px] rounded border border-[var(--border-color)] bg-black/40 px-2 py-2 text-[11px] text-white font-mono"
                />
              </label>

              <div className="flex flex-col gap-2 sticky bottom-0 bg-[var(--panel-bg)] py-2 border-t border-[var(--border-color)]/40">
                <button
                  type="button"
                  disabled={busy || !roomId || !draft.nome.trim()}
                  className={`${BTN_GOLD} min-h-[44px]`}
                  onClick={() =>
                    run(async () => {
                      await api.post(`/shinigami/combat/field/${roomId}`, draft);
                      await loadField();
                      setCol("b");
                    }, "Aggiunto al campo")
                  }
                >
                  Aggiungi al campo
                </button>
                <button
                  type="button"
                  disabled={busy || !draft.nome.trim()}
                  className={`${BTN_VIOLET} min-h-[44px]`}
                  onClick={() =>
                    run(async () => {
                      if (editingAlboId) {
                        await api.put(`/shinigami/combat/albo/${editingAlboId}`, draft);
                        setEditingAlboId(null);
                      } else {
                        await api.post("/shinigami/combat/albo", draft);
                      }
                      await loadAlbo();
                      setToolsTab("albo");
                    }, editingAlboId ? "Albo aggiornato" : "Salvato in Albo")
                  }
                >
                  {editingAlboId ? "Salva modifiche Albo" : "Salva in Albo"}
                </button>
                {editingAlboId && (
                  <button
                    type="button"
                    className={BTN}
                    onClick={() => {
                      setEditingAlboId(null);
                      setDraft(emptyPngDraft(1, "mob"));
                    }}
                  >
                    Annulla modifica
                  </button>
                )}
              </div>
              {selectedSheet && <SchedaPngView entry={selectedSheet} />}
            </div>
          )}

          {toolsTab === "albo" && (
            <div className="space-y-2">
              <input
                type="search"
                placeholder="Filtra nome / tipo / tier…"
                value={filterAlbo}
                onChange={(e) => setFilterAlbo(e.target.value)}
                className="w-full min-h-[40px] rounded border border-[var(--border-color)] bg-black/40 px-2 text-[12px] text-white"
              />
              {albo.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Albo vuoto.</p>
              ) : (
                <ul className="space-y-1.5">
                  {albo.map((it) => (
                    <li
                      key={it.id}
                      className="rounded border border-[var(--border-color)]/60 bg-black/20 p-2 space-y-1.5"
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() =>
                          setSelectedSheet({
                            nome: it.nome,
                            tipo: it.tipo,
                            tier: it.tier as PngTier,
                            hp_max: it.hp_max,
                            hp_correnti: it.hp_max,
                            cs_max: it.cs_max,
                            cs_correnti: 0,
                            ir_attacco: it.ir_attacco,
                            ir_difesa: it.ir_difesa,
                            waza: it.waza ?? [],
                            note: it.note ?? "",
                            status_attivi: [],
                          })
                        }
                      >
                        <p className="text-sm text-white font-display">{it.nome}</p>
                        <p className="text-[10px] text-[var(--accent-violet-light)]">
                          {PNG_TIPO_LABELS[it.tipo]} · T{it.tier}
                        </p>
                      </button>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busy || !roomId}
                          className={BTN_GOLD}
                          onClick={() =>
                            run(async () => {
                              await api.post(
                                `/shinigami/combat/albo/${it.id}/spawn/${roomId}`,
                                {},
                              );
                              await loadField();
                              setCol("b");
                            }, "Istanziato sul campo")
                          }
                        >
                          Istanzia
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_VIOLET}
                          onClick={() => {
                            setEditingAlboId(it.id);
                            setDraft({
                              ...emptyPngDraft(it.tier as PngTier, it.tipo),
                              nome: it.nome,
                              tipo: it.tipo,
                              tier: it.tier as PngTier,
                              hp_max: it.hp_max,
                              hp_correnti: it.hp_max,
                              cs_max: it.cs_max,
                              cs_correnti: 0,
                              ir_attacco: it.ir_attacco,
                              ir_difesa: it.ir_difesa,
                              waza: it.waza ?? [],
                              note: it.note ?? "",
                              salvato_in_albo: true,
                            });
                            setToolsTab("creazione");
                            setMsg(`Modifica Albo: ${it.nome}`);
                          }}
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_WARN}
                          onClick={() =>
                            run(async () => {
                              await api.delete(`/shinigami/combat/albo/${it.id}`);
                              await loadAlbo();
                            }, "Eliminato dall'Albo")
                          }
                        >
                          Elimina
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {selectedSheet && <SchedaPngView entry={selectedSheet} />}
            </div>
          )}

          {toolsTab === "bestiario" && (
            <div className="space-y-2">
              <input
                type="search"
                placeholder="Cerca bestiario…"
                value={filterBest}
                onChange={(e) => setFilterBest(e.target.value)}
                className="w-full min-h-[40px] rounded border border-[var(--border-color)] bg-black/40 px-2 text-[12px] text-white"
              />
              {bestiario.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Catalogo vuoto.</p>
              ) : (
                <ul className="space-y-1.5">
                  {bestiario.map((it) => (
                    <li
                      key={it.id}
                      className="rounded border border-[var(--border-color)]/60 bg-black/20 p-2 space-y-1.5"
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => setSelectedSheet({ nome: it.nome, ...it, status_attivi: [] })}
                      >
                        <p className="text-sm text-white font-display">{it.nome}</p>
                        <p className="text-[10px] text-[var(--accent-violet-light)]">
                          {PNG_TIPO_LABELS[it.tipo]} · T{it.tier}
                          {it.tag_caccia ? " · caccia" : ""}
                        </p>
                      </button>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busy || !roomId}
                          className={BTN_GOLD}
                          onClick={() =>
                            run(async () => {
                              await api.post(
                                `/shinigami/combat/bestiario/${it.id}/spawn/${roomId}`,
                                {},
                              );
                              await loadField();
                              setCol("b");
                            }, "Istanziato sul campo")
                          }
                        >
                          Istanzia
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={BTN_VIOLET}
                          onClick={() =>
                            run(async () => {
                              await api.post(`/shinigami/combat/bestiario/${it.id}/albo`, {});
                              await loadAlbo();
                            }, "Copiato in Albo")
                          }
                        >
                          → Albo
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {selectedSheet && (
                <SchedaBestiarioView
                  entry={selectedSheet as BestiarioEntry & { nome: string }}
                />
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
