"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { useDoMechanicsSnapshot } from "@/hooks/useDoMechanicsSnapshot";
import {
  type DoMechanicsStyleId,
  DO_MECHANICS_STYLE_LABELS,
} from "@/hooks/useDoMechanicsVisibility";
import { TENSIONE_MAX } from "@domain/styles/ito/tensione";

type StylePatch = DoMechanicsStyleId;

const YURAGI_PHASES = ["neutro", "solido", "fluido", "gassoso"] as const;
const HIT_TIERS = [1, 2, 3, 4, 5] as const;

export function DoMechanicsPanel({
  currentCs: currentCsProp,
  visibleStyles,
  showHitTier = false,
  embedded = false,
}: {
  /** CS da Chrono Stack in chat; se assente usa 0. */
  currentCs?: number | null;
  visibleStyles: readonly DoMechanicsStyleId[];
  showHitTier?: boolean;
  /** In chat: senza bordo esterno (wrapper CombatSection). */
  embedded?: boolean;
}) {
  const effectiveCs =
    typeof currentCsProp === "number" && Number.isFinite(currentCsProp)
      ? Math.max(0, Math.floor(currentCsProp))
      : 0;

  const { snapshot: state, loading, error, reload, setSnapshot } = useDoMechanicsSnapshot(effectiveCs);
  const [saving, setSaving] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [itoFeedback, setItoFeedback] = useState<string | null>(null);

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      setSaving(true);
      setPatchError(null);
      setItoFeedback(null);
      try {
        const data = (await api.patch("/characters/me/do-mechanics", {
          ...body,
          currentCs: effectiveCs,
        })) as typeof state & {
          itoPatch?: { emorragiaStacks?: number; csSpent?: number; decayed?: number };
        };
        setSnapshot(data);
        const ip = data.itoPatch;
        if (ip?.emorragiaStacks && ip.emorragiaStacks > 0) {
          setItoFeedback(
            `Esubero: +${ip.emorragiaStacks} Emorragia (sanguina dove tieni i fili).`,
          );
          window.dispatchEvent(new CustomEvent("characterStatusUpdated"));
        } else if (ip?.csSpent && ip.csSpent > 0) {
          setItoFeedback(`Rilascio fili: −2 Tensione · −${ip.csSpent} CS.`);
        } else if (ip?.decayed && ip.decayed > 0) {
          setItoFeedback(`Fine turno: −${ip.decayed} Tensione (rilascio naturale).`);
        }
      } catch (e: unknown) {
        setPatchError(e instanceof Error ? e.message : "Aggiornamento fallito");
      } finally {
        setSaving(false);
      }
    },
    [effectiveCs, setSnapshot],
  );

  const action = (style: StylePatch, actionName: string, extra?: Record<string, unknown>) =>
    patch({ style, action: actionName, ...extra });

  const setLastHitTier = (tier: number | null) =>
    patch({ lastReceivedHitTier: tier ?? 0, currentCs: effectiveCs });

  const showIto = visibleStyles.includes("ito");
  const showNaikan = visibleStyles.includes("naikan");
  const showHensei = visibleStyles.includes("hensei");
  const showHado = visibleStyles.includes("hado");

  if (loading && !state) {
    return <p className="text-[10px] text-gray-500">Caricamento meccaniche Dō…</p>;
  }

  if (error && !state) {
    return (
      <div className="rounded-lg border border-[var(--border-color)] bg-black/30 px-3 py-2 text-[10px] text-gray-500">
        {error}
      </div>
    );
  }

  if (!state) return null;

  const btnClass =
    "text-[9px] font-display uppercase tracking-wide px-2 py-1 rounded border border-[var(--border-color)] text-[var(--accent-violet-light)] hover:border-[var(--accent-gold)]/50 hover:text-[var(--accent-gold)] transition-colors disabled:opacity-50";

  const inner = (
    <div className={embedded ? "space-y-3" : "space-y-4"}>
      {!embedded && (
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[var(--accent-violet-light)]">
          Meccaniche Dō · {visibleStyles.map((id) => DO_MECHANICS_STYLE_LABELS[id]).join(" · ")}
        </h3>
      )}

      {showHitTier && (
        <div className="rounded border border-[var(--border-color)]/60 bg-black/20 px-3 py-2">
          <p className="text-[9px] font-display uppercase tracking-wide text-gray-500 mb-1.5">
            Ultimo colpo subìto · Junnō / Hibiki
          </p>
          <div className="flex flex-wrap gap-1.5 items-center">
            {HIT_TIERS.map((t) => (
              <button
                key={t}
                type="button"
                disabled={saving}
                className={`${btnClass} ${
                  state.lastReceivedHitTier === t
                    ? "border-[var(--accent-gold)]/50 text-[var(--accent-gold)] bg-[var(--accent-gold)]/5"
                    : ""
                }`}
                onClick={() => setLastHitTier(t)}
              >
                T{t}
              </button>
            ))}
            {state.lastReceivedHitTier != null && (
              <button type="button" disabled={saving} className={btnClass} onClick={() => setLastHitTier(null)}>
                Cancella
              </button>
            )}
          </div>
        </div>
      )}

      {showIto && (
        <div className="rounded border border-[var(--border-color)]/80 bg-black/25 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-display uppercase text-[var(--accent-gold)]">Tensione · Itō-dō</span>
            <span className="text-[9px] tabular-nums text-gray-400">
              {state.ito.overflow > 0
                ? `${state.ito.level}+${state.ito.overflow} (cap ${TENSIONE_MAX})`
                : `${state.ito.level}/${TENSIONE_MAX}`}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
            Dichiara i fili con +1/+2 quando lanci waza Itō. A fine turno −1 se non hai usato fili. Oltre {TENSIONE_MAX}: +1
            Emorragia per punto in esubero. Rilascio manuale −2 costa 1 CS.
          </p>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-display uppercase text-gray-500 mb-2">
            <dt>Bonus IR</dt>
            <dd className="text-right text-[var(--accent-gold)] tabular-nums">+{state.ito.irBonus}</dd>
            {state.ito.snapRisk && (
              <>
                <dt>Rischio snap</dt>
                <dd className="text-right text-[var(--accent-violet-light)]">Al limite ({TENSIONE_MAX}/{TENSIONE_MAX})</dd>
              </>
            )}
            {state.ito.overflow > 0 && (
              <>
                <dt>Esubero</dt>
                <dd className="text-right text-[var(--accent-violet-light)] tabular-nums">
                  +{state.ito.overflow} Emorragia
                </dd>
              </>
            )}
          </dl>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              type="button"
              disabled={saving}
              className={btnClass}
              onClick={() => action("ito", "accumulate", { threads: 1 })}
            >
              +1 filo
            </button>
            <button
              type="button"
              disabled={saving}
              className={btnClass}
              onClick={() => action("ito", "accumulate", { threads: 2 })}
            >
              +2 multiplo
            </button>
            {state.ito.rawLevel > 0 && (
              <button
                type="button"
                disabled={saving || effectiveCs < 1}
                className={btnClass}
                onClick={() => action("ito", "release")}
                title={effectiveCs < 1 ? "Servono almeno 1 CS" : undefined}
              >
                Rilascia (−2 · 1 CS)
              </button>
            )}
          </div>
          {itoFeedback && (
            <p className="text-[9px] text-[var(--accent-violet-light)] mb-1 leading-snug">{itoFeedback}</p>
          )}
        </div>
      )}

      {showNaikan && (
        <div className="rounded border border-[var(--border-color)]/80 bg-black/25 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-display uppercase text-[var(--accent-violet-light)]">
              Junkan · Naikan-dō
            </span>
            <span className="text-[9px] tabular-nums text-gray-400">Fase {state.naikan.phase}/3</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
            Circolazione di supporto: ogni alleato aiutato avanza la fase (+10% bonus supporto per fase).
          </p>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-display uppercase text-gray-500 mb-2">
            <dt>Bonus supporto</dt>
            <dd className="text-right text-[var(--accent-violet-light)] tabular-nums">
              +{state.naikan.supportBonusPercent}%
            </dd>
            {state.naikan.canTransfer && (
              <>
                <dt>Trasferimento Jigoka</dt>
                <dd className="text-right text-[var(--accent-violet-light)]">Sbloccato</dd>
              </>
            )}
          </dl>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={saving} className={btnClass} onClick={() => action("naikan", "advance")}>
              Avanza fase
            </button>
            {state.naikan.phase > 0 && (
              <button type="button" disabled={saving} className={btnClass} onClick={() => action("naikan", "reset")}>
                Reset ciclo
              </button>
            )}
          </div>
          <p className="text-[9px] text-gray-600 mt-2 leading-snug">
            Tag chat: <span className="text-[var(--accent-gold)]">[waza:Kōmei…]</span> ·{" "}
            <span className="text-[var(--accent-gold)]">[waza:Shokushin…]</span> +{" "}
            <span className="text-[var(--accent-gold)]">[lettura:NomePG]</span>
          </p>
        </div>
      )}

      {showHensei && (
        <div className="rounded border border-[var(--border-color)]/80 bg-black/25 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-display uppercase text-[var(--accent-violet-light)]">
              Yuragi · Hensei-dō
            </span>
            <span className="text-[9px] capitalize text-gray-400">{state.hensei.phase}</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
            Oscillazione di consistenza: cambiando fase rispetto all&apos;ultima waza ottieni +2 IR di parità.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {YURAGI_PHASES.map((phase) => (
              <button
                key={phase}
                type="button"
                disabled={saving || state.hensei.phase === phase}
                className={`${btnClass} ${
                  state.hensei.phase === phase
                    ? "border-[var(--accent-gold)]/50 text-[var(--accent-gold)] bg-[var(--accent-gold)]/5"
                    : ""
                }`}
                onClick={() => action("hensei", "setPhase", { phase })}
              >
                {phase}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-gray-600 mt-2 leading-snug">
            Tag chat: <span className="text-[var(--accent-gold)]">[waza:Nagori…]</span> ·{" "}
            <span className="text-[var(--accent-gold)]">[yuragi:liquido→solido]</span>
          </p>
        </div>
      )}

      {showHado && (
        <div className="rounded border border-[var(--border-color)]/80 bg-black/25 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-display uppercase text-[var(--accent-gold)]">
              Atsuryoku · Hadō-dō
            </span>
            <span className="text-[9px] tabular-nums text-gray-400">{state.hado.pressure}/15</span>
          </div>
          <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
            Pressione da CS trattenuto: bonus danno fino al +30%. Metamorfosi a CS ≥ 12 (in combattimento).
          </p>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-display uppercase text-gray-500 mb-2">
            <dt>Bonus danno</dt>
            <dd className="text-right text-[var(--accent-gold)] tabular-nums">+{state.hado.damageBonusPercent}%</dd>
            {state.hado.metamorphosisReady && (
              <>
                <dt>Pressione attiva</dt>
                <dd className="text-right text-[var(--accent-gold)]">CS ≥ 12</dd>
              </>
            )}
            {state.hado.overheatBand && (
              <>
                <dt>Banda overheat</dt>
                <dd className="text-right text-[var(--accent-violet-light)]">Attiva</dd>
              </>
            )}
          </dl>
          {state.hado.pressure > 0 && (
            <button type="button" disabled={saving} className={btnClass} onClick={() => action("hado", "vent")}>
              Sfiato (−4 pressione)
            </button>
          )}
          {(state.investimento.active || state.investimento.payoutPending) && (
            <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-display uppercase text-gray-500 mt-2 pt-2 border-t border-[var(--border-color)]/50">
              <dt>Investimento</dt>
              <dd className="text-right text-[var(--accent-gold)] tabular-nums">
                {state.investimento.active
                  ? `${state.investimento.poolCs} CS · ${state.investimento.turnsLeft}t`
                  : "—"}
              </dd>
              {state.investimento.payoutPending && (
                <>
                  <dt>Riscosso</dt>
                  <dd className="text-right text-[var(--accent-gold)] tabular-nums">
                    +{state.investimento.payoutPending.flatDamage} dmg · +
                    {state.investimento.payoutPending.rangeBonusM} m
                  </dd>
                </>
              )}
            </dl>
          )}
          {state.shakkinDebts.length > 0 && (
            <p className="text-[9px] text-[var(--accent-violet-light)] mt-2 leading-snug">
              Debiti Shakkin attivi: {state.shakkinDebts.length} (
              {state.shakkinDebts.reduce((n, d) => n + d.stacks, 0)} stack totali)
            </p>
          )}
          <p className="text-[9px] text-gray-600 mt-2 leading-snug">
            Tag chat: <span className="text-[var(--accent-gold)]">[investimento:+N]</span> ·{" "}
            <span className="text-[var(--accent-gold)]">[investimento:riscuoti]</span> ·{" "}
            <span className="text-[var(--accent-gold)]">[debito:NomePG]</span> con Shakkin
          </p>
        </div>
      )}

      {(patchError || error) && (
        <p className="text-[10px] text-[var(--accent-violet-light)]">{patchError ?? error}</p>
      )}
      <button
        type="button"
        disabled={loading}
        className="text-[9px] font-display uppercase tracking-wide text-gray-500 hover:text-[var(--accent-violet-light)]"
        onClick={() => void reload()}
      >
        Ricarica
      </button>
    </div>
  );

  if (embedded) return inner;

  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-black/35 p-4 shadow-[var(--shadow-violet)]">
      {inner}
    </section>
  );
}
