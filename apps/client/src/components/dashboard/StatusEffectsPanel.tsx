"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";

type StatusEffectItem = {
  id: string;
  tag: string;
  label: string;
  kind: "emotional" | "elemental" | "atypical";
  stacks: number;
  description: string;
  maxStacks: number | null;
};

type StatusEffectsState = {
  effects: StatusEffectItem[];
  modifiers: {
    offensiveTierBonus: number;
    damageTakenTierBonus: number;
    damageMultiplier: number;
    csCostMultiplier: number;
    movementMultiplier: number;
    indexBonus: number;
    bonusCsPerTurn: number;
    blockCsGain: boolean;
    blockWaza: boolean;
    blockHealing: boolean;
    movementTowardEnemyOnly: boolean;
  };
};

function kindClass(kind: StatusEffectItem["kind"]): string {
  if (kind === "emotional") return "status-emotional-tag";
  if (kind === "elemental") return "status-elemental-tag";
  return "status-atypical-tag";
}

export function StatusEffectsPanel({
  characterId,
  isOwnCharacter = true,
  embedded = false,
}: {
  characterId?: string;
  isOwnCharacter?: boolean;
  /** In pannello combattimento chat: senza card esterna ripetuta. */
  embedded?: boolean;
}) {
  const [state, setState] = useState<StatusEffectsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const endpoint = characterId
    ? `/characters/${characterId}/status-effects`
    : isOwnCharacter
      ? "/characters/me/status-effects"
      : null;

  const load = useCallback(async () => {
    if (!endpoint) {
      if (mountedRef.current) {
        setLoading(false);
        setState(null);
      }
      return;
    }
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = (await api.get(endpoint)) as StatusEffectsState;
      if (mountedRef.current) setState(data);
    } catch (e: unknown) {
      if (mountedRef.current) {
        setState(null);
        setError(e instanceof Error ? e.message : "Errore caricamento status");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    let cancelled = false;
    void load().finally(() => {
      if (cancelled) return;
    });
    const onRefresh = () => void load();
    window.addEventListener("characterStatusUpdated", onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener("characterStatusUpdated", onRefresh);
    };
  }, [load]);

  if (loading) {
    return (
      <p className={`text-[10px] text-gray-500 animate__animated animate__fadeIn${embedded ? "" : ""}`}>
        Caricamento status…
      </p>
    );
  }

  if (error) {
    return (
      <div
        className={`text-[10px] text-[var(--accent-violet-light)]${
          embedded ? "" : " rounded-lg border border-[var(--border-color)] bg-black/30 px-3 py-2"
        }`}
      >
        {error}
      </div>
    );
  }

  const effects = state?.effects ?? [];
  const m = state?.modifiers;

  const body = (
    <>
      {effects.length === 0 ? (
        <p className={`${embedded ? "text-[9px]" : "text-[11px]"} text-gray-500 italic`}>
          Nessuno status attivo.
        </p>
      ) : (
        <div className={embedded ? "flex flex-wrap gap-1" : "flex flex-wrap gap-1.5 mb-3"}>
          {effects.map((e) => (
            <span
              key={e.id}
              className={`${kindClass(e.kind)}${embedded ? " text-[8px]" : ""}`}
              title={`${e.description}${e.maxStacks != null ? ` · max ${e.maxStacks}` : ""}`}
            >
              {e.tag} ×{e.stacks}
            </span>
          ))}
        </div>
      )}

      {m && effects.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-display uppercase tracking-wide text-gray-500 mt-1.5">
          {m.offensiveTierBonus !== 0 && (
            <>
              <dt>Tier offensivo</dt>
              <dd className="text-[var(--accent-gold)] tabular-nums text-right">
                {m.offensiveTierBonus > 0 ? "+" : ""}
                {m.offensiveTierBonus}
              </dd>
            </>
          )}
          {m.indexBonus !== 0 && (
            <>
              <dt>IR</dt>
              <dd className="text-[var(--accent-violet-light)] tabular-nums text-right">{m.indexBonus}</dd>
            </>
          )}
          {m.damageMultiplier !== 1 && (
            <>
              <dt>Danno</dt>
              <dd className="tabular-nums text-right">×{m.damageMultiplier}</dd>
            </>
          )}
          {m.csCostMultiplier !== 1 && (
            <>
              <dt>Costo CS</dt>
              <dd className="tabular-nums text-right">×{m.csCostMultiplier}</dd>
            </>
          )}
          {m.movementMultiplier !== 1 && (
            <>
              <dt>Movimento</dt>
              <dd className="tabular-nums text-right">×{m.movementMultiplier}</dd>
            </>
          )}
          {m.bonusCsPerTurn > 0 && (
            <>
              <dt>CS/turno</dt>
              <dd className="text-[var(--accent-gold)] tabular-nums text-right">+{m.bonusCsPerTurn}</dd>
            </>
          )}
          {m.blockWaza && (
            <>
              <dt>Waza</dt>
              <dd className="text-[var(--accent-violet)] text-right">bloccate</dd>
            </>
          )}
          {m.blockCsGain && (
            <>
              <dt>Guadagno CS</dt>
              <dd className="text-[var(--accent-violet)] text-right">bloccato</dd>
            </>
          )}
        </dl>
      )}
    </>
  );

  if (embedded) {
    return <div className="chat-combat-status-embedded">{body}</div>;
  }

  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-black/35 p-4 shadow-[var(--shadow-violet)]">
      <div className="flex items-center gap-2 mb-3">
        <FontAwesomeIcon icon={icons.waza} className="text-[var(--accent-violet-light)] text-xs" />
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-[var(--accent-gold)]">
          Status attivi
        </h3>
      </div>
      {body}
      <p className="mt-3 text-[9px] text-gray-600 leading-relaxed">
        Applicazione e tick a fine turno: Master in combattimento chat.
      </p>
    </section>
  );
}
